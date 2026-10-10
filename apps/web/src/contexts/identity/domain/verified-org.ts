import { ValueObject } from "@/shared/kernel/value-object";

/**
 * Nome do órgão institucional exibido no selo (P13, invariante I5).
 * Existe somente quando há selo; nunca é definido pelo próprio usuário.
 */
export class VerifiedOrg extends ValueObject<{ name: string }> {
  private constructor(name: string) {
    super({ name });
  }

  public static create(raw: string): VerifiedOrg {
    const name = raw.trim().replace(/\s{2,}/g, " ");
    if (name.length < 3 || name.length > 120) {
      throw new Error("nome do órgão deve ter entre 3 e 120 caracteres");
    }
    return new VerifiedOrg(name);
  }

  public get name(): string {
    return this.props.name;
  }

  protected equalsTo(other: { name: string }): boolean {
    return this.props.name === other.name;
  }
}
