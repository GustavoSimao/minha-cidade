import { describe, expect, it } from "vitest";

import { City } from "./city";

describe("City", () => {
  it("deriva o slug nome-uf (G2)", () => {
    const city = City.create({ id: 3201308, uf: "ES", name: "Cariacica" });
    expect(city.slug.value).toBe("cariacica-es");
    expect(city.uf.sigla).toBe("ES");
    expect(city.id.value).toBe(3201308);
  });

  it("nomes repetidos entre UFs geram slugs distintos", () => {
    const pi = City.create({ id: 2202400, uf: "PI", name: "Bom Jesus" });
    const rs = City.create({ id: 4304200, uf: "RS", name: "Bom Jesus" });
    expect(pi.slug.value).toBe("bom-jesus-pi");
    expect(rs.slug.value).toBe("bom-jesus-rs");
    expect(pi.slug.equals(rs.slug)).toBe(false);
  });

  it("remove acentos e pontuação do slug", () => {
    const city = City.create({ id: 3306206, uf: "RJ", name: "São João de Meriti" });
    expect(city.slug.value).toBe("sao-joao-de-meriti-rj");
  });

  it("rejeita código IBGE fora de 7 dígitos (G1)", () => {
    expect(() => City.create({ id: 320130, uf: "ES", name: "Cariacica" })).toThrow(
      /código IBGE inválido/,
    );
    expect(() => City.create({ id: 32013080, uf: "ES", name: "Cariacica" })).toThrow(
      /código IBGE inválido/,
    );
  });

  it("rejeita nome curto e UF inválida", () => {
    expect(() => City.create({ id: 3201308, uf: "ES", name: "X" })).toThrow(/2 e 120/);
    expect(() => City.create({ id: 3201308, uf: "ZZ", name: "Cariacica" })).toThrow();
  });

  it("compara identidade pelo código IBGE", () => {
    const a = City.create({ id: 3201308, uf: "ES", name: "Cariacica" });
    const b = City.create({ id: 3201308, uf: "ES", name: "Cariacica" });
    const c = City.create({ id: 3201902, uf: "ES", name: "Viana" });
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
