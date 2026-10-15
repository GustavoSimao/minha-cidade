import { Entity } from "@/shared/kernel/entity";
import { Identifier } from "@/shared/kernel/identifier";
import { ValueObject } from "@/shared/kernel/value-object";

/** Identificador da notificação. */
export class NotificationId extends Identifier<string> {}

/** Tipos fechados de notificação (invariante N3). */
export type NotificationKind =
  | "comment_added"
  | "publication_supported"
  | "publication_opposed"
  | "friend_requested"
  | "friend_accepted";

/** Tipo da notificação (conjunto fechado — N3). */
export class NotificationType extends ValueObject<{ value: NotificationKind }> {
  private static readonly ALL: readonly NotificationKind[] = [
    "comment_added",
    "publication_supported",
    "publication_opposed",
    "friend_requested",
    "friend_accepted",
  ];

  private constructor(value: NotificationKind) {
    super({ value });
  }

  public static create(raw: string): NotificationType {
    if (!NotificationType.ALL.includes(raw as NotificationKind)) {
      throw new Error("tipo de notificação inválido");
    }

    return new NotificationType(raw as NotificationKind);
  }

  public get value(): NotificationKind {
    return this.props.value;
  }

  public get label(): string {
    const labels: Record<NotificationKind, string> = {
      comment_added: "Novo comentário na sua publicação",
      publication_supported: "Apoiaram sua publicação",
      publication_opposed: "Se opuseram à sua publicação",
      friend_requested: "Novo pedido de amizade",
      friend_accepted: "Pedido de amizade aceito",
    };

    return labels[this.props.value];
  }

  protected equalsTo(other: { value: NotificationKind }): boolean {
    return this.props.value === other.value;
  }
}

/**
 * Notificação in-app destinada a um usuário (invariantes N1/N2/N4).
 *
 *  - N1: destinatário único (`userId`);
 *  - N4: `payload` carrega o mínimo para o link (publicationId/actorId);
 *  - N5: leitura/marcar como lida é do dono (garantido pela RLS).
 */
export class Notification extends Entity<NotificationId> {
  private readonly _userId: string;
  private readonly _type: NotificationType;
  private readonly _payload: Record<string, unknown>;
  private _readAt: Date | null;
  private readonly _createdAt: Date;

  private constructor(params: {
    id: NotificationId;
    userId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
    readAt: Date | null;
    createdAt: Date;
  }) {
    super(params.id);
    this._userId = params.userId;
    this._type = params.type;
    this._payload = params.payload;
    this._readAt = params.readAt;
    this._createdAt = params.createdAt;
  }

  public static create(params: {
    id: string;
    userId: string;
    type: string;
    payload?: Record<string, unknown>;
  }): Notification {
    if (params.userId.length === 0) {
      throw new Error("notificação precisa de destinatário");
    }

    return new Notification({
      id: new NotificationId(params.id),
      userId: params.userId,
      type: NotificationType.create(params.type),
      payload: params.payload ?? {},
      readAt: null,
      createdAt: new Date(),
    });
  }

  public static rehydrate(row: {
    id: string;
    userId: string;
    type: string;
    payload: Record<string, unknown>;
    readAt: Date | null;
    createdAt: Date;
  }): Notification {
    return new Notification({
      id: new NotificationId(row.id),
      userId: row.userId,
      type: NotificationType.create(row.type),
      payload: row.payload,
      readAt: row.readAt,
      createdAt: row.createdAt,
    });
  }

  public get userId(): string {
    return this._userId;
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get payload(): Record<string, unknown> {
    return this._payload;
  }

  public get readAt(): Date | null {
    return this._readAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get isUnread(): boolean {
    return this._readAt === null;
  }

  /** N5: marcar como lida é idempotente. */
  public markAsRead(at: Date): void {
    if (this._readAt !== null) {
      return;
    }

    this._readAt = at;
  }

  /** Link de destino derivado do payload (N4). */
  public get targetUrl(): string {
    const publicationId = this._payload["publicationId"];

    if (typeof publicationId === "string" && publicationId.length > 0) {
      return `/publicacao/${publicationId}`;
    }

    const username = this._payload["username"];

    if (typeof username === "string" && username.length > 0) {
      return `/perfil/${username}`;
    }

    return "/";
  }
}
