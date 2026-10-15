import type { Result } from "@/shared/kernel/result";
import type { NotificationKind } from "../domain/notification";

/** Linha de `notification.notifications` como vem do banco. */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

/** Item de notificação pronto para a interface. */
export interface NotificationItem {
  id: string;
  type: NotificationKind;
  label: string;
  targetUrl: string;
  isUnread: boolean;
  createdAt: Date;
}

/** Sessão necessária para ler notificações (N5). */
export interface NotificationSession {
  userId: string;
}

/** Porta de sessão — implementada pelo gateway de Identity na interface. */
export type CurrentNotificationSessionPort = () => Promise<NotificationSession | null>;

/** Porta de persistência do contexto Notification (D6). */
export interface NotificationRepository {
  listByUser(
    userId: string,
    options: { limit: number; cursor?: string | null },
  ): Promise<{ rows: NotificationRow[]; nextCursor: string | null }>;

  countUnread(userId: string): Promise<number>;

  findById(id: string): Promise<NotificationRow | null>;

  markAsRead(id: string, at: Date): Promise<void>;

  markAllAsRead(userId: string, at: Date): Promise<void>;
}

export type { Result };
