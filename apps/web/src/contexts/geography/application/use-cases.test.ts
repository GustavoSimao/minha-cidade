import { describe, expect, it } from "vitest";

import { City, IbgeCode } from "../domain/city";
import { Neighborhood } from "../domain/neighborhood";
import type {
  CityRepository,
  NeighborhoodRepository,
} from "./ports";
import { ListNeighborhoodsByCity, ResolveLocationSelection, SearchCities } from "./use-cases";

const CARIACICA = City.create({ id: 3201308, uf: "ES", name: "Cariacica" });
const VIANA = City.create({ id: 3201902, uf: "ES", name: "Viana" });
const BOM_JESUS_PI = City.create({ id: 2202400, uf: "PI", name: "Bom Jesus" });

function bairroDaCidade(name: string, id: string): Neighborhood {
  return Neighborhood.create({
    id,
    cityId: CARIACICA.id,
    name,
    source: "lc_171_2025",
    sourceUrl: "https://exemplo.oficial/anexo.pdf",
  });
}

const PORTO_DE_SANTANA = bairroDaCidade("Porto de Santana", "uuid-porto-de-santana");

function fakeCities(cities: City[]): CityRepository {
  return {
    async search(term) {
      const normalized = term.toLowerCase();
      return cities.filter(
        (city) =>
          city.name.toLowerCase().includes(normalized) ||
          city.slug.value.includes(normalized),
      );
    },
    async findById(id) {
      return cities.find((city) => city.id.value === id) ?? null;
    },
  };
}

function fakeNeighborhoods(neighborhoods: Neighborhood[]): NeighborhoodRepository {
  return {
    async listByCity(cityId) {
      return neighborhoods.filter((n) => n.cityId.value === cityId);
    },
    async findById(id) {
      return neighborhoods.find((n) => n.id === id) ?? null;
    },
  };
}

const cities = [CARIACICA, VIANA, BOM_JESUS_PI];
const neighborhoods = [PORTO_DE_SANTANA];

describe("SearchCities", () => {
  it("ignora termo com menos de 2 caracteres", async () => {
    const useCase = new SearchCities(fakeCities(cities));
    expect(await useCase.execute({ term: "c" })).toEqual([]);
  });

  it("encontra por nome, sem acento e sem diferenciar caixa", async () => {
    const useCase = new SearchCities(fakeCities(cities));
    const found = await useCase.execute({ term: "cariacica" });
    expect(found).toHaveLength(1);
    expect(found[0]).toEqual({
      id: 3201308,
      name: "Cariacica",
      uf: "ES",
      slug: "cariacica-es",
    });
  });

  it("encontra por slug com sufixo de UF (G2)", async () => {
    const useCase = new SearchCities(fakeCities(cities));
    const found = await useCase.execute({ term: "bom-jesus-pi" });
    expect(found.map((c) => c.name)).toEqual(["Bom Jesus"]);
  });

  it("respeita o limite máximo de 50", async () => {
    const useCase = new SearchCities(fakeCities(cities));
    expect(await useCase.execute({ term: "a", limit: 500 })).toBeInstanceOf(Array);
  });
});

describe("ListNeighborhoodsByCity", () => {
  it("lista bairros da cidade", async () => {
    const useCase = new ListNeighborhoodsByCity(fakeNeighborhoods(neighborhoods));
    const found = await useCase.execute(3201308);
    expect(found).toEqual([{ id: "uuid-porto-de-santana", name: "Porto de Santana", slug: "porto-de-santana" }]);
  });

  it("devolve lista vazia para cidade sem curadoria (G6)", async () => {
    const useCase = new ListNeighborhoodsByCity(fakeNeighborhoods(neighborhoods));
    expect(await useCase.execute(3201902)).toEqual([]);
  });
});

describe("ResolveLocationSelection", () => {
  const useCase = () =>
    new ResolveLocationSelection(fakeCities(cities), fakeNeighborhoods(neighborhoods));

  it("aceita seleção vazia", async () => {
    const result = await useCase().execute({ cityId: null, neighborhoodId: null });
    expect(result).toEqual({
      ok: true,
      value: { cityName: null, cityUf: null, neighborhoodName: null },
    });
  });

  it("aceita cidade sem bairro (G6)", async () => {
    const result = await useCase().execute({ cityId: 3201308, neighborhoodId: null });
    expect(result).toEqual({
      ok: true,
      value: { cityName: "Cariacica", cityUf: "ES", neighborhoodName: null },
    });
  });

  it("aceita par consistente e devolve os nomes", async () => {
    const result = await useCase().execute({
      cityId: 3201308,
      neighborhoodId: "uuid-porto-de-santana",
    });
    expect(result).toEqual({
      ok: true,
      value: { cityName: "Cariacica", cityUf: "ES", neighborhoodName: "Porto de Santana" },
    });
  });

  it("rejeita bairro sem cidade (G4)", async () => {
    const result = await useCase().execute({ cityId: null, neighborhoodId: "uuid-porto-de-santana" });
    expect(result.ok).toBe(false);
  });

  it("rejeita bairro de outra cidade (G4)", async () => {
    const result = await useCase().execute({
      cityId: 3201902,
      neighborhoodId: "uuid-porto-de-santana",
    });
    expect(result).toEqual({ ok: false, error: "bairro não pertence à cidade selecionada" });
  });

  it("rejeita cidade inexistente", async () => {
    const result = await useCase().execute({ cityId: 9999999, neighborhoodId: null });
    expect(result).toEqual({ ok: false, error: "cidade não encontrada" });
  });
});

describe("IbgeCode", () => {
  it("é usado pelas entidades do domínio", () => {
    expect(IbgeCode.create(3201308).value).toBe(3201308);
    expect(CARIACICA.id.equals(IbgeCode.create(3201308))).toBe(true);
  });
});
