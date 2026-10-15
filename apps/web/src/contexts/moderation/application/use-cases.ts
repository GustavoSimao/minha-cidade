import { randomUUID } from "node:crypto";

import { VerifiedOrg } from "@/contexts/identity/domain/verified-org";
import { fail, ok, type Result } from "@/shared/kernel/result";

import { ReportReason } from "../domain/report-reason";
import { ModerationAction } from "../domain/report-reason";
import { ipSubject, RateLimitPolicy, userSubject } from "../domain/rate-limit-policy";
import type {
  BadgeRequestAdmin,
  BadgeRequestDirectory,
  BadgeRequestQueueItem,
  CurrentClientIpPort,
  CurrentModerationSessionPort,
  ModerationQueueItem,
  ModerationRepository,
  ProfileAdminPort,
  ProfileLookupPort,
  RateLimitSubject,
  ReportOutcome,
  ReportableType,
  RoleDirectory,
  TargetDirectory,
  TargetVisibilityPort,
  UserRole,
} from "./ports";

/**
 * Verifica e consome um limite antes da ação (M9/P16).
 * Usado pelas interfaces dos contextos Publication, Engagement e Moderation.
 *
 * Além do teto por usuário, aplica o teto **por IP** (B4) quando a porta de IP
 * é informada e devolve um endereço (só atrás de proxy confiável — ADR-0017).
 */
export class EnforceRateLimit {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly limits: ModerationRepository,
    private readonly clientIp?: CurrentClientIpPort,
  ) {}

  public async execute(scope: "publication" | "comment" | "report"): Promise<Result<void>> {
    const session = await this.session();

    if (session === null || !session.emailConfirmed) {
      return fail("confirme seu e-mail para interagir");
    }

    const user = userSubject(session.userId);
    const policies: Array<{ policy: RateLimitPolicy; subject: RateLimitSubject }> = [
      { policy: RateLimitPolicy.of(scope), subject: user },
      ...(scope === "publication"
        ? [{ policy: RateLimitPolicy.of("publication", "day"), subject: user }]
        : []),
    ];

    const ip = this.clientIp ? await this.clientIp.ip() : null;
    const ipPolicy = ip ? RateLimitPolicy.ipOf(scope) : null;

    if (ip !== null && ipPolicy !== null) {
      policies.push({ policy: ipPolicy, subject: ipSubject(ip) });
    }

    for (const { policy, subject } of policies) {
      const count = await this.limits.countInWindow(
        subject,
        scope,
        policy.window,
        policy.windowStart(new Date()),
      );

      if (policy.isExceeded(count)) {
        return fail(policy.message);
      }
    }

    for (const { policy, subject } of policies) {
      await this.limits.incrementInWindow(
        subject,
        scope,
        policy.window,
        policy.windowStart(new Date()),
      );
    }

    return ok(undefined);
  }
}

/** Denuncia um conteúdo visível (M1–M4, M8, M9). */
export class ReportContent {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly reports: ModerationRepository,
    private readonly targets: TargetDirectory,
    private readonly limits: ModerationRepository,
  ) {}

  public async execute(params: {
    reportableType: string;
    targetId: string;
    reason: string;
    details?: string | null;
  }): Promise<Result<ReportOutcome>> {
    const session = await this.session();

    if (session === null || !session.emailConfirmed) {
      return fail("confirme seu e-mail para denunciar");
    }

    // M9: teto de 10 denúncias/dia.
    const limit = new EnforceRateLimit(this.session, this.limits);
    const withinLimit = await limit.execute("report");

    if (!withinLimit.ok) {
      return fail(withinLimit.error);
    }

    let reason: ReportReason;
    try {
      reason = ReportReason.create(params.reason);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "motivo inválido");
    }

    const reportableType = params.reportableType as ReportableType;

    if (reportableType !== "publication" && reportableType !== "comment") {
      return fail("tipo de conteúdo inválido");
    }

    // M1: alvo precisa existir e estar visível (denúncia não ressuscita nem derruba).
    const target =
      reportableType === "publication"
        ? await this.targets.findPublication(params.targetId)
        : await this.targets.findComment(params.targetId);

    if (target === null || target.hiddenAt !== null || target.deletedAt !== null) {
      return fail("conteúdo não encontrado");
    }

    // M8: não denuncia o próprio conteúdo.
    if (target.authorId === session.userId) {
      return fail("você não pode denunciar o próprio conteúdo");
    }

    // M2: uma denúncia por usuário/alvo.
    const existing = await this.reports.findReportByUserAndTarget(
      session.userId,
      reportableType,
      params.targetId,
    );

    if (existing !== null) {
      return fail("você já denunciou este conteúdo");
    }

    const id = randomUUID();
    await this.reports.createReport({
      id,
      reporterId: session.userId,
      reportableType,
      reportableId: params.targetId,
      reason: reason.value,
      details: params.details?.trim() ? params.details.trim().slice(0, 1000) : null,
    });

    const count = await this.reports.countReportsByTarget(reportableType, params.targetId);
    await this.reports.recordEvent({
      context: "moderation",
      name: "content.reported",
      aggregateId: params.targetId,
      payload: {
        reportableType,
        targetId: params.targetId,
        reason: reason.value,
        reportsCount: count,
      },
    });

    return ok({ id, reportsCount: count });
  }
}

