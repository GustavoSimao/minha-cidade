import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListFriends } from "@/contexts/social-graph/application/use-cases";
import {
  SupabaseFriendshipRepository,
  SupabaseProfileLookup,
} from "@/contexts/social-graph/infrastructure/supabase/friendship-repository";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { EmptyState } from "@/shared/ui/empty-state";
import { UsersIcon } from "@/shared/ui/icon";
import { Avatar } from "@/shared/ui/avatar";

interface PageParams {
  params: Promise<{ username: string }>;
}

// Lista pública de amigos (leitura sem login).
export const instant = false;

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username } = await params;
  return { title: `Amigos de @${username}` };
}

/** Lista pública de amigos de um perfil (S1 — amizade é mútua). */
export default async function FriendsPage({ params }: PageParams) {
  const { username } = await params;
  const profile = await new SupabaseProfileRepository().findPublicViewByUsername(
    username,
  );

  if (!profile) {
    notFound();
  }

  const { items, nextCursor } = await new ListFriends(
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  ).execute(profile.id, { limit: 50 });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-strong">
        Amigos de{" "}
        <Link className="text-brand-600 hover:underline" href={`/perfil/${profile.username}`}>
          @{profile.username}
        </Link>
      </h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Quando este perfil aceitar pedidos de amizade, os amigos aparecem aqui — a lista é pública."
            icon={<UsersIcon className="h-8 w-8" />}
            title="Este perfil ainda não tem amigos"
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((friend) => (
            <li
              className="flex items-center gap-3 rounded-card border border-border-subtle bg-surface-raised p-4"
              key={friend.id}
            >
              <Avatar imageUrl={null} name={friend.fullName} size={40} />
              <div>
                <Link
                  className="font-semibold text-text-strong hover:underline"
                  href={`/perfil/${friend.username}`}
                >
                  {friend.fullName}
                </Link>
                <p className="text-sm text-text-muted">@{friend.username}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {nextCursor ? (
        <p className="mt-4 text-sm text-text-muted">
          Há mais amigos além dos 50 exibidos.
        </p>
      ) : null}
    </div>
  );
}
