# Contexto: Analytics (snapshots para a transparência)

> **Status:** implementado na Fase 10 (`analytics.daily_metrics`, job pg_cron,
> página `/transparencia`). Fonte: `.kilo/plans/1791856023122-lancamento-local-e-b2g.md` (B3).

## 1. Histórias de usuário

- **Como cidadã**, quero ver números públicos e agregados do meu bairro e da minha
  cidade (volume de publicações, comentários, denúncias, ações de moderação), para
  acompanhar a participação sem depender de terceiros.
- **Como administradora**, quero conferir esses números contra o banco, para provar
  que a página de transparência não inventa dado.

## 2. Decisões herdadas

- **T1 (snapshot, não streaming):** os números são materializados uma vez por dia.
  A página lê o snapshot — não consulta tabelas de produção em cada visita.
- **T2 (nenhum dado pessoal):** a tabela tem só contagens. Nenhuma coluna guarda
  usuário, texto de publicação ou bairro individual. `active_authors` é uma
  **contagem distinta de autores no dia**, nunca uma lista.
- **T3 (fonte conferível):** cada métrica corresponde a uma consulta simples que o
  admin pode rodar à mão (as funções do schema `analytics`).

## 3. Regras de integração (D6/D7)

- O schema é `analytics` (D6: um schema por bounded context).
- **Nenhum JOIN entre schemas (D7):** cada função de agregação lê apenas o(s)
  schema(s) do seu próprio contexto (`publication`, `engagement`, `moderation`,
  `identity`) e devolve números. O refresh chama as quatro e grava o snapshot.
- As funções são `SECURITY DEFINER`: o job pg_cron e o `service_role` executam sem
  precisar de acesso direto aos schemas dos contextos.
- A leitura pela API é pública (RLS: `select` para `anon`/`authenticated`).

## 4. Modelo de domínio

**Snapshot diário** (`analytics.daily_metrics`):

| Coluna | Origem |
|---|---|
| `day` (PK) | dia do snapshot (UTC) |
| `publications_problem` | `publication.publications` do tipo `problem`, não removidas |
| `publications_idea` | `publication.publications` do tipo `idea`, não removidas |
| `publications_anonymous` | publicações marcadas anônimas no dia |
| `active_authors` | autores distintos de publicações do dia |
| `supports` / `opposes` | `engagement.reactions` por tipo |
| `comments` | `engagement.comments` vivos (não removidos) |
| `reports` | `moderation.reports` criados no dia |
| `moderation_hidden` | ações `hide` na trilha de moderação |
| `moderation_removed` | ações `remove` na trilha de moderação |
| `new_users` | `identity.profiles` criados no dia |
| `refreshed_at` | quando o snapshot foi (re)gerado |

Funções (todas `security definer`, `search_path = ''`):

- `analytics.daily_publication_counts(day)` — lê `publication.publications`.
- `analytics.daily_engagement_counts(day)` — lê `engagement.reactions`/`comments`.
- `analytics.daily_moderation_counts(day)` — lê `moderation.reports`/`moderation_actions`.
- `analytics.daily_identity_counts(day)` — lê `identity.profiles`.
- `analytics.refresh_daily_metrics(day)` — chama as quatro, faz upsert (idempotente).

## 5. Regras de aplicação

- **Refresh diário** pelo pg_cron (`analytics-daily-refresh`, 03:20 UTC) consolida o
  dia anterior. Rodar de novo no mesmo dia só atualiza os números (upsert por `day`).
- **Backfill:** o seed local (`supabase/seed/03-dev-seed.sql`) consolida os últimos
  14 dias para a página ter número em desenvolvimento. Em produção o histórico vem
  do próprio job (dia a dia).
- **Nada de texto:** a leitura na aplicação (`GetTransparencyMetrics`) devolve linhas
  do snapshot; a página `/transparencia` só soma e plota.

## 6. Regras de interface

- `/transparencia` (pública): cards de totais da janela (14 dias), gráfico de
  publicações por dia (problema x ideia) e gráfico de denúncias x ações de
  moderação. Recharts no cliente; os dados vêm do servidor.
- Snapshot vazio (banco novo, job ainda não rodou): estado vazio honesto, sem
  número inventado.

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select` em `daily_metrics` | `anon`, `authenticated` (dado público — P20) |
| `insert`/`update` em `daily_metrics` | **nenhum via API** — só as funções definer (job/service_role) |
| `usage` no schema | `anon`, `authenticated` (leitura); `service_role` (funções) |

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| GET | `/transparencia` | — | cards + gráficos (agregados) |
| GET | `analytics.daily_metrics` (via PostgREST, `Accept-Profile: analytics`) | — | últimas N linhas do snapshot |

Eventos no outbox: nenhum — o contexto consome o estado dos outros contextos.

## 9. Testes derivados

- **Unit:** `GetTransparencyMetrics` devolve a janela pedida (com e sem linhas).
- **E2E:** `/transparencia` carrega pública, mostra os cards, os gráficos e **não**
  expõe e-mail/username/texto de publicação; snapshot vazio mostra o estado vazio.

## 10. Ambiente (Supabase)

`analytics` entra em `schemas`/`extra_search_path` do `supabase/config.toml`.
Como o PostgREST recusa carregar sem o schema existir, a ordem para adicionar é:
`supabase stop` → somar o schema nas duas listas → `supabase start` → `supabase db reset`.
Na stack local o pg_cron roda com o container do banco; em produção o job é
configurado no Postgres gerenciado (ver `docs/deploy-checklist.md`).
