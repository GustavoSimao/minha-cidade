import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { ListFeed } from "@/contexts/publication/application/use-cases";
import { SupabaseAuthorDirectory } from "@/contexts/publication/infrastructure/supabase/author-directory";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { signedMediaUrls } from "@/contexts/publication/infrastructure/supabase/storage";
import { SupabaseEngagementRepository } from "@/contexts/engagement/infrastructure/supabase/engagement-repository";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/storage";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { InboxIcon } from "@/shared/ui/icon";
import { FeedFilters } from "@/shared/ui/feed-filters";
import { RelativeTime } from "@/shared/ui/relative-time";

export const metadata: Metadata = {
  title: "Feed do bairro",
  description: "Publicações de problemas e ideias do seu bairro.",
};

// A home É o feed público (a landing foi removida): lê o banco a cada requisição
// (sessão anônima). `/feed` redireciona para cá preservando os filtros.
export const instant = false;

interface HomePageProps {
  searchParams: Promise<{ cidade?: string; bairro?: string; tipo?: string; cursor?: string }>;
}

/** Feed público paginado (P8: recente primeiro, sem ranking; P4: anonimato preservado). */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const cityId = params.cidade ? Number(params.cidade) : null;
  const type = params.tipo === "problem" || params.tipo === "idea" ? params.tipo : null;

  // Filtro por bairro sem cidade: a cascata da UI (cidade → bairro) só
  // inicializa quando a cidade está na URL — sem canonicalizar, o filtro
  // funcionaria no servidor mas a interface não mostraria o bairro ativo.
  // Resolve a cidade dona do bairro e reescreve a URL com os dois parâmetros.
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

  // Nomes resolvidos por ID (D7: sem JOIN entre schemas).
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

  // Contadores públicos em lote (integração por ID, D7 — sem JOIN entre schemas).
  const counts = await new SupabaseEngagementRepository().countsByPublicationIds(
    items.map((item) => item.id),
  );

  const filters = new URLSearchParams();
  if (params.cidade) filters.set("cidade", params.cidade);
  if (params.bairro) filters.set("bairro", params.bairro);
  if (params.tipo) filters.set("tipo", params.tipo);

  const anyFilterActive = cityId !== null || (params.bairro ?? "") !== "" || type !== null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text-strong">Feed do bairro</h1>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
          href="/publicar"
        >
          Publicar
        </Link>
      </div>

      <FeedFilters />

      <section className="mt-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <EmptyState
            action={
              anyFilterActive ? (
                <Link
                  className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-5 py-2 text-sm font-semibold text-text-body hover:bg-surface"
                  href="/"
                >
                  Limpar filtros
                </Link>
              ) : (
                <Link
                  className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
                  href="/publicar"
                >
                  Publicar agora
                </Link>
              )
            }
            description={
              anyFilterActive
                ? "Nenhuma publicação corresponde a esses filtros. Tente ampliar a busca ou limpar os filtros."
                : "Assim que alguém do bairro contar o que está acontecendo, a publicação aparece aqui. Você pode ser o primeiro."
            }
            icon={<InboxIcon className="h-8 w-8" />}
            title={anyFilterActive ? "Nenhum resultado para os filtros" : "Nenhuma publicação por aqui ainda"}
          />
        ) : (
          items.map((item, index) => {
            const author = item.authorId ? authors.get(item.authorId) : null;

            return (
              <article
                className="rounded-card border border-border-subtle bg-surface-raised p-5 shadow-stamp"
                key={item.id}
              >
                <div className="flex items-center gap-3">
                  {author ? (
                    <Link aria-label={`Perfil de ${author.fullName}`} href={`/perfil/${author.username}`}>
                      <Avatar
                        imageUrl={
                          author.avatarPath
                            ? publicStorageUrl("avatars", author.avatarPath)
                            : null
                        }
                        name={author.fullName}
                        size={36}
                      />
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted">
                      Anônimo
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-strong">
                      {author ? (
                        <Link className="hover:underline" href={`/perfil/${author.username}`}>
                          {author.fullName}
                        </Link>
                      ) : (
                        "Morador anônimo"
                      )}
                    </span>
                    {author?.isVerified && author.verifiedOrg ? (
                      <Badge className="mt-1 self-start" testId="institutional-badge" tone="institutional">
                        {author.verifiedOrg}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-text-muted">
                      <RelativeTime date={item.createdAt} />
                      {item.editedAt ? " · editado" : ""}
                    </span>
                  </div>
                  <Badge tone={item.type === "problem" ? "problem" : "idea"}>
                    {item.type === "problem" ? "Problema" : "Ideia"}
                  </Badge>
                </div>

                <h2 className="mt-3 text-base font-semibold text-text-strong">
                  <Link href={`/publicacao/${item.id}`}>{item.title}</Link>
                </h2>

                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-text-body">
                  {item.content}
                </p>

                {medias[index]?.length ? (
                  <ul className="mt-3 hidden gap-2 sm:grid sm:grid-cols-3">
                    {medias[index].map((url, position) =>
                      url ? (
                        <li key={position}>
                          <Image
                            alt={`Imagem ${position + 1} da publicação`}
                            className="aspect-square w-full rounded-lg border border-border-subtle object-cover"
                            height={160}
                            sizes="(min-width: 640px) 180px, 100vw"
                            src={url}
                            width={160}
                          />
                        </li>
                      ) : null,
                    )}
                  </ul>
                ) : null}

                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                  <span>
                    Apoio {counts[item.id]?.support ?? 0} · Oposição {counts[item.id]?.oppose ?? 0}
                  </span>
                  <span>{counts[item.id]?.comments ?? 0} comentário(s)</span>
                </p>

                <p className="mt-1 text-xs text-text-muted">
                  {[cityNames.get(item.cityId), neighborhoodNames.get(item.neighborhoodId ?? "") ?? "Bairro não informado"]
                    .filter((part): part is string => Boolean(part))
                    .join(", ")}
                </p>
              </article>
            );
          })
        )}
      </section>

      {nextCursor ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
          href={`/?${new URLSearchParams({ ...Object.fromEntries(filters), cursor: nextCursor })}`}
        >
          Carregar mais
        </Link>
      ) : null}
    </div>
  );
}
