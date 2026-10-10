import type { City } from "../domain/city";
import type { Neighborhood } from "../domain/neighborhood";

/** Linha de `geography.cities` como vem do banco. */
export interface CityRow {
  id: number;
  uf: string;
  name: string;
  slug: string;
  ibge_synced_at: string | null;
}

/** Linha de `geography.neighborhoods` como vem do banco. */
export interface NeighborhoodRow {
  id: string;
  city_id: number;
  name: string;
  slug: string;
  source: string;
  source_url: string | null;
}

/** Projeção mínima devolvida às interfaces (nunca a linha crua). */
export interface CityOption {
  id: number;
  name: string;
  uf: string;
  slug: string;
}

/** Projeção mínima devolvida às interfaces (nunca a linha crua). */
export interface NeighborhoodOption {
  id: string;
  name: string;
  slug: string;
}

/**
 * Porta de persistência do contexto Geography (D6: infraestrutura depende de
 * abstração). A implementação atual é Supabase; os casos de uso só conhecem esta
 * interface.
 */
export interface CityRepository {
  /** Busca cidades por nome/slug (termo ≥ 2 caracteres); UF opcional filtra. */
  search(term: string, options?: { uf?: string | null; limit?: number }): Promise<City[]>;

  /** Cidade pelo código IBGE ou `null`. */
  findById(id: number): Promise<City | null>;
}

export interface NeighborhoodRepository {
  /** Bairros curados da cidade, ordenados por nome; vazio = sem curadoria (G6). */
  listByCity(cityId: number): Promise<Neighborhood[]>;

  /** Bairro pelo id ou `null`. */
  findById(id: string): Promise<Neighborhood | null>;
}
