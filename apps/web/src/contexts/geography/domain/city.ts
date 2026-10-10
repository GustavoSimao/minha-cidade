import { ValueObject } from "@/shared/kernel/value-object";
import { Uf, type UfSigla } from "./uf";

/**
 * Slug da cidade: `nome-uf` normalizado (invariante G2).
 *
 * Nomes de município se repetem entre UFs ("Bom Jesus" existe em vários estados),
 * por isso o sufixo da UF é obrigatório — garante unicidade no catálogo.
 */
export class CitySlug extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  public static fromNameAndUf(name: string, uf: UfSigla | string): CitySlug {
    const base = CitySlug.normalize(name);

    if (base.length === 0) {
      throw new Error("nome da cidade não gera slug válido");
    }

    return new CitySlug(`${base}-${uf.trim().toLowerCase()}`);
  }

  private static normalize(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
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

/** Código IBGE do município: 7 dígitos (invariante G1). */
export class IbgeCode extends ValueObject<{ value: number }> {
  private constructor(value: number) {
    super({ value });
  }

  public static create(raw: number): IbgeCode {
    if (!Number.isInteger(raw) || raw < 1000000 || raw > 9999999) {
      throw new Error(`código IBGE inválido: ${raw}`);
    }
    return new IbgeCode(raw);
  }

  public get value(): number {
    return this.props.value;
  }

  protected equalsTo(other: { value: number }): boolean {
    return this.props.value === other.value;
  }
}

/** Cidade do catálogo público IBGE (entidade de referência, não emite eventos). */
export class City {
  private constructor(
    public readonly id: IbgeCode,
    public readonly uf: Uf,
    public readonly name: string,
    public readonly slug: CitySlug,
    public readonly ibgeSyncedAt: Date | null,
  ) {}

  public static create(params: {
    id: number;
    uf: string;
    name: string;
    ibgeSyncedAt?: Date | null;
  }): City {
    const name = params.name.trim();

    if (name.length < 2 || name.length > 120) {
      throw new Error("nome da cidade deve ter entre 2 e 120 caracteres");
    }

    const uf = Uf.create(params.uf);

    // G2: o slug é sempre derivado de nome + UF — nunca vem de fora.
    const slug = CitySlug.fromNameAndUf(name, uf.sigla);

    return new City(
      IbgeCode.create(params.id),
      uf,
      name,
      slug,
      params.ibgeSyncedAt ?? null,
    );
  }

  public equals(other: City | null | undefined): boolean {
    return other !== null && other !== undefined && this.id.equals(other.id);
  }
}
