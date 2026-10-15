import type { AnalyticsRepository, DailyMetricsRow } from "./ports";

/**
 * Transparência (P20): lê os snapshots diários materializados e devolve o
 * período pedido (mais recente primeiro). Página pública — sem sessão.
 */
export class GetTransparencyMetrics {
  constructor(private readonly metrics: AnalyticsRepository) {}

  public async execute(days = 30): Promise<DailyMetricsRow[]> {
    return this.metrics.listDailyMetrics(days);
  }
}
