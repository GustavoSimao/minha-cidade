# Plano — Lacunas de produto: perfil (foto/capa), amizade (pedido descobrível), bairros, feed e selo

Criado em 2026-10-13, a pedido do usuário, após verificação contra o código e o working tree.
Implementação: **@task-executor**, uma task por vez (pela tabela do AGENTS.md, família de código =
`stepfun/step-3.7-flash:free`). Commits **somente** após "ok, roda" do usuário.

## Contexto — o que a verificação mudou no diagnóstico

Afirmativas iniciais do usuário vs. código (working tree, não commitado; último commit `9014847`):

| Afirmação | Verificação |
|---|---|
| "tem cidade, mas não tem todas as cidades do Brasil" | **Cidades estão completas**: `geography.cities` tem os 5.571 municípios IBGE, 27 UFs (`supabase/seed/01-ibge-localidades.sql`, linhas 10–5580; confere com a API em 2026-10-10). A lacuna real é **bairros**: `geography.neighborhoods` tem 100 bairros, só de Cariacica/ES (LC 171/2025); nos outros 5.570 municípios a seleção de bairro fica indisponível ("Bairro não informado", G6) e o usuário nunca cria bairro (G5). |
| "tem amizade, mas não existe a interação de pedir amizade" | A interação **existe**: `FriendButton` "Adicionar amigo" no perfil alheio (`apps/web/src/shared/ui/social-graph/friend-button.tsx:104`), 5 server actions (`apps/web/src/contexts/social-graph/interfaces/actions.ts`), tabela `social_graph.friendships` com sentinela anti-duplicata, `/amigos/solicitacoes`. Ressalvas: (a) botão só aparece para logado com e-mail confirmado; (b) o bloqueio de runtime (eventos de domínio) já teve o `grant usage on sequence shared.domain_events_id_seq to service_role` **aplicado** na migration `20261011000003` (linha 30) — falta `db reset` + e2e verde para provar. |
| "tem um perfil" | Existe e é completo (`/perfil/{username}`, `/perfil/editar`). Lacuna: `UpdateMyProfile` já aceita `avatarPath`/`coverPath` e os buckets `avatars`/`covers` existem (migration `20261011000004`), mas **não há caminho de upload**: `updateProfileAction` não encaminha os campos (`apps/web/src/contexts/identity/interfaces/actions.ts:140-146`), `ProfileForm` não tem campo de foto (`apps/web/src/shared/ui/profile-forms.tsx`) e não existe rota de upload. |
| "e outras coisas" | Sem busca de pessoas (pedir amizade exige saber o @username); feed sem UI de filtros (só query string); selo institucional só no perfil (não no feed/publicação); B1–B4 (selo/promoção no `/admin`, `/transparencia`, rate limit por IP) implementadas no working tree, sem commit e sem validação; B5 e derivas doc↔código pendentes. |

Planos vigentes (não reabrir): `.kilo/plans/1791911524703-retomada-lancamento-local-e-b2g.md` (T1–T13) e
`docs/status-lancamento-2026-10-13.md`.

## Decisões já travadas (não reabrir)

- Cidades são dado de catálogo completo; bairro novo = curadoria com fonte oficial (G5/G8), nunca criação por usuário.
- Local = e-mail/senha; deploy é configuração (C2, fora da execução).
- Migration em banco só local pode ser editada no próprio arquivo; `db reset` reaplica tudo.
- Nenhuma task deste plano precisa de migration nova — colunas e buckets já existem.
- Commits somente após "ok, roda"; um commit por task, estilo `<contexto>: <resumo>`.

## Tasks (ordem exata)

