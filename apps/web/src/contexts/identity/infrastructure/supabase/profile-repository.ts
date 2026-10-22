import { Profile } from "@/contexts/identity/domain/profile";
import type { ProfileEditableFields, PublicProfileView } from "@/contexts/identity/domain/profile";
import { createClient, createServiceRoleClient, table } from "./server";
import type { ProfileRepository, ProfileRow } from "@/contexts/identity/application/ports";

/** Colunas da projeção pública (invariante I7 — nunca `email`/`phone`). */
const PUBLIC_COLUMNS =
  "id, username, full_name, bio, avatar_path, cover_path, role, verified_org, is_verified, city_id, neighborhood_id, show_neighborhood, website, created_at";

/** Mapeia a linha do banco (snake_case) para o formato do domínio. */
function toDomainRow(row: ProfileRow): Parameters<typeof Profile.rehydrate>[0] {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio,
    phone: row.phone,
    avatarPath: row.avatar_path,
    coverPath: row.cover_path,
    website: row.website,
    showNeighborhood: row.show_neighborhood,
    role: row.role,
    verifiedOrg: row.verified_org,
    cityId: row.city_id,
    neighborhoodId: row.neighborhood_id,
    termsAcceptedAt: row.termos_aceitos_em ? new Date(row.termos_aceitos_em) : null,
  };
}

/**
 * Projeção pública de uma linha (I7): o bairro só é exposto quando o dono
 * permite (`show_neighborhood`). A cidade continua visível.
 */
function toPublicView(row: ProfileRow): PublicProfileView {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio,
    avatarPath: row.avatar_path,
    coverPath: row.cover_path,
    role: row.role,
    verifiedOrg: row.verified_org,
    isVerified: row.is_verified,
    cityId: row.city_id,
    neighborhoodId: row.show_neighborhood ? row.neighborhood_id : null,
    website: row.website,
    createdAt: new Date(row.created_at),
  };
}

/** Repositório de perfis em Supabase/Postgres. */
export class SupabaseProfileRepository implements ProfileRepository {
  async findPublicViewByUsername(username: string): Promise<PublicProfileView | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.profiles")
      .select(PUBLIC_COLUMNS)
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar perfil: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return toPublicView(data as unknown as ProfileRow);
  }

  async findPublicViewsByIds(ids: readonly string[]): Promise<PublicProfileView[]> {
    if (ids.length === 0) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.profiles")
      .select(PUBLIC_COLUMNS)
      .in("id", [...ids]);

    if (error) {
      throw new Error(`falha ao buscar perfis: ${error.message}`);
    }

    return ((data ?? []) as unknown as ProfileRow[]).map(toPublicView);
  }

  /** Listas públicas (I7) — a query já aplica as exclusões (D-6: opt-out aparece). */
  private async queryPublicViews(
    supabase: Awaited<ReturnType<typeof createClient>>,
    options: { limit: number; excludeIds?: readonly string[]; neighborhoodId?: string },
  ): Promise<PublicProfileView[]> {
    const limit = Math.min(Math.max(options.limit, 1), 50);

    let query = table(supabase, "identity.profiles")
      .select(PUBLIC_COLUMNS)
      .order("username", { ascending: true });

    if (options.neighborhoodId) {
      query = query.eq("neighborhood_id", options.neighborhoodId);
    }

    // `neq` encadeado (AND): cada excluído vira um filtro — evita o `not in`
    // com lista entre parênteses, que o PostgREST rejeita sem quoting.
    for (const id of options.excludeIds ?? []) {
      query = query.neq("id", id);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      throw new Error(`falha ao listar perfis: ${error.message}`);
    }

    return ((data ?? []) as unknown as ProfileRow[]).map(toPublicView);
  }

  async listPublicViewsByNeighborhood(
    neighborhoodId: string,
    options: { limit: number; excludeIds?: readonly string[] },
  ): Promise<PublicProfileView[]> {
    const supabase = await createClient();

    return this.queryPublicViews(supabase, { ...options, neighborhoodId });
  }

  async listPublicViews(options: {
    limit: number;
    excludeIds?: readonly string[];
  }): Promise<PublicProfileView[]> {
    const supabase = await createClient();

    return this.queryPublicViews(supabase, options);
  }

  async findById(id: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar perfil: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return Profile.rehydrate(toDomainRow(data as unknown as ProfileRow));
  }

  async updateEditableFields(
    id: string,
    fields: ProfileEditableFields,
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "identity.profiles")
      .update({
        full_name: fields.fullName,
        bio: fields.bio,
        phone: fields.phone,
        avatar_path: fields.avatarPath?.trim() ? fields.avatarPath : null,
        cover_path: fields.coverPath?.trim() ? fields.coverPath : null,
        website: fields.website?.trim() ? fields.website : null,
        show_neighborhood: fields.showNeighborhood,
        city_id: fields.cityId,
        neighborhood_id: fields.neighborhoodId,
      })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao atualizar perfil: ${error.message}`);
    }
  }

  async usernameExists(username: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "identity.profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao verificar username: ${error.message}`);
    }

    return data !== null;
  }

  async deleteById(id: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await table(supabase, "identity.profiles").delete().eq("id", id);

    if (error) {
      throw new Error(`falha ao encerrar conta: ${error.message}`);
    }
  }
}
