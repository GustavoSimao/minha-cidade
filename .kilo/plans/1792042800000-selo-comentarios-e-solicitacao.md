# Plano — selo institucional nos comentários + solicitação de selo (B2)

Criado em 2026-10-15 ~02:40, a pedido do usuário ("sim"), após a varredura de
produto e a verificação de bugs. Nada foi executado. Implementação: agente
code/`@task-executor`, task por task. **Sem commit** (regra "ok, roda").

## O que existe hoje (verificado por leitura)

- **Selo institucional já aparece em**: perfil (`perfil/[username]/page.tsx:126`),
  card do feed (`app/page.tsx`), página da publicação (`publicacao/[id]/page.tsx:166`)
  — entrega T5.
- **Comentários NÃO têm o selo**: `comment-item.tsx:53-55` mostra só o nome; os
  autores vêm de `SupabaseAuthorDirectory` (`engagement/infrastructure/publication-state.ts:47-58`),
  que projeta apenas `{ username, fullName, avatarPath }`. A projeção pública de
  Identity (`findPublicViewsByIds`) já carrega `is_verified`/`verified_org` — falta
  transportar.
- **Concessão**: `GrantBadge` (`moderation/application/use-cases.ts:298`),
  `grantBadgeAction` (`moderation/interfaces/actions.ts:122`) e a UI
  `StaffProfileActions` na seção "Contas" do `/admin` — admin busca username,
  informa o nome do órgão, concede; tudo registrado em `moderation_actions` (M5/M7).
- **Regras**: I5 (`is_verified` espelho de `verified_org`; só `service_role`
  escreve — trigger `identity.enforce_profile_invariants`); ADR-0016 (concessão
  manual após evidência — link oficial ou e-mail de domínio oficial; nenhuma
  verificação automática na v1).
- **Seed determinístico**: `prefeitura-cariacica` (uuid `bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc`)
  tem comentário na publicação `bbbbbbbb-0001-4000-8000-000000000005`
  (`supabase/seed/03-dev-seed.sql:377-379`).
- **PRD jornada 6** ("órgão público solicita o selo com evidência") **não existe
  em tela nenhuma** — hoje só a concessão direta pelo admin.

## Task 1 — selo nos comentários (fecha P13 ponta a ponta)

1. `contexts/engagement/application/ports.ts` — `PublicCommentAuthor` (ou o tipo
   usado pelo `AuthorDirectory` de engagement) ganha `isVerified: boolean;
   verifiedOrg: string | null`, espelhando o `PublicAuthor` da publication (T5).
2. `contexts/engagement/infrastructure/publication-state.ts` —
   `SupabaseAuthorDirectory.findPublicAuthors` passa a mapear os dois campos a
   partir de `findPublicViewsByIds` (a projeção já tem as colunas).
3. `shared/ui/engagement/comment-list.tsx` (tipo `CommentFeedItem.author`, linha
   18) e `shared/ui/engagement/comment-item.tsx` (linha 19) — atualizar o tipo e
   render `<Badge testId="institutional-badge" tone="institutional">` ao lado do
   nome quando `isVerified && verifiedOrg` (mesmo padrão do feed/publicação).
4. **Testes**: e2e em `04-engajamento.spec.ts` (ou no 03-feed) visitando
   `/publicacao/bbbbbbbb-0001-4000-8000-000000000005`: selo "Prefeitura de
   Cariacica" dentro do comentário da prefeitura; ausente no comentário do
   `fabio-neres` (autor comum, mesma publicação). Ajustar mock do `AuthorDirectory`
   nos testes unitários de `ListPublicationComments`, se existirem.

## Task 2 — solicitação de selo (produto B2)

### Decisões de desenho (a confirmar pelo usuário antes de codar)

- **D1 — tabela `identity.badge_requests`** (contexto Identity: o selo é I5;
  moderação só decide — mesmo padrão de `GrantBadge` vivendo em moderação e
  escrevendo em `identity.profiles` via `ProfileAdminPort`). Colunas: `id`,
  `user_id → identity.profiles(on delete cascade)`, `org_name` (2–120),
  `evidence_url` (http/https obrigatória), `evidence_email` (opcional),
  `message` (≤500), `status` (`pending`|`approved`|`rejected`), `decided_by`,
  `decided_at`, `decision_reason`, `created_at`, `updated_at`. Índice único
  parcial `(user_id) where status = 'pending'` (uma pendência por usuário) e
  índice `(status, created_at)` para a fila do admin.
