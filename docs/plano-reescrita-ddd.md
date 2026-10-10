# Minha Cidade — Reescrita DDD (Next.js + Supabase + Vercel)

Plano de execução para o produto "Minha Cidade" (participação cidadã: problemas, ideias, eventos, apoio a causas), reconstruído do zero, orientado a documentos e organizado por bounded contexts em DDD.

> **STATUS DE EXECUÇÃO — 2026-10-10**
>
> | Etapa | Situação |
> |---|---|
> | Apêndice B (backup, cópia do plano, deleção do repo Laravel) | **concluído** — bundle em `C:\projetos\minha-cidade-laravel.bundle`; plano copiado para `docs/plano-reescrita-ddd.md`; repo `minha-cidade` deletado |
> | Fase 0 — fundação do repo novo (`C:\projetos\minha-cidade`) | **concluído** — Next.js 16 + React 19 + TS + Tailwind 4 + ESLint + Vitest; CI em `.github/workflows/ci.yml`; estrutura `apps/web/src/contexts`, `supabase/`; lint/typecheck/test/build verdes |
> | Fase 1 — documentos de fundação | **concluído** — `docs/00-product`, `01-process`, `02-design` (C4 + design system + ADRs), `03-data`, `04-contexts` |
> | **Decisões de produto P1–P22** | **concluídas** (2026-10-10) — registradas na seção 2 deste documento e nas ADRs 0015–0021 |
> | Fase 2 — Identity & Access | **concluído** — spec `docs/04-contexts/identity-access.md`; migration `20261010000001_identity_create_profiles.sql`; domínio com 22 testes; `@supabase/ssr` + proxy (`src/proxy.ts`); rotas `/auth/callback`, `/login`, `/cadastro`, `/perfil/{username}`, `/perfil/editar`; termos e privacidade. Falta aplicar a migration no projeto Supabase (ação manual) |
> | Fases 3 a 12 | pendentes — uma bounded context por fase, spec → migration → domínio → aplicação → infraestrutura → tela → teste |
>
> Próximo passo: **Fase 3 — Geography** (seed IBGE de cidades/UF + bairros curados de
> Cariacica com fonte oficial registrada, e a seleção cidade → bairro em cascata).

> **ATENÇÃO — único artefato sobrevivente:** o repo Laravel foi deletado e apenas este documento (com o Apêndice A) preserva o conhecimento do sistema anterior.

---

## 1. Contexto e por que reescrever

O repo anterior (`laravel/laravel` + 7 módulos composer locais, ~2 commits, **hoje deletado**) tinha auth Breeze funcional, perfil público e amizade/reações em Livewire, mas estava em estado incompleto e inconsistente (registro histórico — servir como lição, não como referência de código):

- Views Livewire defasadas em relação ao schema: `resources/views/livewire/identity/profile-tabs.blade.php` referenciava colunas/relações inexistentes (`$pub->body`, `$pub->media`, `$event->starts_at`, `$event->modality`, `$user->city`, `$user->activeNeighborhoods`).
- Caminhos de view errados: componentes renderizavam `view('livewire.friendship-button')` enquanto os Blades estavam em `livewire/community/` e `livewire/identity/`.
- Tags `<livewire:community.friendship-button>` e `<livewire:identity.profile-tabs>` usadas sem namespace/`Livewire::component()` registrado.
- Módulos Geography/Moderation/Verification/Notification sem models; `participations` e `bookmarks` sem model.
- Sem tabela de cidades/bairros (o feed por bairro era o core do produto), sem RLS, sem testes além do Breeze, sem camada de dados.
- Contradições de stack: README dizia Livewire 4 e PHP 8.4 com `livewire ^3.6.4` e `php ^8.3`; `tailwindcss ^3` e `@tailwindcss/vite ^4` simultâneos; README dizia MySQL com `.env` em sqlite.
- **Não havia dados de produção** (seeder era o stub padrão, sem deploy ativo) — a reescrita começa com banco limpo, sem migração de dados.

---

## 2. Decisões travadas (contrato do plano)

