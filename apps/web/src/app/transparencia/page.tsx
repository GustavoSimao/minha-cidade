import type { Metadata } from "next";
import Link from "next/link";

import { GetTransparencyMetrics } from "@/contexts/analytics/application/use-cases";
import type { DailyMetricsRow } from "@/contexts/analytics/application/ports";
import { SupabaseAnalyticsRepository } from "@/contexts/analytics/infrastructure/supabase/analytics-repository";
import { TransparencyCharts } from "@/shared/ui/analytics/transparency-charts";
import { EmptyState } from "@/shared/ui/empty-state";
import { Icon } from "@/shared/ui/icon";

export const metadata: Metadata = {
  title: "Transparência",
  description:
    "Números públicos e agregados do seu bairro e da sua cidade, sem dado pessoal de ninguém.",
};

export const instant = false;

const WINDOW_DAYS = 14;

function sum(rows: DailyMetricsRow[], pick: (row: DailyMetricsRow) => number): number {
  return rows.reduce((total, row) => total + pick(row), 0);
}

/** Métricas agregadas de snapshots diários, sem texto nem dados pessoais. */
export default async function TransparencyPage() {
  const rows = await new GetTransparencyMetrics(new SupabaseAnalyticsRepository()).execute(
    WINDOW_DAYS,
  );

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-text-strong">Transparência</h1>
        <p className="mt-1 text-sm text-text-muted">
          Números públicos do bairro e da cidade, sempre agregados e sem dados pessoais.
        </p>

        <div className="mt-6">
          <EmptyState
            description="Os snapshots diários ainda não foram gerados. Eles são atualizados uma vez por dia."
            icon={<Icon name="chart" className="h-8 w-8" />}
            title="Sem números consolidados ainda"
          />
        </div>

        <Link
          className="mt-4 inline-flex min-h-11 items-center rounded-button bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          href="/"
        >
          Ver o feed do bairro
        </Link>
      </div>
    );
  }

  const totals = {
    publications:
      sum(rows, (row) => row.publicationsProblem) + sum(rows, (row) => row.publicationsIdea),
    anonymous: sum(rows, (row) => row.publicationsAnonymous),
    comments: sum(rows, (row) => row.comments),
    supports: sum(rows, (row) => row.supports),
    opposes: sum(rows, (row) => row.opposes),
    reports: sum(rows, (row) => row.reports),
    moderationActions:
      sum(rows, (row) => row.moderationHidden) + sum(rows, (row) => row.moderationRemoved),
    newUsers: sum(rows, (row) => row.newUsers),
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-text-strong">Transparência</h1>
      <p className="mt-1 text-sm text-text-muted">
        Números públicos dos últimos {WINDOW_DAYS} dias, sempre agregados e sem dados pessoais.
        {refreshedAt ? ` Atualizado em ${refreshedAt}.` : ""}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <article
            className="rounded-card border border-border-subtle bg-surface-raised p-4 shadow-stamp"
            key={card.label}
          >
            <p className="font-display text-2xl font-bold text-text-strong">{card.value}</p>
            <p className="mt-1 text-xs text-text-muted">{card.label}</p>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <TransparencyCharts rows={rows} />
      </div>

      <p className="mt-6 text-sm leading-6 text-text-muted">
        Os snapshots são gerados diariamente a partir de contagens agregadas de publicações,
        comentários, denúncias e contas. Nenhum texto de publicação ou dado pessoal é exibido.
      </p>

      <Link
        className="mt-4 inline-flex min-h-11 items-center rounded-button bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        href="/"
      >
        Ver o feed do bairro
      </Link>
    </div>
  );
}
