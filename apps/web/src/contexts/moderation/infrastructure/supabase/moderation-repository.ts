import type {
  CurrentClientIpPort,
  CurrentModerationSessionPort,
  ModerationRepository,
  ProfileAdminPort,
  ProfileLookupPort,
  ProfileSummary,
  RateLimitSubject,
  ReportableType,
  ReportRow,
  RoleDirectory,
  TargetDirectory,
  TargetVisibilityPort,
  UserRole,
} from "@/contexts/moderation/application/ports";

import { createClient, createServiceRoleClient, table } from "@/shared/infrastructure/supabase";

import { headers } from "next/headers";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";

import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";

const REPORT_COLUMNS =
  "id, reporter_id, reportable_type, reportable_id, reason, details, created_at";

export const currentModerationSession: CurrentModerationSessionPort = async () => {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    return null;
  }

  return { userId: session.userId, emailConfirmed: session.emailConfirmed };
};

/**
 * IP do cliente para o limite por IP (B4/P16 — ADR-0017).
 *
 * `x-forwarded-for`/`x-real-ip` só são confiáveis quando a aplicação está atrás
 * de um proxy que sobrescreve o cabeçalho. Sem `TRUSTED_PROXY=1` (dev/local, e
 * qualquer deploy sem proxy à frente) devolve **null** — o limite por IP então
 * não se aplica, e ninguém pode forjar endereço para derrubar os outros.
 */
