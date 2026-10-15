import { DomainEvent, Entity } from "@/shared/kernel/entity";
import { Identifier } from "@/shared/kernel/identifier";
import { ValueObject } from "@/shared/kernel/value-object";

/** Identificador de comentário. */
export class CommentId extends Identifier<string> {}

/** Janela de edição do comentário (invariante E5 da spec). */
export const COMMENT_EDIT_WINDOW_MINUTES = 15;

/** Conteúdo do comentário: 2–2.000 caracteres após trim (invariante E3). */
export class CommentContent extends ValueObject<{ value: string }> {
  private static readonly MIN = 2;
  private static readonly MAX = 2000;

  private constructor(value: string) {
    super({ value });
  }

  public static create(raw: string): CommentContent {
    const value = raw.trim();

    if (value.length < CommentContent.MIN || value.length > CommentContent.MAX) {
      throw new Error(
        `comentário deve ter entre ${CommentContent.MIN} e ${CommentContent.MAX} caracteres`,
      );
    }

    return new CommentContent(value);
  }

  public get value(): string {
    return this.props.value;
  }

  protected equalsTo(other: { value: string }): boolean {
    return this.props.value === other.value;
  }
}

/**
 * Comentário de uma publicação.
 *
 * Invariantes (spec docs/04-contexts/engagement.md):
 *  - E3: 2–2.000 caracteres;
 *  - E4: anonimato opcional (P4 — projeção pública não expõe autor);
 *  - E5: só o autor edita (aplicação), e em até 15 minutos;
 *  - E5/E10: apagar é lógico (`deletedAt`); ocultar é da moderação.
 */
export class Comment extends Entity<CommentId> {
  private _publicationId: string;
  private _authorId: string | null;
  private _content: CommentContent;
  private _isAnonymous: boolean;
  private _editedAt: Date | null;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;

  private constructor(params: {
    id: CommentId;
    publicationId: string;
    authorId: string | null;
    content: CommentContent;
    isAnonymous: boolean;
    editedAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
  }) {
    super(params.id);
    this._publicationId = params.publicationId;
    this._authorId = params.authorId;
    this._content = params.content;
    this._isAnonymous = params.isAnonymous;
    this._editedAt = params.editedAt;
    this._deletedAt = params.deletedAt;
    this._createdAt = params.createdAt;
  }

  public static create(params: {
    id: string;
    publicationId: string;
    authorId: string;
    content: string;
    isAnonymous: boolean;
    createdAt?: Date;
  }): Comment {
    return new Comment({
      id: new CommentId(params.id),
      publicationId: params.publicationId,
      authorId: params.authorId,
      content: CommentContent.create(params.content),
      isAnonymous: params.isAnonymous,
      editedAt: null,
      deletedAt: null,
      createdAt: params.createdAt ?? new Date(),
    });
  }

  public static rehydrate(row: {
    id: string;
    publicationId: string;
    authorId: string | null;
    content: string;
    isAnonymous: boolean;
    editedAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
  }): Comment {
    return new Comment({
      id: new CommentId(row.id),
      publicationId: row.publicationId,
      authorId: row.authorId,
      content: CommentContent.create(row.content),
      isAnonymous: row.isAnonymous,
      editedAt: row.editedAt,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
    });
  }

  public get publicationId(): string {
    return this._publicationId;
  }

  public get authorId(): string | null {
    return this._authorId;
  }

  public get content(): CommentContent {
    return this._content;
  }

  public get isAnonymous(): boolean {
    return this._isAnonymous;
  }

  public get editedAt(): Date | null {
    return this._editedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  /** E5: edição permitida somente dentro da janela de 15 minutos. */
  public canEditAt(now: Date): boolean {
    if (this._deletedAt !== null) {
      return false;
    }

    return now.getTime() - this._createdAt.getTime() <= COMMENT_EDIT_WINDOW_MINUTES * 60_000;
  }

  /** E5: edita o conteúdo e marca `editedAt`; rejeita fora da janela. */
  public edit(content: string, now: Date): void {
    if (!this.canEditAt(now)) {
      throw new Error(
        `comentário só pode ser editado em até ${COMMENT_EDIT_WINDOW_MINUTES} minutos`,
      );
    }

    this._content = CommentContent.create(content);
    this._editedAt = now;
    this.record(new CommentEditedEvent(this.id.value));
  }

  /** E5: exclusão lógica — some das leituras públicas, preservada no banco. */
  public softDelete(): void {
    this._deletedAt = new Date();
    this.record(new CommentDeletedEvent(this.id.value));
  }

  public get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  /** Projeção pública (E4/P4): `authorId` é `null` quando anônimo. */
  public toPublicView(): PublicCommentView {
    return {
      id: this.id.value,
      publicationId: this._publicationId,
      authorId: this._isAnonymous ? null : this._authorId,
      content: this._content.value,
      isAnonymous: this._isAnonymous,
      editedAt: this._editedAt,
      createdAt: this._createdAt,
    };
  }
}

/** Projeção pública de comentário (invariante E4/P4). */
export interface PublicCommentView {
  id: string;
  publicationId: string;
  authorId: string | null;
  content: string;
  isAnonymous: boolean;
  editedAt: Date | null;
  createdAt: Date;
}

export class CommentEditedEvent extends DomainEvent {
  constructor(public readonly commentId: string) {
    super("engagement.comment_edited");
  }
}

export class CommentDeletedEvent extends DomainEvent {
  constructor(public readonly commentId: string) {
    super("engagement.comment_deleted");
  }
}