- **D2 — RLS**: dono insere e lê apenas as próprias linhas; leitura/atualização
  da fila pelo `service_role` (ações de admin — padrão `conceder-selo`); `anon`
  sem acesso.
- **D3 — use cases**: em Identity — `RequestBadge` (sessão; recusa se já
  verificado ou com pendência; VO `VerifiedOrg` + validação de URL) e
  `ListMyBadgeRequest` (dono vê o status). Em Moderation — `ListBadgeRequests`
  (staff, pendentes primeiro), `ApproveBadgeRequest` (admin: marca `approved`,
  chama `GrantBadge` internamente, registra na trilha) e `RejectBadgeRequest`
  (admin: motivo obrigatório, registra na trilha).
- **D4 — tela `/solicitar-selo`** (sessão obrigatória): formulário com órgão,
  URL da evidência, e-mail de contato e mensagem; estados — sem selo e sem
  pedido (formulário), pendente ("em análise"), aprovado (mostra o selo) e
  rejeitado (mostra o motivo e permite reenviar).
- **D5 — `/admin`**: nova seção "Solicitações de selo" (pendentes primeiro) com
  Aprovar (org_name pré-preenchido, editável) e Reprovar (motivo obrigatório);
  ações na trilha (`badge_request_approved`/`badge_request_rejected`).
- **D6 — entrada**: link "Solicitar selo institucional" em `/perfil/editar`
  (visível para conta com e-mail confirmado — I9).
- **D7 — eventos** `BadgeRequested`/`BadgeRequestApproved`/`BadgeRequestRejected`
  em `shared.domain_events` (padrão dos contextos; mantém o outbox coerente).
- **D8 — docs no mesmo change**: migration idempotente (`create table if not
  exists`, `drop policy if exists` + `create policy`), dicionário
  (`docs/03-data/dicionario-dados.md`) e spec (`identity-access.md` — novos casos
  de uso e rota).
- **D9 — seed**: 1 solicitação **pendente** de um órgão fictício (novo usuário
  `secretaria@minhacidade.dev` / "Secretaria de Meio Ambiente" no seed de dev)
  para a demo B2G e para o e2e do admin.

## Task 3 — validação

- **Unit** (novos): `RequestBadge` recusa duplicata e já-verificado; aprovar
  concede + registra trilha; reprovar exige motivo. Rodar a suíte completa
  (209 atuais + novos).
- **e2e**: (a) comentário da prefeitura com selo (Task 1); (b) fluxo completo —
  login `secretaria@minhacidade.dev` → `/solicitar-selo` → envia → login
  `carla@minhacidade.dev` → `/admin` aprova → perfil do solicitante com selo e
  fila vazia. Manter determinismo: seed fixo, usuários do seed.
- **Build/lint/typecheck** verdes; smoke manual `/solicitar-selo` (307 sem
  sessão) e `/admin` (404 para não-staff).

## Riscos e Observações

- Aprovação é **admin-only** (ADR-0016) — a UI do admin passa a ter dois caminhos
  de concessão (direto e via solicitação); manter o direto (órgãos vindos de
  venda) e a fila (demanda orgânica).
- Evidência é **URL** nesta v1 (ADR-0016: link oficial ou e-mail de domínio);
  upload de documento fica fora.
- Cross-context: moderação lê/escreve `identity.badge_requests` via
  `service_role` — mesmo padrão de `RoleDirectory`/`ProfileAdminPort`.
- Fora de escopo: verificação automática da evidência, upload de PDF,
  notificação por e-mail ao solicitar/decidir, aprovação por moderador.

## Registro de execução (2026-10-15 ~03:00–04:20, agente code)

**Executado e validado — 100% do plano, decisões D1–D9 confirmadas pelo usuário.**

### Task 1 — selo nos comentários ✅
- `engagement/application/ports.ts`: `PublicCommentAuthor` ganhou
  `isVerified`/`verifiedOrg`; `CommentItem.author` passou a usar o tipo nomeado.
