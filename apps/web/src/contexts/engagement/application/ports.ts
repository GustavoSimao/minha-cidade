import type { Result } from "@/shared/kernel/result";
import type { PublicCommentView } from "../domain/comment";

/** Linha de `engagement.reactions` como vem do banco. */
export interface ReactionRow {
  id: string;
  publication_id: string;
  user_id: string;
  type: string;
  created_at: string;
}

/** Linha de `engagement.comments` como vem do banco. */
export interface CommentRow {
  id: string;
  publication_id: string;
  author_id: string | null;
  content: string;
  is_anonymous: boolean;
  edited_at: string | null;
  hidden_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

/** Sessão necessária para interagir (invariante E8/P3). */
export interface EngagementSession {
  userId: string;
  emailConfirmed: boolean;
}

/** Porta de sessão — implementada pelo gateway de Identity na interface. */
export type CurrentEngagementSessionPort = () => Promise<EngagementSession | null>;

/**
 * Leitura do estado da publicação (E2/P9): Engagement não consulta Publication
 * diretamente (D15/D6) — a interface injeta o repositório de Publication.
 */
export interface PublicationStatePort {
  findState(
    id: string,
  ): Promise<{ authorId: string | null; deletedAt: Date | null; hiddenAt: Date | null } | null>;
}

/** Contadores derivados por agregação (E9 — sem coluna de contador). */
export interface ReactionCounts {
  support: number;
  oppose: number;
}

/** Contadores públicos de uma publicação (apoio, oposição e comentários). */
export interface PublicationCounts extends ReactionCounts {
  comments: number;
}

/** Porta de persistência do contexto Engagement (D6). */
export interface EngagementRepository {
  findReactionByUser(
    publicationId: string,
    userId: string,
  ): Promise<ReactionRow | null>;

  insertReaction(input: {
    id: string;
    publicationId: string;
    userId: string;
    type: "support" | "oppose";
  }): Promise<void>;

  updateReactionType(
    publicationId: string,
    userId: string,
    type: "support" | "oppose",
  ): Promise<void>;

  deleteReaction(publicationId: string, userId: string): Promise<void>;

  countReactions(publicationId: string): Promise<ReactionCounts>;

  countComments(publicationId: string): Promise<number>;

  /**
   * Contadores em lote para uma lista de publicações (leitura pública).
   * Integração por ID — sem JOIN entre schemas de contextos (D7).
   */
  countsByPublicationIds(
    publicationIds: readonly string[],
  ): Promise<Record<string, PublicationCounts>>;

  /** Quantas publicações o usuário apoiou (contador público do perfil — P6). */
  countSupportedByUser(userId: string): Promise<number>;

  listComments(
    publicationId: string,
    options: { limit: number; before?: string | null },
  ): Promise<{ rows: CommentRow[]; nextCursor: string | null }>;

  findCommentById(id: string): Promise<CommentRow | null>;

  insertComment(input: {
    id: string;
    publicationId: string;
    authorId: string;
    content: string;
    isAnonymous: boolean;
  }): Promise<void>;

  updateCommentContent(id: string, content: string, editedAt: Date): Promise<void>;

  softDeleteComment(id: string, deletedAt: Date): Promise<void>;

  isBookmarked(publicationId: string, userId: string): Promise<boolean>;

  addBookmark(publicationId: string, userId: string): Promise<void>;

  removeBookmark(publicationId: string, userId: string): Promise<void>;

  /** IDs das publicações salvas pelo usuário, mais recentes primeiro (E6). */
  listSavedPublicationIds(
    userId: string,
    options?: { limit?: number; before?: string | null },
  ): Promise<{ ids: string[]; nextCursor: string | null }>;

  listBookmarkedIds(userId: string, publicationIds: readonly string[]): Promise<string[]>;

  /** Outbox de eventos de domínio (D7): consumidores leem `shared.domain_events`. */
  recordEvent(event: {
    context: string;
    name: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

/** Comentário público + autor resolvido (projeção pública I7 — sem JOIN, D7). */
export interface CommentItem extends PublicCommentView {
  author: PublicCommentAuthor | null;
}

/** Item do feed de comentários, já com permissões do usuário resolvidas (E5). */
export interface CommentFeedItem extends CommentItem {
  /** true quando o comentário é do usuário logado (pode apagar — E5). */
  isMine: boolean;
  /** true quando é do usuário logado e está na janela de 15 minutos (E5). */
  canEdit: boolean;
}

/** Projeção pública de autor para exibição (I7 — sem e-mail/telefone). */
export interface PublicCommentAuthor {
  username: string;
  fullName: string;
  avatarPath: string | null;
  /** Selo institucional (P13) — mesmo carregamento do feed/Publicação. */
  isVerified: boolean;
  verifiedOrg: string | null;
}

/**
 * Leitura pública de autores em lote (Identity) — resolução por ID, sem JOIN
 * entre contextos (D7).
 */
export interface AuthorDirectory {
  findPublicAuthors(
    ids: readonly string[],
  ): Promise<Map<string, PublicCommentAuthor>>;
}

/** Resumo de engajamento de uma publicação para a página pública. */
export interface EngagementSummary {
  counts: ReactionCounts;
  commentsCount: number;
  myReaction: "support" | "oppose" | null;
  saved: boolean;
}

/** Resultado do toggle de reação (para a interface comunicar o estado). */
export type ReactionToggleOutcome = "added" | "removed" | "switched";

export type EngagementResult<T> = Result<T>;
