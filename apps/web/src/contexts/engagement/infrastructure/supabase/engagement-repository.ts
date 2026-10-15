import type {
  EngagementRepository,
  PublicationCounts,
  ReactionCounts,
  ReactionRow,
  CommentRow,
} from "@/contexts/engagement/application/ports";
import { aggregatePublicationCounts } from "@/contexts/engagement/application/aggregate-counts";
import {
  createClient,
  createServiceRoleClient,
  table,
} from "@/shared/infrastructure/supabase";

/** Repositório de engajamento (reações, comentários, salvamentos) em Supabase. */
export class SupabaseEngagementRepository implements EngagementRepository {
  async findReactionByUser(
    publicationId: string,
    userId: string,
  ): Promise<ReactionRow | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "engagement.reactions")
      .select("id, publication_id, user_id, type, created_at")
      .eq("publication_id", publicationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar reação: ${error.message}`);
    }

    return data ? (data as unknown as ReactionRow) : null;
  }

  async insertReaction(input: {
    id: string;
    publicationId: string;
    userId: string;
    type: "support" | "oppose";
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.reactions").insert({
      id: input.id,
      publication_id: input.publicationId,
      user_id: input.userId,
      type: input.type,
    });

    if (error) {
      throw new Error(`falha ao registrar reação: ${error.message}`);
    }
  }

  async updateReactionType(
    publicationId: string,
    userId: string,
    type: "support" | "oppose",
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.reactions")
      .update({ type })
      .eq("publication_id", publicationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`falha ao trocar reação: ${error.message}`);
    }
  }

  async deleteReaction(publicationId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.reactions")
      .delete()
      .eq("publication_id", publicationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`falha ao remover reação: ${error.message}`);
    }
  }

  async countReactions(publicationId: string): Promise<ReactionCounts> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "engagement.reactions")
      .select("type")
      .eq("publication_id", publicationId);

    if (error) {
      throw new Error(`falha ao contar reações: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as { type: string }[];

    return {
      support: rows.filter((row) => row.type === "support").length,
      oppose: rows.filter((row) => row.type === "oppose").length,
    };
  }

  async countComments(publicationId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await table(supabase, "engagement.comments")
      .select("id", { count: "exact", head: true })
      .eq("publication_id", publicationId)
      .is("deleted_at", null)
      .is("hidden_at", null);

    if (error) {
      throw new Error(`falha ao contar comentários: ${error.message}`);
    }

    return count ?? 0;
  }

  async countsByPublicationIds(
    publicationIds: readonly string[],
  ): Promise<Record<string, PublicationCounts>> {
    if (publicationIds.length === 0) {
      return {};
    }

    const supabase = await createClient();
    const ids = [...publicationIds];

    // Duas consultas em lote (em vez de 2N por publicação) — leitura pública.
    const [reactions, comments] = await Promise.all([
      table(supabase, "engagement.reactions")
        .select("publication_id, type")
        .in("publication_id", ids),
      table(supabase, "engagement.comments")
        .select("publication_id")
        .in("publication_id", ids)
        .is("deleted_at", null)
        .is("hidden_at", null),
    ]);

    if (reactions.error) {
      throw new Error(`falha ao contar reações: ${reactions.error.message}`);
    }

    if (comments.error) {
      throw new Error(`falha ao contar comentários: ${comments.error.message}`);
    }

    return aggregatePublicationCounts({
      publicationIds: ids,
      reactions: (reactions.data ?? []) as unknown as {
        publication_id: string;
        type: string;
      }[],
      comments: (comments.data ?? []) as unknown as { publication_id: string }[],
    });
  }

  async countSupportedByUser(userId: string): Promise<number> {
    const supabase = await createClient();

    const { count, error } = await table(supabase, "engagement.reactions")
      .select("publication_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "support");

    if (error) {
      throw new Error(`falha ao contar apoios do usuário: ${error.message}`);
    }

    return count ?? 0;
  }

  async listComments(
    publicationId: string,
    options: { limit: number; before?: string | null },
  ): Promise<{ rows: CommentRow[]; nextCursor: string | null }> {
    const supabase = await createClient();

    let request = table(supabase, "engagement.comments")
      .select(
        "id, publication_id, author_id, content, is_anonymous, edited_at, hidden_at, deleted_at, created_at",
      )
      .eq("publication_id", publicationId)
      .is("deleted_at", null)
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(options.limit + 1);

    if (options.before) {
      request = request.lt("created_at", options.before);
    }

    const { data, error } = await request;

    if (error) {
      throw new Error(`falha ao carregar comentários: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as CommentRow[];
    const hasMore = rows.length > options.limit;
    const page = hasMore ? rows.slice(0, options.limit) : rows;

    return { rows: page, nextCursor: hasMore ? page[page.length - 1].created_at : null };
  }

  async findCommentById(id: string): Promise<CommentRow | null> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "engagement.comments")
      .select(
        "id, publication_id, author_id, content, is_anonymous, edited_at, hidden_at, deleted_at, created_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao buscar comentário: ${error.message}`);
    }

    return data ? (data as unknown as CommentRow) : null;
  }

  async insertComment(input: {
    id: string;
    publicationId: string;
    authorId: string;
    content: string;
    isAnonymous: boolean;
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.comments").insert({
      id: input.id,
      publication_id: input.publicationId,
      author_id: input.authorId,
      content: input.content,
      is_anonymous: input.isAnonymous,
    });

    if (error) {
      throw new Error(`falha ao publicar comentário: ${error.message}`);
    }
  }

  async updateCommentContent(
    id: string,
    content: string,
    editedAt: Date,
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.comments")
      .update({ content, edited_at: editedAt.toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao editar comentário: ${error.message}`);
    }
  }

  async softDeleteComment(id: string, deletedAt: Date): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.comments")
      .update({ deleted_at: deletedAt.toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`falha ao apagar comentário: ${error.message}`);
    }
  }

  async isBookmarked(publicationId: string, userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await table(supabase, "engagement.bookmarks")
      .select("user_id")
      .eq("publication_id", publicationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`falha ao verificar salvamento: ${error.message}`);
    }

    return data !== null;
  }

  async addBookmark(publicationId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    // Idempotente (E6): salvar duas vezes não duplica.
    const { error } = await table(supabase, "engagement.bookmarks")
      .upsert({ user_id: userId, publication_id: publicationId }, { onConflict: "user_id,publication_id" });

    if (error) {
      throw new Error(`falha ao salvar publicação: ${error.message}`);
    }
  }

  async removeBookmark(publicationId: string, userId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await table(supabase, "engagement.bookmarks")
      .delete()
      .eq("publication_id", publicationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`falha ao remover salvamento: ${error.message}`);
    }
  }

  async listSavedPublicationIds(
    userId: string,
    options: { limit?: number; before?: string | null } = {},
  ): Promise<{ ids: string[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
    const supabase = await createClient();

    let request = table(supabase, "engagement.bookmarks")
      .select("publication_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (options.before) {
      request = request.lt("created_at", options.before);
    }

    const { data, error } = await request;

    if (error) {
      throw new Error(`falha ao listar salvamentos: ${error.message}`);
    }

    const rows = (data ?? []) as unknown as { publication_id: string; created_at: string }[];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      ids: page.map((row) => row.publication_id),
      nextCursor: hasMore ? page[page.length - 1].created_at : null,
    };
  }

  async listBookmarkedIds(
    userId: string,
    publicationIds: readonly string[],
  ): Promise<string[]> {
    if (publicationIds.length === 0) {
      return [];
    }

    const supabase = await createClient();

    const { data, error } = await table(supabase, "engagement.bookmarks")
      .select("publication_id")
      .eq("user_id", userId)
      .in("publication_id", [...publicationIds]);

    if (error) {
      throw new Error(`falha ao listar salvamentos: ${error.message}`);
    }

    return ((data ?? []) as unknown as { publication_id: string }[]).map(
      (row) => row.publication_id,
    );
  }

  async recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    // Outbox (D7): a tabela é service_role-only (revogada para anon/
    // authenticated na migration 20261011000003) — o evento entra pelo
    // cliente de serviço. Sem o evento, a notificação do dono da publicação
    // (Fase 8) não é materializada.
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
