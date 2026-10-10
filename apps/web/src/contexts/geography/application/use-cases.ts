import type { Result } from "@/shared/kernel/result";

import { City } from "../domain/city";
import type { Neighborhood } from "../domain/neighborhood";
import type {
  CityOption,
  CityRepository,
  NeighborhoodOption,
  NeighborhoodRepository,
} from "./ports";

/** Normaliza o termo de busca: minúsculas, sem acentos, espaços comprimidos. */
function normalizeTerm(term: string): string {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s{2,}/g, " ");
}

function toCityOption(city: City): CityOption {
  return { id: city.id.value, name: city.name, uf: city.uf.sigla, slug: city.slug.value };
}

function toNeighborhoodOption(neighborhood: Neighborhood): NeighborhoodOption {
  return { id: neighborhood.id, name: neighborhood.name, slug: neighborhood.slug.value };
}

/** Busca de cidades para o seletor em cascata. */
export class SearchCities {
  constructor(private readonly cities: CityRepository) {}

  public async execute(params: {
    term: string;
    uf?: string | null;
    limit?: number;
  }): Promise<CityOption[]> {
    const term = normalizeTerm(params.term);

    if (term.length < 2) {
      return [];
    }

    const cities = await this.cities.search(term, {
      uf: params.uf ?? null,
      limit: Math.min(params.limit ?? 10, 50),
    });

    return cities.map(toCityOption);
  }
}

/** Lista de bairros de uma cidade ( cascata cidade → bairro ). */
export class ListNeighborhoodsByCity {
  constructor(private readonly neighborhoods: NeighborhoodRepository) {}

  public async execute(cityId: number): Promise<NeighborhoodOption[]> {
    const neighborhoods = await this.neighborhoods.listByCity(cityId);
    return neighborhoods.map(toNeighborhoodOption);
  }
}

export interface LocationLabels {
  cityName: string | null;
  cityUf: string | null;
  neighborhoodName: string | null;
}

/**
 * Valida e resolve o par cidade/bairro (invariantes G4 e G6) e devolve os nomes
 * para exibição — usado pelo perfil e, a partir da Fase 4, pelas publicações.
 */
export class ResolveLocationSelection {
  constructor(
    private readonly cities: CityRepository,
    private readonly neighborhoods: NeighborhoodRepository,
  ) {}

  public async execute(params: {
    cityId: number | null;
    neighborhoodId: string | null;
  }): Promise<Result<LocationLabels>> {
    const { cityId, neighborhoodId } = params;

    if (cityId === null) {
      if (neighborhoodId !== null) {
        return { ok: false, error: "bairro selecionado exige a cidade correspondente" };
      }
      return { ok: true, value: { cityName: null, cityUf: null, neighborhoodName: null } };
    }

    const city = await this.cities.findById(cityId);
    if (city === null) {
      return { ok: false, error: "cidade não encontrada" };
    }

    if (neighborhoodId === null) {
      // G6: cidade sem bairro é seleção válida.
      return {
        ok: true,
        value: { cityName: city.name, cityUf: city.uf.sigla, neighborhoodName: null },
      };
    }

    const neighborhood = await this.neighborhoods.findById(neighborhoodId);
    // G4: o bairro precisa pertencer à cidade informada.
    if (neighborhood === null || !neighborhood.cityId.equals(city.id)) {
      return { ok: false, error: "bairro não pertence à cidade selecionada" };
    }

    return {
      ok: true,
      value: {
        cityName: city.name,
        cityUf: city.uf.sigla,
        neighborhoodName: neighborhood.name,
      },
    };
  }
}
