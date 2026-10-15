"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyMetricsRow } from "@/contexts/analytics/application/ports";

const BRAND = "#1e5b45";
const WARNING = "#8a5a00";
const DANGER = "#b3261e";

function formatDay(day: string): string {
  // `day` é uma data ISO (yyyy-mm-dd); formatar em pt-BR sem depender de locale.
  const [, month, date] = day.split("-");

  return `${date}/${month}`;
}

/**
 * Gráficos da transparência (P20): publicações por dia (problema x ideia) e
 * a relação denúncias x ações de moderação. Só contagens agregadas — nunca
 * texto de publicação nem informação de quem publicou.
 */
export function TransparencyCharts({ rows }: { rows: DailyMetricsRow[] }) {
  // Mais antigo primeiro: gráfico lê da esquerda para a direita.
  const data = [...rows].reverse().map((row) => ({
    day: formatDay(row.day),
    problemas: row.publicationsProblem,
    ideias: row.publicationsIdea,
    denuncias: row.reports,
    acoes: row.moderationHidden + row.moderationRemoved,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-card border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-base font-semibold text-text-strong">
          Publicações por dia
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          Volume diário por tipo (problema ou ideia).
        </p>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e2e2de" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" fontSize={12} stroke="#6b6b66" />
              <YAxis allowDecimals={false} fontSize={12} stroke="#6b6b66" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--color-border-subtle)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="problemas" fill={BRAND} name="Problemas" radius={[4, 4, 0, 0]} stackId="p" />
              <Bar dataKey="ideias" fill="#7fb3a1" name="Ideias" radius={[4, 4, 0, 0]} stackId="p" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-card border border-border-subtle bg-surface-raised p-4">
        <h3 className="text-base font-semibold text-text-strong">
          Denúncias e ações de moderação
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          Denúncias recebidas e ações aplicadas (ocultar/remover) por dia.
        </p>
        <div className="mt-4 h-64">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#e2e2de" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" fontSize={12} stroke="#6b6b66" />
              <YAxis allowDecimals={false} fontSize={12} stroke="#6b6b66" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--color-border-subtle)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                dataKey="denuncias"
                name="Denúncias"
                stroke={WARNING}
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="acoes"
                name="Ações de moderação"
                stroke={DANGER}
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
