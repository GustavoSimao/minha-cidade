import type { Metadata } from "next";
import Link from "next/link";

import { ListFeed } from "@/contexts/publication/application/use-cases";
import { SupabaseAuthorDirectory } from "@/contexts/publication/infrastructure/supabase/author-directory";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { signedMediaUrls } from "@/contexts/publication/infrastructure/supabase/storage";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/storage";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";

export const metadata: Metadata = {
  title: "Feed do bairro",
  description: "Publicações de problemas e ideias do seu bairro.",
};

// Feed público lê o banco a cada requisição (sessão anônima).
export const instant = false;

interface FeedPageProps {
  searchParams: Promise<{ cidade?: string; bairro?: string; tipo?: string; cursor?: string }>;
}

function timeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(seconds) < 60) {
    return formatter.format(-seconds, "second");
  }
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return formatter.format(-minutes, "minute");
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return formatter.format(-hours, "hour");
  }
  return formatter.format(-Math.round(hours / 24), "day");
}

/** Feed público paginado (P8: recente primeiro, sem ranking; P4: anonimato preservado). */
export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const cityId = params.cidade ? Number(params.cidade) : null;
  const type = params.tipo === "problem" || params.tipo === "idea" ? params.tipo : null;

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

  const filters = new URLSearchParams();
  if (params.cidade) filters.set("cidade", params.cidade);
  if (params.bairro) filters.set("bairro", params.bairro);
  if (params.tipo) filters.set("tipo", params.tipo);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-text-strong">Feed do bairro</h1>
        <Link
          className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          href="/publicar"
        >
          Publicar
        </Link>
      </div>

      <section className="mt-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="rounded-card border border-dashed border-border-subtle bg-surface-raised p-6 text-center text-text-body">
            Nenhuma publicação por aqui ainda. Seja o primeiro a contar o que está
            acontecendo no bairro.
          </p>
        ) : (
          items.map((item, index) => {
            const author = item.authorId ? authors.get(item.authorId) : null;

            return (
              <article
                className="rounded-card border border-border-subtle bg-surface-raised p-5 shadow-sm"
                key={item.id}
              >
                <div className="flex items-center gap-3">
                  {author ? (
                    <Link href={`/perfil/${author.username}`}>
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
                    <span className="text-xs text-text-muted">
                      {timeAgo(item.createdAt)}
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

                <p className="mt-1 whitespace-pre-line text-sm text-text-body">
                  {item.content}
                </p>

                {medias[index]?.length ? (
                  <ul className="mt-3 grid grid-cols-3 gap-2">
                    {medias[index].map((url, position) =>
                      url ? (
                        <li key={position}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={`Imagem ${position + 1} da publicação`}
                            className="aspect-square w-full rounded-lg border border-border-subtle object-cover"
                            src={url}
                          />
                        </li>
                      ) : null,
                    )}
                  </ul>
                ) : null}

                <p className="mt-3 text-xs text-text-muted">
                  {[cityNames.get(item.cityId), neighborhoodNames.get(item.neighborhoodId ?? "") ?? "Bairro não informado"]
                    .filter((part): part is string => Boolean(part))
                    .join(" · ")}
                </p>
              </article>
            );
          })
        )}
      </section>

      {nextCursor ? (
        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
          href={`/feed?${new URLSearchParams({ ...Object.fromEntries(filters), cursor: nextCursor })}`}
        >
          Carregar mais
        </Link>
      ) : null}
    </div>
  );
}