| # | Decisão |
|---|---|
| D1 | App web: **Next.js (App Router) + TypeScript**, hospedado na **Vercel**; UI mobile-first responsiva |
| D2 | Backend: **Supabase** — Postgres, Auth (Google + email/senha), Storage, Realtime, pg_cron; RLS ativo |
| D3 | **Repo novo** para o app (`minha-cidade-web`) e repo separado para analytics (`minha-cidade-analytics`). O repo Laravel antigo é deletado **antes da Fase 0**; só `.kilo/plans/` (este plano) sobrevive |
| D4 | **Documentação como fonte de verdade**: spec por bounded context + C4 + ADRs, versionados em `docs/`; PR não passa sem spec e testes de domínio atualizados |
| D5 | Bounded contexts: Identity & Access, Geography, Publication, Engagement, Social Graph, Moderation, Notification, Analytics |
| D6 | Código e banco espelham os contextos: `apps/web/src/contexts/<ctx>/{domain,application,infrastructure,interfaces}` e **um schema Postgres por contexto** (+ schema `shared` para tipos comuns) |
| D7 | Integração entre contextos **somente por IDs e eventos de domínio publicados no Postgres** — nunca JOIN entre schemas de contextos diferentes |
| D8 | **Casos de uso executam no servidor** (Route Handlers / Server Actions chamando use cases); cliente usa `supabase-js` apenas para Realtime e leituras públicas. RLS é a segunda barreira |
| D9 | MVP v1: auth + perfil + publicações (problema/ideia, anônimas) + feed por bairro/cidade + reações + amizade + comentários + denunciar + admin mínimo. Eventos, notificações por email, verificação e busca ficam fora de escopo |
| D10 | Localização: tabelas `cities`/`neighborhoods` **semeadas do IBGE**; coluna `lat/lng` opcional; PostGIS disponível mas não obrigatório na v1 |
| D11 | Login: Google OAuth + email/senha via Supabase Auth; publicações podem ser anônimas (autor real preservado só para moderação interna) |
| D12 | Segurança pública mínima: botão denunciar, rate limiting por usuário/IP, painel `/admin` para ocultar/remover e resolver denúncias |
| D13 | Entrega: **PWA instalável** (manifest, ícones, service worker) com cache de leitura offline; sem loja de apps na v1 |
| D14 | Métricas materializadas no Postgres (pg_cron) + página pública **Transparência** no app (Recharts) + **repo Python separado** (pandas, notebooks, ETL, Streamlit Community Cloud) |
| D15 | Regra de dependência: Publication/Engagement/Social Graph → Identity, Geography. Moderation e Notification são consumidores de eventos. Analytics é read-only |

---

## 3. Arquitetura alvo (C4 resumido)

```text
[Usuário: celular/PC] ──HTTPS──> [Vercel CDN / Edge]
                                     │
                              [Next.js App Router]
                                ├─ RSC + Route Handlers / Server Actions  (application layer)
                                ├─ supabase-js (server client, RLS on)    ──> [Supabase Postgres]
                                └─ supabase-js (browser, Realtime only)  ──> [Supabase Realtime]
                                     │
                              [Supabase Storage] (avatars, covers, publication media)
                                     │
[pg_cron] ──> refresh de métricas (schema analytics_metrics)
                                     │
[GitHub Actions ETL] ──> snapshots no schema analytics
                                     ├──> [Página Transparência no app]
                                     └──> [Streamlit dashboards públicos]
```

**Estrutura de pastas do repo do app:**

```
docs/
  00-product/        PRD, personas, escopo MVP, fora de escopo
  01-process/        workflow (spec→code→test), Definition of Done, revisão de docs
  02-design/         C4 context/container/component, ADRs, design system (tokens)
  03-data/           dicionário de dados, ERD por contexto, política RLS, catálogo IBGE
  04-contexts/<ctx>/ spec.md (linguagem ubíqua, invariantes, casos de uso, eventos, ERD, endpoints)
apps/web/
  src/contexts/<ctx>/{domain,application,infrastructure,interfaces}
  src/shared/         kernel DDD (Entity, ValueObject, DomainEvent, Result), tipos
  src/app/            rotas, layouts, páginas (Next App Router)
  public/             manifest, ícones PWA, service worker
  **/*.test.ts        testes de unidade de domínio (vitest), junto do código
supabase/
  migrations/         SQL por contexto (um arquivo por versão de schema)
  seed/               seed IBGE + seed de desenvolvimento
  functions/          Edge Functions (somente quando necessário: webhooks, segredos) — criado na fase que precisar
tests/e2e/            testes Playwright (viewports mobile/desktop) — criados na Fase 9
.github/workflows/    ci.yml, deploy checks, e2e (a partir da Fase 9), ETL agendado
```

