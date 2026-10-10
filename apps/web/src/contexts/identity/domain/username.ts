import { ValueObject } from "@/shared/kernel/value-object";

/**
 * Username público e imutável (P5, invariante I2).
 *
 * Regra de normalização (espelha a função `identity_slugify` no banco):
 * trim → espaços viram hífen → minúsculas → remove acentos → mantém só [a-z0-9-].
 * Se o resultado for vazio, usa-se o fallback `usuario-<8>` (I3).
 */
export class Username extends ValueObject<{ value: string }> {
  private static readonly PATTERN = /^[a-z0-9-]+$/;

  private constructor(value: string) {
    super({ value });
  }

  public static fromName(name: string): Username {
    const normalized = Username.normalize(name);

    if (normalized.length === 0) {
      return Username.fallback();
    }

    return new Username(normalized);
  }

  public static fallback(): Username {
    const random = Math.random().toString(36).slice(2, 10).padEnd(8, "0");
    return new Username(`usuario-${random}`);
  }

  public static create(raw: string): Username {
    const value = raw.trim().toLowerCase();
    if (!Username.PATTERN.test(value)) {
      throw new Error("username inválido: use apenas letras minúsculas, números e hífen");
    }
    return new Username(value);
  }

  private static normalize(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  public get value(): string {
    return this.props.value;
  }

  protected equalsTo(other: { value: string }): boolean {
    return this.props.value === other.value;
  }
}
