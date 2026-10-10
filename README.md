# Minha Cidade

Plataforma de participação cidadã: moradores publicam problemas e ideias do seu bairro,
recebem apoio dos vizinhos, comentam e se conectam — usável no celular e no PC, sem
instalar aplicativo de loja.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 na Vercel;
Supabase (Postgres com RLS, Auth, Storage, Realtime, pg_cron) no backend; PWA instalável.
Camada de dados/analytics em repositório Python separado.

**Arquitetura:** DDD com bounded contexts — um schema Postgres e uma pasta de código por
contexto; documentação em `docs/` é a fonte da verdade.

> Status atual: **Fase 1 concluída** (fundação do repo + documentos de produto, processo,
> design e dados aprovados para revisão). As Fases 2+ implementam um bounded context por
> vez, sempre spec → migration → domínio → aplicação → infraestrutura → tela → teste.

## Documentação (fonte da verdade)

| Pasta | Conteúdo |
|---|---|
| [`docs/plano-reescrita-ddd.md`](docs/plano-reescrita-ddd.md) | plano completo, decisões D1–D15, fases 0–12 e schema de referência |
| [`docs/00-product/`](docs/00-product) | PRD do MVP e personas |
| [`docs/01-process/`](docs/01-process) | workflow spec→código→teste e Definition of Done |
| [`docs/02-design/`](docs/02-design) | C4 (contexto e containers), design system e ADRs |
| [`docs/03-data/`](docs/03-data) | convenções de schema, política de RLS, catálogo IBGE, dicionário de dados |
| [`docs/04-contexts/`](docs/04-contexts) | template e specs por bounded context |

## Estrutura

```text
apps/web/                  app Next.js
  src/contexts/<ctx>/      domain / application / infrastructure / interfaces
  src/shared/kernel/       Entity, ValueObject, Identifier, Result, DomainEvent
  src/shared/ui/           componentes de interface (form, avatar, badge, cabeçalho)
  src/app/                 rotas e páginas (App Router)
  src/proxy.ts             renovação de sessão e proteção de rotas (substitui middleware)
  **/*.test.ts             testes de unidade de domínio (vitest), junto do código
supabase/
  config.toml              configuração do Supabase CLI (schemas por contexto)
  migrations/              migrations SQL por contexto
  seed/                    seed idempotente (IBGE + desenvolvimento)
tests/e2e/                 testes Playwright (viewports mobile/desktop) — criados na Fase 9
.github/workflows/ci.yml   lint, typecheck, testes de unidade e build
docs/                      fonte da verdade (ver acima)
```

## Rotas implementadas

| Rota | O que faz |
|---|---|
| `/` | página inicial com chamada para entrar/cadastrar (sessão em streaming) |
| `/feed` | placeholder do feed (implementado na Fase 4) |
| `/login`, `/cadastro` | entrar e cadastrar (Google ou e-mail/senha, com aceite dos termos) |
| `/auth/callback` | callback do OAuth do Google |
| `/perfil/{username}` | perfil público (projeção sem e-mail/telefone) |
| `/perfil/editar` | editar o próprio perfil (com seletor cidade → bairro) e encerrar conta |
| `/api/geography/cities` | busca de cidades do catálogo IBGE (leitura pública) |
| `/api/geography/neighborhoods` | bairros de uma cidade (leitura pública) |
| `/termos`, `/privacidade` | mínimo legal (P22) |
| `/transparencia` | placeholder de métricas (implementado na Fase 10) |

## Como rodar

```bash
# 1. Dependências
npm install --prefix apps/web

# 2. Variáveis de ambiente
cp .env.example apps/web/.env.local   # preencher com os dados do painel Supabase

# 3. App
npm run dev --prefix apps/web         # http://localhost:3000

# 4. Qualidade
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run test --prefix apps/web
npm run build --prefix apps/web
```

## Configuração do Supabase (manual, uma vez)

1. Criar projeto em <https://supabase.com/dashboard> (Postgres 17).
2. Aplicar as migrations na ordem: rodar
   `supabase/migrations/20261010000001_identity_create_profiles.sql` e
   `supabase/migrations/20261011000002_geography_create_cities_neighborhoods.sql`
   no SQL Editor (ou `supabase db push` com a CLI). A primeira cria os schemas
   `shared`/`identity`, a tabela `identity.profiles`, os triggers e as políticas RLS;
   a segunda cria o schema `geography` (cidades e bairros) e as FKs de localização em
   `identity.profiles`. Os demais schemas chegam nas Fases 4+.
3. Em **Authentication → Providers**, ativar Google (preencher Client ID/Secret do Google
   Cloud) e manter e-mail/senha com confirmação ativa.
4. Em **Authentication → URL Configuration**, adicionar
   `http://localhost:3000/auth/callback` (e o domínio final em produção) como redirect.
5. Em **Storage**, criar os buckets `avatars`, `covers` e `publication-media`.
6. Copiar `Project URL`, `anon key` e `service_role key` para `apps/web/.env.local`.
7. Rodar os seeds em `supabase/seed/` (ordem em `supabase/seed/README.md`):
   `ibge-localidades.sql` (5.571 municípios IBGE) e `bairros-cariacica.sql`
   (100 bairros de Cariacica/ES, fonte oficial LC 171/2025).

## Deploy (Vercel)

1. Importar o repositório em <https://vercel.com/new> com **Root Directory = `apps/web`**.
2. Variáveis de ambiente de produção: as mesmas de `.env.local`, com
   `NEXT_PUBLIC_SITE_URL` apontando para o domínio final.
3. Deploy automático por push; preview por pull request.
4. O repositório Git local já tem o commit inicial (branch `main`); falta criar o
   repositório no GitHub e conectar o remote para o primeiro push.

## Status das fases

| Fase | Situação |
|---|---|
| 0 — fundação do repo | concluída |
| 1 — documentos de fundação | concluída |
| Decisões de produto P1–P22 | concluídas |
| 2 — Identity & Access | concluída (código + migration; falta aplicar no Supabase) |
| 3 — Geography | concluída (spec, migration, seeds IBGE + bairros de Cariacica, APIs e seletor em cascata; falta aplicar no Supabase) |
| 4 a 12 | pendentes (ver `docs/plano-reescrita-ddd.md`) |

## Camada de dados (repo separado)

`minha-cidade-analytics`: pandas + SQLAlchemy + Jupyter, ETL agendado no GitHub Actions,
snapshots no schema `analytics` e dashboards em Streamlit Community Cloud (apenas dados
agregados). Ver ADR-0014.
