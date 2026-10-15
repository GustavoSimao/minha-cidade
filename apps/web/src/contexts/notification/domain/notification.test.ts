import { describe, expect, it } from "vitest";

import { Notification, NotificationType } from "./notification";

describe("NotificationType (N3)", () => {
  it("aceita os cinco tipos fechados", () => {
    for (const kind of [
      "comment_added",
      "publication_supported",
      "publication_opposed",
      "friend_requested",
      "friend_accepted",
    ]) {
      expect(NotificationType.create(kind).value).toBe(kind);
    }
  });

  it("rejeita tipo fora do conjunto", () => {
    expect(() => NotificationType.create("push_enviado")).toThrow(
      "tipo de notificação inválido",
    );
  });
});

describe("Notification (N1/N4/N5)", () => {
  function make() {
    return Notification.create({
      id: "n1",
      userId: "u1",
      type: "comment_added",
      payload: { publicationId: "p1", userId: "u2" },
    });
  }

  it("exige destinatário (N1)", () => {
    expect(() =>
      Notification.create({ id: "n1", userId: "", type: "comment_added" }),
    ).toThrow("destinatário");
  });

  it("nasce não lida e marca leitura idempotente (N5)", () => {
    const notification = make();

    expect(notification.isUnread).toBe(true);

    const now = new Date("2026-10-12T10:00:00.000Z");
    notification.markAsRead(now);
    expect(notification.isUnread).toBe(false);
    expect(notification.readAt).toEqual(now);

    notification.markAsRead(new Date("2026-10-12T11:00:00.000Z"));
    expect(notification.readAt).toEqual(now);
  });

  it("deriva o link do payload (N4)", () => {
    expect(make().targetUrl).toBe("/publicacao/p1");

    const friend = Notification.create({
      id: "n2",
      userId: "u1",
      type: "friend_requested",
      payload: { username: "u2" },
    });

    expect(friend.targetUrl).toBe("/perfil/u2");
  });

  it("rehydrate reconstrói estado persistido", () => {
    const notification = Notification.rehydrate({
      id: "n1",
      userId: "u1",
      type: "friend_accepted",
      payload: {},
      readAt: new Date("2026-10-12T10:00:00.000Z"),
      createdAt: new Date("2026-10-12T09:00:00.000Z"),
    });

    expect(notification.isUnread).toBe(false);
    expect(notification.type.value).toBe("friend_accepted");
  });
});