### T1 — Provar que "pedir amizade" funciona (pré-requisito; ref retomada T1–T3)
1. `npx --yes supabase db reset` (Docker Desktop no ar) — reaplica 11 migrations + 3 seeds.
2. `npx playwright test` em `apps/web` até 0 falhas em **mobile e desktop**; alvo: specs `05-amizade` e `07-perfil`.
3. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` em `apps/web`.
- Aceite: enviar/aceitar/recusar/cancelar/desfazer pelo app sem 500; `select count(*) from shared.domain_events` > 0.
- Se o e2e acusar outro erro em `domain_events`, corrigir na camada certa (repositório/action), não na UI.

### T2 — Foto e capa do perfil (spec `docs/04-contexts/identity-access.md` §4 já cobre avatar/capa; padrão de imagem = P15)
1. **Domínio**: conferir/ajustar `Profile.updateEditableFields` para `avatarPath`/`coverPath` (string vazia → `null`); teste unit.
2. **Infraestrutura**: Route Handler `apps/web/src/app/api/profile/media/route.ts` espelhando `apps/web/src/app/api/publications/media/route.ts` — sessão obrigatória (401), ≤ 10 MiB, magic bytes WebP, parâmetro `kind` restrito a `avatars|covers`, path `<bucket>/{userId}/{uuid}.webp`, upload via `createServiceRoleClient()`. Cliente redimensiona para WebP ≤ 1600px reaproveitando o helper do formulário de publicação (extrair para `shared/` se estiver colado no componente).
3. **Aplicação/interface**: `updateProfileAction` passa a ler `avatarPath`/`coverPath` do formData (campo vazio = remover → `null`); `ProfileForm` ganha upload de avatar e de capa com preview (`Avatar` + `publicStorageUrl`) e ação "remover".
4. **Testes**: unit do caso de uso; e2e em `07-perfil` (sobe foto → aparece em `/perfil/{username}`).

### T3 — Tornar o pedido de amizade descobrível (busca de pessoas)
1. **Identity**: caso de uso `SearchProfiles` (termo ≥ 2 chars, `name`/`username` ILIKE, limite 10–20, **só projeção pública I7** — sem e-mail/telefone) + método `searchProfiles` no repositório (RLS de select em `identity.profiles` já é anon/authenticated).
2. **Rota privada** `apps/web/src/app/amigos/buscar/page.tsx`: busca por query string `?q=`, resultados com `Avatar`, link para o perfil e `FriendButton` (relacionamento por resultado via `GetRelationshipForViewer`).
3. Link "Buscar pessoas" no cabeçalho e/ou em `/amigos/solicitacoes`.
4. **Testes**: unit (termo curto recusado, limite, projeção sem e-mail/telefone) + e2e (buscar usuário do seed → enviar pedido).

### T4 — UI de filtros do feed (gap conhecido, `status-lancamento` §4.1)
1. Componente cliente de filtros: cidade (`/api/geography/cities`), bairro (`/api/geography/neighborhoods`), tipo (problema/ideia) — navega por query string; `FeedPage`/`ListFeed` já leem `searchParams` (`apps/web/src/app/feed/page.tsx:28-39`), **sem mudança de domínio**.
2. `EmptyState` quando o filtro não retornar resultados.
3. **Testes**: e2e em `03-feed` (filtrar reflete na URL e na lista).

### T5 — Selo institucional visível no feed e na publicação (P13)
1. Card do feed e página `publicacao/[id]`: `Badge tone="institutional"` ao lado do autor quando `is_verified` (conferir se a projeção das listas já carrega o selo; ajustar repositório de publication se necessário).
2. **Testes**: e2e/atualizar spec existente usando `prefeitura-cariacica` do seed.

### T6 — Runbook de curadoria de bairros (B5, só doc)
1. `docs/03-data/runbook-curadoria-bairros.md`: fonte oficial → transcrição em `supabase/seed/sources/` com hash SHA-256 em `shared.app_metadata` → seed numerado idempotente → validar contagem → `db reset` (processo da Fase 3).
2. Registrar em README/geography: **cidades = 5.571 municípios completos**; bairros = curados por município (Cariacica/ES no lançamento).

### T7 — Validação integrada e commits (após "ok, roda")
1. `db reset` 2× seguidas (idempotência) → `build` → `start` → e2e mobile+desktop; Lighthouse ≥ 90 em `/` e `/feed` (registrar em `docs/status-design-2026-10-12.md`).
2. Commits por task (`feat(identity):`, `feat(social-graph):`, `feat(publication):`, `docs:`) — a árvore está sem commit desde `9014847`.

### T8 — Fechar derivas doc↔código (C1)
1. `supabase/seed/README.md`: 3 → 12 usuários de teste (conferir `03-dev-seed.sql`).
2. `docs/03-data/dicionario-dados.md`: `moderation.rate_limits` agora tem `subject_type`/`subject_id` (migration `20261016000011`) — alinhar.
3. ADR-0023 (motivos de denúncia): conferir registro vs. enum implementado.
4. `docs/status-lancamento-2026-10-13.md`: B1–B4 constam como não iniciadas mas estão implementadas no working tree — atualizar o status.

## Riscos

| Risco | Tratamento |
|---|---|
| e2e flaky (upload, Realtime, timing) | waits explícitos, sem assert de Realtime, execução em série |
| Next 16 Cache Components | `instant=false`/`connection()` em páginas com sessão; redimensionamento só no cliente |
| Edição de migration antiga | apenas local; `db reset` reaplica tudo |
| Buckets `avatars`/`covers` públicos | path com UUID do usuário + magic bytes no servidor |
| Busca de pessoas e privacidade | só projeção I7; teste negativo para e-mail/telefone |

## Fora de escopo

Deploy, OAuth de produção e domínio (C2 — configuração); bairros de municípios além de Cariacica (dados — só runbook); repositório Python de analytics (Fase 11); seguidores/feed de amigos (P25, evolução).

## Validação (comandos)

```
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm test --prefix apps/web
npm run build --prefix apps/web
npx --yes supabase db reset
npx playwright test --prefix apps/web        # mobile 375×667 e desktop 1280×720
```
