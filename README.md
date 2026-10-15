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
.github/workflows/ci.yml   lint, typecheck, testes de unidade, build e e2e
docs/                      fonte da verdade (ver acima)
```

## Rotas implementadas

| Rota | O que faz |
|---|---|
| `/` | home = feed público de publicações (filtros cidade/bairro/tipo, paginação por cursor) |
| `/feed` | redirect para `/` preservando os filtros (links antigos) |
| `/login`, `/cadastro` | entrar e cadastrar (Google ou e-mail/senha, com aceite dos termos) |
| `/auth/callback` | callback do OAuth do Google |
| `/perfil/{username}` | perfil público (projeção sem e-mail/telefone) |
| `/perfil/editar` | editar o próprio perfil (com seletor cidade → bairro) e encerrar conta |
| `/api/geography/cities` | busca de cidades do catálogo IBGE (leitura pública) |
| `/api/geography/neighborhoods` | bairros de uma cidade (leitura pública) |
| `/publicar` | formulário de publicação (problema/ideia, fotos, anonimato) |
| `/publicacao/{id}` | publicação pública (anonimato preservado); editar/apagar quando é o autor; apoio/oposição, comentários e salvar (Fase 5, com Realtime) |
| `/amigos` | hub privado de amizades: amigos, solicitações (recebidas + enviadas) e sugestões do bairro |
| `/amigos/descobrir` | descoberta de pessoas da plataforma (cartões com "pular") |
| `/amigos/buscar` | busca de pessoas por nome ou @username |
| `/amigos/{username}` | lista pública de amigos de um perfil |
| `/amigos/solicitacoes` | redirect para `/amigos?tab=solicitacoes` |
| `/api/publications/media` | upload de imagem WebP (P5 — magic bytes no servidor; Route Handler por causa dos 10 MiB) |
| `/salvos` | lista privada de publicações salvas (Fase 5 — só o dono) |
| `/amigos/{username}` | lista pública de amigos (Fase 6 — amizade é mútua) |
| `/amigos/solicitacoes` | solicitações de amizade recebidas (Fase 6 — privado) |
| `/admin` | fila de moderação e trilha (Fase 7 — só staff; 404 para os demais); seção **Contas** com selo institucional e papel, exclusiva do admin (Fase 8) |
| `/notificacoes` | notificações in-app com sino no cabeçalho e Realtime (Fase 8) |
| `/termos`, `/privacidade` | mínimo legal (P22) |
| `/transparencia` | números públicos agregados (Fase 10) a partir dos snapshots diários de `analytics.daily_metrics` |

Nota de ambiente: ao **adicionar um schema novo** em `config.toml`, o container do
PostgREST precisa ser recriado para ler a lista nova — `supabase stop` seguido de
`supabase start` (um `docker restart` do container REST não basta, porque o
`PGRST_DB_SCHEMAS` vem do env do container).

## Como rodar (local — Supabase CLI + Docker)

Tudo roda na sua máquina: Postgres 17, Auth, Storage, Realtime, Studio e Inbucket
via Docker. Nada na nuvem até o deploy.

### Caminho rápido (clone novo)

```bash
# Pré-requisitos: Docker Desktop rodando + Supabase CLI
# (scoop install supabase — a CLI também é resolvida via npx, sem instalar)
npm run setup --prefix apps/web          # docker + stack + seeds + .env.local + npm install
npm run dev --prefix apps/web            # http://localhost:3000
```

O script `apps/web/scripts/setup-local.mjs` é idempotente: em stack já ativa ele
apenas regera o `.env.local` (as chaves mudam quando a stack é recriada) e confirma
o estado. Rode de novo a qualquer momento.

### Caminho manual (equivalentes, se preferir)

```bash
supabase start      # Postgres :54322, API :54321, Studio :54323, Inbucket :54324
supabase db reset   # migrations + seeds (idempotente; apaga e recria o banco LOCAL)
npm install --prefix apps/web
npm run dev --prefix apps/web
# .env.local: copiar .env.example e preencher com `supabase status`
# (chaves públicas/secret — o formato varia com a versão da CLI: sb_publishable_/
# sb_secret_ ou JWT anon/service_role; ambos funcionam na stack local)
```

**Usuários de teste** (criados pelo seed `03-dev-seed.sql`, senha única
`Cidade@123`, e-mail já confirmado):

| E-mail | Quem | Acesso |
|---|---|---|
| `ana@minhacidade.dev` | Ana Souza | user, bairro Boa Sorte |
| `bruno@minhacidade.dev` | Bruno Lima | user, bairro Aparecida |
| `carla@minhacidade.dev` | Carla Dias | **admin** (moderação) |
| `daniel@minhacidade.dev` | Daniel Rocha | user, bairro Boa Sorte |
| `elena@minhacidade.dev` | Elena Matos | user, bairro Flexal |
| `fabio@minhacidade.dev` | Fabio Ramos | user, bairro Campo Grande |
| `graca@minhacidade.dev` | Graça Nunes | user, bairro Porto de Santana |
| `heitor@minhacidade.dev` | Heitor Batista | user, bairro Bela Vista |
| `iris@minhacidade.dev` | Iris Veiga | user, bairro Jardim Campo Grande |
| `joao@minhacidade.dev` | João Pedro Alves | user, bairro Rosa da Penha |
| `prefeitura@minhacidade.dev` | Prefeitura de Cariacica | **selo institucional** (canal oficial — P13) |
| `marco@minhacidade.dev` | Marco Andrade | **moderador** (moderação) |
| `secretaria@minhacidade.dev` | Secretaria de Meio Ambiente | user com **solicitação de selo pendente** (fila do `/admin`) |

Cadastros novos pela interface recebem e-mail de confirmação capturado pelo
**Inbucket** (`http://127.0.0.1:54324`) — clique no link para confirmar. O template
`supabase/templates/confirmation.html` aponta o link para
`/auth/callback?token_hash=...` (fluxo `verifyOtp`): o clique já deixa o usuário
com sessão aberta e cai na home (`/`, que é o feed). Ao trocar o template, rode `supabase stop` &&
`supabase start` (o `db reset` não basta para o container do Auth recarregá-lo).

