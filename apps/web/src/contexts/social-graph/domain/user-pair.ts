import { ValueObject } from "@/shared/kernel/value-object";

/** Identificador de perfil (usuário) no grafo. */
export type ProfileId = string;

/** Sentinela ordenada: `userLow < userHigh` (invariantes S2/S3 da spec). */
export class UserPair extends ValueObject<{ low: ProfileId; high: ProfileId }> {
  private constructor(low: ProfileId, high: ProfileId) {
    super({ low, high });
  }

  /** Cria o par ordenado (S2) e rejeita autorelacionamento (S3). */
  public static of(a: ProfileId, b: ProfileId): UserPair {
    if (a === b) {
      throw new Error("não é permitido ser amigo de si mesmo");
    }

    const [low, high] = a < b ? [a, b] : [b, a];

    return new UserPair(low, high);
  }

  public get low(): ProfileId {
    return this.props.low;
  }

  public get high(): ProfileId {
    return this.props.high;
  }

  public contains(id: ProfileId): boolean {
    return this.props.low === id || this.props.high === id;
  }

  /** O outro membro do par (direção derivada, não armazenada). */
  public other(id: ProfileId): ProfileId {
    if (this.props.low === id) {
      return this.props.high;
    }

    if (this.props.high === id) {
      return this.props.low;
    }

    throw new Error("usuário não pertence ao par");
  }

  protected equalsTo(other: { low: ProfileId; high: ProfileId }): boolean {
    return this.props.low === other.low && this.props.high === other.high;
  }
}

/** Estado do relacionamento entre dois usuários. */
export type RelationshipKind = "none" | "pending_sent" | "pending_received" | "friends";

/** Status persistido da linha de amizade. */
export type FriendshipStatus = "pending" | "accepted";
