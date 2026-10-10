# ADR-0002 — Supabase como backend (Postgres, Auth, Storage, Realtime, pg_cron)

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D2

## Contexto
O sistema anterior era um monólito Laravel com módulos locais, sem RLS, sem camada de dados
e sem backend gerenciado. Precisávamos de banco, autenticação, storage de imagens, realtime
e agendamento sem operar servidores.

## Decisão
Usar **Supabase** como backend: Postgres (com **RLS ativa**), Auth (Google + e-mail/senha),
Storage, Realtime e pg_cron. O app nunca fala com o banco sem passar por RLS.

## Consequências
- Zero servidor de aplicação tradicional para operar; escalabilidade gerenciada.
- Regras de acesso expressas em SQL (RLS) — poderoso, mas exige testes negativos por tabela.
- Dependência de fornecedor para Auth/Storage; mitigações: dados no Postgres acessível via
  `DATABASE_URL` e schema versionado em `supabase/migrations`.
- `service_role` só em código de servidor, nunca no browser.
