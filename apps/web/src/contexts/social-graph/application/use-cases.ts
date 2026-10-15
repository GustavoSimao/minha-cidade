import { randomUUID } from "node:crypto";

import { fail, ok, type Result } from "@/shared/kernel/result";

import { Friendship } from "../domain/friendship";
import type {
  CurrentSocialGraphSessionPort,
  FriendshipRepository,
  PersonCard,
  ProfileLookup,
} from "./ports";

/** Resolve o `userId` de um username (erro amigável quando não existe). */
async function resolveTarget(
  profiles: ProfileLookup,
  username: string,
): Promise<Result<string>> {
  const id = await profiles.findProfileIdByUsername(username.trim().toLowerCase());

  if (id === null) {
    return fail("perfil não encontrado");
  }

  return ok(id);
}

/** Envia pedido de amizade (S2/S3; idempotente quando já existe vínculo). */
export class SendFriendRequest {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(params: { username: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null || !session.emailConfirmed) {
      return fail("confirme seu e-mail para enviar amizades");
    }

    const target = await resolveTarget(this.profiles, params.username);

    if (!target.ok) {
      return fail(target.error);
    }

    if (target.value === session.userId) {
      return fail("não é permitido ser amigo de si mesmo");
    }

    const existing = await this.friendships.findByPair(session.userId, target.value);

    if (existing !== null) {
      // S2: já existe vínculo (pendente ou aceito) — nenhum par duplicado.
      return fail("já existe um vínculo entre vocês");
    }

    const friendship = Friendship.request(
      randomUUID(),
      session.userId,
      target.value,
    );

    await this.friendships.createRequest({
      id: friendship.id.value,
      requesterId: session.userId,
      otherId: target.value,
    });

    await this.friendships.recordEvent({
      context: "social_graph",
      name: "friend.requested",
      aggregateId: friendship.id.value,
      payload: { requesterId: session.userId, targetId: target.value },
    });

    return ok(undefined);
  }
}

/** Cancela o próprio pedido (S5 — só o remetente). */
export class CancelFriendRequest {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(params: { username: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const target = await resolveTarget(this.profiles, params.username);

    if (!target.ok) {
      return fail(target.error);
    }

    const row = await this.friendships.findByPair(session.userId, target.value);

    if (row === null) {
      return fail("Não há pedido para cancelar");
    }

    const friendship = Friendship.rehydrate({
      id: row.id,
      userLow: row.user_low,
      userHigh: row.user_high,
      status: row.status,
      requestedBy: row.requested_by,
      respondedBy: row.responded_by,
      createdAt: new Date(row.created_at),
    });

    if (!friendship.isPending || friendship.requestedBy !== session.userId) {
      return fail("somente o remetente pode cancelar o pedido");
    }

    await this.friendships.remove(row.id);
    await this.friendships.recordEvent({
      context: "social_graph",
      name: "friend.request_cancelled",
      aggregateId: row.id,
      payload: { requesterId: session.userId, targetId: target.value },
    });

    return ok(undefined);
  }
}

/** Aceita um pedido recebido (S4 — só o destinatário). */
export class AcceptFriendRequest {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(params: { username: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const target = await resolveTarget(this.profiles, params.username);

    if (!target.ok) {
      return fail(target.error);
    }

    const row = await this.friendships.findByPair(session.userId, target.value);

    if (row === null) {
      return fail("Não há pedido para aceitar");
    }

    const friendship = Friendship.rehydrate({
      id: row.id,
      userLow: row.user_low,
      userHigh: row.user_high,
      status: row.status,
      requestedBy: row.requested_by,
      respondedBy: row.responded_by,
      createdAt: new Date(row.created_at),
    });

    if (friendship.relationshipFor(session.userId) !== "pending_received") {
      return fail("somente o destinatário pode aceitar o pedido");
    }

    await this.friendships.accept(row.id, session.userId);
    await this.friendships.recordEvent({
      context: "social_graph",
      name: "friend.accepted",
      aggregateId: row.id,
      payload: { responderId: session.userId, requesterId: row.requested_by },
    });

    return ok(undefined);
  }
}

/** Recusa um pedido recebido (S4 — remove a linha). */
export class RejectFriendRequest {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(params: { username: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const target = await resolveTarget(this.profiles, params.username);

    if (!target.ok) {
      return fail(target.error);
    }

    const row = await this.friendships.findByPair(session.userId, target.value);

    if (row === null) {
      return fail("Não há pedido para recusar");
    }

    const friendship = Friendship.rehydrate({
      id: row.id,
      userLow: row.user_low,
      userHigh: row.user_high,
      status: row.status,
      requestedBy: row.requested_by,
      respondedBy: row.responded_by,
      createdAt: new Date(row.created_at),
    });

    if (friendship.relationshipFor(session.userId) !== "pending_received") {
      return fail("somente o destinatário pode recusar o pedido");
    }

    await this.friendships.remove(row.id);
    await this.friendships.recordEvent({
      context: "social_graph",
      name: "friend.rejected",
      aggregateId: row.id,
      payload: { responderId: session.userId, requesterId: row.requested_by },
    });

    return ok(undefined);
  }
}

/** Desfaz uma amizade (S6 — qualquer um dos lados). */
export class Unfriend {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(params: { username: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const target = await resolveTarget(this.profiles, params.username);

    if (!target.ok) {
      return fail(target.error);
    }

    const row = await this.friendships.findByPair(session.userId, target.value);

    if (row === null || row.status !== "accepted") {
      return fail("vocês não são amigos");
    }

    await this.friendships.remove(row.id);
    await this.friendships.recordEvent({
      context: "social_graph",
      name: "friend.removed",
      aggregateId: row.id,
      payload: { by: session.userId, other: target.value },
    });

    return ok(undefined);
  }
}

/** Lista pública de amigos de um perfil (resolvendo a projeção I7 — D7). */
export class ListFriends {
  constructor(
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(
    userId: string,
    options: { limit?: number; cursor?: string | null } = {},
  ): Promise<{
    items: {
      id: string;
      username: string;
      fullName: string;
      avatarPath: string | null;
      isVerified: boolean;
      verifiedOrg: string | null;
    }[];
    nextCursor: string | null;
  }> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

    const { rows, nextCursor } = await this.friendships.listFriends(userId, {
      limit,
      cursor: options.cursor ?? null,
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const otherId = row.user_low === userId ? row.user_high : row.user_low;
        const profile = await this.profiles.findPublicProfile(otherId);

        return {
          id: otherId,
          username: profile?.username ?? "perfil-encerrado",
          fullName: profile?.fullName ?? "Perfil encerrado",
          avatarPath: profile?.avatarPath ?? null,
          isVerified: profile?.isVerified ?? false,
          verifiedOrg: profile?.verifiedOrg ?? null,
        };
      }),
    );

