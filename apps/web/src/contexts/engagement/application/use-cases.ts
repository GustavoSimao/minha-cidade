import { randomUUID } from "node:crypto";

import { fail, ok, type Result } from "@/shared/kernel/result";

import type {
  AuthorDirectory,
  CommentFeedItem,
  CurrentEngagementSessionPort,
  EngagementRepository,
  EngagementSummary,
  PublicationStatePort,
  ReactionToggleOutcome,
} from "./ports";
import { Comment } from "../domain/comment";
import { Reaction } from "../domain/reaction";
import type { ReactionType as ReactionTypeValue } from "../domain/reaction-type";
import { ReactionType } from "../domain/reaction-type";

/** Alterna a reação do usuário na publicação (E1: mesmo tipo remove, outro troca). */
export class ToggleReaction {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly publications: PublicationStatePort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(params: {
    publicationId: string;
    type: string;
  }): Promise<Result<ReactionToggleOutcome>> {
    const session = await this.session();

    // E8/P3: interagir exige conta com e-mail confirmado.
    if (session === null) {
      return fail("sessão necessária para reagir");
    }
    if (!session.emailConfirmed) {
      return fail("confirme seu e-mail para interagir");
    }

    // E2/P9: só em publicação visível.
    const state = await this.publications.findState(params.publicationId);

    if (state === null || state.deletedAt !== null || state.hiddenAt !== null) {
      return fail("publicação não encontrada");
    }

    let kind: ReactionTypeValue;
    try {
      kind = ReactionType.create(params.type);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "reação inválida");
    }

    const existing = await this.engagements.findReactionByUser(
      params.publicationId,
      session.userId,
    );

    if (existing === null) {
      const reaction = Reaction.create({
        id: randomUUID(),
        publicationId: params.publicationId,
        userId: session.userId,
        type: kind,
      });

      await this.engagements.insertReaction({
        id: reaction.id.value,
        publicationId: params.publicationId,
        userId: session.userId,
        type: kind.value,
      });
      await this.engagements.recordEvent({
        context: "engagement",
        name: "publication.supported",
        aggregateId: params.publicationId,
        payload: { kind: kind.value, userId: session.userId },
      });

      return ok("added");
    }

    const current = Reaction.rehydrate({
      id: existing.id,
      publicationId: existing.publication_id,
      userId: existing.user_id,
      type: existing.type,
    });

    if (current.isSameKind(kind.value)) {
      await this.engagements.deleteReaction(params.publicationId, session.userId);
      await this.engagements.recordEvent({
        context: "engagement",
        name: "publication.reaction_removed",
        aggregateId: params.publicationId,
        payload: { kind: kind.value, userId: session.userId },
      });

      return ok("removed");
    }

    await this.engagements.updateReactionType(
      params.publicationId,
      session.userId,
      kind.value,
    );
    await this.engagements.recordEvent({
      context: "engagement",
      name: "publication.opposed",
      aggregateId: params.publicationId,
      payload: { kind: kind.value, userId: session.userId },
    });

    return ok("switched");
  }
}

/** Cria um comentário em uma publicação visível (E2/E3/E4/E8). */
export class AddComment {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly publications: PublicationStatePort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(params: {
    publicationId: string;
    content: string;
    isAnonymous: boolean;
  }): Promise<Result<{ id: string }>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária para comentar");
    }
    if (!session.emailConfirmed) {
      return fail("confirme seu e-mail para comentar");
    }

    const state = await this.publications.findState(params.publicationId);

    if (state === null || state.deletedAt !== null || state.hiddenAt !== null) {
      return fail("publicação não encontrada");
    }

    let comment: Comment;
    try {
      comment = Comment.create({
        id: randomUUID(),
        publicationId: params.publicationId,
        authorId: session.userId,
        content: params.content,
        isAnonymous: params.isAnonymous,
      });
    } catch (error) {
      return fail(error instanceof Error ? error.message : "comentário inválido");
    }

    await this.engagements.insertComment({
      id: comment.id.value,
      publicationId: params.publicationId,
      authorId: session.userId,
      content: comment.content.value,
      isAnonymous: comment.isAnonymous,
    });

    // Notifica o autor da publicação (consumido na Fase 8 — exceto anônimo/auto).
    if (state.authorId !== null && state.authorId !== session.userId) {
      await this.engagements.recordEvent({
        context: "engagement",
        name: "comment.added",
        aggregateId: comment.id.value,
        payload: {
          publicationId: params.publicationId,
          publicationAuthorId: state.authorId,
          commentAuthorId: session.userId,
          isAnonymous: comment.isAnonymous,
        },
      });
    }

    return ok({ id: comment.id.value });
  }
}

