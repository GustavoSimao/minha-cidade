import { ValueObject } from "@/shared/kernel/value-object";

/** Título da publicação: 5–120 caracteres após trim (invariante P2). */
export class Title extends ValueObject<{ value: string }> {
  private static readonly MIN = 5;
  private static readonly MAX = 120;

  private constructor(value: string) {
    super({ value });
  }

  public static create(raw: string): Title {
    const value = raw.trim().replace(/\s{2,}/g, " ");

    if (value.length < Title.MIN || value.length > Title.MAX) {
      throw new Error(
        `título deve ter entre ${Title.MIN} e ${Title.MAX} caracteres`,
      );
    }

    return new Title(value);
  }

  public get value(): string {
    return this.props.value;
  }

  protected equalsTo(other: { value: string }): boolean {
    return this.props.value === other.value;
  }
}

/** Corpo da publicação: 10–5.000 caracteres após trim (invariante P2). */
export class Content extends ValueObject<{ value: string }> {
  private static readonly MIN = 10;
  private static readonly MAX = 5000;

  private constructor(value: string) {
    super({ value });
  }

  public static create(raw: string): Content {
    const value = raw.trim();

    if (value.length < Content.MIN || value.length > Content.MAX) {
      throw new Error(
        `texto deve ter entre ${Content.MIN} e ${Content.MAX} caracteres`,
      );
    }

    return new Content(value);
  }

  public get value(): string {
    return this.props.value;
  }

  /** Resumo curto para listas (feed). */
  public get excerpt(): string {
    const value = this.props.value;
    return value.length <= 160 ? value : `${value.slice(0, 157)}…`;
  }

  protected equalsTo(other: { value: string }): boolean {
    return this.props.value === other.value;
  }
}
