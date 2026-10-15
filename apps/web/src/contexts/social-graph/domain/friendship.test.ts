import { describe, expect, it } from "vitest";

import { Friendship } from "./friendship";
import type { RelationshipKind } from "./user-pair";

function pending() {
  return Friendship.request("f1", "u1", "u2");
}

describe("Friendship (S1/S4/S5/S6)", () => {
  it("pedido nasce pendente com o solicitante correto", () => {
    const friendship = pending();

    expect(friendship.status).toBe("pending");
    expect(friendship.requestedBy).toBe("u1");
    expect(friendship.respondedBy).toBeNull();
    expect(friendship.relationshipFor("u1")).toBe("pending_sent");
    expect(friendship.relationshipFor("u2")).toBe("pending_received");
    expect(friendship.relationshipFor("u3")).toBe("none");
  });

  it("aceita somente pelo destinatário (S4)", () => {
    const friendship = pending();

    expect(() => friendship.accept("u1")).toThrow("somente o destinatário pode aceitar");

    friendship.accept("u2");

    expect(friendship.status).toBe("accepted");
    expect(friendship.respondedBy).toBe("u2");
    // S1: aceita é mútuo — os dois lados veem "friends".
    expect(friendship.relationshipFor("u1")).toBe<RelationshipKind>("friends");
    expect(friendship.relationshipFor("u2")).toBe<RelationshipKind>("friends");
  });

  it("não aceita duas vezes nem quem não participa (S4)", () => {
    const friendship = pending();
    friendship.accept("u2");

    expect(() => friendship.accept("u2")).toThrow("só um pedido pendente pode ser aceito");
  });

  it("sentinela do par segue a direção da criação (S2)", () => {
    const forward = Friendship.request("f1", "u1", "u2");
    const backward = Friendship.request("f2", "u2", "u1");

    expect(forward.pair.low).toBe("u1");
    expect(backward.pair.low).toBe("u1");
    expect(forward.pair.equals(backward.pair)).toBe(true);
  });

  it("participantes e terceiros", () => {
    const friendship = pending();

    expect(friendship.involves("u1")).toBe(true);
    expect(friendship.involves("u4")).toBe(false);
  });

  it("rehydrate reconstrói o estado persistido", () => {
    const friendship = Friendship.rehydrate({
      id: "f9",
      userLow: "u2",
      userHigh: "u5",
      status: "accepted",
      requestedBy: "u5",
      respondedBy: "u2",
      createdAt: new Date("2026-10-12T10:00:00.000Z"),
    });

    expect(friendship.pair.low).toBe("u2");
    expect(friendship.pair.high).toBe("u5");
    expect(friendship.isAccepted).toBe(true);
    expect(friendship.isPending).toBe(false);
    expect(friendship.relationshipFor("u2")).toBe<RelationshipKind>("friends");
  });
});
