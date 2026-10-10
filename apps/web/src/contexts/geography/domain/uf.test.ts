import { describe, expect, it } from "vitest";

import { Uf, UF_SIGLAS } from "./uf";

describe("Uf", () => {
  it("aceita as 27 siglas oficiais", () => {
    expect(UF_SIGLAS).toHaveLength(27);
    for (const sigla of UF_SIGLAS) {
      expect(Uf.create(sigla).sigla).toBe(sigla);
    }
  });

  it("normaliza minúsculas e espaços", () => {
    expect(Uf.create(" es ").sigla).toBe("ES");
  });

  it("rejeita sigla inexistente", () => {
    expect(() => Uf.create("XX")).toThrow(/UF inválida/);
    expect(() => Uf.create("Essa")).toThrow(/UF inválida/);
  });

  it("compara por valor", () => {
    expect(Uf.create("ES").equals(Uf.create("es"))).toBe(true);
    expect(Uf.create("ES").equals(Uf.create("RJ"))).toBe(false);
  });
});
