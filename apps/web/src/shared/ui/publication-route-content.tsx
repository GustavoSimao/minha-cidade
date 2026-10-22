import { redirect } from "next/navigation";

import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { PublicationForm } from "@/shared/ui/publication-form";

/** Código IBGE de Cariacica/ES — município de lançamento (P12). */
const LAUNCH_CITY_ID = 3201308;

export async function PublicationRouteContent() {
  const session = await new SupabaseAuthGateway().currentSession();
  if (!session) redirect("/login?next=/publicar");

  const launchCity = await new SupabaseCityRepository().findById(LAUNCH_CITY_ID);

  return (
    <PublicationForm
      launchCity={launchCity
        ? {
            id: launchCity.id.value,
            name: launchCity.name,
            uf: launchCity.uf.sigla,
            slug: launchCity.slug.value,
          }
        : null}
    />
  );
}