export const currentClientIp: CurrentClientIpPort = {
  async ip() {
    if (process.env.TRUSTED_PROXY !== "1") {
      return null;
    }

    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");

    if (forwarded) {
      const [first] = forwarded.split(",");

      if (first) {
        const trimmed = first.trim();

        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    const realIp = headerList.get("x-real-ip");

    return realIp !== null && realIp.length > 0 ? realIp : null;
  },
};

/** Repositório de denúncias, trilha e limites em Supabase. */
export class SupabaseModerationRepository implements ModerationRepository {
  async findReportByUserAndTarget(
    userId: string,
    reportableType: ReportableType,
    reportableId: string,
  ): Promise<ReportRow | null> {
    const service = createServiceRoleClient();

    const { data, error } = await table(service, "moderation.reports")
      .select(REPORT_COLUMNS)
      .eq("reporter_id", userId)
      .eq("reportable_type", reportableType)
      .eq("reportable_id", reportableId)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar denúncia: ${error.message}`);
    }

    return data ? (data as unknown as ReportRow) : null;
  }

  async countReportsByTarget(
    reportableType: ReportableType,
    reportableId: string,
  ): Promise<number> {
    const service = createServiceRoleClient();

    const { count, error } = await table(service, "moderation.reports")
      .select("id", { count: "exact", head: true })
      .eq("reportable_type", reportableType)
      .eq("reportable_id", reportableId);

    if (error) {
      throw new Error(`falha ao contar denúncias: ${error.message}`);
    }

    return count ?? 0;
  }

  async createReport(input: {
    id: string;
    reporterId: string;
    reportableType: ReportableType;
    reportableId: string;
    reason: string;
    details: string | null;
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "moderation.reports").insert({
      id: input.id,
      reporter_id: input.reporterId,
      reportable_type: input.reportableType,
      reportable_id: input.reportableId,
      reason: input.reason,
      details: input.details,
    });

    if (error) {
      throw new Error(`falha ao registrar denúncia: ${error.message}`);
    }
  }

  async listQueue(options: {
    minReports: number;
    limit: number;
  }): Promise<
    {
      reportableType: ReportableType;
      reportableId: string;
      reportsCount: number;
      reasons: ("spam" | "discurso_odio" | "informacao_falsa" | "conteudo_ilegal" | "assedio" | "outro")[];
      latest: string;
    }[]
  > {
    const service = createServiceRoleClient();

    // Sem GROUP BY no PostgREST: lê as denúncias recentes e agrega na aplicação
    // (fila do MVP local; o limite de leitura mantém a fila barata).
    const { data, error } = await table(service, "moderation.reports")
      .select(REPORT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`falha ao carregar fila: ${error.message}`);
    }

    const grouped = new Map<
      string,
      {
        reportableType: ReportableType;
        reportableId: string;
        reportsCount: number;
        reasons: ("spam" | "discurso_odio" | "informacao_falsa" | "conteudo_ilegal" | "assedio" | "outro")[];
        latest: string;
      }
    >();

    for (const row of (data ?? []) as unknown as ReportRow[]) {
      const key = `${row.reportable_type}:${row.reportable_id}`;
      const entry = grouped.get(key) ?? {
        reportableType: row.reportable_type,
        reportableId: row.reportable_id,
        reportsCount: 0,
        reasons: [],
        latest: row.created_at,
      };

      entry.reportsCount += 1;
      entry.reasons.push(row.reason as never);
      entry.latest =
        row.created_at > entry.latest ? row.created_at : entry.latest;
      grouped.set(key, entry);
    }

    return [...grouped.values()]
      .filter((entry) => entry.reportsCount >= options.minReports)
      .sort((a, b) => b.reportsCount - a.reportsCount)
      .slice(0, options.limit);
  }

  async listReportsByTarget(
    reportableType: ReportableType,
    reportableId: string,
  ): Promise<ReportRow[]> {
    const service = createServiceRoleClient();

    const { data, error } = await table(service, "moderation.reports")
      .select(REPORT_COLUMNS)
      .eq("reportable_type", reportableType)
      .eq("reportable_id", reportableId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`falha ao listar denúncias: ${error.message}`);
    }

    return (data ?? []) as unknown as ReportRow[];
  }

  async listActions(options: { limit: number }): Promise<
    {
      id: string;
      actorId: string | null;
      action: string;
      targetType: string;
      targetId: string;
      reason: string | null;
      createdAt: string;
    }[]
  > {
    const service = createServiceRoleClient();

    const { data, error } = await table(service, "moderation.moderation_actions")
      .select("id, actor_id, action, target_type, target_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(options.limit);

    if (error) {
      throw new Error(`falha ao carregar trilha: ${error.message}`);
    }

    return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      actorId: (row.actor_id as string | null) ?? null,
      action: String(row.action),
      targetType: String(row.target_type),
      targetId: String(row.target_id),
      reason: (row.reason as string | null) ?? null,
      createdAt: String(row.created_at),
    }));
  }

  async recordAction(input: {
    id: string;
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    reason: string | null;
  }): Promise<void> {
    const service = createServiceRoleClient();

    const { error } = await table(service, "moderation.moderation_actions").insert({
      id: input.id,
      actor_id: input.actorId,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
    });

    if (error) {
      throw new Error(`falha ao registrar ação: ${error.message}`);
    }
  }

  async countInWindow(
    subject: RateLimitSubject,
    scope: string,
    window: string,
    windowStart: Date,
  ): Promise<number> {
    // Contadores são infra: leitura pelo service_role vale para os dois sujeitos
    // (a RLS de usuário só enxerga as próprias linhas e as de IP não têm perfil).
    const supabase = createServiceRoleClient();

    const { data, error } = await table(supabase, "moderation.rate_limits")
      .select("count")
      .eq("subject_type", subject.type)
      .eq("subject_id", subject.id)
      .eq("scope", scope)
      .eq("window", window)
      .eq("window_start", windowStart.toISOString())
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao verificar limite: ${error.message}`);
    }

    return data ? Number((data as unknown as { count: number }).count) : 0;
  }

  async incrementInWindow(
    subject: RateLimitSubject,
    scope: string,
    window: string,
    windowStart: Date,
  ): Promise<void> {
    const supabase = createServiceRoleClient();

    const current = await this.countInWindow(subject, scope, window, windowStart);

    const { error } = await table(supabase, "moderation.rate_limits")
      .upsert(
        {
          subject_type: subject.type,
          subject_id: subject.id,
          // Linhas de usuário mantêm user_id (FK/analytics); de IP ficam nulas.
          user_id: subject.type === "user" ? subject.id : null,
          scope,
          window,
          window_start: windowStart.toISOString(),
          count: current + 1,
        },
        { onConflict: "subject_type,subject_id,scope,window,window_start" },
      );

    if (error) {
      throw new Error(`falha ao registrar limite: ${error.message}`);
    }
  }

  async recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    // Outbox (D7): a tabela é service_role-only (revogada para anon/
    // authenticated na migration 20261011000003) — o evento entra pelo
    // cliente de serviço.
    const events = createServiceRoleClient();

    const { error } = await table(events, "shared.domain_events").insert({
      context: event.context,
      name: event.name,
      aggregate_id: event.aggregateId,
      payload: event.payload,
    });

    if (error) {
      throw new Error(`falha ao registrar evento: ${error.message}`);
    }
  }
}

/** Papel do usuário lido de Identity (por ID — D15). */
export class SupabaseRoleDirectory implements RoleDirectory {
  constructor(private readonly profiles = new SupabaseProfileRepository()) {}

  async findRole(userId: string): Promise<UserRole | null> {
    const profile = await this.profiles.findById(userId);

    return profile?.role.name ?? null;
  }
}

/**
 * Alvos das denúncias lidos por ID, sem JOIN (D7). avoid-ai-design-ignore: SD4w
 *
 * A leitura é por **service_role**: a RLS de publications/comments esconde
 * linhas ocultadas ou removidas de quem não é o autor (M5) — a fila do staff
 * precisa ver o alvo e o estado (badge "oculto"/"removido") para poder
 * restaurar ou remover.
 */
export class SupabaseTargetDirectory implements TargetDirectory {
  private async findPublicationRow(id: string) {
    const service = createServiceRoleClient();

    const { data, error } = await table(service, "publication.publications")
      .select("id, title, content, author_id, is_anonymous, hidden_at, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar publicação: ${error.message}`);
    }

    return data;
  }

