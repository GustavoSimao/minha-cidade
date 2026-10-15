import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DiscoverRandomPeople } from "@/contexts/social-graph/application/use-cases";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import {
  SupabaseFriendshipRepository,
  SupabaseProfileLookup,
} from "@/contexts/social-graph/infrastructure/supabase/friendship-repository";
import { currentSocialGraphSession } from "@/contexts/social-graph/infrastructure/session";
import { EmptyState } from "@/shared/ui/empty-state";
import { UsersIcon } from "@/shared/ui/icon";
import { PersonRow } from "@/shared/ui/social-graph/person-row";

export const metadata: Metadata = { title: "Descobrir pessoas" };

// Página privada: depende da sessão.
export const instant = false;

interface DiscoverParams {
  searchParams: Promise<{ exclude?: string }>;
}

/** Teto do `exclude` acumulado pelo "pular" (D-6 — evita URL gigante). */
const EXCLUDE_CAP = 20;

/** Descoberta de pessoas da plataforma (S3/S4): cartões com "pular" acumulando exclusões. */
export default async function DiscoverPeoplePage({ searchParams }: DiscoverParams) {
  const session = await new SupabaseAuthGateway().currentSession();

  if (!session) {
    redirect("/login?next=/amigos/descobrir");
  }

  const { exclude: rawExclude } = await searchParams;
  const exclude = (rawExclude ?? "")
    .split(",")
    .filter((id) => id.length > 0)
    .slice(-EXCLUDE_CAP);

  const result = await new DiscoverRandomPeople(
    currentSocialGraphSession,
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  ).execute({ limit: 5, exclude });

  const people = result.ok ? result.value : [];

  // Nomes de cidade/bairro resolvidos por ID (Geografia — D7).
  const cityNames = new Map<number, string>();
  for (const cityId of [...new Set(people.map((person) => person.cityId))]) {
    if (cityId === null) {
      continue;
    }

    const city = await new SupabaseCityRepository().findById(cityId);

    if (city) {
      cityNames.set(cityId, `${city.name} — ${city.uf.sigla}`);
    }
  }

  const neighborhoodNames = new Map<string, string>();
  for (const neighborhoodId of [...new Set(people.map((person) => person.neighborhoodId))]) {
    if (neighborhoodId === null) {
      continue;
    }

    const neighborhood = await new SupabaseNeighborhoodRepository().findById(neighborhoodId);

    if (neighborhood) {
      neighborhoodNames.set(neighborhoodId, neighborhood.name);
    }
  }

  const nextExclude = [...exclude, ...people.map((person) => person.id)].slice(-EXCLUDE_CAP);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-strong">Descobrir pessoas</h1>
      <p className="mt-1 text-sm text-text-muted">
        Pessoas de toda a plataforma que você ainda não conhece. O bairro aparece só
        quando a pessoa escolhe mostrar.
      </p>

      {people.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Você já viu todo mundo por enquanto (ou já é amigo de quase todos). Convide alguém pelo @ ou volte mais tarde, quando a comunidade crescer."
            icon={<UsersIcon className="h-8 w-8" />}
            title="Ninguém novo para descobrir"
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {people.map((person) => (
            <PersonRow
              canInteract={session.emailConfirmed}
              key={person.id}
              person={person}
              relationship="none"
              subtitle={
                [
                  person.neighborhoodId
                    ? neighborhoodNames.get(person.neighborhoodId)
                    : null,
                  person.cityId ? cityNames.get(person.cityId) : null,
                ]
                  .filter((part): part is string => Boolean(part))
                  .join(", ") || undefined
              }
            />
          ))}
        </ul>
      )}

      {people.length > 0 ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
          href={`/amigos/descobrir?exclude=${nextExclude.join(",")}`}
        >
          Pular estes e ver outras pessoas
        </Link>
      ) : null}
    </div>
  );
}