/** Fila de moderação: alvos com volume mínimo de denúncias (P10). */
export class ListModerationQueue {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly reports: ModerationRepository,
    private readonly targets: TargetDirectory,
  ) {}

  public async execute(options?: {
    minReports?: number;
    limit?: number;
  }): Promise<Result<ModerationQueueItem[]>> {
    const staff = await this.requireStaff(this.session, this.roles);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const minReports = options?.minReports ?? 3;
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);

    const raw = await this.reports.listQueue({ minReports, limit });

    const items = await Promise.all(
      raw.map(async (item): Promise<ModerationQueueItem> => {
        if (item.reportableType === "publication") {
          const target = await this.targets.findPublication(item.reportableId);

          return {
            ...item,
            target:
              target === null
                ? null
                : {
                    title: target.title,
                    excerpt: target.content.slice(0, 160),
                    authorId: target.authorId,
                    isAnonymous: target.isAnonymous,
                    hiddenAt: target.hiddenAt,
                    deletedAt: target.deletedAt,
                    url: `/publicacao/${item.reportableId}`,
                  },
          };
        }

        const comment = await this.targets.findComment(item.reportableId);

        return {
          ...item,
          target:
            comment === null
              ? null
              : {
                  title: null,
                  excerpt: comment.content.slice(0, 160),
                  authorId: comment.authorId,
                  isAnonymous: comment.isAnonymous,
                  hiddenAt: comment.hiddenAt,
                  deletedAt: comment.deletedAt,
                  url: `/publicacao/${comment.publicationId}`,
                },
        };
      }),
    );

    return ok(items);
  }

  /** Confere papel de staff (M5). */
  public async requireStaff(
    session: CurrentModerationSessionPort,
    roles: RoleDirectory,
  ): Promise<Result<{ userId: string; role: UserRole }>> {
    return new StaffGate(session, roles).require();
  }
}

/**
 * Portão de staff (M5) — compartilhado pela fila de moderação e pelas ações
 * de perfil da Fase 8 (selo institucional e papel). `adminOnly` restringe as
 * ações sensíveis: todas as quatro de perfil são exclusivas do admin.
 */
export class StaffGate {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
  ) {}

  public async require(
    adminOnly = false,
  ): Promise<Result<{ userId: string; role: UserRole }>> {
    const current = await this.session();

    if (current === null) {
      return fail("sessão necessária");
    }

    const role = await this.roles.findRole(current.userId);

    if (role !== "moderator" && role !== "admin") {
      return fail("acesso restrito à moderação");
    }

    if (adminOnly && role !== "admin") {
      return fail("esta ação é exclusiva da administração");
    }

    return ok({ userId: current.userId, role });
  }
}

/**
 * Concede o selo de canal institucional a um perfil (B2/I5/P13) — só admin.
 * O alvo é buscado por username; o nome do órgão passa pelo VO `VerifiedOrg`.
 */
