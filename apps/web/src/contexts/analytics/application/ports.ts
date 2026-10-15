/**
 * Porta de persistência do contexto Analytics (D6).
 * Só leitura: os snapshots são escritos pelo job pg_cron (ETL interno).
 */
export interface AnalyticsRepository {
  /** Snapshot diário mais recente primeiro (limite em dias). */
  listDailyMetrics(days: number): Promise<DailyMetricsRow[]>;
}

/** Linha de `analytics.daily_metrics` — só contagens (T1/T2 do spec). */
export interface DailyMetricsRow {
  day: string;
  publicationsProblem: number;
  publicationsIdea: number;
  publicationsAnonymous: number;
  activeAuthors: number;
  supports: number;
  opposes: number;
  comments: number;
  reports: number;
  moderationHidden: number;
  moderationRemoved: number;
  newUsers: number;
  refreshedAt: Date;
}

/** Totais do período exibido em `/transparencia` (derivado na aplicação). */
export interface TransparencySummary {
  publications: number;
  anonymousShare: number;
  comments: number;
  supports: number;
  opposes: number;
  reports: number;
  moderationActions: number;
  newUsers: number;
}
