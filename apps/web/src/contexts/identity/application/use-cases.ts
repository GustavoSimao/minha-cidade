import { randomUUID } from "node:crypto";

import { Profile } from "@/contexts/identity/domain/profile";
import type { ProfileEditableFields } from "@/contexts/identity/domain/profile";
import { VerifiedOrg } from "@/contexts/identity/domain/verified-org";
import type {
  AuthGateway,
  BadgeRequestRepository,
  BeforeAccountClosed,
  MyBadgeRequestView,
  ProfileRepository,
} from "./ports";

/** Resultado de caso de uso: sucesso com valor, ou falha com mensagem. */
export type UseCaseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const ok = <T>(value: T): UseCaseResult<T> => ({ ok: true, value });
const fail = <T>(error: string): UseCaseResult<T> => ({ ok: false, error });

export class UpdateMyProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auth: AuthGateway,
  ) {}

  /**
   * Atualiza apenas os campos que o usuário pode alterar.
   * Invariantes I2/I4/I5 são protegidas pelo domínio e pelo trigger no banco.
   */
  async execute(input: Partial<ProfileEditableFields>): Promise<UseCaseResult<PublicProfileSnapshot>> {
    const session = await this.auth.currentSession();
    if (!session) {
      return fail("sessão expirada: entre novamente");
    }

    const current = await this.profiles.findById(session.userId);
    if (!current) {
      return fail("perfil não encontrado");
    }

    const fields: ProfileEditableFields = {
      fullName: input.fullName ?? current.fullName.value,
      bio: input.bio ?? null,
      phone: input.phone ?? current.phone,
      // `undefined` = não informado (mantém); `""` = remover (normalizado no domínio).
      avatarPath: input.avatarPath ?? current.avatarPath,
      coverPath: input.coverPath ?? current.coverPath,
      showNeighborhood: input.showNeighborhood ?? current.showNeighborhood,
      cityId: input.cityId ?? current.cityId,
      neighborhoodId: input.neighborhoodId ?? current.neighborhoodId,
    };

    try {
      current.updateEditableFields(fields);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "dados inválidos");
    }

    await this.profiles.updateEditableFields(session.userId, fields);

    return ok({
      username: current.username.value,
      fullName: current.fullName.value,
      cityId: current.cityId,
      neighborhoodId: current.neighborhoodId,
    });
  }
}

export class CloseMyAccount {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly auth: AuthGateway,
    private readonly beforeClosed: BeforeAccountClosed,
  ) {}

  /**
   * Invariante I8: anonimiza publicações, apaga os dados próprios e remove o usuário do
   * Auth (o cascade apaga o perfil).
   */
  async execute(password: string): Promise<UseCaseResult<null>> {
    const session = await this.auth.currentSession();
    if (!session) {
      return fail("sessão expirada: entre novamente");
    }

    const valid = await this.auth.verifyPassword(session.email, password);
    if (!valid) {
      return fail("senha incorreta");
    }

    // 1. anonimiza publicações (no-op na Fase 2; implementado na Fase 4).
    await this.beforeClosed(session.userId);

    // 2. apaga os dados próprios que não dependem do cascade do Auth.
    await this.profiles.deleteById(session.userId);

    // 3. remove o usuário do Auth (em produção, pelo painel/admin ou função server-side).
    await this.auth.deleteUser(session.userId);

    return ok(null);
  }
}

export interface PublicProfileSnapshot {
  username: string;
  fullName: string;
  cityId: number | null;
  neighborhoodId: string | null;
}

/**
 * Solicita o selo institucional (P13/B2 — jornada 6 do PRD).
 * O órgão anexa a evidência como link oficial (ADR-0016); a análise é manual
 * pelo admin no /admin. Invariantes: I9 (e-mail confirmado) e uma pendência
 * por usuário (unique parcial no banco, espelhada aqui).
 */
export class RequestBadge {
  constructor(
    private readonly auth: AuthGateway,
    private readonly profiles: ProfileRepository,
    private readonly requests: BadgeRequestRepository,
  ) {}

  async execute(input: {
    orgName: string;
    evidenceUrl: string;
    evidenceEmail?: string | null;
    message?: string | null;
  }): Promise<UseCaseResult<null>> {
    const session = await this.auth.currentSession();

    if (!session) {
      return fail("sessão expirada: entre novamente");
    }

    if (!session.emailConfirmed) {
      return fail("confirme seu e-mail para solicitar o selo");
    }

    const profile = await this.profiles.findById(session.userId);

    if (!profile) {
      return fail("perfil não encontrado");
    }

    if (profile.isVerified) {
      return fail("seu perfil já tem selo institucional");
    }

    if (await this.requests.findPendingByUserId(session.userId)) {
      return fail("você já tem uma solicitação em análise");
    }

    let orgName: string;
    try {
      orgName = VerifiedOrg.create(input.orgName).name;
    } catch (error) {
      return fail(error instanceof Error ? error.message : "nome do órgão inválido");
    }

    const evidenceUrl = input.evidenceUrl.trim();

    if (!/^https?:\/\//i.test(evidenceUrl)) {
      return fail("informe o link oficial da evidência (começa com http:// ou https://)");
    }

    const evidenceEmail = input.evidenceEmail?.trim() || null;

    if (evidenceEmail !== null && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(evidenceEmail)) {
      return fail("e-mail de contato inválido");
    }

    const message = input.message?.trim() || null;

    const id = randomUUID();
    await this.requests.create({
      id,
      userId: session.userId,
      orgName,
      evidenceUrl,
      evidenceEmail,
      message,
    });

    await this.requests.recordEvent({
      context: "identity",
      name: "identity.badge_requested",
      aggregateId: id,
      payload: { userId: session.userId, orgName },
    });

    return ok(null);
  }
}

/** Estado do próprio pedido de selo (tela `/solicitar-selo`). */
export class ListMyBadgeRequest {
  constructor(
    private readonly auth: AuthGateway,
    private readonly requests: BadgeRequestRepository,
  ) {}

  async execute(): Promise<UseCaseResult<MyBadgeRequestView | null>> {
    const session = await this.auth.currentSession();

    if (!session) {
      return fail("sessão expirada: entre novamente");
    }

    const row = await this.requests.findLatestByUserId(session.userId);

    if (row === null) {
      return ok(null);
    }

    const status = row.status;

    if (status !== "pending" && status !== "approved" && status !== "rejected") {
      return ok(null);
    }

    return ok({
      status,
      orgName: row.org_name,
      evidenceUrl: row.evidence_url,
      decisionReason: row.decision_reason,
      decidedAt: row.decided_at ? new Date(row.decided_at) : null,
      createdAt: new Date(row.created_at),
    });
  }
}

export { Profile };
