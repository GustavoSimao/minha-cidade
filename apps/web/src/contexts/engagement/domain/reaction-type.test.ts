import { describe, expect, it } from "vitest";

import { ReactionType } from "./reaction-type";

describe("ReactionType (E1)", () => {
  it("aceita apoio e oposição", () => {
    expect(ReactionType.create("support").value).toBe("support");
    expect(ReactionType.create("oppose").value).toBe("oppose");
    expect(ReactionType.create("support").label).toBe("Apoio");
    expect(ReactionType.create("oppose").label).toBe("Oposição");
  });

  it("rejeita valor fora do conjunto", () => {
    expect(() => ReactionType.create("like")).toThrow("reação deve ser");
    expect(() => ReactionType.create("")).toThrow("reação deve ser");
  });

  it("compara tipos", () => {
    expect(ReactionType.create("support").equalsType(ReactionType.create("support"))).toBe(
      true,
    );
    expect(ReactionType.create("support").equalsType(ReactionType.create("oppose"))).toBe(
      false,
    );
  });
});