**Conteúdo obrigatório de cada `docs/04-contexts/<ctx>/spec.md`:** glossário/linguagem ubíqua; entidades e value objects com invariantes; casos de uso (comando → evento → efeito); eventos de domínio publicados; ERD do schema do contexto; políticas RLS em linguagem natural; endpoints/rotas; casos de teste derivados das invariantes.

---

## 4. Plano de execução (ordenado)

Cada fase termina com: spec do contexto escrita/revisada → migrations → código de domínio/aplicação → testes → tela → check de validação. Nada de código sem spec correspondente.

**Fase 0 — Fundação do repo novo**
- Criar repo `minha-cidade-web` (o repo Laravel antigo já foi deletado; apenas `.kilo/plans/` com este plano permaneceu). Copiar este plano para `docs/` do repo novo.
- Next.js (App Router) + TypeScript strict + Tailwind (uma versão só) + ESLint/Prettier.
- Supabase: projeto criado, migrations em `supabase/migrations` versionadas por contexto.
- CI: PR roda lint + typecheck + `vitest`; `playwright` em PR para main; deploy preview por PR.
- Definir nomenclatura de eventos de domínio e do outbox/eventos no Postgres (tabela `shared.domain_events`).
- **Validação:** PR vazio passa por CI e gera preview na Vercel.

**Fase 1 — Documentos de fundação**
- `docs/00-product` (PRD do MVP, personas: morador, moderador, analista), `docs/01-process` (workflow spec→código, Definition of Done), `docs/02-design` (C4 context + container, design system com tokens de cor/espaço/tipografia e alvos de toque ≥44px), `docs/03-data` (convenções de schema, política RLS, versionamento).
- ADRs iniciais: D1–D15 registrados em `docs/02-design/adr/`.
- **Validação:** documentos revisados e aprovados por você antes de codar contexto.

**Fase 2 — Identity & Access**
- Supabase Auth: Google OAuth + email/senha; trigger `on_auth_user_created` criando linha em `identity.profiles` (username único, papel, datas).
- Domínio: entidades `User`/`Profile`, invariantes (username único e imutável após criação; email obrigatório), eventos `UserRegistered`, `ProfileUpdated`.
- Telas: login/cadastro, `/perfil/{username}` público, edição de perfil (foto/capa/bio/cidade/bairro).
- RLS: leitura pública de perfil; escrita somente do próprio dono.
- **Validação:** testes de unidade das invariantes; e2e mobile criando conta e editando perfil; teste negativo de RLS (outro usuário não altera).

**Fase 3 — Geography**
- Seed IBGE (`/api/v1/localidades`) para `geography.cities` e `geography.neighborhoods` (script idempotente em `supabase/seed`).
- Endereço polimórfico (perfil/publicação) e `lat/lng` opcional.
- Telas: seleção de cidade/bairro em cascata com busca.
- **Validação:** seed roda limpo em banco novo; seleção funciona em viewport mobile; contagem de cidades/bairros confere com a origem IBGE.

**Fase 4 — Publication + feed**
- Domínio: `Publication` (tipo `problem|idea`, `is_anonymous`, título, corpo, mídia), invariantes (tamanhos, tipo válido, autor obrigatório, anonimato não exposto em leitura pública), evento `PublicationCreated`.
- Storage: buckets `publication-media`, `avatars`, `covers`; upload com validação de tipo/tamanho e limites.
- Feed: lista pública paginada filtrada por bairro/cidade, ordenação recente.
- **Validação:** e2e mobile publicando com foto anônima e vendo no feed; rate limit ativo (D12); RLS garante que autor anônimo não vaza.

