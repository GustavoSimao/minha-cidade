import type { Metadata } from "next";
import Link from "next/link";

import { GetTransparencyMetrics } from "@/contexts/analytics/application/use-cases";
import type { DailyMetricsRow } from "@/contexts/analytics/application/ports";
import { SupabaseAnalyticsRepository } from "@/contexts/analytics/infrastructure/supabase/analytics-repository";
import { TransparencyCharts } from "@/shared/ui/analytics/transparency-charts";
import { EmptyState } from "@/shared/ui/empty-state";
import { ChartIcon } from "@/shared/ui/icon";

export const metadata: Metadata = {
  title: "Transparência",
  description:
    "Números públicos e agregados do seu bairro e da sua cidade, sem dado pessoal de ninguém.",
};

// Página pública: leitura anônima do banco a cada requisição.
export const instant = false;

/** Janela exibida (dias). */
const WINDOW_DAYS = 14;

/** Soma dos valores do período. */
function sum(rows: DailyMetricsRow[], pick: (row: DailyMetricsRow) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

/**
 * Transparência (P20) — Fase 10.
 *
 * Os números vêm dos snapshots diários (`analytics.daily_metrics`), gerados pelo
 * job pg_cron a partir das contagens de cada contexto. Não há texto de
 * publicação nem informação de quem publicou: só agregados.
 */
export default async function TransparencyPage() {
  const rows = await new GetTransparencyMetrics(new SupabaseAnalyticsRepository()).execute(
    WINDOW_DAYS,
  );

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-text-strong">Transparência</h1>
        <p className="mt-1 text-sm text-text-muted">
          Números públicos do bairro e da cidade — sempre agregados, sem dado pessoal.
        </p>

        <div className="mt-6">
          <EmptyState
            description="Os snapshots diários ainda não foram gerados. O job roda uma vez por dia (pg_cron) e leva alguns minutos para o primeiro número aparecer."
            icon={<ChartIcon className="h-8 w-8" />}
            title="Sem números consolidados ainda"
          />
        </div>

        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
          href="/"
        >
          Ver o feed do bairro
        </Link>
      </div>
    );
  }

  const totals = {
    publications:
      sum(rows, (r) => r.publicationsProblem) + sum(rows, (r) => r.publicationsIdea),
    anonymous: sum(rows, (r) => r.publicationsAnonymous),
    comments: sum(rows, (r) => r.comments),
    supports: sum(rows, (r) => r.supports),
    opposes: sum(rows, (r) => r.opposes),
    reports: sum(rows, (r) => r.reports),
    moderationActions:
      sum(rows, (r) => r.moderationHidden) + sum(rows, (r) => r.moderationRemoved),
    newUsers: sum(rows, (r) => r.newUsers),
  };

  const refreshedAt = rows[0]?.refreshedAt.toLocaleString("pt-BR") ?? "";

  const cards = [
    { label: "Publicações", value: totals.publications },
    { label: "Publicações anônimas", value: totals.anonymous },
    { label: "Comentários", value: totals.comments },
    { label: "Apoios", value: totals.supports },
    { label: "Oposições", value: totals.opposes },
    { label: "Denúncias", value: totals.reports },
    { label: "Ações de moderação", value: totals.moderationActions },
    { label: "Contas criadas", value: totals.newUsers },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-text-strong">Transparência</h1>
      <p className="mt-1 text-sm text-text-muted">
        Números públicos dos últimos {WINDOW_DAYS} dias — sempre agregados, sem dado
        pessoal. Atualizado em {refreshedAt}.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            className="rounded-card border border-border-subtle bg-surface-raised p-3"
            key={card.label}
          >
            <p className="text-2xl font-bold text-text-strong">{card.value}</p>
            <p className="mt-1 text-xs text-text-muted">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <TransparencyCharts rows={rows} />
      </div>

      <p className="mt-6 text-sm text-text-muted">
        Os snapshots são gerados diariamente a partir das contagens de cada área
        (publicações, comentários, denúncias e contas). Não há texto de publicação nem
        informação de quem publicou — só totais.
      </p>

      <Link
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
        href="/"
      >
        Ver o feed do bairro
      </Link>
    </div>
  );
}
