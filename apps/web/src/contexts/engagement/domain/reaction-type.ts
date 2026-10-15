import { ValueObject } from "@/shared/kernel/value-object";

/** Tipos de reação (MVP): apoio ou oposição — uma por usuário/publicação (E1). */
export type ReactionKind = "support" | "oppose";

/** Tipo de reação: valor do domínio, validado (invariante E1 da spec). */
export class ReactionType extends ValueObject<{ value: ReactionKind }> {
  private constructor(value: ReactionKind) {
    super({ value });
  }

  public static create(raw: string): ReactionType {
    if (raw !== "support" && raw !== "oppose") {
      throw new Error("reação deve ser 'support' ou 'oppose'");
    }

    return new ReactionType(raw);
  }

  public get value(): ReactionKind {
    return this.props.value;
  }

  /** Rótulo em português para a interface. */
  public get label(): string {
    return this.props.value === "support" ? "Apoio" : "Oposição";
  }

  public equalsType(other: ReactionType): boolean {
    return this.props.value === other.props.value;
  }

  protected equalsTo(other: { value: ReactionKind }): boolean {
    return this.props.value === other.value;
  }
}
