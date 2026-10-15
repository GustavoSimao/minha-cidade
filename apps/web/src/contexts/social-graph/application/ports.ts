import type { RelationshipKind } from "../domain/user-pair";

/** Linha de `social_graph.friendships` como vem do banco. */
export interface FriendshipRow {
  id: string;
  user_low: string;
  user_high: string;
  status: "pending" | "accepted";
  requested_by: string;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Sessão necessária para interagir (mesmo critério do Engagement — P3). */
export interface SocialGraphSession {
  userId: string;
  emailConfirmed: boolean;
}

/** Porta de sessão — implementada pelo gateway de Identity na interface. */
export type CurrentSocialGraphSessionPort = () => Promise<SocialGraphSession | null>;

/**
 * Resolução de username → id do perfil (Identity), para os casos de uso
 * trabalharem com usuários sem depender do contexto Identity (D15).
 */
export interface ProfileLookup {
  findProfileIdByUsername(username: string): Promise<string | null>;
  findPublicProfile(
    id: string,
  ): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatarPath: string | null;
    isVerified: boolean;
    verifiedOrg: string | null;
  } | null>;

  /**
   * Busca pública por nome ou @username (projeção I7 — sem e-mail/telefone).
   * Usado pela descoberta de pessoas (`/amigos/buscar`).
   */
  searchPublicProfiles(
    term: string,
    options: { limit?: number },
  ): Promise<{ id: string; username: string; fullName: string; avatarPath: string | null }[]>;

  /** Bairro do próprio usuário (dado privado dele — base das sugestões, D-6). */
  findOwnNeighborhoodId(userId: string): Promise<string | null>;

  /** Cartões públicos de um bairro (sugestões — S3). */
  listPeopleByNeighborhood(
    neighborhoodId: string,
    options: { limit: number; excludeIds?: readonly string[] },
  ): Promise<PersonCard[]>;

  /** Cartões públicos da plataforma (descoberta — S3). */
  listPeople(options: { limit: number; excludeIds?: readonly string[] }): Promise<PersonCard[]>;
}

/**
 * Cartão público de pessoa (projeção I7). `neighborhoodId` já vem `null`
 * quando o perfil optou por não mostrar o bairro (T2) — quem exibe não precisa
 * reimplementar a regra.
 */
export interface PersonCard {
  id: string;
  username: string;
  fullName: string;
  avatarPath: string | null;
  isVerified: boolean;
  verifiedOrg: string | null;
  cityId: number | null;
  neighborhoodId: string | null;
}

/** Porta de persistência do contexto Social Graph (D6). */
export interface FriendshipRepository {
  findByPair(userId: string, otherId: string): Promise<FriendshipRow | null>;

  createRequest(input: {
    id: string;
    requesterId: string;
    otherId: string;
  }): Promise<void>;

  accept(rowId: string, responderId: string): Promise<void>;

  remove(rowId: string): Promise<void>;

  /** Amigos aceitos do usuário (paginado). */
  listFriends(
    userId: string,
    options: { limit: number; cursor?: string | null },
  ): Promise<{ rows: FriendshipRow[]; nextCursor: string | null }>;

  /** Pedidos recebidos pendentes. */
  listIncomingRequests(
    userId: string,
    options?: { limit?: number },
  ): Promise<FriendshipRow[]>;

  /** Pedidos enviados pendentes. */
  listOutgoingRequests(
    userId: string,
    options?: { limit?: number },
  ): Promise<FriendshipRow[]>;

  countFriends(userId: string): Promise<number>;

  /** Outbox de eventos de domínio (D7). */
  recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

/** Item público de amizade (projeção I7 — sem e-mail/telefone). */
export interface FriendItem {
  id: string;
  username: string;
  fullName: string;
  avatarPath: string | null;
  since: Date;
}

/** Estado do relacionamento na visão do visitante (para o botão do perfil). */
export type { RelationshipKind };
