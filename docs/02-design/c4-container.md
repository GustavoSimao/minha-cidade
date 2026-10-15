# C4 — Nível 2: Containers

Containers técnicos e suas responsabilidades. Cada bounded context (D5) vive como pasta
em `apps/web/src/contexts/<ctx>` e como schema no Postgres (D6).

```text
┌──────────────────────────── Vercel ─────────────────────────────┐
│                                                                │
│  ┌──────────────────────┐        ┌──────────────────────────┐   │
│  │  Next.js (App Router)│        │  Service Worker / PWA    │   │
│  │  React 19 + TS       │        │  cache do shell + feed   │   │
│  └──────────┬───────────┘        └──────────────────────────┘   │
│             │                                                  │
│   src/contexts/…         src/app/ (rotas e páginas)            │
│   ├─ identity            / /login /cadastro                    │
│   ├─ geography            /perfil/{username} /perfil/editar   │
│   ├─ publication          / (feed) /publicar /publicacoes/      │
│   ├─ engagement           /#comentarios (reação/comentário)     │
│   ├─ social_graph         /amigos /solicitacoes               │
│   ├─ moderation           /admin/denuncias                    │
│   ├─ notification         sininho + /notificacoes             │
│   └─ analytics            /transparencia                      │
│                                                                │
│   src/shared/kernel (Entity, ValueObject, Identifier, Result)  │
└────────────────────────────┬───────────────────────────────────┘
                             │ supabase-js
        ┌────────────────────┴─────────────────────┐
        │                Supabase                  │
        │  Auth · Postgres(RLS) · Storage · Realtime│
        │  pg_cron (métricas diárias)               │
        └────────────────────┬─────────────────────┘
                             │ leitura (pooler)
                    ┌────────┴─────────┐
                    │ Streamlit (Python)│  analytics público agregado
                    └──────────────────┘
```

## Containers

| Container | Tecnologia | Responsabilidade | Não faz |
|---|---|---|---|
| App web | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 | UI, rotas, casos de uso no servidor, RSC | Não concentra regra de negócio em componente de tela |
| PWA | manifest + service worker | instalação, cache do shell e do feed visitado | Não persiste dados sensíveis |
| Postgres | Supabase Postgres 17 | persistência, invariantes, RLS, métricas | Não é acessado diretamente pelo browser além das políticas RLS |
| Auth | Supabase Auth | cadastro/login Google + e-mail/senha, JWT | Não guarda perfil de produto (fica em `identity.profiles`) |
| Storage | Supabase Storage | avatares, capas, mídia de publicações | Não é servido pelo domínio do app |
| Realtime | Supabase Realtime | contadores, comentários, notificações | Não substitui persistência |
| pg_cron | Postgres | refresh das métricas diárias | Não regra de negócio |
| Analytics | Python (pandas/Streamlit) + GitHub Actions | ETL, snapshots, dashboards | Não escreve em schemas de negócio |

## Fronteiras de comunicação

- Browser → Postgres: **somente leitura pública** e **assinaturas Realtime**, sempre via
  `anon key` e RLS.
- Browser → app (Next.js): todas as escritas, via Route Handlers / Server Actions que
  chamam casos de uso (D8).
- App → Postgres: `service_role` apenas em código de servidor; RLS continua ativa.
- Entre contextos: eventos de domínio em `shared.domain_events` (D7), nunca JOIN entre
  schemas de contextos diferentes.
- Analytics: leitura read-only via pooler; escrita apenas no schema `analytics`.