export class GrantBadge {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly profiles: ProfileLookupPort,
    private readonly admin: ProfileAdminPort,
    private readonly reports: ModerationRepository,
  ) {}

  public async execute(params: {
    username: string;
    orgName: string;
    reason?: string | null;
  }): Promise<Result<void>> {
    const staff = await new StaffGate(this.session, this.roles).require(true);

    if (!staff.ok) {
      return fail(staff.error);
    }

    let orgName: string;
    try {
      orgName = VerifiedOrg.create(params.orgName).name;
    } catch (error) {
      return fail(error instanceof Error ? error.message : "nome do órgão inválido");
    }

    const target = await this.profiles.findByUsername(normalizeUsername(params.username));

    if (target === null) {
      return fail("perfil não encontrado");
    }

    if (target.verifiedOrg !== null) {
      return fail("o perfil já tem selo institucional");
    }

    await this.admin.grantVerifiedOrg(target.id, orgName);

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: "grant_badge",
      targetType: "profile",
      targetId: target.id,
      reason: params.reason?.trim() ? params.reason.trim().slice(0, 500) : null,
    });
    await this.reports.recordEvent({
      context: "moderation",
      name: "profile.badge_granted",
      aggregateId: target.id,
      payload: { actorId: staff.value.userId },
    });

    return ok(undefined);
  }
}

/** Revoga o selo de canal institucional (B2/I5) — só admin. */
export class RevokeBadge {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly profiles: ProfileLookupPort,
    private readonly admin: ProfileAdminPort,
    private readonly reports: ModerationRepository,
  ) {}

  public async execute(params: {
    username: string;
    reason?: string | null;
  }): Promise<Result<void>> {
    const staff = await new StaffGate(this.session, this.roles).require(true);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const target = await this.profiles.findByUsername(normalizeUsername(params.username));

    if (target === null) {
      return fail("perfil não encontrado");
    }

    if (target.verifiedOrg === null) {
      return fail("o perfil não tem selo institucional");
    }

    await this.admin.revokeVerifiedOrg(target.id);

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: "revoke_badge",
      targetType: "profile",
      targetId: target.id,
      reason: params.reason?.trim() ? params.reason.trim().slice(0, 500) : null,
    });
    await this.reports.recordEvent({
      context: "moderation",
      name: "profile.badge_revoked",
      aggregateId: target.id,
      payload: { actorId: staff.value.userId },
    });

    return ok(undefined);
  }
}

/**
 * Fila de solicitações de selo institucional pendentes (P13/B2 — jornada 6 do
 * PRD). Staff (moderador e admin) vê; a decisão é do admin.
 */
export class ListBadgeRequests {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly requests: BadgeRequestDirectory,
  ) {}

  public async execute(options: { limit?: number } = {}): Promise<Result<BadgeRequestQueueItem[]>> {
    const staff = await new StaffGate(this.session, this.roles).require(false);

    if (!staff.ok) {
      return fail(staff.error);
    }

    return ok(await this.requests.listPending(options.limit ?? 20));
  }
}

/**
 * Aprova uma solicitação de selo (P13/B2). A concessão passa pelo MESMO caso de
 * uso do atalho do /admin (`GrantBadge`): uma trilha só, uma invariante (I5),
 * um caminho de escrita em `identity.profiles`.
 */
export class ApproveBadgeRequest {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly requests: BadgeRequestDirectory,
    private readonly requestAdmin: BadgeRequestAdmin,
    private readonly profiles: ProfileLookupPort,
    private readonly profileAdmin: ProfileAdminPort,
    private readonly reports: ModerationRepository,
  ) {}

  public async execute(params: {
    requestId: string;
    orgName?: string | null;
    reason?: string | null;
  }): Promise<Result<void>> {
    const staff = await new StaffGate(this.session, this.roles).require(true);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const request = await this.requests.findById(params.requestId);

    if (request === null) {
      return fail("solicitação não encontrada");
    }

    if (request.status !== "pending") {
      return fail("esta solicitação já foi decidida");
    }

    const orgName = params.orgName?.trim() ? params.orgName.trim() : request.orgName;

    const granted = await new GrantBadge(
      this.session,
      this.roles,
      this.profiles,
      this.profileAdmin,
      this.reports,
    ).execute({
      username: request.username,
      orgName,
      reason: params.reason?.trim()
        ? params.reason.trim().slice(0, 500)
        : "solicitação de selo aprovada",
    });

    if (!granted.ok) {
      return fail(granted.error);
    }

    await this.requestAdmin.markApproved(request.id, staff.value.userId);

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: "approve_badge_request",
      targetType: "profile",
      targetId: request.userId,
      reason: params.reason?.trim() ? params.reason.trim().slice(0, 500) : null,
    });
    await this.reports.recordEvent({
      context: "moderation",
      name: "profile.badge_request_approved",
      aggregateId: request.userId,
      payload: { requestId: request.id, orgName },
    });

    return ok(undefined);
  }
}

