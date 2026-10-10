/**
 * Value Object base do kernel DDD.
 * Comparação por valor, imutável, sem identidade própria.
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props) as T;
  }

  public equals(other: ValueObject<T> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (other.constructor !== this.constructor) {
      return false;
    }

    return this.equalsTo(other.props);
  }

  protected abstract equalsTo(other: T): boolean;
}
