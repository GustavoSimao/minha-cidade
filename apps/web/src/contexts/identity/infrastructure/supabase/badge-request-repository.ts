import type {
  BadgeRequestRepository,
  BadgeRequestRow,
} from "@/contexts/identity/application/ports";
import {
  createClient,
  createServiceRoleClient,
  table,
} from "@/shared/infrastructure/supabase";

const COLUMNS =
  "id, user_id, org_name, evidence_url, evidence_email, message, status, decided_by, decided_at, decision_reason, created_at";

/** Repositório de solicitações de selo (P13/B2) em Supabase/Postgres. */
export class SupabaseBadgeRequestRepository implements BadgeRequestRepository {
  async create(input: {
    id: string;
    userId: string;
    orgName: string;
    evidenceUrl: string;
    evidenceEmail: string | null;
    message: string | null;
  }): Promise<void> {
    // RLS: dono insere a própria linha (`auth.uid() = user_id`).
    const supabase = await createClient();

    const { error } = await table(supabase, "identity.badge_requests").insert({
      id: input.id,
      user_id: input.userId,
      org_name: input.orgName,
      evidence_url: input.evidenceUrl,
      evidence_email: input.evidenceEmail,
      message: input.message,
      status: "pending",
    });

    if (error) {
      throw new Error(`falha ao registrar solicitação: ${error.message}`);
    }
  }

  async findPendingByUserId(userId: string): Promise<BadgeRequestRow | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.badge_requests")
      .select(COLUMNS)
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar solicitação: ${error.message}`);
    }

    return (data as BadgeRequestRow | null) ?? null;
  }

  async findLatestByUserId(userId: string): Promise<BadgeRequestRow | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.badge_requests")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar solicitação: ${error.message}`);
    }

    return (data as BadgeRequestRow | null) ?? null;
  }

  async recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    // Outbox (D7): `shared.domain_events` é service_role-only — o evento entra
    // pelo cliente de serviço (mesmo padrão do engagement).
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
