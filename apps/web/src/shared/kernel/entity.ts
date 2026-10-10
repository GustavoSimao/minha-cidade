import { Identifier } from "./identifier";

/**
 * Entidade base do kernel DDD: possui identidade e ciclo de vida.
 * Igualdade definida pela identidade, nunca pelos atributos.
 */
export abstract class Entity<TId extends Identifier> {
  protected readonly _id: TId;
  private readonly _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    this._id = id;
  }

  public get id(): TId {
    return this._id;
  }

  public equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (other.constructor !== this.constructor) {
      return false;
    }

    return this._id.equals(other._id);
  }

  public pullDomainEvents(): DomainEvent[] {
    return this._domainEvents.splice(0, this._domainEvents.length);
  }

  protected record(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
}

export class DomainEvent {
  public readonly occurredAt: Date;

  protected constructor(public readonly eventName: string) {
    this.occurredAt = new Date();
  }
}
