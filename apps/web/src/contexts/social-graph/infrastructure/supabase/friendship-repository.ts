import type {
  FriendshipRepository,
  FriendshipRow,
  PersonCard,
  ProfileLookup,
} from "@/contexts/social-graph/application/ports";
import {
  createClient,
  createServiceRoleClient,
  table,
} from "@/shared/infrastructure/supabase";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";

const COLUMNS =
  "id, user_low, user_high, status, requested_by, responded_by, created_at, updated_at";

/** Repositório de amizades em Supabase (sentinela ordenada — S2). */
export class SupabaseFriendshipRepository implements FriendshipRepository {
  async findByPair(userId: string, otherId: string): Promise<FriendshipRow | null> {
    const low = userId < otherId ? userId : otherId;
    const high = low === userId ? otherId : userId;
    const supabase = await createClient();

    const { data, error } = await table(supabase, "social_graph.friendships")
      .select(COLUMNS)
      .eq("user_low", low)
      .eq("user_high", high)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar amizade: ${error.message}`);
    }

    return data ? (data as unknown as FriendshipRow) : null;
  }

  async createRequest(input: {
    id: string;
    requesterId: string;
    otherId: string;
  }): Promise<void> {
    const low = input.requesterId < input.otherId ? input.requesterId : input.otherId;
    const high = low === input.requesterId ? input.otherId : input.requesterId;
    const supabase = await createClient();

    const { error } = await table(supabase, "social_graph.friendships").insert({
      id: input.id,
      user_low: low,
      user_high: high,
      status: "pending",
      requested_by: input.requesterId,
    });

    if (error) {
      throw new Error(`falha ao enviar pedido de amizade: ${error.message}`);
    }
  }

  async accept(rowId: string, responderId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "social_graph.friendships")
      .update({ status: "accepted", responded_by: responderId })
      .eq("id", rowId);

    if (error) {
      throw new Error(`falha ao aceitar pedido: ${error.message}`);
    }
  }

  async remove(rowId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "social_graph.friendships")
      .delete()
      .eq("id", rowId);

    if (error) {
      throw new Error(`falha ao remover amizade: ${error.message}`);
    }
  }

  async listFriends(
    userId: string,
    options: { limit: number; cursor?: string | null },
  ): Promise<{ rows: FriendshipRow[]; nextCursor: string | null }> {
    const supabase = await createClient();

    let request = table(supabase, "social_graph.friendships")
      .select(COLUMNS)
      .eq("status", "accepted");

    // Sentinela: o usuário pode estar em qualquer lado do par.
    const orFilter = `and(user_low.eq.${userId},user_high.neq.${userId}),and(user_high.eq.${userId},user_low.neq.${userId})`;
    request = request.or(orFilter);

    if (options.cursor) {
      request = request.lt("updated_at", options.cursor);
    }

    const { data, error } = await request
      .order("updated_at", { ascending: false })
      .limit(options.limit + 1);

    if (error) {
      throw new Error(`falha ao listar amigos: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as FriendshipRow[];
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    return {
      rows: page,
      nextCursor: hasMore ? page[page.length - 1].updated_at : null,
    };
  }