**Fase 5 — Engagement**
- Domínio: `Reaction` (apoio/oposição, único por usuário/publicação — toggle), `Comment` (anonimato opcional), `Bookmark`; eventos `PublicationSupported`, `CommentAdded`.
- Realtime: contadores e novos comentários assinados via `supabase-js` no cliente (D8).
- **Validação:** toggle de reação em tempo real em dois clientes; comentário aparece sem recarregar.

**Fase 6 — Social Graph**
- Domínio: `Friendship` (estados `pending|accepted|removed`, sem duplicata A↔B por constraint único), eventos `FriendRequested/Accepted/Removed`.
- Telas: botão de amizade no perfil público, lista de amigos e solicitações.
- **Validação:** teste de constraint (não permitir solicitação duplicada nos dois sentidos); fluxo completo em e2e mobile.

**Fase 7 — Moderação, rate limit e admin mínimo**
- Domínio: `Report` (reportável polimórfico: publicação/comentário/perfil), invariantes (não denunciar a si mesmo, motivo obrigatório), evento `ContentReported`.
- Rate limit: por usuário autenticado e por IP, aplicado na camada application (tabela própria ou Upstash).
- `/admin`: fila de denúncias, ocultar/restaurar/remover conteúdo, marcar resolvida. Acesso restrito a papel `admin`/`moderator` via RLS + guarda de rota.
- **Validação:** teste de abuso (publicar além do limite é bloqueado); RLS garante que só admin vê a fila.

**Fase 8 — Notification (mínimo)**
- Domínio: `Notification` in-app (eventos de amizade, comentário, reação) com `read_at`; sininho com contagem e Realtime.
- Fora de escopo na v1: push por email/web push.
- **Validação:** notificação chega em tempo real; controle de leitura por dono via RLS.

**Fase 9 — PWA, performance e acessibilidade**
- Manifest + ícones + service worker (cache do shell e das últimas publicações lidas → leitura offline).
- Orçamento de performance: JS inicial enxuto (Server Components por padrão), `next/image`, otimização de mídia no upload.
- Acessibilidade: contraste AA, navegação por teclado, labels, foco visível.
- **Validação:** Lighthouse mobile ≥ 90 (Performance/Acessibilidade/Best Practices); prompt de instalação no Android e "Adicionar à Tela" no iOS; leitura offline funciona após visitar o feed.

**Fase 10 — Analytics no banco + página Transparência**
- Tabelas de métricas diárias (`analytics_metrics.daily_metrics`: publicações por bairro/tipo, apoios, comentários, usuários ativos, denúncias) alimentadas por job pg_cron (fallback: GitHub Actions ou Vercel Cron chamando rota admin).
- Página pública `/transparencia` com Recharts, alimentada por função SQL read-only.
- **Validação:** números conferem com contagem direta no banco; página carrega rápido em 3G simulado.

**Fase 11 — Repo Python de analytics**
- Repo `minha-cidade-analytics`: `pyproject.toml` (uv), pandas + SQLAlchemy + Jupyter; conexão read-only via pooler do Supabase.
- ETL em GitHub Actions (agendado) gravando snapshots no schema `analytics`.
- Notebooks de análise (sazonalidade de publicações por bairro, engajamento, crescimento) com narrativa em markdown.
- Dashboard **Streamlit** público no Community Cloud: somente dados **agregados e anonimizados** (nunca PII, nunca texto de posts).
- **Validação:** ETL roda em schedule e é idempotente; notebooks reproduzem do zero; dashboard público sem dado pessoal.

**Fase 12 — Rollout em produção**
- Deploy produção na Vercel + domínio próprio; variáveis de ambiente do Supabase em produção; backups automáticos conferidos.
- Verificar PWA instalada em Android e iOS reais; Lighthouse mobile ≥ 95 nos três eixos em produção.
- Checklist final: docs de contexto publicados no repo, ETL/Streamlit rodando, `/transparencia` com números conferidos.

---