    return { items, nextCursor };
  }
}

/** Estado do relacionamento na visão do usuário logado (botão do perfil). */
export class GetRelationshipForViewer {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(profileUserId: string): Promise<"none" | "pending_sent" | "pending_received" | "friends"> {
    const session = await this.session();

    if (session === null || session.userId === profileUserId) {
      return "none";
    }

    const row = await this.friendships.findByPair(session.userId, profileUserId);

    if (row === null) {
      return "none";
    }

    return Friendship.rehydrate({
      id: row.id,
      userLow: row.user_low,
      userHigh: row.user_high,
      status: row.status,
      requestedBy: row.requested_by,
      respondedBy: row.responded_by,
      createdAt: new Date(row.created_at),
    }).relationshipFor(session.userId);
  }
}

/** Contagem pública de amigos. */
export class CountFriends {
  constructor(private readonly friendships: FriendshipRepository) {}

  public async execute(userId: string): Promise<number> {
    return this.friendships.countFriends(userId);
  }
}

/** Solicitações recebidas (página privada /amigos/solicitacoes). */
export class ListIncomingFriendRequests {
  constructor(
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(
    userId: string,
  ): Promise<{
    requesterId: string;
    username: string;
    fullName: string;
    avatarPath: string | null;
    isVerified: boolean;
    verifiedOrg: string | null;
    createdAt: Date;
  }[]> {
    const rows = await this.friendships.listIncomingRequests(userId, { limit: 50 });

    return Promise.all(
      rows.map(async (row) => {
        const profile = await this.profiles.findPublicProfile(row.requested_by);

        return {
          requesterId: row.requested_by,
          username: profile?.username ?? "perfil-encerrado",
          fullName: profile?.fullName ?? "Perfil encerrado",
          avatarPath: profile?.avatarPath ?? null,
          isVerified: profile?.isVerified ?? false,
          verifiedOrg: profile?.verifiedOrg ?? null,
          createdAt: new Date(row.created_at),
        };
      }),
    );
  }
}

/** Solicitações enviadas ainda pendentes (aba do hub /amigos — resolve C2). */
export class ListOutgoingFriendRequests {
  constructor(
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(
    userId: string,
  ): Promise<{
    targetId: string;
    username: string;
    fullName: string;
    avatarPath: string | null;
    isVerified: boolean;
    verifiedOrg: string | null;
    createdAt: Date;
  }[]> {
    const rows = await this.friendships.listOutgoingRequests(userId, { limit: 50 });

    return Promise.all(
      rows.map(async (row) => {
        const targetId = row.user_low === userId ? row.user_high : row.user_low;
        const profile = await this.profiles.findPublicProfile(targetId);

        return {
          targetId,
          username: profile?.username ?? "perfil-encerrado",
          fullName: profile?.fullName ?? "Perfil encerrado",
          avatarPath: profile?.avatarPath ?? null,
          isVerified: profile?.isVerified ?? false,
          verifiedOrg: profile?.verifiedOrg ?? null,
          createdAt: new Date(row.created_at),
        };
      }),
    );
  }
}

/** Ids já relacionados ao usuário: ele mesmo, amigos aceitos e pendentes nos dois sentidos. */
async function collectRelatedIds(
  userId: string,
  friendships: FriendshipRepository,
): Promise<string[]> {
  const [friends, incoming, outgoing] = await Promise.all([
    friendships.listFriends(userId, { limit: 50 }),
    friendships.listIncomingRequests(userId),
    friendships.listOutgoingRequests(userId),
  ]);

  const related = new Set<string>([userId]);

  for (const row of [...friends.rows, ...incoming, ...outgoing]) {
    related.add(row.user_low);
    related.add(row.user_high);
  }

  return [...related];
}

/** Embaralha (Fisher-Yates) — variedade nas sugestões sem depender do banco. */
function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/**
 * Sugestões de amizade do mesmo bairro (S3/D-6).
 *
 * Regras: exclui a própria pessoa, amigos aceitos e pendentes nos dois
 * sentidos; perfis **sem** bairro não aparecem (não há onde encaixar); perfis
 * com opt-out do bairro continuam sugeríveis (D-6 — o cartão só não mostra o
 * bairro). Sem bairro próprio, devolve lista vazia (a tela convida a escolher).
 */
export class SuggestFriends {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(options: { limit?: number } = {}): Promise<Result<PersonCard[]>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const neighborhoodId = await this.profiles.findOwnNeighborhoodId(session.userId);

