import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GetEngagementSummary } from "@/contexts/engagement/application/use-cases";
import { SupabaseEngagementRepository } from "@/contexts/engagement/infrastructure/supabase/engagement-repository";
import { currentEngagementSession } from "@/contexts/engagement/infrastructure/publication-state";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/storage";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { InboxIcon } from "@/shared/ui/icon";
import { SaveButton } from "@/shared/ui/engagement/save-button";

export const metadata: Metadata = { title: "Salvos" };

// Página protegida (E6): lista privada — depende da sessão.
export const instant = false;

/** Lista privada de publicações salvas (E6 — só o dono vê as próprias). */
export default async function SavedPage() {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    redirect("/login?next=/salvos");
  }

  const engagements = new SupabaseEngagementRepository();
  const publications = new SupabasePublicationRepository();
  const { ids } = await engagements.listSavedPublicationIds(session.userId);

  const items = await Promise.all(
    ids.map(async (id) => {
      const publication = await publications.findById(id);

      if (publication === null) {
        return null;
      }

      const [city, neighborhood, author] = await Promise.all([
        new SupabaseCityRepository().findById(publication.city_id),
        publication.neighborhood_id
          ? new SupabaseNeighborhoodRepository().findById(publication.neighborhood_id)
          : null,
        publication.author_id && !publication.is_anonymous
          ? (await new SupabaseProfileRepository().findPublicViewsByIds([publication.author_id]))[0] ?? null
          : null,
      ]);

      const summary = await new GetEngagementSummary(
        currentEngagementSession,
        engagements,
      ).execute(id);

      return {
        id,
        type: publication.type as "problem" | "idea",
        title: publication.title,
        content: publication.content,
        isAnonymous: publication.is_anonymous,
        editedAt: publication.edited_at ? new Date(publication.edited_at) : null,
        createdAt: new Date(publication.created_at),
        cityName: city ? `${city.name} — ${city.uf.sigla}` : null,
        neighborhoodName: neighborhood?.name ?? "Bairro não informado",
        author,
        summary,
      };
    }),
  );

  const rows = items.filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-strong">Publicações salvas</h1>
      <p className="mt-1 text-sm text-text-muted">
        Lista privada — só você vê (E6).
      </p>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Use “Salvar para depois” em uma publicação e ela fica guardada aqui, só para você."
            icon={<InboxIcon className="h-8 w-8" />}
            title="Nada salvo ainda"
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {rows.map((row) => (
            <li
              className="rounded-card border border-border-subtle bg-surface-raised p-4 shadow-stamp"
              key={row.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={row.type === "problem" ? "problem" : "idea"}>
                  {row.type === "problem" ? "Problema" : "Ideia"}
                </Badge>
                <span className="text-sm text-text-muted">
                  {[row.cityName, row.neighborhoodName]
                    .filter((part): part is string => part !== null)
                    .join(", ")}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-text-strong">
                <Link className="hover:underline" href={`/publicacao/${row.id}`}>
                  {row.title}
                </Link>
              </h2>

              <p className="mt-1 line-clamp-3 whitespace-pre-line text-base text-text-body">
                {row.content}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                {row.author !== null ? (
                  <span className="flex items-center gap-2">
                    <Avatar
                      imageUrl={
                        row.author.avatarPath
                          ? publicStorageUrl("avatars", row.author.avatarPath)
                          : null
                      }
                      name={row.author.fullName}
                      size={28}
                    />
                    {row.author.fullName}
                  </span>
                ) : (
                  <span>Morador anônimo</span>
                )}
                <span>
                  Apoio {row.summary.counts.support}, oposição {row.summary.counts.oppose},{" "}
                  {row.summary.commentsCount} comentário(s)
                  {row.editedAt ? ", editado" : ""}
                </span>
              </div>

              <div className="mt-3">
                <SaveButton
                  canInteract
                  publicationId={row.id}
                  saved={row.summary.saved}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
