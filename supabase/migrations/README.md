# Migrations do banco

Regras (fonte: `docs/03-data/convencoes-schema.md`):

- Um arquivo por mudança, nome `YYYYMMDDHHMMSS_<contexto>_<descricao>.sql`.
- Sempre aditiva; `down` documentado em comentário quando viável.
- Nenhuma tabela fora do schema do seu contexto; nenhuma FK cross-schema (ADR-0007).
- RLS habilitada e políticas escritas na migration (e na spec do contexto).

Ordem de aplicação por fase do plano:

| Fase | Migration | Conteúdo |
|---|---|---|
| 2 | `..._identity_create_schema.sql` | schema, `identity.profiles`, trigger em `auth.users`, RLS |
| 3 | `..._geography_create_schema.sql` | schema, `cities`, `neighborhoods`, RLS + seed IBGE |
| 4 | `..._publication_create_schema.sql` | `publications`, `publication_media`, `events` (v2), RLS |
| 5 | `..._engagement_create_schema.sql` | `reactions`, `comments`, `bookmarks`, RLS |
| 6 | `..._social_graph_create_schema.sql` | `friendships`, constraint anti-duplicata, RLS |
| 7 | `..._moderation_create_schema.sql` | `reports`, `moderation_actions`, papéis, RLS |
| 8 | `..._notification_create_schema.sql` | `notifications`, RLS |
| 10 | `..._analytics_create_schema.sql` | `analytics_metrics.daily_metrics`, `analytics.snapshots`, pg_cron |

A Fase 9 (PWA) e a Fase 11 (repo Python) não criam migrations de negócio.
