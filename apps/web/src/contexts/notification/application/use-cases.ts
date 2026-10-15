import { fail, ok, type Result } from "@/shared/kernel/result";

import { Notification } from "../domain/notification";
import type {
  CurrentNotificationSessionPort,
  NotificationItem,
  NotificationRepository,
} from "./ports";

function toItem(row: {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}): NotificationItem {
  const notification = Notification.rehydrate({
    id: row.id,
    userId: "",
    type: row.type,
    payload: row.payload,
    readAt: row.read_at ? new Date(row.read_at) : null,
    createdAt: new Date(row.created_at),
  });

  return {
    id: notification.id.value,
    type: notification.type.value,
    label: notification.type.label,
    targetUrl: notification.targetUrl,
    isUnread: notification.isUnread,
    createdAt: notification.createdAt,
  };
}

/** Lista as notificações do usuário logado (N5). */
export class ListMyNotifications {
  constructor(
    private readonly session: CurrentNotificationSessionPort,
    private readonly notifications: NotificationRepository,
  ) {}

  public async execute(options?: {
    limit?: number;
    cursor?: string | null;
  }): Promise<Result<{ items: NotificationItem[]; nextCursor: string | null }>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
    const { rows, nextCursor } = await this.notifications.listByUser(session.userId, {
      limit,
      cursor: options?.cursor ?? null,
    });

    return ok({ items: rows.map(toItem), nextCursor });
  }
}

/** Contagem de não lidas para o sininho (N5). */
export class CountMyUnreadNotifications {
  constructor(
    private readonly session: CurrentNotificationSessionPort,
    private readonly notifications: NotificationRepository,
  ) {}

  public async execute(): Promise<number> {
    const session = await this.session();

    if (session === null) {
      return 0;
    }

    return this.notifications.countUnread(session.userId);
  }
}

/** Marca uma notificação como lida (N5 — só a própria). */
export class MarkNotificationAsRead {
  constructor(
    private readonly session: CurrentNotificationSessionPort,
    private readonly notifications: NotificationRepository,
  ) {}

  public async execute(params: { id: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const row = await this.notifications.findById(params.id);

    if (row === null || row.user_id !== session.userId) {
      return fail("notificação não encontrada");
    }

    if (row.read_at !== null) {
      return ok(undefined);
    }

    await this.notifications.markAsRead(params.id, new Date());

    return ok(undefined);
  }
}

/** Marca todas como lidas (N5). */
export class MarkAllNotificationsAsRead {
  constructor(
    private readonly session: CurrentNotificationSessionPort,
    private readonly notifications: NotificationRepository,
  ) {}

  public async execute(): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    await this.notifications.markAllAsRead(session.userId, new Date());

    return ok(undefined);
  }
}
