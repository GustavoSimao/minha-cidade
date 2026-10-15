import { Entity } from "@/shared/kernel/entity";
import { Identifier } from "@/shared/kernel/identifier";

import { ProfileId, UserPair } from "./user-pair";

/** Identificador da amizade. */
export class FriendshipId extends Identifier<string> {}

/**
 * Amizade mútua entre dois usuários.
 *
 * Invariantes (spec docs/04-contexts/social-graph.md):
 *  - S1: amizade é mútua (não existe "seguindo");
 *  - S2: no máximo uma linha por par (sentinela ordenada em `pair`);
 *  - S3: sem autorelacionamento;
 *  - S4: só o destinatário responde;
 *  - S5: só o remetente cancela;
 *  - S6: qualquer lado desfaz.
 */
export class Friendship extends Entity<FriendshipId> {
  private readonly _pair: UserPair;
  private _status: "pending" | "accepted";
  private readonly _requestedBy: ProfileId;
  private _respondedBy: ProfileId | null;
  private readonly _createdAt: Date;

  private constructor(params: {
    id: FriendshipId;
    pair: UserPair;
    status: "pending" | "accepted";
    requestedBy: ProfileId;
    respondedBy: ProfileId | null;
    createdAt: Date;
  }) {
    super(params.id);
    this._pair = params.pair;
    this._status = params.status;
    this._requestedBy = params.requestedBy;
    this._respondedBy = params.respondedBy;
    this._createdAt = params.createdAt;
  }

  /** Cria um pedido de amizade pendente (regra: quem cria é o solicitante). */
  public static request(
    id: string,
    requesterId: ProfileId,
    otherId: ProfileId,
    now: Date = new Date(),
  ): Friendship {
    const pair = UserPair.of(requesterId, otherId);

    return new Friendship({
      id: new FriendshipId(id),
      pair,
      status: "pending",
      requestedBy: requesterId,
      respondedBy: null,
      createdAt: now,
    });
  }

  /** Reconstrói uma amizade existente a partir da persistência. */
  public static rehydrate(row: {
    id: string;
    userLow: ProfileId;
    userHigh: ProfileId;
    status: "pending" | "accepted";
    requestedBy: ProfileId;
    respondedBy: ProfileId | null;
    createdAt: Date;
  }): Friendship {
    return new Friendship({
      id: new FriendshipId(row.id),
      pair: UserPair.of(row.userLow, row.userHigh),
      status: row.status,
      requestedBy: row.requestedBy,
      respondedBy: row.respondedBy,
      createdAt: row.createdAt,
    });
  }

  public get pair(): UserPair {
    return this._pair;
  }

  public get status(): "pending" | "accepted" {
    return this._status;
  }

  public get requestedBy(): ProfileId {
    return this._requestedBy;
  }

  public get respondedBy(): ProfileId | null {
    return this._respondedBy;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get isAccepted(): boolean {
    return this._status === "accepted";
  }

  public get isPending(): boolean {
    return this._status === "pending";
  }

  /** Direção do relacionamento na visão de um usuário (S1/S4/S5). */
  public relationshipFor(viewerId: ProfileId): "none" | "pending_sent" | "pending_received" | "friends" {
    if (!this._pair.contains(viewerId)) {
      return "none";
    }

    if (this._status === "accepted") {
      return "friends";
    }

    return this._requestedBy === viewerId ? "pending_sent" : "pending_received";
  }

  /** S4: só o destinatário aceita um pedido pendente. */
  public accept(responderId: ProfileId): void {
    if (this._status !== "pending") {
      throw new Error("só um pedido pendente pode ser aceito");
    }

    if (this._pair.contains(responderId) === false) {
      throw new Error("somente participantes podem aceitar");
    }

    if (responderId === this._requestedBy) {
      throw new Error("somente o destinatário pode aceitar o pedido");
    }

    this._status = "accepted";
    this._respondedBy = responderId;
  }

  /** S5/S6: cancelar/recusar/desfazer são modelados como remoção (aplicação). */
  public involves(userId: ProfileId): boolean {
    return this._pair.contains(userId);
  }
}
