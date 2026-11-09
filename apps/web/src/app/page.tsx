import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ListFeed } from "@/contexts/publication/application/use-cases";
import { SupabaseAuthorDirectory } from "@/contexts/publication/infrastructure/supabase/author-directory";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { signedMediaUrls } from "@/contexts/publication/infrastructure/supabase/storage";
import { SupabaseEngagementRepository } from "@/contexts/engagement/infrastructure/supabase/engagement-repository";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { HomeShell } from "@/shared/ui/home-shell";

export const metadata: Metadata = {
  title: "Feed do bairro",
  description: "Publicações de problemas e ideias do seu bairro.",
};

interface HomePageProps {
  searchParams: Promise<{ cidade?: string; bairro?: string; tipo?: string; cursor?: string }>;
}

function FeedLoading() {
  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-3 py-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-4 bg-soft rounded w-3/4 animate-pulse"></div>
      ))}
    </div>
  );
}

async function ServerFeed({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const cityId = params.cidade ? Number(params.cidade) : null;
  const type = params.tipo === "problem" || params.tipo === "idea" ? params.tipo : null;

  if (params.bairro && !params.cidade) {
    const neighborhood = await new SupabaseNeighborhoodRepository().findById(params.bairro);
    if (neighborhood) {
      redirect(`/?cidade=${neighborhood.cityId.value}&bairro=${params.bairro}`);
    }
  }

  const { items, nextCursor } = await new ListFeed(new SupabasePublicationRepository()).execute({
    cityId: cityId && Number.isInteger(cityId) ? cityId : null,
    neighborhoodId: params.bairro ?? null,
    type,
    cursor: params.cursor ?? null,
    limit: 20,
  });

  const authors = await new SupabaseAuthorDirectory().findPublicAuthors(
    items.map((item) => item.authorId ?? "").filter((id) => id.length > 0),
  );

  const cityRepo = new SupabaseCityRepository();
  const neighborhoodRepo = new SupabaseNeighborhoodRepository();

  const cityNames = new Map<number, string>();
  for (const cityIdToLoad of [...new Set(items.map((item) => item.cityId))]) {
    const city = await cityRepo.findById(cityIdToLoad);
    if (city) {
      cityNames.set(cityIdToLoad, `${city.name} — ${city.uf.sigla}`);
    }
  }

  const neighborhoodNames = new Map<string, string>();
  for (const id of [...new Set(items.map((item) => item.neighborhoodId).filter((id): id is string => id !== null))]) {
    const neighborhood = await neighborhoodRepo.findById(id);
    if (neighborhood) {
      neighborhoodNames.set(id, neighborhood.name);
    }
  }

  const medias = await Promise.all(
    items.map((item) => signedMediaUrls(item.media.map((media) => media.path))),
  );

  const engagement = new SupabaseEngagementRepository();
  const session = await new SupabaseAuthGateway().currentSession();
  const [counts, myReactions] = await Promise.all([
    engagement.countsByPublicationIds(items.map((item) => item.id)),
    session?.emailConfirmed
      ? engagement.listReactionsByUser(items.map((item) => item.id), session.userId)
      : Promise.resolve({}),
  ]);

  const filters: Record<string, string> = {};
  if (params.cidade) filters.cidade = params.cidade;
  if (params.bairro) filters.bairro = params.bairro;
  if (params.tipo) filters.tipo = params.tipo;

  const anyFilterActive = cityId !== null || (params.bairro ?? "") !== "" || type !== null;

  const serializedItems = items.map((item) => ({
    id: item.id,
    type: item.type,
    authorId: item.authorId ?? null,
    title: item.title,
    content: item.content,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    editedAt: item.editedAt instanceof Date ? item.editedAt.toISOString() : (item.editedAt ?? null),
    media: item.media.map((m) => ({ path: m.path })),
    cityId: item.cityId,
    neighborhoodId: item.neighborhoodId,
  }));

  const serializedMedias: Array<(string | null)[]> = medias.map((m) => m.map((u) => u ?? null));

  return (
    <HomeShell
      items={serializedItems}
      nextCursor={nextCursor}
      authors={authors}
      cityNames={cityNames}
      neighborhoodNames={neighborhoodNames}
      medias={serializedMedias}
      counts={counts}
      filters={filters}
      anyFilterActive={anyFilterActive}
      canInteract={session !== null && session.emailConfirmed}
      myReactions={myReactions}
      signedIn={session !== null}
    />
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  return (
    <Suspense fallback={<FeedLoading />}>
      <ServerFeed searchParams={searchParams} />
    </Suspense>
  );
}