/** Edita o próprio comentário em até 15 minutos (E5). */
export class EditMyComment {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(params: {
    commentId: string;
    content: string;
  }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const row = await this.engagements.findCommentById(params.commentId);

    if (row === null || row.author_id !== session.userId || row.deleted_at !== null) {
      return fail("comentário não encontrado");
    }

    const comment = Comment.rehydrate({
      id: row.id,
      publicationId: row.publication_id,
      authorId: row.author_id,
      content: row.content,
      isAnonymous: row.is_anonymous,
      editedAt: row.edited_at ? new Date(row.edited_at) : null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      createdAt: new Date(row.created_at),
    });

    try {
      comment.edit(params.content, new Date());
    } catch (error) {
      return fail(error instanceof Error ? error.message : "não foi possível editar");
    }

    await this.engagements.updateCommentContent(
      comment.id.value,
      comment.content.value,
      comment.editedAt as Date,
    );

    return ok(undefined);
  }
}

/** Apaga (lógico) o próprio comentário (E5). */
export class DeleteMyComment {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(params: { commentId: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    const row = await this.engagements.findCommentById(params.commentId);

    if (row === null || row.author_id !== session.userId) {
      return fail("comentário não encontrado");
    }

    if (row.deleted_at !== null) {
      return ok(undefined);
    }

    await this.engagements.softDeleteComment(params.commentId, new Date());

    return ok(undefined);
  }
}

/** Salva uma publicação na lista privada (E6; idempotente). */
export class SavePublication {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly publications: PublicationStatePort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(params: { publicationId: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária para salvar");
    }

    const state = await this.publications.findState(params.publicationId);

    if (state === null || state.deletedAt !== null || state.hiddenAt !== null) {
      return fail("publicação não encontrada");
    }

    await this.engagements.addBookmark(params.publicationId, session.userId);
    await this.engagements.recordEvent({
      context: "engagement",
      name: "publication.bookmarked",
      aggregateId: params.publicationId,
      payload: { userId: session.userId },
    });

    return ok(undefined);
  }
}

/** Remove uma publicação da lista privada (idempotente). */
export class UnsavePublication {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(params: { publicationId: string }): Promise<Result<void>> {
    const session = await this.session();

    if (session === null) {
      return fail("sessão necessária");
    }

    await this.engagements.removeBookmark(params.publicationId, session.userId);

    return ok(undefined);
  }
}

/** Lista comentários públicos de uma publicação com autores resolvidos (E4/P4, D7). */
export class ListPublicationComments {
  constructor(
    private readonly engagements: EngagementRepository,
    private readonly authors: AuthorDirectory,
  ) {}

  public async execute(
    publicationId: string,
    options: {
      limit?: number;
      before?: string | null;
      /** Usuário logado (para marcar o que é dele — E5). */
      viewerId?: string | null;
      /** Instante de referência da janela de edição (injetável para testes). */
      now?: Date;
    } = {},
  ): Promise<{ items: CommentFeedItem[]; nextCursor: string | null }> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
    const now = options.now ?? new Date();

    const { rows, nextCursor } = await this.engagements.listComments(publicationId, {
      limit,
      before: options.before ?? null,
    });

    const authorIds = [
      ...new Set(rows.map((row) => row.author_id).filter((id): id is string => id !== null)),
    ];
    const authors = await this.authors.findPublicAuthors(authorIds);

    const items = rows.map((row): CommentFeedItem => {
      // E4/P4: projeção pública não expõe autor quando anônimo.
      const authorId = row.is_anonymous ? null : row.author_id;
      const createdAt = new Date(row.created_at);
      const viewerId = options.viewerId ?? null;
      const isMine = viewerId !== null && authorId === viewerId;

      return {
        id: row.id,
        publicationId: row.publication_id,
        authorId,
        content: row.content,
        isAnonymous: row.is_anonymous,
        editedAt: row.edited_at ? new Date(row.edited_at) : null,
        createdAt,
        author: authorId !== null ? authors.get(authorId) ?? null : null,
        isMine,
        // E5: edição só dentro da janela de 15 minutos.
        canEdit: isMine && now.getTime() - createdAt.getTime() <= 15 * 60_000,
      };
    });

    return { items, nextCursor };
  }
}

/** Resumo de engajamento para render inicial da página (E9: contadores derivados). */
export class GetEngagementSummary {
  constructor(
    private readonly session: CurrentEngagementSessionPort,
    private readonly engagements: EngagementRepository,
  ) {}

  public async execute(publicationId: string): Promise<EngagementSummary> {
    const [counts, commentsCount, session] = await Promise.all([
      this.engagements.countReactions(publicationId),
      this.engagements.countComments(publicationId),
      this.session(),
    ]);

    const myReactionRow =
      session === null
        ? null
        : await this.engagements.findReactionByUser(publicationId, session.userId);

    const saved =
      session !== null
        ? await this.engagements.isBookmarked(publicationId, session.userId)
        : false;

    return {
      counts,
      commentsCount,
      myReaction:
        myReactionRow === null
          ? null
          : myReactionRow.type === "oppose"
            ? "oppose"
            : "support",
      saved,
    };
  }
}
