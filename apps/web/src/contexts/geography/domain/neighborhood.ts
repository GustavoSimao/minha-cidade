import { ValueObject } from "@/shared/kernel/value-object";
import type { IbgeCode } from "./city";

/** Slug do bairro, único dentro da cidade (invariante G3). */
export class NeighborhoodSlug extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  public static fromName(name: string): NeighborhoodSlug {
    const value = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "");

    if (value.length === 0) {
      throw new Error("nome do bairro não gera slug válido");
    }

    return new NeighborhoodSlug(value);
  }

  public get value(): string {
    return this.props.value;
  }

  protected equalsTo(other: { value: string }): boolean {
    return this.props.value === other.value;
  }
}

/** Bairro de catálogo curado (entidade de referência, não emite eventos). */
export class Neighborhood {
  private constructor(
    public readonly id: string,
    public readonly cityId: IbgeCode,
    public readonly name: string,
    public readonly slug: NeighborhoodSlug,
    public readonly source: string,
    public readonly sourceUrl: string | null,
  ) {}

  public static create(params: {
    id: string;
    cityId: IbgeCode;
    name: string;
    source: string;
    sourceUrl?: string | null;
  }): Neighborhood {
    const name = params.name.trim();

    if (name.length < 2 || name.length > 120) {
      throw new Error("nome do bairro deve ter entre 2 e 120 caracteres");
    }

    // G8: fonte oficial é obrigatória em todo bairro curado.
    if (!params.source || params.source.trim().length === 0) {
      throw new Error("bairro curado exige source (G8)");
    }

    return new Neighborhood(
      params.id,
      params.cityId,
      name,
      NeighborhoodSlug.fromName(name),
      params.source.trim(),
      params.sourceUrl ?? null,
    );
  }

  public equals(other: Neighborhood | null | undefined): boolean {
    return other !== null && other !== undefined && this.id === other.id;
  }
}
