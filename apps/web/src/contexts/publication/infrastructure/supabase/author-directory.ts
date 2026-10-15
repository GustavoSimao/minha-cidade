import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import type { AuthorDirectory, PublicAuthor } from "@/contexts/publication/application/ports";

/**
 * Leitura pública de autores em lote (Identity) para o feed — publicações
 * anônimas nunca chegam aqui (P4).
 */
export class SupabaseAuthorDirectory implements AuthorDirectory {
  private readonly profiles = new SupabaseProfileRepository();

  async findPublicAuthors(ids: readonly string[]): Promise<Map<string, PublicAuthor>> {
    const unique = [...new Set(ids)].filter((id) => id.length > 0);
    const views = await this.profiles.findPublicViewsByIds(unique);

    return new Map(
      views.map((view) => [
        view.id,
        {
          username: view.username,
          fullName: view.fullName,
          avatarPath: view.avatarPath,
          isVerified: view.isVerified,
          verifiedOrg: view.verifiedOrg,
        },
      ]),
    );
  }
}
