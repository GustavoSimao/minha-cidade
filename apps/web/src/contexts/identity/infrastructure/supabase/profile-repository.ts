import { Profile } from "@/contexts/identity/domain/profile";
import type { ProfileEditableFields, PublicProfileView } from "@/contexts/identity/domain/profile";
import { createClient, createServiceRoleClient } from "./server";
import type { ProfileRepository, ProfileRow } from "@/contexts/identity/application/ports";

/** Colunas da projeção pública (invariante I7 — nunca `email`/`phone`). */
const PUBLIC_COLUMNS =
  "id, username, full_name, bio, avatar_path, cover_path, role, verified_org, is_verified, city_id, neighborhood_id, created_at";

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
    role: row.role,
    verifiedOrg: row.verified_org,
    cityId: row.city_id,
    neighborhoodId: row.neighborhood_id,
    termsAcceptedAt: row.termos_aceitos_em ? new Date(row.termos_aceitos_em) : null,
  };
}

/** Repositório de perfis em Supabase/Postgres. */
export class SupabaseProfileRepository implements ProfileRepository {
  async findPublicViewByUsername(username: string): Promise<PublicProfileView | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("identity.profiles")
      .select(PUBLIC_COLUMNS)
      .eq("username", username)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar perfil: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const row = data as unknown as ProfileRow;

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
      neighborhoodId: row.neighborhood_id,
      createdAt: new Date(row.created_at),
    };
  }

  async findPublicViewsByIds(ids: readonly string[]): Promise<PublicProfileView[]> {
    if (ids.length === 0) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("identity.profiles")
      .select(PUBLIC_COLUMNS)
      .in("id", [...ids]);

    if (error) {
      throw new Error(`falha ao buscar perfis: ${error.message}`);
    }

    return ((data ?? []) as unknown as ProfileRow[]).map((row) => ({
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
      neighborhoodId: row.neighborhood_id,
      createdAt: new Date(row.created_at),
    }));
  }

  async findById(id: string): Promise<Profile | null> {    const supabase = await createClient();

    const { data, error } = await supabase
      .from("identity.profiles")
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

    const { error } = await supabase
      .from("identity.profiles")
      .update({
        full_name: fields.fullName,
        bio: fields.bio,
        phone: fields.phone,
        avatar_path: fields.avatarPath,
        cover_path: fields.coverPath,
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

    const { data, error } = await supabase
      .from("identity.profiles")
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

    const { error } = await supabase.from("identity.profiles").delete().eq("id", id);

    if (error) {
      throw new Error(`falha ao encerrar conta: ${error.message}`);
    }
  }
}
