import { Entity, DomainEvent } from "@/shared/kernel/entity";
import { Identifier } from "@/shared/kernel/identifier";

import { ReactionKind, ReactionType } from "./reaction-type";

/** Identificador de reação. */
export class ReactionId extends Identifier<string> {}

/**
 * Reação de um usuário a uma publicação (apoio ou oposição).
 *
 * Invariantes (spec docs/04-contexts/engagement.md):
 *  - E1: no máximo uma reação por (publication, usuário) — a unicidade é
 *    garantida pelo banco (`reactions_user_publication_uk`) e o ciclo de vida
 *    aqui só trata da alternância;
 *  - reagir de novo com o mesmo tipo **remove**; com o outro **troca**.
 */
export class Reaction extends Entity<ReactionId> {
  private _publicationId: string;
  private _userId: string;
  private _type: ReactionType;

  private constructor(params: {
    id: ReactionId;
    publicationId: string;
    userId: string;
    type: ReactionType;
  }) {
    super(params.id);
    this._publicationId = params.publicationId;
    this._userId = params.userId;
    this._type = params.type;
  }

  public static create(params: {
    id: string;
    publicationId: string;
    userId: string;
    type: ReactionType;
  }): Reaction {
    return new Reaction({
      id: new ReactionId(params.id),
      publicationId: params.publicationId,
      userId: params.userId,
      type: params.type,
    });
  }

  /** Reconstrói uma reação existente a partir da persistência. */
  public static rehydrate(row: {
    id: string;
    publicationId: string;
    userId: string;
    type: string;
  }): Reaction {
    return new Reaction({
      id: new ReactionId(row.id),
      publicationId: row.publicationId,
      userId: row.userId,
      type: ReactionType.create(row.type),
    });
  }

  public get publicationId(): string {
    return this._publicationId;
  }

  public get userId(): string {
    return this._userId;
  }

  public get type(): ReactionType {
    return this._type;
  }

  /** E1: mesmo tipo já registrado = a próxima interação remove. */
  public isSameKind(kind: ReactionKind): boolean {
    return this._type.value === kind;
  }

  /** Troca apoio <-> oposição na mesma linha (E1). */
  public switchTo(kind: ReactionKind): void {
    const next = ReactionType.create(kind);

    if (this._type.equalsType(next)) {
      return;
    }

    this._type = next;
    this.record(
      new ReactionSwitchedEvent(this._publicationId, this._userId, next.value),
    );
  }
}

export class ReactionChangedEvent extends DomainEvent {
  constructor(
    public readonly publicationId: string,
    public readonly userId: string,
    public readonly kind: ReactionKind,
  ) {
    super("engagement.reaction_changed");
  }
}

/** Reação adicionada (consumidores: Moderação, Notificação — Fases 7–8). */
export class ReactionAddedEvent extends DomainEvent {
  constructor(
    public readonly publicationId: string,
    public readonly userId: string,
    public readonly kind: ReactionKind,
  ) {
    super("engagement.reaction_added");
  }
}

/** Reação removida (toggle com o mesmo tipo — E1). */
export class ReactionRemovedEvent extends DomainEvent {
  constructor(
    public readonly publicationId: string,
    public readonly userId: string,
    public readonly kind: ReactionKind,
  ) {
    super("engagement.reaction_removed");
  }
}

/** Reação trocada de apoio para oposição (ou vice-versa) — E1. */
export class ReactionSwitchedEvent extends DomainEvent {
  constructor(
    public readonly publicationId: string,
    public readonly userId: string,
    public readonly kind: ReactionKind,
  ) {
    super("engagement.reaction_switched");
  }
}
