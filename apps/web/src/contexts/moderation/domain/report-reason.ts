import { ValueObject } from "@/shared/kernel/value-object";

/** Tipos de conteúdo denunciável (M3). */
export type ReportableType = "publication" | "comment";

/** Motivos fechados de denúncia (M3). */
export type ReportReasonKind =
  | "spam"
  | "discurso_odio"
  | "informacao_falsa"
  | "conteudo_ilegal"
  | "assedio"
  | "outro";

/** Motivo da denúncia: conjunto fechado (invariante M3). */
export class ReportReason extends ValueObject<{ value: ReportReasonKind }> {
  private static readonly ALL: readonly ReportReasonKind[] = [
    "spam",
    "discurso_odio",
    "informacao_falsa",
    "conteudo_ilegal",
    "assedio",
    "outro",
  ];

  private constructor(value: ReportReasonKind) {
    super({ value });
  }

  public static create(raw: string): ReportReason {
    if (!ReportReason.ALL.includes(raw as ReportReasonKind)) {
      throw new Error("motivo de denúncia inválido");
    }

    return new ReportReason(raw as ReportReasonKind);
  }

  public static list(): readonly ReportReasonKind[] {
    return ReportReason.ALL;
  }

  public get value(): ReportReasonKind {
    return this.props.value;
  }

  /** Rótulo em português para a interface. */
  public get label(): string {
    const labels: Record<ReportReasonKind, string> = {
      spam: "Spam ou propaganda",
      discurso_odio: "Discurso de ódio",
      informacao_falsa: "Informação falsa",
      conteudo_ilegal: "Conteúdo ilegal",
      assedio: "Assédio ou ameaça",
      outro: "Outro",
    };

    return labels[this.props.value];
  }

  protected equalsTo(other: { value: ReportReasonKind }): boolean {
    return this.props.value === other.value;
  }
}

/** Ação aplicada pela moderação (M5). */
export type ModerationActionKind = "hide" | "restore" | "remove";

/** Papel necessário por ação (M5: remover é exclusivo do admin). */
export class ModerationAction extends ValueObject<{ value: ModerationActionKind }> {
  private static readonly ALL: readonly ModerationActionKind[] = [
    "hide",
    "restore",
    "remove",
  ];

  private constructor(value: ModerationActionKind) {
    super({ value });
  }

  public static create(raw: string): ModerationAction {
    if (!ModerationAction.ALL.includes(raw as ModerationActionKind)) {
      throw new Error("ação de moderação inválida");
    }

    return new ModerationAction(raw as ModerationActionKind);
  }

  public get value(): ModerationActionKind {
    return this.props.value;
  }

  /** Papel mínimo exigido (M5). */
  public get requiredRole(): "moderator" | "admin" {
    return this.props.value === "remove" ? "admin" : "moderator";
  }

  /** Rótulo em português para a interface. */
  public get label(): string {
    const labels: Record<ModerationActionKind, string> = {
      hide: "Ocultar",
      restore: "Restaurar",
      remove: "Remover",
    };

    return labels[this.props.value];
  }

  protected equalsTo(other: { value: ModerationActionKind }): boolean {
    return this.props.value === other.value;
  }
}