  private async findCommentRow(id: string) {
    const service = createServiceRoleClient();

    const { data, error } = await table(service, "engagement.comments")
      .select("id, publication_id, content, author_id, is_anonymous, hidden_at, deleted_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar comentário: ${error.message}`);
    }

    return data;
  }

  async findPublication(id: string) {
    const row = await this.findPublicationRow(id);

    if (row === null) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      authorId: row.author_id,
      isAnonymous: row.is_anonymous,
      hiddenAt: row.hidden_at ? new Date(row.hidden_at) : null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }

  async findComment(id: string) {
    const row = await this.findCommentRow(id);

    if (row === null) {
      return null;
    }

    return {
      id: row.id,
      publicationId: row.publication_id,
      content: row.content,
      authorId: row.author_id,
      isAnonymous: row.is_anonymous,
      hiddenAt: row.hidden_at ? new Date(row.hidden_at) : null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    };
  }
}

/**
 * Aplicação de visibilidade pelo **service_role** — os triggers de ocultação das
 * Fases 4/5 só permitem `hidden_at`/`hidden_by` com esse papel (M5).
 */
export class SupabaseTargetVisibility implements TargetVisibilityPort {
  async hidePublication(id: string, at: Date, actorId: string): Promise<void> {
    const service = createServiceRoleClient();
    const { error } = await table(service, "publication.publications")
      .update({ hidden_at: at.toISOString(), hidden_by: actorId })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao ocultar publicação: ${error.message}`);
    }
  }

  async restorePublication(id: string): Promise<void> {
    const service = createServiceRoleClient();
    const { error } = await table(service, "publication.publications")
      .update({ hidden_at: null, hidden_by: null })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao restaurar publicação: ${error.message}`);
    }
  }

  async removePublication(id: string, at: Date): Promise<void> {
    const service = createServiceRoleClient();
    const { error } = await table(service, "publication.publications")
      .update({ deleted_at: at.toISOString(), hidden_at: null, hidden_by: null })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao remover publicação: ${error.message}`);
    }
  }

  async hideComment(id: string, at: Date, actorId: string): Promise<void> {
    const service = createServiceRoleClient();
    const { error } = await table(service, "engagement.comments")
      .update({ hidden_at: at.toISOString(), hidden_by: actorId })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao ocultar comentário: ${error.message}`);
    }
  }

  async restoreComment(id: string): Promise<void> {
    const service = createServiceRoleClient();
    const { error } = await table(service, "engagement.comments")
      .update({ hidden_at: null, hidden_by: null })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao restaurar comentário: ${error.message}`);
    }
  }

  async removeComment(id: string, at: Date): Promise<void> {
    const service = createServiceRoleClient();
    const { error } = await table(service, "engagement.comments")
      .update({ deleted_at: at.toISOString(), hidden_at: null, hidden_by: null })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao remover comentário: ${error.message}`);
    }
  }
}

/**
 * Busca de perfil por username (projeção pública I7) — usada pelas ações de
 * staff da Fase 8 para localizar o alvo antes de aplicar selo/papel.
 */
export class SupabaseProfileLookup implements ProfileLookupPort {
  constructor(
    private readonly profiles = new SupabaseProfileRepository(),
  ) {}

  async findByUsername(username: string): Promise<ProfileSummary | null> {
    const view = await this.profiles.findPublicViewByUsername(username);

    if (view === null) {
      return null;
    }

    return {
      id: view.id,
      username: view.username,
      fullName: view.fullName,
      role: view.role as UserRole,
      verifiedOrg: view.verifiedOrg,
    };
  }
}

/**
 * Escrita administrativa em perfis pelo **service_role** (B2). As invariantes
 * I4/I5 do banco só permitem `role`/`verified_org` com esse papel; I5 exige que
 * selo e `is_verified` andem juntos (constraint `profiles_verified_org_consistent`).
 */
export class SupabaseProfileAdmin implements ProfileAdminPort {
  async grantVerifiedOrg(profileId: string, orgName: string): Promise<void> {
    const service = createServiceRoleClient();

    const { error } = await table(service, "identity.profiles")
      .update({ verified_org: orgName, is_verified: true })
      .eq("id", profileId);

    if (error) {
      throw new Error(`falha ao conceder selo institucional: ${error.message}`);
    }
  }

  async revokeVerifiedOrg(profileId: string): Promise<void> {
    const service = createServiceRoleClient();

    const { error } = await table(service, "identity.profiles")
      .update({ verified_org: null, is_verified: false })
      .eq("id", profileId);

    if (error) {
      throw new Error(`falha ao revogar selo institucional: ${error.message}`);
    }
  }

  async setRole(profileId: string, role: UserRole): Promise<void> {
    const service = createServiceRoleClient();

    const { error } = await table(service, "identity.profiles")
      .update({ role })
      .eq("id", profileId);

    if (error) {
      throw new Error(`falha ao alterar papel: ${error.message}`);
    }
  }
}
