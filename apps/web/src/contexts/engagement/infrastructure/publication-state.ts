import type {
  AuthorDirectory,
  CurrentEngagementSessionPort,
  PublicCommentAuthor,
} from "@/contexts/engagement/application/ports";
import {
  SupabaseProfileRepository,
} from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import type { PublicationRepository } from "@/contexts/publication/application/ports";

/**
 * Porta de sessão do Engagement (E8/P3): só contas com e-mail confirmado
 * interagem. O gateway de Identity é a única fonte da sessão (D8).
 */
export const currentEngagementSession: CurrentEngagementSessionPort = async () => {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    return null;
  }

  return { userId: session.userId, emailConfirmed: session.emailConfirmed };
};

/**
 * Leitura do estado da publicação para o Engagement (E2/P9). Usa o repositório
 * de Publication já existente — integração por ID, sem JOIN (D7/D15).
 */
export class SupabasePublicationStatePort {
  constructor(private readonly publications: PublicationRepository) {}

  async findState(
    id: string,
  ): Promise<{ authorId: string | null; deletedAt: Date | null; hiddenAt: Date | null } | null> {
    const row = await this.publications.findById(id);

    if (row === null) {
      return null;
    }

    return {
      authorId: row.author_id,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      hiddenAt: row.hidden_at ? new Date(row.hidden_at) : null,
    };
  }
}

/** Resolução de autores pela projeção pública de Identity (I7, D7). */
export class SupabaseAuthorDirectory implements AuthorDirectory {
  constructor(private readonly profiles = new SupabaseProfileRepository()) {}

  async findPublicAuthors(
    ids: readonly string[],
  ): Promise<Map<string, PublicCommentAuthor>> {
    const views = await this.profiles.findPublicViewsByIds(ids);

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
