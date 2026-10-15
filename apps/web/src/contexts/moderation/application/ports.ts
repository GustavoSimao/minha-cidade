import type { Result } from "@/shared/kernel/result";
import type {
  ModerationActionKind,
  ReportReasonKind,
  ReportableType,
} from "../domain/report-reason";
import type { RateLimitPolicy, RateLimitScope, RateLimitWindow } from "../domain/rate-limit-policy";

export type { ReportableType, ReportReasonKind, ModerationActionKind, RateLimitScope, RateLimitPolicy, RateLimitWindow };

/** Papel do usuário (vem de Identity — leitura por ID). */
export type UserRole = "user" | "moderator" | "admin";

/** Sessão necessária para agir (P3/M1). */
export interface ModerationSession {
  userId: string;
  emailConfirmed: boolean;
}

/** Porta de sessão — implementada pelo gateway de Identity na interface. */
export type CurrentModerationSessionPort = () => Promise<ModerationSession | null>;

/** Sujeito de um contador de limite (B4): usuário autenticado ou IP (ADR-0017). */
export interface RateLimitSubject {
  type: "user" | "ip";
  id: string;
}

/**
 * IP do cliente (B4/P16) — a aplicação só confia no endereço quando está atrás
 * de proxy configurado (ADR-0017). Sem proxy, devolve null e o limite por IP
 * simplesmente não se aplica.
 */
export interface CurrentClientIpPort {
  ip(): Promise<string | null>;
}

/** Leitura de papel do usuário (Identity, por ID — D15). */
export interface RoleDirectory {
  findRole(userId: string): Promise<UserRole | null>;
}

/** Resumo público de um perfil (projeção I7, sem e-mail/telefone). */
export interface ProfileSummary {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  verifiedOrg: string | null;
}

/** Busca de perfil por username (usada pelas ações de staff da Fase 8). */
export interface ProfileLookupPort {
  findByUsername(username: string): Promise<ProfileSummary | null>;
}

/**
 * Escrita administrativa em perfis pelo **service_role** — só a Fase 8
 * (B2: selo institucional e papel) usa esta porta. As invariantes I4/I5
 * do banco só permitem essas mudanças com esse papel.
 */
export interface ProfileAdminPort {
  grantVerifiedOrg(profileId: string, orgName: string): Promise<void>;
  revokeVerifiedOrg(profileId: string): Promise<void>;
  setRole(profileId: string, role: UserRole): Promise<void>;
}

/** Linha de `moderation.reports`. */
export interface ReportRow {
  id: string;
  reporter_id: string;
  reportable_type: ReportableType;
  reportable_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}

/** Item da fila: alvo + volume de denúncias. */
export interface ModerationQueueItem {
  reportableType: ReportableType;
  reportableId: string;
  reportsCount: number;
  reasons: ReportReasonKind[];
  latest: string;
  /** Estado atual do alvo (enriquecido por ID — D7). */
  target: {
    title: string | null;
    excerpt: string | null;
    authorId: string | null;
    isAnonymous: boolean;
    hiddenAt: Date | null;
    deletedAt: Date | null;
    url: string;
  } | null;
}

/** Porta de persistência do contexto Moderation (D6). */
export interface ModerationRepository {
  findReportByUserAndTarget(
    userId: string,
    reportableType: ReportableType,
    reportableId: string,
  ): Promise<ReportRow | null>;

  countReportsByTarget(
    reportableType: ReportableType,
    reportableId: string,
  ): Promise<number>;

  createReport(input: {
    id: string;
    reporterId: string;
    reportableType: ReportableType;
    reportableId: string;
    reason: ReportReasonKind;
    details: string | null;
  }): Promise<void>;

  /** Alvos com volume mínimo de denúncias, mais denunciados primeiro. */
  listQueue(options: {
    minReports: number;
    limit: number;
  }): Promise<
    {
      reportableType: ReportableType;
      reportableId: string;
      reportsCount: number;
      reasons: ReportReasonKind[];
      latest: string;
    }[]
  >;

  listReportsByTarget(
    reportableType: ReportableType,
    reportableId: string,
  ): Promise<ReportRow[]>;

  listActions(options: { limit: number }): Promise<
    {
      id: string;
      actorId: string | null;
      action: string;
      targetType: string;
      targetId: string;
      reason: string | null;
      createdAt: string;
    }[]
  >;

  recordAction(input: {
    id: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    reason: string | null;
  }): Promise<void>;

  // ---- limites (M9/P16)

  countInWindow(
    subject: RateLimitSubject,
    scope: RateLimitScope,
    window: RateLimitWindow,
    windowStart: Date,
  ): Promise<number>;

  incrementInWindow(
    subject: RateLimitSubject,
    scope: RateLimitScope,
    window: RateLimitWindow,
    windowStart: Date,
  ): Promise<void>;

  /** Outbox de eventos de domínio (D7). */
  recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

/** Aplica visibilidade no alvo via service_role (triggers das Fases 4/5). */
export interface TargetVisibilityPort {
  hidePublication(id: string, at: Date, actorId: string): Promise<void>;
  restorePublication(id: string): Promise<void>;
  removePublication(id: string, at: Date): Promise<void>;
  hideComment(id: string, at: Date, actorId: string): Promise<void>;
  restoreComment(id: string): Promise<void>;
  removeComment(id: string, at: Date): Promise<void>;
}

/** Descobre o alvo de uma denúncia (publicação ou comentário) — D7. */
export interface TargetDirectory {
  findPublication(
    id: string,
  ): Promise<{ id: string; title: string; content: string; authorId: string | null; isAnonymous: boolean; hiddenAt: Date | null; deletedAt: Date | null } | null>;

  findComment(
    id: string,
  ): Promise<{ id: string; publicationId: string; content: string; authorId: string | null; isAnonymous: boolean; hiddenAt: Date | null; deletedAt: Date | null } | null>;
}

/** Dado de uma denúncia válida (para UI após criar). */
export interface ReportOutcome {
  id: string;
  reportsCount: number;
}

/**
 * Item da fila de solicitações de selo (`identity.badge_requests` — leitura
 * por ID, D7; perfis resolvidos pela projeção pública de Identity).
 */
export interface BadgeRequestQueueItem {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  orgName: string;
  evidenceUrl: string;
  evidenceEmail: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
}

/** Fila de solicitações de selo (staff vê; admin decide). */
export interface BadgeRequestDirectory {
  listPending(limit: number): Promise<BadgeRequestQueueItem[]>;
  findById(id: string): Promise<BadgeRequestQueueItem | null>;
}

/** Decisão sobre uma solicitação de selo — service_role (ação de admin). */
export interface BadgeRequestAdmin {
  markApproved(id: string, decidedBy: string): Promise<void>;
  markRejected(id: string, decidedBy: string, reason: string): Promise<void>;
}

export type { Result };
