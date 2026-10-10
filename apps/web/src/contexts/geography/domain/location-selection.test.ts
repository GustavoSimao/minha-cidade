import { describe, expect, it } from "vitest";

import { LocationSelection } from "./location-selection";

describe("LocationSelection", () => {
  it("aceita cidade sem bairro (G6)", () => {
    const selection = LocationSelection.create({ cityId: 3201308, neighborhoodId: null });
    expect(selection.hasCity).toBe(true);
    expect(selection.hasNeighborhood).toBe(false);
  });

  it("aceita cidade com bairro", () => {
    const selection = LocationSelection.create({
      cityId: 3201308,
      neighborhoodId: "uuid-do-bairro",
    });
    expect(selection.hasNeighborhood).toBe(true);
  });

  it("aceita seleção vazia", () => {
    const selection = LocationSelection.create({ cityId: null, neighborhoodId: null });
    expect(selection.hasCity).toBe(false);
  });

  it("rejeita bairro sem cidade (G4)", () => {
    expect(() =>
      LocationSelection.create({ cityId: null, neighborhoodId: "uuid-do-bairro" }),
    ).toThrow(/bairro selecionado exige a cidade/);
  });

  it("rejeita cidade fora de 7 dígitos", () => {
    expect(() => LocationSelection.create({ cityId: 320130, neighborhoodId: null })).toThrow(
      /código IBGE inválido/,
    );
  });
});
