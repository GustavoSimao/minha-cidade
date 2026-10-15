import { describe, expect, it, vi } from "vitest";

import {
  CountMyUnreadNotifications,
  ListMyNotifications,
  MarkAllNotificationsAsRead,
  MarkNotificationAsRead,
} from "./use-cases";
import type {
  CurrentNotificationSessionPort,
  NotificationRepository,
  NotificationRow,
} from "./ports";

const ME = "u1";
const OTHER = "u2";

function row(overrides: Partial<NotificationRow> = {}): NotificationRow {
  return {
    id: "n1",
    user_id: ME,
    type: "comment_added",
    payload: { publicationId: "p1" },
    read_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeRepo(initial: NotificationRow[] = []): NotificationRepository {
  const rows = new Map<string, NotificationRow>(initial.map((r) => [r.id, { ...r }]));

  return {
    async listByUser(userId, options) {
      const mine = [...rows.values()]
        .filter((r) => r.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, options.limit);

      return { rows: mine, nextCursor: null };
    },
    async countUnread(userId) {
      return [...rows.values()].filter((r) => r.user_id === userId && r.read_at === null)
        .length;
    },
    async findById(id) {
      return rows.get(id) ?? null;
    },
    async markAsRead(id, at) {
      const found = rows.get(id);

      if (found) {
        found.read_at = at.toISOString();
      }
    },
    async markAllAsRead(userId, at) {
      for (const item of rows.values()) {
        if (item.user_id === userId) {
          item.read_at = at.toISOString();
        }
      }
    },
  };
}

function sessionOf(session: { userId: string } | null): CurrentNotificationSessionPort {
  return vi.fn().mockResolvedValue(session) as CurrentNotificationSessionPort;
}

describe("ListMyNotifications (N5)", () => {
  it("traz só as notificações do dono", async () => {
    const repo = makeRepo([row(), row({ id: "n2", user_id: OTHER })]);
    const result = await new ListMyNotifications(sessionOf({ userId: ME }), repo).execute();

    expect(result.ok && result.value.items).toHaveLength(1);
  });

  it("exige sessão", async () => {
    const repo = makeRepo([]);
    const result = await new ListMyNotifications(sessionOf(null), repo).execute();

    expect(result.ok).toBe(false);
  });
});

describe("CountMyUnreadNotifications", () => {
  it("conta apenas não lidas do dono", async () => {
    const repo = makeRepo([
      row(),
      row({ id: "n2", read_at: new Date().toISOString() }),
      row({ id: "n3", user_id: OTHER }),
    ]);

    const count = await new CountMyUnreadNotifications(
      sessionOf({ userId: ME }),
      repo,
    ).execute();

    expect(count).toBe(1);
  });

  it("zero sem sessão", async () => {
    const repo = makeRepo([row()]);

    const count = await new CountMyUnreadNotifications(sessionOf(null), repo).execute();

    expect(count).toBe(0);
  });
});

describe("MarkNotificationAsRead (N5)", () => {
  it("marca a própria notificação", async () => {
    const repo = makeRepo([row()]);

    const result = await new MarkNotificationAsRead(
      sessionOf({ userId: ME }),
      repo,
    ).execute({ id: "n1" });

    expect(result.ok).toBe(true);
    expect((await repo.findById("n1"))?.read_at).not.toBeNull();
  });

  it("não marca notificação de outro usuário", async () => {
    const repo = makeRepo([row({ user_id: OTHER })]);

    const result = await new MarkNotificationAsRead(
      sessionOf({ userId: ME }),
      repo,
    ).execute({ id: "n1" });

    expect(result.ok).toBe(false);
    expect((await repo.findById("n1"))?.read_at).toBeNull();
  });
});

describe("MarkAllNotificationsAsRead", () => {
  it("marca todas do dono como lidas", async () => {
    const repo = makeRepo([row(), row({ id: "n2" }), row({ id: "n3", user_id: OTHER })]);

    const result = await new MarkAllNotificationsAsRead(
      sessionOf({ userId: ME }),
      repo,
    ).execute();

    expect(result.ok).toBe(true);
    expect((await repo.findById("n3"))?.read_at).toBeNull();
    expect((await repo.findById("n1"))?.read_at).not.toBeNull();
    expect((await repo.findById("n2"))?.read_at).not.toBeNull();
  });
});
