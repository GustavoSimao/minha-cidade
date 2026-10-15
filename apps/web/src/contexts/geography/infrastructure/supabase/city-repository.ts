import { City } from "@/contexts/geography/domain/city";
import type {
  CityOption,
  CityRepository,
  CityRow,
} from "@/contexts/geography/application/ports";
import { createClient, table } from "@/shared/infrastructure/supabase";

function toDomain(row: CityRow): City {
  return City.create({
    id: row.id,
    uf: row.uf,
    name: row.name,
    ibgeSyncedAt: row.ibge_synced_at ? new Date(row.ibge_synced_at) : null,
  });
}

/** Repositório de cidades (catálogo IBGE) em Supabase/Postgres. */
export class SupabaseCityRepository implements CityRepository {
  async search(
    term: string,
    options?: { uf?: string | null; limit?: number },
  ): Promise<City[]> {
    const supabase = await createClient();
    const limit = options?.limit ?? 10;

    let query = table(supabase, "geography.cities")
      .select("id, uf, name, slug, ibge_synced_at")
      .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
      .limit(limit);

    if (options?.uf) {
      query = query.eq("uf", options.uf);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`falha ao buscar cidades: ${error.message}`);
    }

    return ((data ?? []) as unknown as CityRow[]).map(toDomain);
  }

  async findById(id: number): Promise<City | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "geography.cities")
      .select("id, uf, name, slug, ibge_synced_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar cidade: ${error.message}`);
    }

    return data ? toDomain(data as unknown as CityRow) : null;
  }
}

export type { CityOption };