## 5. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| RLS mal configurada vazar dados entre usuários | Políticas escritas na spec em linguagem natural + testes negativos de RLS por tabela na CI |
| Abuso em feed público com post anônimo | Rate limit por usuário/IP, denúncia e admin mínimo já na v1 (D12) |
| Seed IBGE grande/desatualizado | Script idempotente versionado, com teste de contagem e atualização documentada |
| pg_cron indisponível no plano Supabase | Fallback: job agendado no GitHub Actions ou Vercel Cron chamando rota admin autenticada |
| Dashboard público expor dados pessoais | Regra dura: Streamlit lê apenas schema `analytics` agregado; revisão obrigatória antes de publicar |
| Service worker servindo conteúdo velho | Versionamento do cache + atualização em background + aviso de "novo conteúdo disponível" |
| Docs descolarem do código (D4) | Spec por contexto é artefato de PR; checklist de revisão exige spec+tests quando o comportamento muda |
| Perda do schema de referência com a deleção do repo antigo | Apêndice A já embute as 17 tabelas, colunas e o comportamento a preservar; opcional: `git bundle` antes de deletar |

---

## 6. Critérios de aceite da v1

1. Visitante sem login vê o feed do bairro/cidade e perfil público; conteúdo público é responsivo e instalável como PWA.
2. Cadastro/login por Google ou email/senha funciona em mobile e desktop.
3. Usuário publica problema/ideia com foto, opcionalmente anônimo, e aparece no feed do bairro.
4. Apoio/oposição e comentários atualizam em tempo real.
5. Amizade: solicitar, aceitar, recusar, desfazer — sem duplicatas.
6. Denunciar funciona; admin oculta/remove e resolve denúncia; rate limit bloqueia abuso.
7. Feed continua legível offline após visita (cache PWA).
8. Lighthouse mobile ≥ 90 nos três eixos; alvos de toque ≥ 44px; contraste AA.
9. Página `/transparencia` publicada com métricas do banco.
10. Repo Python com ETL agendado, notebooks reproduzíveis e dashboard Streamlit no ar sem PII.
11. Toda tela tem caso de uso documentado em `docs/04-contexts/<ctx>/spec.md` com teste correspondente.

---

## 7. Fora de escopo na v1 (registrado, não esquecido)

Eventos com data/local/participação, notificações por email/push, verificação de email/telefone, busca textual, moderação avançada (fila com palavras bloqueadas/shadowban), app nativo em loja (avaliar Capacitor após a PWA validar), migração de dados do Laravel (não existem dados de produção).

---

## 8. Próximo passo

Aplicar a **Fase 0** no repo novo `minha-cidade-web`: tooling, projeto Supabase, CI e deploy preview — e, antes de qualquer código de contexto, escrever os documentos da **Fase 1** para sua aprovação.

---

## Apêndice A — Schema e comportamento de referência do app antigo (preservar conhecimento)

Registro extraído das migrations/modelos do repo Laravel deletado. Serve para desenhar os schemas novos por bounded context (D6); nomes e granularidade devem ser redesenhados nas specs.

| Tabela | Colunas principais | Contexto novo |
|---|---|---|
| `users` | id, name, email, password, `username` (único, adicionado depois), email_verified_at, remember_token | Identity (auth é do Supabase; espelhar em `identity.profiles`) |
| `profiles` | user_id, full_name, bio, email(**duplicado**), phone, supported_causes(string), events_created/participating/participated(string), profile_picture, social_links(string), role(string), cover_image, is_verified(bool) | Identity — **corrigir**: sem e-mail duplicado; contadores viram métricas derivadas; social_links vira tabela própria ou JSON tipado |
| `addresses` | morphs(addressable), country, state, city(district=bairro), street, number, complement, cep | Geography |
| `publications` | user_id, type(string), is_anonymous(bool), title, content, image_1..3, video, timestamps | Publication — `type` vira enum `problem|idea`; mídia vai para Storage (bucket) com tabela `publication_media` |
| `events` | publication_id, data_inicio, data_fim, local, tipo, link_externo, limite_participantes, preco(10,2) | Publication (eventos = **fora de escopo v1**, mas schema documentado para v2) |
| `comments` | publication_id, user_id, content, is_anonymous | Engagement |
| `reactions` | publication_id, user_id, type, **unique(user_id, publication_id)** | Engagement |
| `participations` | user_id, event_id, status(default 'confirmed') | Publication/Engagement (v2) |
| `friends` | user_id, friend_id, status(default 'pending'), **sem unique composto** | Social Graph — **corrigir**: constraint único lógico (sentinela) para impedir A↔B duplicado |
| `bookmarks` | user_id, publication_id | Engagement |
| `reports` | user_id, morphs(reportable), reason, description, status(default 'pending') | Moderation |
| `verification_tokens` | user_id, type, token, expires_at, used_at | Identity (v2) |
| `notifications` | user_id, type, data(text), read_at | Notification |
| core | `users`, `cache`, `jobs`, `sessions` (driver database) | `sessions` é do Supabase Auth; `cache/jobs` não se aplicam ao stack novo |

