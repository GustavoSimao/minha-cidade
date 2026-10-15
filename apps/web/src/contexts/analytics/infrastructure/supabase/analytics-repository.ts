import { createClient, table } from "@/shared/infrastructure/supabase";
import type { AnalyticsRepository, DailyMetricsRow } from "@/contexts/analytics/application/ports";

/** Linha como vem do banco (snake_case). */
interface DailyMetricsDbRow {
  day: string;
  publications_problem: number;
  publications_idea: number;
  publications_anonymous: number;
  active_authors: number;
  supports: number;
  opposes: number;
  comments: number;
  reports: number;
  moderation_hidden: number;
  moderation_removed: number;
  new_users: number;
  refreshed_at: string;
}

/** Repositório de snapshots em Supabase/Postgres (leitura pública — RLS). */
export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  async listDailyMetrics(days: number): Promise<DailyMetricsRow[]> {
    const limit = Math.min(Math.max(days, 1), 90);
    const supabase = await createClient();

    const { data, error } = await table(supabase, "analytics.daily_metrics")
      .select("*")
      .order("day", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`falha ao buscar métricas: ${error.message}`);
    }

    return ((data ?? []) as unknown as DailyMetricsDbRow[]).map((row) => ({
      day: row.day,
      publicationsProblem: row.publications_problem,
      publicationsIdea: row.publications_idea,
      publicationsAnonymous: row.publications_anonymous,
      activeAuthors: row.active_authors,
      supports: row.supports,
      opposes: row.opposes,
      comments: row.comments,
      reports: row.reports,
      moderationHidden: row.moderation_hidden,
      moderationRemoved: row.moderation_removed,
      newUsers: row.new_users,
      refreshedAt: new Date(row.refreshed_at),
    }));
  }
}
