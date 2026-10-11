import { ValueObject } from "@/shared/kernel/value-object";

/** Tipo da publicação (invariante P1 — imutável após a criação). */
export class PublicationType extends ValueObject<{ value: "problem" | "idea" }> {
  private constructor(value: "problem" | "idea") {
    super({ value });
  }

  public static problem(): PublicationType {
    return new PublicationType("problem");
  }

  public static idea(): PublicationType {
    return new PublicationType("idea");
  }

  public static create(raw: string): PublicationType {
    if (raw === "problem" || raw === "idea") {
      return new PublicationType(raw);
    }
    throw new Error("tipo de publicação inválido: use problem ou idea");
  }

  public get value(): "problem" | "idea" {
    return this.props.value;
  }

  /** Rótulo em português para a interface. */
  public get label(): string {
    return this.props.value === "problem" ? "Problema" : "Ideia";
  }

  protected equalsTo(other: { value: "problem" | "idea" }): boolean {
    return this.props.value === other.value;
  }
}