/** Rejeita uma solicitação de selo (motivo obrigatório — volta para o dono). */
export class RejectBadgeRequest {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly requests: BadgeRequestDirectory,
    private readonly requestAdmin: BadgeRequestAdmin,
    private readonly reports: ModerationRepository,
  ) {}

  public async execute(params: {
    requestId: string;
    reason: string;
  }): Promise<Result<void>> {
    const staff = await new StaffGate(this.session, this.roles).require(true);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const reason = params.reason.trim();

    if (reason.length < 3) {
      return fail("informe o motivo da rejeição");
    }

    const request = await this.requests.findById(params.requestId);

    if (request === null) {
      return fail("solicitação não encontrada");
    }

    if (request.status !== "pending") {
      return fail("esta solicitação já foi decidida");
    }

    await this.requestAdmin.markRejected(request.id, staff.value.userId, reason.slice(0, 500));

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: "reject_badge_request",
      targetType: "profile",
      targetId: request.userId,
      reason: reason.slice(0, 500),
    });
    await this.reports.recordEvent({
      context: "moderation",
      name: "profile.badge_request_rejected",
      aggregateId: request.userId,
      payload: { requestId: request.id, reason },
    });

    return ok(undefined);
  }
}

/** Promove um usuário comum a moderador (B2/M5) — só admin. */
export class PromoteModerator {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly profiles: ProfileLookupPort,
    private readonly admin: ProfileAdminPort,
    private readonly reports: ModerationRepository,
  ) {}

  public async execute(params: {
    username: string;
    reason?: string | null;
  }): Promise<Result<void>> {
    const staff = await new StaffGate(this.session, this.roles).require(true);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const target = await this.profiles.findByUsername(normalizeUsername(params.username));

    if (target === null) {
      return fail("perfil não encontrado");
    }

    if (target.role !== "user") {
      return fail("o perfil já é moderador ou administrador");
    }

    await this.admin.setRole(target.id, "moderator");

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: "promote_moderator",
      targetType: "profile",
      targetId: target.id,
      reason: params.reason?.trim() ? params.reason.trim().slice(0, 500) : null,
    });
    await this.reports.recordEvent({
      context: "moderation",
      name: "profile.promoted",
      aggregateId: target.id,
      payload: { actorId: staff.value.userId, role: "moderator" },
    });

    return ok(undefined);
  }
}

/** Rebaixa moderador/admin a usuário comum (B2/M5) — só admin. */
export class DemoteModerator {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly profiles: ProfileLookupPort,
    private readonly admin: ProfileAdminPort,
    private readonly reports: ModerationRepository,
  ) {}

  public async execute(params: {
    username: string;
    reason?: string | null;
  }): Promise<Result<void>> {
    const staff = await new StaffGate(this.session, this.roles).require(true);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const target = await this.profiles.findByUsername(normalizeUsername(params.username));

    if (target === null) {
      return fail("perfil não encontrado");
    }

    if (target.role === "user") {
      return fail("o perfil já é um usuário comum");
    }

    // Auto-rebaixamento deixaria o time sem admin por engano.
    if (target.id === staff.value.userId) {
      return fail("você não pode rebaixar a si mesmo");
    }

    await this.admin.setRole(target.id, "user");

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: "demote_moderator",
      targetType: "profile",
      targetId: target.id,
      reason: params.reason?.trim() ? params.reason.trim().slice(0, 500) : null,
    });
    await this.reports.recordEvent({
      context: "moderation",
      name: "profile.demoted",
      aggregateId: target.id,
      payload: { actorId: staff.value.userId, role: "user" },
    });

    return ok(undefined);
  }
}

