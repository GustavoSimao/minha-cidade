import type {
  CurrentNotificationSessionPort,
  NotificationRepository,
  NotificationRow,
} from "@/contexts/notification/application/ports";
import { createClient, table } from "@/shared/infrastructure/supabase";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";

const COLUMNS = "id, user_id, type, payload, read_at, created_at";

export const currentNotificationSession: CurrentNotificationSessionPort = async () => {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    return null;
  }

  return { userId: session.userId };
};

/** Repositório de notificações em Supabase. */
export class SupabaseNotificationRepository implements NotificationRepository {
  async listByUser(
    userId: string,
    options: { limit: number; cursor?: string | null },
  ): Promise<{ rows: NotificationRow[]; nextCursor: string | null }> {
    const supabase = await createClient();

    let request = table(supabase, "notification.notifications")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(options.limit + 1);

    if (options.cursor) {
      request = request.lt("created_at", options.cursor);
    }

    const { data, error } = await request;

    if (error) {
      throw new Error(`falha ao listar notificações: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as NotificationRow[];
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    return { rows: page, nextCursor: hasMore ? page[page.length - 1].created_at : null };
  }

  async countUnread(userId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await table(supabase, "notification.notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      throw new Error(`falha ao contar notificações: ${error.message}`);
    }

    return count ?? 0;
  }

  async findById(id: string): Promise<NotificationRow | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "notification.notifications")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar notificação: ${error.message}`);
    }

    return data ? (data as unknown as NotificationRow) : null;
  }

  async markAsRead(id: string, at: Date): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "notification.notifications")
      .update({ read_at: at.toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao marcar notificação: ${error.message}`);
    }
  }

  async markAllAsRead(userId: string, at: Date): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "notification.notifications")
      .update({ read_at: at.toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      throw new Error(`falha ao marcar notificações: ${error.message}`);
    }
  }
}
