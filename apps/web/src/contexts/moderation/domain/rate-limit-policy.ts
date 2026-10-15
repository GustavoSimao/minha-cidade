import { ValueObject } from "@/shared/kernel/value-object";
import type { RateLimitSubject } from "../application/ports";

/** Escopos com limite de uso (P16/M9). */
export type RateLimitScope = "publication" | "comment" | "report";

/** Janela de contagem: hora ou dia (início truncado). */
export type RateLimitWindow = "hour" | "day";

/** Teto por usuário de cada escopo/janela (P16). */
export const RATE_LIMITS: Record<
  RateLimitScope,
  { window: RateLimitWindow; limit: number; label: string }
> = {
  publication: { window: "hour", limit: 5, label: "5 publicações por hora" },
  comment: { window: "hour", limit: 20, label: "20 comentários por hora" },
  report: { window: "day", limit: 10, label: "10 denúncias por dia" },
};

/**
 * Teto **por IP** (B4/ADR-0017): coleta abuso de contas múltiplas no mesmo
 * endereço. Só existe o de publicação; sem proxy confiável não é aplicado.
 */
export const IP_RATE_LIMITS: Partial<
  Record<RateLimitScope, { window: RateLimitWindow; limit: number; label: string }>
> = {
  publication: { window: "hour", limit: 30, label: "30 publicações por hora por IP" },
};

/** Sujeito padrão (usuário autenticado) a partir da sessão. */
export function userSubject(userId: string): RateLimitSubject {
  return { type: "user", id: userId };
}

/** Sujeito de IP (B4) — só usado quando o proxy é confiável. */
export function ipSubject(ip: string): RateLimitSubject {
  return { type: "ip", id: ip };
}

/** Limite diário de publicações (P16) — segunda janela do mesmo escopo. */
export const DAILY_PUBLICATION_LIMIT = 20;

/**
 * Política de limite: calcula o início da janela (hora cheia / dia UTC) e
 * informa se a ação cabe no teto (invariante M9).
 */
export class RateLimitPolicy extends ValueObject<{
  scope: RateLimitScope;
  window: RateLimitWindow;
  limit: number;
  byIp: boolean;
}> {
  private constructor(params: {
    scope: RateLimitScope;
    window: RateLimitWindow;
    limit: number;
    byIp: boolean;
  }) {
    super(params);
  }

  public static of(scope: RateLimitScope, window?: RateLimitWindow): RateLimitPolicy {
    const config = RATE_LIMITS[scope];
    const chosenWindow = window ?? config.window;
    const limit =
      chosenWindow === "day" && scope === "publication"
        ? DAILY_PUBLICATION_LIMIT
        : config.limit;

    return new RateLimitPolicy({ scope, window: chosenWindow, limit, byIp: false });
  }

  /** Política equivalente para o sujeito IP (B4) — null quando o escopo não tem teto por IP. */
  public static ipOf(scope: RateLimitScope): RateLimitPolicy | null {
    const config = IP_RATE_LIMITS[scope];

    if (!config) {
      return null;
    }

    return new RateLimitPolicy({
      scope,
      window: config.window,
      limit: config.limit,
      byIp: true,
    });
  }

  public get scope(): RateLimitScope {
    return this.props.scope;
  }

  public get window(): RateLimitWindow {
    return this.props.window;
  }

  public get limit(): number {
    return this.props.limit;
  }

  /** Início da janela que contém `now` (hora cheia ou meia-noite UTC). */
  public windowStart(now: Date): Date {
    const reference = new Date(now);

    if (this.props.window === "day") {
      reference.setUTCHours(0, 0, 0, 0);

      return reference;
    }

    reference.setUTCMinutes(0, 0, 0);

    return reference;
  }

  /** true quando a contagem já está no teto (a ação não pode acontecer). */
  public isExceeded(count: number): boolean {
    return count >= this.props.limit;
  }

  /** Mensagem amigável para a interface. */
  public get message(): string {
    const unit = this.props.window === "day" ? "por dia" : "por hora";
    const noun =
      this.props.scope === "publication"
        ? "publicações"
        : this.props.scope === "comment"
          ? "comentários"
          : "denúncias";
    const suffix = this.props.byIp ? " por IP" : "";

    return `Limite atingido: no máximo ${this.props.limit} ${noun} ${unit}${suffix}.`;
  }

  protected equalsTo(other: {
    scope: RateLimitScope;
    window: RateLimitWindow;
    limit: number;
    byIp: boolean;
  }): boolean {
    return (
      this.props.scope === other.scope &&
      this.props.window === other.window &&
      this.props.limit === other.limit &&
      this.props.byIp === other.byIp
    );
  }
}
