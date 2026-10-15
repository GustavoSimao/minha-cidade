import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListFriends, CountFriends, GetRelationshipForViewer } from "@/contexts/social-graph/application/use-cases";
import { SupabaseFriendshipRepository, SupabaseProfileLookup } from "@/contexts/social-graph/infrastructure/supabase/friendship-repository";
import { currentSocialGraphSession } from "@/contexts/social-graph/infrastructure/session";
import { SupabaseEngagementRepository } from "@/contexts/engagement/infrastructure/supabase/engagement-repository";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { ResolveLocationSelection } from "@/contexts/geography/application/use-cases";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/storage";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { InboxIcon } from "@/shared/ui/icon";
import { UsersIcon } from "@/shared/ui/icon";
import { FriendButton } from "@/shared/ui/social-graph/friend-button";

interface PageParams {
  params: Promise<{ username: string }>;
}

// Perfil público lê o banco a cada requisição (sessão anônima): pode bloquear.
export const instant = false;

/** Perfil público: apenas a projeção pública (invariante I7). */
export default async function PublicProfilePage({ params }: PageParams) {
  const { username } = await params;
  const profile = await new SupabaseProfileRepository().findPublicViewByUsername(
    username,
  );

  if (!profile) {
    notFound();
  }

  // Social Graph: relação do visitante com o perfil, lista e contagem (S1).
  const session = await currentSocialGraphSession();
  const [relationship, friends, friendsCount] = await Promise.all([
    new GetRelationshipForViewer(currentSocialGraphSession, new SupabaseFriendshipRepository()).execute(
      profile.id,
    ),
    new ListFriends(new SupabaseProfileLookup(), new SupabaseFriendshipRepository()).execute(
      profile.id,
      { limit: 6 },
    ),
    new CountFriends(new SupabaseFriendshipRepository()).execute(profile.id),
  ]);

  const isMe = session !== null && session.userId === profile.id;

  const created = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    profile.createdAt,
  );

  // Publication: contador e lista pública. Engagement: "causas apoiadas" (P6).
  // P4: publicações anônimas NUNCA são associadas ao autor em leitura pública —
  // só o dono, vendo o próprio perfil, as reconhece.
  const [publicationsCount, supportedCauses, authorPublications] = await Promise.all([
    new SupabasePublicationRepository().countPublicByAuthor(profile.id),
    new SupabaseEngagementRepository().countSupportedByUser(profile.id),
    new SupabasePublicationRepository().listPublicByAuthor(profile.id, { limit: 20 }),
  ]);

  const publications = isMe
    ? authorPublications.rows
    : authorPublications.rows.filter((row) => !row.is_anonymous);

  // Geography resolve os IDs da localização para nomes (integração por ID — D7).
  // Falha de leitura do catálogo não derruba o perfil: a localização é opcional.
  let locationLabel: string | null = null;
  try {
    const location = await new ResolveLocationSelection(
      new SupabaseCityRepository(),
      new SupabaseNeighborhoodRepository(),
    ).execute({
      cityId: profile.cityId,
      neighborhoodId: profile.neighborhoodId,
    });

    if (location.ok && location.value.cityName) {
      locationLabel = [location.value.cityName, location.value.neighborhoodName]
        .filter((part): part is string => part !== null)
        .join(" — ");
    }
  } catch {
    locationLabel = null;
  }

  return (
    <article className="overflow-hidden rounded-card border border-border-subtle bg-surface-raised shadow-stamp">
      <div
        className="h-28 w-full bg-brand-100 sm:h-40"
        style={
          profile.coverPath
            ? {
                backgroundImage: `url(${publicStorageUrl("covers", profile.coverPath)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      <div className="px-5 pb-6 sm:px-6">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <Avatar
            className="ring-4 ring-surface-raised"
            imageUrl={
              profile.avatarPath
                ? publicStorageUrl("avatars", profile.avatarPath)
                : null
            }
            name={profile.fullName}
            size={88}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-text-strong sm:text-2xl">
            {profile.fullName}
          </h1>
          {profile.isVerified && profile.verifiedOrg ? (
            <Badge tone="institutional">{profile.verifiedOrg}</Badge>
          ) : null}
          {profile.role !== "user" ? (
            <Badge tone="moderation">
              {profile.role === "admin" ? "Administração" : "Moderação"}
            </Badge>
          ) : null}
        </div>

        <p className="text-sm text-text-muted">@{profile.username}</p>

        {profile.bio ? (
          <p className="mt-3 whitespace-pre-line text-text-body">{profile.bio}</p>
        ) : null}

        <p className="mt-3 text-sm text-text-muted">
          Membro desde {created}
        </p>

        {locationLabel ? (
          <p className="mt-1 text-sm text-text-muted">{locationLabel}</p>
        ) : null}

        {isMe ? null : (
          <div className="mt-4">
            <FriendButton
              canInteract={session !== null && session.emailConfirmed}
              relationship={relationship}
              username={profile.username}
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Amigos", value: friendsCount, href: `/amigos/${profile.username}` },
            { label: "Publicações", value: publicationsCount, href: null },
            { label: "Causas apoiadas", value: supportedCauses, href: null },
          ].map((counter) => (
            <div
              className="rounded-card border border-border-subtle bg-surface p-3 text-center"
              key={counter.label}
            >
              <p className="font-display text-2xl font-bold text-text-strong">{counter.value}</p>
              <p className="mt-0.5 text-xs text-text-muted">{counter.label}</p>
              {counter.href ? (
                <Link
                  className="mt-1 inline-block text-xs text-brand-600 hover:underline"
                  href={counter.href}
                >
                  ver lista
                </Link>
              ) : null}
            </div>
          ))}
        </div>

        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-strong">
            Publicações {isMe ? "(inclui as anônimas)" : ""}
          </h2>
          {publications.length < publicationsCount ? (
            <p className="text-xs text-text-muted">
              Mostrando as {publications.length} mais recentes de {publicationsCount}.
            </p>
          ) : null}

          {publications.length === 0 ? (
            <EmptyState
              className="border-dashed bg-surface p-4"
              description={
                isMe
                  ? "Suas publicações aparecem aqui — inclusive as anônimas, que só você reconhece."
                  : "Este perfil ainda não publicou no feed do bairro."
              }
              icon={<InboxIcon className="h-6 w-6" />}
              title="Nenhuma publicação ainda."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {publications.map((row) => (
                <li
                  className="rounded-card border border-border-subtle bg-surface-raised p-4 shadow-stamp"
                  key={row.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={row.type === "problem" ? "problem" : "idea"}>
                      {row.type === "problem" ? "Problema" : "Ideia"}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
                        new Date(row.created_at),
                      )}
                      {row.edited_at ? ", editado" : ""}
                      {row.is_anonymous && isMe ? " · anônima" : ""}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-text-strong">
                    <Link className="hover:underline" href={`/publicacao/${row.id}`}>
                      {row.title}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-body">{row.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 rounded-card border border-border-subtle p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-strong">
              Amigos ({friendsCount})
            </h2>
            {friends.items.length > 0 ? (
              <Link
                className="text-sm text-brand-600 hover:underline"
                href={`/amigos/${profile.username}`}
              >
                Ver todos
              </Link>
            ) : null}
          </div>
          {friends.items.length === 0 ? (
            <EmptyState
              className="mt-3 border-dashed bg-surface p-4"
              description="Quando este perfil aceitar pedidos de amizade, os amigos aparecem aqui."
              icon={<UsersIcon className="h-6 w-6" />}
              title="Nenhum amigo ainda."
            />
          ) : (
            <ul className="mt-3 flex flex-wrap gap-3">
              {friends.items.map((friend) => (
                <li key={friend.id}>
                  <Link
                    className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1.5 text-sm text-text-body hover:bg-surface"
                    href={`/perfil/${friend.username}`}
                  >
                    <Avatar name={friend.fullName} size={24} imageUrl={null} />
                    {friend.fullName}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username } = await params;
  const profile = await new SupabaseProfileRepository().findPublicViewByUsername(
    username,
  );

  if (!profile) {
    return { title: "Perfil não encontrado" };
  }

  return {
    title: `${profile.fullName} (@${profile.username})`,
    description: profile.bio ?? `Perfil de ${profile.fullName} no Minha Cidade.`,
  };
}