**Login do Google:** localmente o provedor fica desabilitado sem as env vars
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`/`SECRET` — use e-mail/senha no ambiente
local. O login social é configuração de produção (ver
[docs/deploy-checklist.md](docs/deploy-checklist.md)).

### Problemas conhecidos no ambiente local

| Sintoma | Causa | Solução |
|---|---|---|
| Stack não sobe / script reclama do Docker | Docker Desktop parado | iniciar o Docker Desktop e rodar `npm run setup --prefix apps/web` de novo |
| Tabela "não encontrada" no PostgREST após adicionar schema | `PGRST_DB_SCHEMAS` vem do env do container | `supabase stop` && `supabase start` (reiniciar só o container REST não basta) |
| Confirmação de e-mail não chega / template velho | container do Auth cacheia o template | `supabase stop` && `supabase start` |
| Chaves inválidas após reset da stack | chaves são geradas por instância da stack | rodar `npm run setup --prefix apps/web` (regera o `.env.local`) |
| "Empty JWT"/401 nas leituras | `.env.local` desatualizado | idem — regenerar o `.env.local` |

**Conferências rápidas do seed:** `select count(*) from geography.cities;` → 5571;
`select count(*) from geography.neighborhoods where city_id = 3201308;` → 100;
`select count(*) from storage.buckets;` → 3.

## Como rodar (nuvem — apenas para deploy)

```bash
# 1. Dependências
npm install --prefix apps/web

# 2. Variáveis de ambiente (painel do Supabase — Project Settings -> API)
cp .env.example apps/web/.env.local   # preencher com os dados do projeto na nuvem

# 3. Qualidade
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run test --prefix apps/web
npm run build --prefix apps/web
```

## Configuração do Supabase (manual, uma vez)

1. Criar projeto em <https://supabase.com/dashboard> (Postgres 17).
2. Aplicar as migrations na ordem: rodar
   `supabase/migrations/20261010000001_identity_create_profiles.sql`,
   `supabase/migrations/20261011000002_geography_create_cities_neighborhoods.sql` e
   `supabase/migrations/20261011000003_publication_create_publications.sql`
   no SQL Editor (ou `supabase db push` com a CLI). A primeira cria os schemas
   `shared`/`identity`, a tabela `identity.profiles`, os triggers e as políticas RLS;
   a segunda cria o schema `geography` (cidades e bairros) e as FKs de localização em
   `identity.profiles`; a terceira cria o schema `publication` (publicações, mídia,
   triggers de invariantes e o outbox `shared.domain_events`). Os demais schemas chegam
   nas Fases 5+.
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
| 4 — Publication + feed | concluída (spec, migration, publicar/editar/apagar, upload WebP, feed paginado; falta aplicar no Supabase) |
| 5 — Engagement | concluída (reações, comentários, salvamentos — WebSocket + Repositório) |
| 6 — Social Graph | concluída (amizade mútua, solicitações, lista pública) |
| 7 — Moderation | concluída (denúncias, fila, ocultar/restaurar/remover, trilha, rate limit) |
| 8 — Notification | concluída (in-app + e-mail, sino não lido, Realtime) |
| 9 — PWA | concluída (manifest, ícones, service worker com cache só de leitura pública) |
| 10 a 12 | pendentes: analytics/transparência (Fase 10), repo Python (Fase 11), deploy (Fase 12) — ver `docs/plano-reescrita-ddd.md` |
| Design (etapas A/B/C do plano de identidade) | concluído — status, pendências e como retomar em `docs/status-design-2026-10-12.md` |

## Camada de dados (repo separado)

`minha-cidade-analytics`: pandas + SQLAlchemy + Jupyter, ETL agendado no GitHub Actions,
snapshots no schema `analytics` e dashboards em Streamlit Community Cloud (apenas dados
agregados). Ver ADR-0014.
