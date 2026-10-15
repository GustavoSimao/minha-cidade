import type {
  BadgeRequestAdmin,
  BadgeRequestDirectory,
  BadgeRequestQueueItem,
} from "@/contexts/moderation/application/ports";

import { createServiceRoleClient, table } from "@/shared/infrastructure/supabase";

import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";

const REQUEST_COLUMNS =
  "id, user_id, org_name, evidence_url, evidence_email, message, status, decided_by, decided_at, decision_reason, created_at";

interface BadgeRequestRecord {
  id: string;
  user_id: string;
  org_name: string;
  evidence_url: string;
  evidence_email: string | null;
  message: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  created_at: string;
}

/**
 * Fila de solicitações de selo (`identity.badge_requests` — leitura por ID,
 * D7). Staff acessa pelo service_role: as linhas são dos solicitantes e a RLS
 * de dono não vale para o administrador.
 */
export class SupabaseBadgeRequestDirectory implements BadgeRequestDirectory {
  private readonly profiles = new SupabaseProfileRepository();

  private async hydrate(records: BadgeRequestRecord[]): Promise<BadgeRequestQueueItem[]> {
    if (records.length === 0) {
      return [];
    }

    // Projeção pública (I7) para resolver username/nome — sem JOIN entre contextos.
    const views = await this.profiles.findPublicViewsByIds(
      records.map((record) => record.user_id),
    );

    return records.map((record) => {
      const view = views.find((item) => item.id === record.user_id);

      return {
        id: record.id,
        userId: record.user_id,
        username: view?.username ?? "desconhecido",
        fullName: view?.fullName ?? "Perfil removido",
        orgName: record.org_name,
        evidenceUrl: record.evidence_url,
        evidenceEmail: record.evidence_email,
        message: record.message,
        status: record.status,
        createdAt: new Date(record.created_at),
      };
    });
  }

  async listPending(limit: number): Promise<BadgeRequestQueueItem[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await table(supabase, "identity.badge_requests")
      .select(REQUEST_COLUMNS)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`falha ao listar solicitações de selo: ${error.message}`);
    }

    return this.hydrate((data ?? []) as unknown as BadgeRequestRecord[]);
  }

  async findById(id: string): Promise<BadgeRequestQueueItem | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await table(supabase, "identity.badge_requests")
      .select(REQUEST_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar solicitação de selo: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const [item] = await this.hydrate([data as unknown as BadgeRequestRecord]);

    return item ?? null;
  }
}

/** Decisões do admin sobre uma solicitação — service_role (M5/M7). */
export class SupabaseBadgeRequestAdmin implements BadgeRequestAdmin {
  async markApproved(id: string, decidedBy: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await table(supabase, "identity.badge_requests")
      .update({ status: "approved", decided_by: decidedBy, decided_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      throw new Error(`falha ao aprovar solicitação: ${error.message}`);
    }
  }

  async markRejected(id: string, decidedBy: string, reason: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await table(supabase, "identity.badge_requests")
      .update({
        status: "rejected",
        decided_by: decidedBy,
        decided_at: new Date().toISOString(),
        decision_reason: reason,
      })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      throw new Error(`falha ao rejeitar solicitação: ${error.message}`);
    }
  }
}
