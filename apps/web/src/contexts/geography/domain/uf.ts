import { ValueObject } from "@/shared/kernel/value-object";

/** As 27 unidades federativas do Brasil (invariante G1). */
export const UF_SIGLAS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const;

export type UfSigla = (typeof UF_SIGLAS)[number];

/**
 * Unidade federativa do município (invariante G1).
 * Sigla oficial de 2 letras, sempre maiúscula.
 */
export class Uf extends ValueObject<{ sigla: UfSigla }> {
  private constructor(sigla: UfSigla) {
    super({ sigla });
  }

  public static create(raw: string): Uf {
    const sigla = raw.trim().toUpperCase();
    if (!Uf.isValid(sigla)) {
      throw new Error(`UF inválida: ${raw}`);
    }
    return new Uf(sigla as UfSigla);
  }

  public static isValid(raw: string): boolean {
    return (UF_SIGLAS as readonly string[]).includes(raw.trim().toUpperCase());
  }

  public static all(): readonly UfSigla[] {
    return UF_SIGLAS;
  }

  public get sigla(): UfSigla {
    return this.props.sigla;
  }

  protected equalsTo(other: { sigla: UfSigla }): boolean {
    return this.props.sigla === other.sigla;
  }
}
