import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GetRelationshipForViewer, SearchProfiles } from "@/contexts/social-graph/application/use-cases";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import {
  SupabaseFriendshipRepository,
  SupabaseProfileLookup,
} from "@/contexts/social-graph/infrastructure/supabase/friendship-repository";
import { currentSocialGraphSession } from "@/contexts/social-graph/infrastructure/session";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/public-url";
import { Alert, Button } from "@/shared/ui/form";
import { Avatar } from "@/shared/ui/avatar";
import { EmptyState } from "@/shared/ui/empty-state";
import { SearchIcon } from "@/shared/ui/icon";
import { FriendButton } from "@/shared/ui/social-graph/friend-button";

export const metadata: Metadata = { title: "Buscar pessoas" };

interface PageParams {
  searchParams: Promise<{ q?: string }>;
}

// Página privada: depende da sessão.
export const instant = false;

/** Busca de pessoas (T3): nome ou @username, com o botão de amizade por resultado. */
export default async function SearchPeoplePage({ searchParams }: PageParams) {
  const auth = new SupabaseAuthGateway();
  const session = await auth.currentSession();

  if (session === null) {
    redirect("/login?next=/amigos/buscar");
  }

  const { q = "" } = await searchParams;
  const term = q.trim();
  const profiles = new SupabaseProfileLookup();

  const result =
    term.length > 0
      ? await new SearchProfiles(profiles).execute(term)
      : null;

  const relationshipFor = new GetRelationshipForViewer(
    currentSocialGraphSession,
    new SupabaseFriendshipRepository(),
  );

  const results =
    result?.ok === true
      ? await Promise.all(
          result.value.map(async (profile) => ({
            profile,
            relationship: await relationshipFor.execute(profile.id),
          })),
        )
      : [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-strong">Buscar pessoas</h1>
      <p className="mt-1 text-sm text-text-muted">
        Procure pelo nome ou pelo @ de quem você quer conhecer. Os perfis mostram
        apenas informações públicas.
      </p>

      <form action="/amigos/buscar" className="mt-4 flex flex-wrap items-end gap-2" method="get">
        <label className="flex-1 text-sm font-medium text-text-strong" htmlFor="q">
          Nome ou @username
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong"
            defaultValue={term}
            id="q"
            maxLength={80}
            name="q"
            placeholder="Ex.: Ana Souza ou ana-souza"
            type="search"
          />
        </label>
        <Button type="submit">Buscar</Button>
      </form>

      {result && !result.ok ? <Alert tone="error">{result.error}</Alert> : null}

      {result?.ok === true && results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description={`Nenhum perfil encontrado para "${term}". Tente outro nome ou @username.`}
            icon={<SearchIcon className="h-8 w-8" />}
            title="Nenhum resultado"
          />
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {results.map(({ profile, relationship }) => (
            <li
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border-subtle bg-surface-raised p-4"
              key={profile.id}
            >
              <Link className="flex items-center gap-3" href={`/perfil/${profile.username}`}>
                <Avatar
                  imageUrl={profile.avatarPath ? publicStorageUrl("avatars", profile.avatarPath) : null}
                  name={profile.fullName}
                  size={40}
                />
                <span>
                  <span className="font-semibold text-text-strong">{profile.fullName}</span>
                  <span className="block text-sm text-text-muted">@{profile.username}</span>
                </span>
              </Link>
              <FriendButton
                canInteract={session.emailConfirmed}
                relationship={relationship}
                username={profile.username}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