  async listIncomingRequests(
    userId: string,
    options: { limit?: number } = {},
  ): Promise<FriendshipRow[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const supabase = await createClient();

    const { data, error } = await table(supabase, "social_graph.friendships")
      .select(COLUMNS)
      .eq("status", "pending")
      .neq("requested_by", userId)
      .or(`user_low.eq.${userId},user_high.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`falha ao listar solicitações: ${error.message}`);
    }

    return (data ?? []) as unknown as FriendshipRow[];
  }

  async listOutgoingRequests(
    userId: string,
    options: { limit?: number } = {},
  ): Promise<FriendshipRow[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const supabase = await createClient();

    const { data, error } = await table(supabase, "social_graph.friendships")
      .select(COLUMNS)
      .eq("status", "pending")
      .eq("requested_by", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`falha ao listar pedidos enviados: ${error.message}`);
    }

    return (data ?? []) as unknown as FriendshipRow[];
  }

  async countFriends(userId: string): Promise<number> {
    const supabase = await createClient();

    const orFilter = `and(user_low.eq.${userId},user_high.neq.${userId}),and(user_high.eq.${userId},user_low.neq.${userId})`;

    const { count, error } = await table(supabase, "social_graph.friendships")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(orFilter);

    if (error) {
      throw new Error(`falha ao contar amigos: ${error.message}`);
    }

    return count ?? 0;
  }

  async recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    // Outbox (D7): a tabela é service_role-only (revogada para anon/
    // authenticated na migration 20261011000003) — o evento entra pelo
    // cliente de serviço.
    const events = createServiceRoleClient();

    const { error } = await table(events, "shared.domain_events").insert({
      context: event.context,
      name: event.name,
      aggregate_id: event.aggregateId,
      payload: event.payload,
    });

    if (error) {
      throw new Error(`falha ao registrar evento: ${error.message}`);
    }
  }
}

/** Resolução de perfis (Identity) pela projeção pública — D7/D15. */
export class SupabaseProfileLookup implements ProfileLookup {
  constructor(private readonly profiles = new SupabaseProfileRepository()) {}

  async findProfileIdByUsername(username: string): Promise<string | null> {
    const profile = await this.profiles.findPublicViewByUsername(username);

    return profile?.id ?? null;
  }

  async findPublicProfile(id: string): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatarPath: string | null;
    isVerified: boolean;
    verifiedOrg: string | null;
  } | null> {
    const views = await this.profiles.findPublicViewsByIds([id]);

    return views[0]
      ? {
          id: views[0].id,
          username: views[0].username,
          fullName: views[0].fullName,
          avatarPath: views[0].avatarPath,
          isVerified: views[0].isVerified,
          verifiedOrg: views[0].verifiedOrg,
        }
      : null;
  }

  async searchPublicProfiles(
    term: string,
    options: { limit?: number } = {},
  ): Promise<{ id: string; username: string; fullName: string; avatarPath: string | null }[]> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 20);
    const needle = `%${term.trim()}%`;

    if (needle === "%%") {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.profiles")
      .select("id, username, full_name, avatar_path")
      .or(`username.ilike.${needle},full_name.ilike.${needle}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`falha ao buscar perfis: ${error.message}`);
    }

    return ((data ?? []) as unknown as {
      id: string;
      username: string;
      full_name: string;
      avatar_path: string | null;
    }[]).map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      avatarPath: row.avatar_path,
    }));
  }

  async findOwnNeighborhoodId(userId: string): Promise<string | null> {
    // Perfil completo é dado do próprio usuário (a query roda com a sessão dele).
    const profile = await this.profiles.findById(userId);

    return profile?.neighborhoodId ?? null;
  }

  async listPeopleByNeighborhood(
    neighborhoodId: string,
    options: { limit: number; excludeIds?: readonly string[] },
  ): Promise<PersonCard[]> {
    const views = await this.profiles.listPublicViewsByNeighborhood(neighborhoodId, options);

    return views.map(toPersonCard);
  }

  async listPeople(options: {
    limit: number;
    excludeIds?: readonly string[];
  }): Promise<PersonCard[]> {
    const views = await this.profiles.listPublicViews(options);

    return views.map(toPersonCard);
  }
}

/** Projeção pública de Identity → cartão do Social Graph (D7). */
function toPersonCard(view: {
  id: string;
  username: string;
  fullName: string;
  avatarPath: string | null;
  isVerified: boolean;
  verifiedOrg: string | null;
  cityId: number | null;
  neighborhoodId: string | null;
}): PersonCard {
  return {
    id: view.id,
    username: view.username,
    fullName: view.fullName,
    avatarPath: view.avatarPath,
    isVerified: view.isVerified,
    verifiedOrg: view.verifiedOrg,
    cityId: view.cityId,
    // `neighborhoodId` já vem condicionado a `show_neighborhood` (T2).
    neighborhoodId: view.neighborhoodId,
  };
}
