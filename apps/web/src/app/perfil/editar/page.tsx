import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResolveLocationSelection } from "@/contexts/geography/application/use-cases";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { Alert } from "@/shared/ui/form";
import { Badge as BadgePill } from "@/shared/ui/badge";
import {
  CloseAccountForm,
  ProfileForm,
  type OwnProfileFormData,
} from "@/shared/ui/profile-forms";

export const metadata: Metadata = { title: "Meu perfil" };

/** Código IBGE de Cariacica/ES — município de lançamento (P12). */
const LAUNCH_CITY_ID = 3201308;

// Página protegida: depende da sessão e do perfil do usuário.
export const instant = false;

export default async function EditProfilePage() {
  const auth = new SupabaseAuthGateway();
  const session = await auth.currentSession();

  if (!session) {
    redirect("/login?next=/perfil/editar");
  }

  const profile = await new SupabaseProfileRepository().findById(session.userId);

  if (!profile) {
    return (
      <Alert tone="error">
        Não encontramos seu perfil. Encerre a sessão e entre novamente para recriá-lo.
      </Alert>
    );
  }

  // Nomes da localização para exibição (Geography resolve IDs — D7).
  const location = await new ResolveLocationSelection(
    new SupabaseCityRepository(),
    new SupabaseNeighborhoodRepository(),
  ).execute({ cityId: profile.cityId, neighborhoodId: profile.neighborhoodId });

  const launchCity = await new SupabaseCityRepository().findById(LAUNCH_CITY_ID);

  const formData: OwnProfileFormData = {
    username: profile.username.value,
    fullName: profile.fullName.value,
    bio: profile.toPublicView(new Date()).bio,
    phone: profile.phone,
    cityId: profile.cityId,
    cityName: location.ok ? location.value.cityName : null,
    cityUf: location.ok ? location.value.cityUf : null,
    neighborhoodId: profile.neighborhoodId,
    launchCity: launchCity
      ? {
          id: launchCity.id.value,
          name: launchCity.name,
          uf: launchCity.uf.sigla,
          slug: launchCity.slug.value,
        }
      : null,
    isVerified: profile.isVerified,
    verifiedOrg: profile.verifiedOrg?.name ?? null,
    role: profile.role.name,
    emailConfirmed: session.emailConfirmed,
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {!session.emailConfirmed ? (
        <Alert tone="error">
          Confirme seu e-mail para publicar, comentar, enviar amizades e denunciar. A
          leitura do feed já está liberada.
        </Alert>
      ) : null}

      {profile.isVerified && profile.verifiedOrg ? (
        <p className="text-sm text-text-muted">
          Selo institucional ativo: <BadgePill tone="institutional">{profile.verifiedOrg.name}</BadgePill>
        </p>
      ) : null}

      <ProfileForm profile={formData} />

      <CloseAccountForm />
    </div>
  );
}