/** Aceita username com ou sem `@`, sem espaços e em minúsculas. */
function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "").toLowerCase();
}

/** Aplica uma ação de moderação no alvo (M5/M7). */
export class ApplyModerationAction {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly reports: ModerationRepository,
    private readonly targets: TargetDirectory,
    private readonly visibility: TargetVisibilityPort,
  ) {}

  public async execute(params: {
    action: string;
    targetType: string;
    targetId: string;
    reason?: string | null;
  }): Promise<Result<void>> {
    const gate = new ListModerationQueue(this.session, this.roles, this.reports, this.targets);
    const staff = await gate.requireStaff(this.session, this.roles);

    if (!staff.ok) {
      return fail(staff.error);
    }

    let action: ModerationAction;
    try {
      action = ModerationAction.create(params.action);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "ação inválida");
    }

    // M5: papel mínimo por ação.
    const roleRank: Record<UserRole, number> = { user: 0, moderator: 1, admin: 2 };
    const required = action.requiredRole === "admin" ? 2 : 1;

    if (roleRank[staff.value.role] < required) {
      return fail("esta ação é exclusiva da administração");
    }

    const targetType = params.targetType;

    if (targetType !== "publication" && targetType !== "comment") {
      return fail("tipo de conteúdo inválido");
    }

    const isPublication = targetType === "publication";
    const target = isPublication
      ? await this.targets.findPublication(params.targetId)
      : await this.targets.findComment(params.targetId);

    if (target === null) {
      return fail("conteúdo não encontrado");
    }

    const now = new Date();
    const reason = params.reason?.trim() ? params.reason.trim().slice(0, 500) : null;

    if (action.value === "hide") {
      if (target.hiddenAt !== null) {
        return fail("conteúdo já está oculto");
      }

      if (target.deletedAt !== null) {
        return fail("conteúdo foi removido");
      }

      if (isPublication) {
        await this.visibility.hidePublication(params.targetId, now, staff.value.userId);
      } else {
        await this.visibility.hideComment(params.targetId, now, staff.value.userId);
      }
    }

    if (action.value === "restore") {
      if (target.hiddenAt === null) {
        return fail("conteúdo não está oculto");
      }

      if (isPublication) {
        await this.visibility.restorePublication(params.targetId);
      } else {
        await this.visibility.restoreComment(params.targetId);
      }
    }

    if (action.value === "remove") {
      if (target.deletedAt !== null) {
        return fail("conteúdo já foi removido");
      }

      if (isPublication) {
        await this.visibility.removePublication(params.targetId, now);
      } else {
        await this.visibility.removeComment(params.targetId, now);
      }
    }

    await this.reports.recordAction({
      id: randomUUID(),
      actorId: staff.value.userId,
      action: action.value,
      targetType,
      targetId: params.targetId,
      reason,
    });

    await this.reports.recordEvent({
      context: "moderation",
      name: `content.${action.value === "restore" ? "restored" : action.value === "hide" ? "hidden" : "removed"}`,
      aggregateId: params.targetId,
      payload: { targetType, actorId: staff.value.userId },
    });

    return ok(undefined);
  }
}

/** Trilha de ações (M7). */
export class ListModerationActions {
  constructor(
    private readonly session: CurrentModerationSessionPort,
    private readonly roles: RoleDirectory,
    private readonly reports: ModerationRepository,
    private readonly targets: TargetDirectory,
  ) {}

  public async execute(limit = 20): Promise<
    Result<
      {
        id: string;
        action: string;
        targetType: string;
        targetId: string;
        reason: string | null;
        createdAt: Date;
      }[]
    >
  > {
    const staff = await new ListModerationQueue(
      this.session,
      this.roles,
      this.reports,
      this.targets,
    ).requireStaff(this.session, this.roles);

    if (!staff.ok) {
      return fail(staff.error);
    }

    const rows = await this.reports.listActions({ limit: Math.min(Math.max(limit, 1), 50) });

    return ok(
      rows.map((row) => ({
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        reason: row.reason,
        createdAt: new Date(row.createdAt),
      })),
    );
  }
}
