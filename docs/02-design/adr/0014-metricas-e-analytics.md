# ADR-0014 — Métricas no Postgres, página Transparência no app e repo Python separado

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D14

## Contexto
O dono do produto quer análise de dados, dashboards e portfólio. A dúvida era se o produto
deveria ser todo em Python (Django) ou manter TypeScript no app e Python na camada de dados.

## Decisão
Modelo **híbrido**:
- Métricas diárias materializadas no Postgres (`analytics_metrics.daily_metrics`),
  atualizadas por **pg_cron** (fallback: GitHub Actions/Vercel Cron em rota admin).
- Página pública **`/transparencia`** no app, com gráficos simples alimentados por função
  SQL read-only.
- **Repo Python separado** (`minha-cidade-analytics`): pandas + SQLAlchemy + Jupyter, ETL
  agendado gravando snapshots no schema `analytics`, dashboards em **Streamlit Community
  Cloud** com dados agregados e anonimizados.

## Consequências
- Produto rápido e nativo do stack (TS) sem pagar o custo de Python no request path.
- Portfólio em dados forte: análises reproduzíveis + dashboard online.
- Dashboard público nunca lê dado pessoal nem texto de posts (regra dura).
- pg_cron pode não estar disponível em todos os planos — fallback já previsto.
