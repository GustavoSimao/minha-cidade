import { describe, expect, it } from "vitest";

import { UserPair } from "./user-pair";

describe("UserPair (S2/S3)", () => {
  it("ordena o par independentemente da direção (S2)", () => {
    const ab = UserPair.of("a", "b");
    const ba = UserPair.of("b", "a");

    expect(ab.low).toBe("a");
    expect(ab.high).toBe("b");
    expect(ba.low).toBe("a");
    expect(ba.high).toBe("b");
  });

  it("rejeita autorelacionamento (S3)", () => {
    expect(() => UserPair.of("a", "a")).toThrow("não é permitido ser amigo de si mesmo");
  });

  it("informa participantes e o outro membro", () => {
    const pair = UserPair.of("u1", "u2");

    expect(pair.contains("u1")).toBe(true);
    expect(pair.contains("u3")).toBe(false);
    expect(pair.other("u1")).toBe("u2");
    expect(pair.other("u2")).toBe("u1");
    expect(() => pair.other("u3")).toThrow("não pertence ao par");
  });

  it("compara pares iguais", () => {
    expect(UserPair.of("a", "b").equals(UserPair.of("b", "a"))).toBe(true);
    expect(UserPair.of("a", "b").equals(UserPair.of("a", "c"))).toBe(false);
  });
});
