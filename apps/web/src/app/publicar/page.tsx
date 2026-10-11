import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { PublicationForm } from "@/shared/ui/publication-form";

export const metadata: Metadata = { title: "Publicar" };

/** Código IBGE de Cariacica/ES — município de lançamento (P12). */
const LAUNCH_CITY_ID = 3201308;

// Página protegida: depende da sessão (P3 — publicar exige conta com e-mail confirmado).
export const instant = false;

export default async function PublishPage() {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    redirect("/login?next=/publicar");
  }

  const launchCity = await new SupabaseCityRepository().findById(LAUNCH_CITY_ID);

  return (
    <div className="mx-auto max-w-2xl">
      <PublicationForm
        launchCity={
          launchCity
            ? {
                id: launchCity.id.value,
                name: launchCity.name,
                uf: launchCity.uf.sigla,
                slug: launchCity.slug.value,
              }
            : null
        }
      />
    </div>
  );
}