**Comportamento validado que deve ser preservado (referência funcional):**

1. **Username:** gerado do nome na criação — trim, espaços → `-`, lowercase, remove `[^a-z0-9-]`; colisão resolve com sufixo `-1`, `-2`…; único e imutável depois.
2. **Amizade:** estados `none | pending_sent | pending_received | friends`; ações enviar, cancelar (só quem enviou), aceitar (só quem recebeu), desfazer (qualquer lado); mão dupla, sem "seguidores".
3. **Reação:** `support`/`oppose` com toggle — clicar no mesmo tipo remove; clicar no outro troca; única por usuário/publicação (constraint).
4. **Anonimato:** `is_anonymous` oculta o autor na leitura pública, mas o autor real permanece no banco para moderação.
5. **Perfil público:** `/perfil/{username}` com contadores de amigos, publicações, eventos criados e causas apoiadas; foto/capa com fallback (avatar gerado a partir do nome).
6. **Feed:** público, paginado, filtrado por bairro/cidade, ordenado por mais recente.

**Lacunas de domínio a criar do zero:** `cities`/`neighborhoods` (seed IBGE), métricas/analytics, moderação com ação administrativa, rate limiting, e todo o schema de localização que o produto pressupunha mas não tinha.

---

## Apêndice B — Procedimento de deleção do repo antigo (já executado)

Deleção é irreversível. Foi executado **nesta ordem**, um passo por vez, conferindo cada saída.

**B0. Backup do histórico** (concluído):
```powershell
git -C C:\projetos\minha-cidade bundle create C:\projetos\minha-cidade-laravel.bundle --all
```
Restaurar depois, se preciso: `git clone minha-cidade-laravel.bundle <destino>`.

**B1. Preservar o plano** (concluído — o plano foi copiado para `docs/plano-reescrita-ddd.md`
dentro do próprio repo novo, verificando o hash antes de qualquer deleção).

**B2. Deletar o repo antigo** (concluído):
```powershell
Remove-Item -Path "C:\projetos\minha-cidade\*" -Recurse -Force
```
Removeu `app-modules/`, `app/`, `resources/`, `.git/` e `.kilo/`. A pasta
`C:\projetos\minha-cidade` em si ficou de pé (vazia) porque o processo da sessão a usa como
diretório de trabalho — e passou a ser a pasta raiz do projeto novo. **Nunca usar
`git clean -fdx`** sem antes ter o plano copiado fora.

**B3. Conferência final (concluída):** plano legível em `docs/plano-reescrita-ddd.md`;
pasta antiga vazia; bundle presente em `C:\projetos\minha-cidade-laravel.bundle`.

**B4. Estado atual:** o projeto novo (Fases 0 e 1) vive em `C:\projetos\minha-cidade` — a
pasta "minha-cidade normal", como determinado pelo produto. O nome do repositório no GitHub
segue a definir (ver `docs/04-contexts/decisoes-em-aberto.md`).

> Não havia dados de produção, seeds relevantes, deploy ativo ou credenciais no repo antigo:
> nada além do plano precisava sobreviver.
