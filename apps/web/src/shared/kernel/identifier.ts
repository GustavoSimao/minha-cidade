import { ValueObject } from "./value-object";

/**
 * Identificador tipado de entidade. Garante que IDs de contextos
 * diferentes não sejam trocados por acidente em tempo de compilação.
 */
export abstract class Identifier<T = string> extends ValueObject<T> {
  public constructor(value: T) {
    super(value);
  }

  public get value(): T {
    return this.props;
  }

  public toString(): string {
    return String(this.props);
  }

  protected equalsTo(other: T): boolean {
    return this.props === other;
  }
}
