import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CountFriends,
  ListFriends,
  ListIncomingFriendRequests,
  ListOutgoingFriendRequests,
  SuggestFriends,
} from "@/contexts/social-graph/application/use-cases";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import {
  SupabaseFriendshipRepository,
  SupabaseProfileLookup,
} from "@/contexts/social-graph/infrastructure/supabase/friendship-repository";
import { currentSocialGraphSession } from "@/contexts/social-graph/infrastructure/session";
import { EmptyState } from "@/shared/ui/empty-state";
import { UsersIcon } from "@/shared/ui/icon";
import { PersonRow } from "@/shared/ui/social-graph/person-row";

export const metadata: Metadata = { title: "Amigos" };

// Página privada: depende da sessão.
export const instant = false;

const TABS = ["amigos", "solicitacoes", "sugestoes"] as const;

type Tab = (typeof TABS)[number];

interface FriendsHubParams {
  searchParams: Promise<{ tab?: string }>;
}

/** Hub de amizades (S4): amigos, solicitações (recebidas + enviadas) e sugestões. */
export default async function FriendsHubPage({ searchParams }: FriendsHubParams) {
  const session = await new SupabaseAuthGateway().currentSession();

  if (!session) {
    redirect("/login?next=/amigos");
  }

  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "amigos";

  const profiles = new SupabaseProfileLookup();
  const friendships = new SupabaseFriendshipRepository();

  const [friendsCount, friends, incoming, outgoing, suggestions, myNeighborhoodId] =
    await Promise.all([
      new CountFriends(friendships).execute(session.userId),
      new ListFriends(profiles, friendships).execute(session.userId, { limit: 50 }),
      new ListIncomingFriendRequests(profiles, friendships).execute(session.userId),
      new ListOutgoingFriendRequests(profiles, friendships).execute(session.userId),
      new SuggestFriends(currentSocialGraphSession, profiles, friendships).execute({ limit: 10 }),
      profiles.findOwnNeighborhoodId(session.userId),
    ]);

  const myNeighborhood = myNeighborhoodId
    ? await new SupabaseNeighborhoodRepository().findById(myNeighborhoodId)
    : null;

  const suggested = suggestions.ok ? suggestions.value : [];
  const canInteract = session.emailConfirmed;

  const tabs: { id: Tab; label: string }[] = [
    { id: "amigos", label: `Amigos (${friendsCount})` },
    { id: "solicitacoes", label: `Solicitações (${incoming.length})` },
    { id: "sugestoes", label: `Sugestões (${suggested.length})` },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text-strong">Amigos</h1>

      <nav aria-label="Abas de amizades" className="mt-4 flex flex-wrap gap-2" role="tablist">
        {tabs.map((item) => {
          const active = item.id === tab;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-stamp"
                  : "inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
              }
              href={item.id === "amigos" ? "/amigos" : `/amigos?tab=${item.id}`}
              key={item.id}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {tab === "amigos" ? (
        <section aria-label="Amigos" className="mt-6">
          {friends.items.length === 0 ? (
            <EmptyState
              description="Quando alguém aceitar seu pedido, a pessoa aparece aqui — e o perfil dela continua público."
              icon={<UsersIcon className="h-8 w-8" />}
              title="Você ainda não tem amigos por aqui"
            />
          ) : (
            <ul className="mt-2 flex flex-col gap-3">
              {friends.items.map((friend) => (
                <PersonRow
                  canInteract={canInteract}
                  key={friend.id}
                  person={friend}
                  relationship="friends"
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "solicitacoes" ? (
        <section aria-label="Solicitações" className="mt-6 flex flex-col gap-8">
          <div>
            <h2 className="text-base font-semibold text-text-strong">Recebidas</h2>
            {incoming.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">
                Nenhum pedido de amizade recebido.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {incoming.map((request) => (
                  <PersonRow
                    canInteract={canInteract}
                    key={request.requesterId}
                    person={request}
                    relationship="pending_received"
                  />
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-text-strong">Enviadas</h2>
            {outgoing.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">
                Nenhum pedido enviado aguardando resposta.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {outgoing.map((request) => (
                  <PersonRow
                    canInteract={canInteract}
                    key={request.targetId}
                    person={request}
                    relationship="pending_sent"
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "sugestoes" ? (
        <section aria-label="Sugestões" className="mt-6">
          {suggested.length === 0 ? (
            <EmptyState
              action={
                myNeighborhoodId === null ? (
                  <Link
                    className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
                    href="/perfil/editar"
                  >
                    Escolher meu bairro
                  </Link>
                ) : undefined
              }
              description={
                myNeighborhoodId === null
                  ? "Escolha seu bairro no perfil para ver sugestões de pessoas da vizinhança."
                  : `Nenhuma pessoa nova em ${myNeighborhood?.name ?? "seu bairro"} por enquanto. Conheça gente de outros bairros na descoberta.`
              }
              icon={<UsersIcon className="h-8 w-8" />}
              title={myNeighborhoodId === null ? "Sem bairro no perfil" : "Sugestões esgotadas por aqui"}
            />
          ) : (
            <ul className="mt-2 flex flex-col gap-3">
              {suggested.map((person) => (
                <PersonRow
                  canInteract={canInteract}
                  key={person.id}
                  person={person}
                  relationship="none"
                  subtitle={myNeighborhood ? `do ${myNeighborhood.name}` : undefined}
                />
              ))}
            </ul>
          )}

          <p className="mt-4 text-sm text-text-muted">
            Quer ver gente de outros bairros?{" "}
            <Link className="text-brand-600 hover:underline" href="/amigos/descobrir">
              Descobrir pessoas
            </Link>
            .
          </p>
        </section>
      ) : null}
    </div>
  );
}
