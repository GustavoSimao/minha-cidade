import { describe, expect, it, vi } from "vitest";

import { Reaction } from "./reaction";
import { ReactionType } from "./reaction-type";

function makeReaction() {
  return Reaction.create({
    id: "r1",
    publicationId: "p1",
    userId: "u1",
    type: ReactionType.create("support"),
  });
}

describe("Reaction (E1)", () => {
  it("reconhece o mesmo tipo (toggle remove)", () => {
    expect(makeReaction().isSameKind("support")).toBe(true);
    expect(makeReaction().isSameKind("oppose")).toBe(false);
  });

  it("troca apoio por oposição e emite evento", () => {
    const reaction = makeReaction();
    reaction.switchTo("oppose");

    expect(reaction.type.value).toBe("oppose");
    const events = reaction.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("engagement.reaction_switched");
  });

  it("não troca para o mesmo tipo", () => {
    const reaction = makeReaction();
    reaction.switchTo("support");

    expect(reaction.type.value).toBe("support");
    expect(reaction.pullDomainEvents()).toHaveLength(0);
  });

  it("rehydrate valida o tipo do banco", () => {
    const reaction = Reaction.rehydrate({
      id: "r2",
      publicationId: "p1",
      userId: "u1",
      type: "oppose",
    });

    expect(reaction.type.value).toBe("oppose");
    expect(reaction.id.value).toBe("r2");
    expect(vi.isMockFunction(() => {})).toBe(false);
  });
});