- `engagement/infrastructure/publication-state.ts` (`SupabaseAuthorDirectory`)
  projeta os dois campos de `findPublicViewsByIds`.
- `comment-list.tsx`/`comment-item.tsx`: tipo atualizado + `Badge`
  `testId="institutional-badge"` ao lado do nome do autor verificado.
- e2e: novo teste em `04-engajamento.spec.ts` (comentário da prefeitura com selo,
  autor comum sem).

### Task 2 — solicitação de selo ✅
- **Migration** `20261015000009_identity_badge_requests.sql`: tabela
  `identity.badge_requests` (D1), índice único parcial `(user_id) where status =
  'pending'`, índice de fila, RLS dono-only + service_role para a fila, versão do
  schema `identity` → 2.
- **Identity**: `BadgeRequestRepository` (port) + `SupabaseBadgeRequestRepository`;
  use cases `RequestBadge` (I9, uma pendência, VO `VerifiedOrg`, URL http(s),
  e-mail opcional validado, evento `identity.badge_requested`) e
  `ListMyBadgeRequest`. Action `requestBadgeAction`.
- **Tela** `/solicitar-selo` (D4/D6): estados de sem pedido, pendente, aprovado e
  rejeitado (com motivo e reenvio); link de entrada em `/perfil/editar`.
- **Moderation**: portas `BadgeRequestDirectory`/`BadgeRequestAdmin` +
  adaptadores (`badge-request-adapters.ts`, service_role); use cases
  `ListBadgeRequests` (staff), `ApproveBadgeRequest` (admin — concede via o mesmo
  `GrantBadge`, marca aprovada, trilha + evento) e `RejectBadgeRequest` (admin,
  motivo obrigatório); actions `approveBadgeRequestAction`/`rejectBadgeRequestAction`.
- **/admin**: seção "Solicitações de selo institucional" (D5) com a fila
  (`BadgeRequestQueue`), aprovar (nome do selo pré-preenchido, editável) e
  rejeitar (motivo).
- **Migration 20261016000009 estendida**: CHECK de `moderation_actions.action`
  acrescenta `approve_badge_request`/`reject_badge_request`.
- **Seed** (D9): 13º usuário `secretaria-meio-ambiente`
  (`secretaria@minhacidade.dev`) com uma solicitação **pendente** — demo B2G;
  README raiz e `supabase/seed/README.md` atualizados (13 usuários).
- **Docs**: dicionário (`identity.badge_requests`), spec
  `identity-access.md` (2 use cases + rota + nota de que as ações de staff ficam
  em Moderation).

### Dois bugs encontrados pelo e2e e corrigidos (regressão real)

1. **id HTML duplicado nos formulários** — `TextField`/`Textarea`/`Select` usavam
   `props.name` como `id` (`form.tsx:50`, `text-area.tsx:20`, `select.tsx:21`):
   com a fila do admin (vários forms com `orgName`/`reason`) e o dialog de
   concessão na mesma página, os `<label>` apontavam para o input errado — o
   teste preenchia o campo da fila e o `orgName` chegava vazio na action.
   Correção na origem: `useId()` em `form.tsx`, `text-area.tsx` e `select.tsx`
   (+ `"use client"` nesses módulos). Também removido o
   `defaultValue={username}` indevido no campo "Nome do órgão" do dialog.
2. **CHECK da trilha** — `moderation_actions_action_check` não conhecia
   `approve_badge_request`/`reject_badge_request`; a action estourava 500
   **depois** de marcar a decisão (o e2e de aprovar passou porque a asserção
   seguinte navegava para outra página — erro mascarado; ver observação 0004).

### Validação

- unit **229/229** (209 + 11 de `RequestBadge`/`ListMyBadgeRequest` + 9 de
  `ListBadgeRequests`/`ApproveBadgeRequest`/`RejectBadgeRequest`);
- lint/typecheck limpos; **build verde** (29 rotas, `/solicitar-selo` incluída);
- e2e **90/90** (mobile + desktop, exit 0) — fluxo completo: secretaria do seed
  na fila, usuário fresco solicita → admin aprova → selo no perfil, e rejeição
  com motivo visível para o requerente;
- `db reset` reaplicado (migration + seed). Sem commit.