    if (neighborhoodId === null) {
      return ok([]);
    }

    const excludeIds = await collectRelatedIds(session.userId, this.friendships);

    const people = await this.profiles.listPeopleByNeighborhood(neighborhoodId, {
      limit: 50,
      excludeIds,
    });

    const limit = Math.min(Math.max(options.limit ?? 10, 1), 10);

    return ok(shuffle(people).slice(0, limit));
  }
}

/**
 * Descoberta de pessoas na plataforma inteira (S3/D-6).
 *
 * `exclude` acumula quem o usuário já pulou (teto de 20 por consulta); amigos e
 * pendentes são sempre excluídos. A ordem é alfabética no banco e o caso de
 * uso embaralha — com o `exclude` a cada "pular" entra gente nova.
 */
export class DiscoverRandomPeople {
  constructor(
    private readonly session: CurrentSocialGraphSessionPort,
    private readonly profiles: ProfileLookup,
    private readonly friendships: FriendshipRepository,
  ) {}

  public async execute(
    options: { limit?: number; exclude?: readonly string[] } = {},
  ): Promise<Result<PersonCard[]>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const related = await collectRelatedIds(session.userId, this.friendships);
    const excludeIds = [...new Set([...related, ...(options.exclude ?? []).slice(0, 20)])];

    const people = await this.profiles.listPeople({ limit: 50, excludeIds });

    const limit = Math.min(Math.max(options.limit ?? 5, 1), 10);

    return ok(shuffle(people).slice(0, limit));
  }
}

/** Resultado público de uma busca de pessoas (projeção I7). */
export interface ProfileSearchItem {
  id: string;
  username: string;
  fullName: string;
  avatarPath: string | null;
}

/**
 * Busca de pessoas por nome ou @username (T3 — resolve a lacuna C1 do plano).
 *
 * Projeção pública apenas: nunca e-mail/telefone. Termo mínimo de 2 caracteres
 * (evita listar a base inteira) e limite entre 1 e 20 resultados.
 */
export class SearchProfiles {
  constructor(private readonly profiles: ProfileLookup) {}

  public async execute(
    term: string,
    options: { limit?: number } = {},
  ): Promise<Result<ProfileSearchItem[]>> {
    const normalized = term.trim();

    if (normalized.length < 2) {
      return fail("digite ao menos 2 caracteres para buscar");
    }

    const limit = Math.min(Math.max(options.limit ?? 20, 1), 20);
    const items = await this.profiles.searchPublicProfiles(normalized, { limit });

    return ok(items);
  }
}
