import type {
  PublicationMediaRow,
  PublicationRepository,
  PublicationRow,
} from "@/contexts/publication/application/ports";
import { createClient, createServiceRoleClient, table } from "@/shared/infrastructure/supabase";

const COLUMNS =
  "id, author_id, type, title, content, is_anonymous, city_id, neighborhood_id, edited_at, hidden_at, hidden_by, deleted_at, created_at";

/** Repositório de publicações em Supabase/Postgres. */
export class SupabasePublicationRepository implements PublicationRepository {
  async create(publication: {
    id: string;
    authorId: string;
    type: string;
    title: string;
    content: string;
    isAnonymous: boolean;
    cityId: number;
    neighborhoodId: string | null;
    media: readonly { path: string; position: number; byteSize: number; width: number | null; height: number | null }[];
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "publication.publications").insert({
      id: publication.id,
      author_id: publication.authorId,
      type: publication.type,
      title: publication.title,
      content: publication.content,
      is_anonymous: publication.isAnonymous,
      city_id: publication.cityId,
      neighborhood_id: publication.neighborhoodId,
    });

    if (error) {
      throw new Error(`falha ao criar publicação: ${error.message}`);
    }

    if (publication.media.length > 0) {
      const { error: mediaError } = await table(
        supabase,
        "publication.publication_media",
      ).insert(
        publication.media.map((item) => ({
          publication_id: publication.id,
          path: item.path,
          position: item.position,
          byte_size: item.byteSize,
          width: item.width,
          height: item.height,
        })),
      );

      if (mediaError) {
        throw new Error(`falha ao salvar mídia: ${mediaError.message}`);
      }
    }

    // Outbox: consumidores (engagement, notification, moderation, analytics)
    // leem shared.domain_events — integração por eventos (D7). A tabela é
    // service_role-only (revogada para anon/authenticated na migration
    // 20261011000003): o evento entra pelo cliente de serviço.
    const events = createServiceRoleClient();

    const { error: eventError } = await table(events, "shared.domain_events").insert({
      context: "publication",
      name: "publication.created",
      aggregate_id: publication.id,
      payload: {
        authorId: publication.authorId,
        type: publication.type,
        cityId: publication.cityId,
        neighborhoodId: publication.neighborhoodId,
        isAnonymous: publication.isAnonymous,
      },
    });

    if (eventError) {
      throw new Error(`falha ao registrar evento: ${eventError.message}`);
    }
  }

  async findById(id: string): Promise<PublicationRow | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "publication.publications")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar publicação: ${error.message}`);
    }

    return data ? (data as unknown as PublicationRow) : null;
  }

  async findMediaRows(publicationId: string): Promise<PublicationMediaRow[]> {
    const supabase = await createClient();

    const { data, error } = await table(
      supabase,
      "publication.publication_media",
    )
      .select("publication_id, path, position, byte_size, width, height")
      .eq("publication_id", publicationId)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(`falha ao buscar mídia: ${error.message}`);
    }

    return (data ?? []) as unknown as PublicationMediaRow[];
  }

  async listPublicFeed(query: {
    cityId?: number | null;
    neighborhoodId?: string | null;
    type?: "problem" | "idea" | null;
    cursor?: string | null;
    limit?: number;
  }): Promise<{ rows: PublicationRow[]; nextCursor: string | null }> {
    const supabase = await createClient();
    const limit = query.limit ?? 20;

    let request = table(supabase, "publication.publications")
      .select(COLUMNS)
      .is("deleted_at", null)
      .is("hidden_at", null);

    if (query.cityId) {
      request = request.eq("city_id", query.cityId);
    }
    if (query.neighborhoodId) {
      request = request.eq("neighborhood_id", query.neighborhoodId);
    }
    if (query.type) {
      request = request.eq("type", query.type);
    }
    if (query.cursor) {
      // Paginação por cursor: criadas estritamente antes do cursor (P8 — sem ranking).
      request = request.lt("created_at", query.cursor);
    }

    const { data, error } = await request
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (error) {
      throw new Error(`falha ao carregar feed: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as PublicationRow[];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      rows: page,
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    };
  }

  /**
   * Publicações públicas de um autor, mais recentes primeiro (leitura pública).
   * Usado no perfil (B5): publicações anônimas não são associadas ao perfil (P4).
   */
  async listPublicByAuthor(
    authorId: string,
    options: { limit?: number } = {},
  ): Promise<{ rows: PublicationRow[] }> {
    const supabase = await createClient();
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

    const { data, error } = await table(supabase, "publication.publications")
      .select(COLUMNS)
      .eq("author_id", authorId)
      .eq("is_anonymous", false)
      .is("deleted_at", null)
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`falha ao carregar publicações do perfil: ${error.message}`);
    }

    return { rows: (data ?? []) as unknown as PublicationRow[] };
  }

  /** Contagem de publicações identificadas do autor (contador do perfil — P6). */
  async countPublicByAuthor(authorId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await table(supabase, "publication.publications")
      .select("id", { count: "exact", head: true })
      .eq("author_id", authorId)
      .eq("is_anonymous", false)
      .is("deleted_at", null)
      .is("hidden_at", null);

    if (error) {
      throw new Error(`falha ao contar publicações do perfil: ${error.message}`);
    }

    return count ?? 0;
  }

  async updateEditableFields(
    id: string,
    fields: { title: string; content: string; editedAt: Date },
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "publication.publications")
      .update({
        title: fields.title,
        content: fields.content,
        edited_at: fields.editedAt.toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao atualizar publicação: ${error.message}`);
    }
  }

  async replaceMedia(
    id: string,
    media: readonly { path: string; position: number; byteSize: number; width: number | null; height: number | null }[],
  ): Promise<void> {
    const supabase = await createClient();

    const { error: deleteError } = await table(
      supabase,
      "publication.publication_media",
    )
      .delete()
      .eq("publication_id", id);

    if (deleteError) {
      throw new Error(`falha ao limpar mídia: ${deleteError.message}`);
    }

    if (media.length === 0) {
      return;
    }

    const { error } = await table(supabase, "publication.publication_media").insert(
      media.map((item) => ({
        publication_id: id,
        path: item.path,
        position: item.position,
        byte_size: item.byteSize,
        width: item.width,
        height: item.height,
      })),
    );

    if (error) {
      throw new Error(`falha ao salvar mídia: ${error.message}`);
    }
  }

  async softDelete(id: string, deletedAt: Date): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "publication.publications")
      .update({ deleted_at: deletedAt.toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao apagar publicação: ${error.message}`);
    }

    const events = createServiceRoleClient();

    const { error: eventError } = await table(events, "shared.domain_events").insert({
      context: "publication",
      name: "publication.deleted",
      aggregate_id: id,
      payload: {},
    });

    if (eventError) {
      throw new Error(`falha ao registrar evento: ${eventError.message}`);
    }
  }
}
