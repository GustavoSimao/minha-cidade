import { describe, expect, it } from "vitest";

import { City, IbgeCode } from "./city";
import { Neighborhood } from "./neighborhood";

const CARIACICA = IbgeCode.create(3201308);

function bairro(overrides: Partial<Parameters<typeof Neighborhood.create>[0]> = {}) {
  return Neighborhood.create({
    id: "b1c2d3e4-0000-4000-8000-000000000001",
    cityId: CARIACICA,
    name: "Porto de Santana",
    source: "lc_171_2025",
    sourceUrl: "https://exemplo.oficial/anexo.pdf",
    ...overrides,
  });
}

describe("Neighborhood", () => {
  it("deriva o slug do nome (G3)", () => {
    expect(bairro().slug.value).toBe("porto-de-santana");
  });

  it("exige source da fonte oficial (G8)", () => {
    expect(() => bairro({ source: "" })).toThrow(/source/);
    expect(() => bairro({ source: undefined as unknown as string })).toThrow(/source/);
  });

  it("rejeita nome fora de 2..120 caracteres", () => {
    expect(() => bairro({ name: " X " })).toThrow(/2 e 120/);
    expect(() => bairro({ name: "x".repeat(121) })).toThrow(/2 e 120/);
  });

  it("compara identidade pelo id", () => {
    const a = bairro();
    const b = bairro({ id: "outro-id" });
    expect(a.equals(b)).toBe(false);
    expect(a.equals(bairro())).toBe(true);
  });
});

describe("IbgeCode", () => {
  it("aceita 7 dígitos", () => {
    expect(IbgeCode.create(3201308).value).toBe(3201308);
  });

  it("rejeita valor não inteiro", () => {
    expect(() => IbgeCode.create(3201308.5)).toThrow();
  });
});

describe("City x Neighborhood", () => {
  it("bairro referencia a cidade pelo código IBGE", () => {
    const city = City.create({ id: 3201308, uf: "ES", name: "Cariacica" });
    expect(bairro().cityId.equals(city.id)).toBe(true);
  });
});
