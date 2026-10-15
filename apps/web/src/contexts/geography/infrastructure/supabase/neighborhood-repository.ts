import type {
  NeighborhoodOption,
  NeighborhoodRepository,
  NeighborhoodRow,
} from "@/contexts/geography/application/ports";
import { IbgeCode } from "@/contexts/geography/domain/city";
import { Neighborhood } from "@/contexts/geography/domain/neighborhood";
import { createClient, table } from "@/shared/infrastructure/supabase";

function toDomain(row: NeighborhoodRow): Neighborhood {
  return Neighborhood.create({
    id: row.id,
    cityId: IbgeCode.create(row.city_id),
    name: row.name,
    source: row.source,
    sourceUrl: row.source_url,
  });
}

/** Repositório de bairros (catálogo curado) em Supabase/Postgres. */
export class SupabaseNeighborhoodRepository implements NeighborhoodRepository {
  async listByCity(cityId: number): Promise<Neighborhood[]> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "geography.neighborhoods")
      .select("id, city_id, name, slug, source, source_url")
      .eq("city_id", cityId)
      .order("slug", { ascending: true });

    if (error) {
      throw new Error(`falha ao buscar bairros: ${error.message}`);
    }

    return ((data ?? []) as unknown as NeighborhoodRow[]).map(toDomain);
  }

  async findById(id: string): Promise<Neighborhood | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "geography.neighborhoods")
      .select("id, city_id, name, slug, source, source_url")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar bairro: ${error.message}`);
    }

    return data ? toDomain(data as unknown as NeighborhoodRow) : null;
  }
}

export type { NeighborhoodOption };
