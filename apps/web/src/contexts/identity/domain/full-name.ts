import { ValueObject } from "@/shared/kernel/value-object";

/**
 * Nome completo do usuário (2–120 caracteres após trim).
 */
export class FullName extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  public static create(raw: string): FullName {
    const value = raw.trim().replace(/\s{2,}/g, " ");
    if (value.length < 2 || value.length > 120) {
      throw new Error("nome deve ter entre 2 e 120 caracteres");
    }
    return new FullName(value);
  }

  public get value(): string {
    return this.props.value;
  }

  protected equalsTo(other: { value: string }): boolean {
    return this.props.value === other.value;
  }
}
