import type { Result } from "@/shared/kernel/result";
import { ok } from "@/shared/kernel/result";

import { ResolveLocationSelection } from "@/contexts/geography/application/use-cases";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import type { LocationValidator } from "@/contexts/publication/application/ports";

/**
 * Validação de localização das publicações compondo os casos de uso de
 * Geography (integração por IDs/portas — D7/D15).
 */
export class GeographyLocationValidator implements LocationValidator {
  private readonly resolve = new ResolveLocationSelection(
    new SupabaseCityRepository(),
    new SupabaseNeighborhoodRepository(),
  );

  private readonly neighborhoods = new SupabaseNeighborhoodRepository();

  async validate(params: {
    cityId: number;
    neighborhoodId: string | null;
  }): Promise<
    Result<{
      cityName: string;
      neighborhoodName: string | null;
      hasCuratedNeighborhoods: boolean;
    }>
  > {
    const location = await this.resolve.execute(params);

    if (!location.ok) {
      return location;
    }

    // P6: município com lista curada exige bairro.
    const curated = await this.neighborhoods.listByCity(params.cityId);

    return ok({
      cityName: location.value.cityName ?? "",
      neighborhoodName: location.value.neighborhoodName,
      hasCuratedNeighborhoods: curated.length > 0,
    });
  }
}
