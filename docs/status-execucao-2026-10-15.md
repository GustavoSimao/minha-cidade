# Status de execução — 2026-10-15 (handover para a próxima sessão)

> Snapshot às ~18:50 (fim do dia). Continua `docs/status-execucao-2026-10-14.md`
> (T4/T5/T6) e `docs/status-design-2026-10-12.md` (Lighthouse). Planos com registro
> de execução: `.kilo/plans/1792020880261` (T4→Fase 3),
> `.kilo/plans/1792036500000` (feed na raiz), `.kilo/plans/1792042800000`
> (selo em comentários + solicitação de selo).

## Estado do repositório (após os commits do dia)

- **18 commits em `main` sobre `1e373a3`** — 217 arquivos, +22.930 linhas. Um por
  contexto: `chore(platform)`, `feat(identity)`, `feat(geography)`,
  `feat(publication)`, `feat(engagement)`, `feat(social-graph)` (+migration),
  `feat(moderation)`, `feat(notification)`, `feat(analytics)`, `feat(pwa)`,
  `feat(ui)`, `docs`, `chore(kilo)`, `fix(publication)` (RLS do soft-delete),
  `refactor(seed)` (renomes 01/02).
- **Push NÃO feito** — `git push` quando quiser (origem já configurada).
- `.env.local`, `.next`, `test-results` fora do versionamento;
  `supabase/.branches/` e `supabase/.temp/` (estado do CLI) no `.gitignore`.
- **Ambiente desligado** (shutdown a pedido): dev server parado, stack Supabase
  parada, Docker Desktop parado. Para retomar:
  `docker desktop start` → `npx supabase start` (ou `npm run setup:local`) →
  `npm run dev --prefix apps/web` (porta 3000). O banco persiste no volume; se
  quiser o estado do seed de novo: `npx supabase db reset`.
- Último estado do banco antes do shutdown: migrations até `20261016000011` +
  seed com **13 usuários** (inclui `secretaria@minhacidade.dev` com pedido de
  selo **pendente** para a demo B2G). Senha única do seed: `Cidade@123`.
- Validação no estado commitado: **unit 240/240**, lint/typecheck limpos,
  build verde, e2e **104/104** (rodada antes dos commits; nada em `src/` mudou
  desde então).

## Feito nesta sessão (2026-10-15, validado)

1. **Varredura de bugs** (auditoria read-only + verificação própria): smoke HTTP
   de 21 rotas, correções — canonicalização de `/?bairro=X` sem cidade
   (`app/page.tsx` + teste em `03-feed`), sininho Realtime filtrado por usuário
   (`notification-bell.tsx`), aviso honesto de truncamento no perfil, e
   `app/not-found.tsx`.
2. **Feed virou a home** (`/` = feed; `/feed` = redirect que preserva query;
   landing removida): `app/page.tsx`, links internos, `manifest.ts`, `sw.js`
   (cache v2), e2e e docs. Lighthouse mobile na home: **92/100/100**.
3. **Plano `1792042800000` — selo institucional em comentários + solicitação de
   selo** (jornada 6 do PRD), completo:
   - `engagement`: `PublicCommentAuthor` com `isVerified`/`verifiedOrg`;
     Badge nos comentários (`comment-item.tsx`) + e2e em `04-engajamento`.
   - migration `20261015000009_identity_badge_requests.sql` (tabela, índice
     único parcial de pendência, RLS dono-only, fila service_role).
   - Identity: `RequestBadge`/`ListMyBadgeRequest` + repositório; tela
     `/solicitar-selo` (4 estados) e link em `/perfil/editar`.
   - Moderation: `ListBadgeRequests`/`ApproveBadgeRequest`/`RejectBadgeRequest`
     (aprovar concede via o mesmo `GrantBadge`); seção "Solicitações de selo" no
     `/admin`.
   - migration `20261016000009` estendida: `approve_badge_request`/
     `reject_badge_request` no CHECK da trilha.
   - seed: `secretaria-meio-ambiente` com pedido pendente; docs (dicionário,
     spec `identity-access.md`, README).
4. **Dois bugs achados pelo e2e e corrigidos**: (a) `TextField`/`Textarea`/
   `Select` usavam `name` como id HTML → com vários forms na página os labels
   apontavam para o input errado; corrigido com `useId()` (+`"use client"`) e
   removido o `defaultValue={username}` do dialog; (b) CHECK da trilha (acima).

**Validação atual**: unit **240/240**, lint/typecheck limpos, build verde
(30 rotas), e2e **104/104** (13 specs, mobile+desktop, exit 0). Inclui o Hub
`/amigos` (S1–S6) concluído na segunda sessão do dia.

## O que falta (fila, na ordem)

1. **S1–S6 — Hub `/amigos`** ✅ **concluído hoje (segunda sessão)** — baixo em
   `contexts/social-graph/application/use-cases.ts` (`SuggestFriends`,
   `DiscoverRandomPeople`, `ListOutgoingFriendRequests`) + duas listas públicas
   na API de Identity; hub `/amigos` com 3 abas e contadores; `/amigos/descobrir`
   com "pular" (`?exclude=`); cabeçalho com "Amizades" → `/amigos` e "Descobrir
   pessoas"; `/amigos/solicitacoes` redireciona para a aba; e2e
   `12-amigos-hub.spec.ts` e docs. Atenção à lição de isolamento: testes que
   mudam estado do seed quebram na suíte completa (os viewports rodam em
   paralelo) — as mutações usam usuários frescos.
2. **Incongruências**: A1 convite "escolha seu bairro" + fallback cidade no feed
   (P1); A3 dropdown do sininho (hoje é link); A3b link `/admin` no cabeçalho
   para staff; A4 Realtime de amizades; B1–B4 derivas de doc; A6–A8 (páginas
   chamando repositório direto em vez de use case).
3. **Fase 3**: `db reset` 2× → build → start → e2e → Lighthouse (`/` e `/feed`)
   → commits (um por contexto, após "ok, roda").

## Armadilhas vividas hoje (não redescobrir)

- **Ruído do validation worker**: a suíte e2e emite `[WebServer] … unstable value
  Date.now() while prerendering` no stderr sem falhar teste — veredito sai da
  linha de resumo/exit code; `background_process monitor` (teto de 200 linhas)
  esconde o resumo: rode suítes longas redirecionando para
  `$env:TEMP\kilo\*.log` e grepe. (observação 0003)
- **Server action com efeito colateral antes do erro passa em e2e** se a próxima
  asserção navegar para outra página — sempre confira a mensagem/estado da
  action antes de navegar. (observação 0004)
- Após mexer muito no código, **reinicie o dev server** antes do e2e (HMR stale).
- `next build` suja `.next` e o dev passa a emitir o ruído de validação (não é
  falha); `docker desktop start` está allowlisted nas permissões do repo.

## Próxima sessão — comandos de partida

```powershell
docker ps                                   # stack no ar?
npm run dev --prefix apps/web               # http://localhost:3000 (se não estiver rodando)
npx playwright test --reporter=line         # e2e (saída para $env:TEMP\kilo\suite.log e grepar)
npm test --prefix apps/web -- --run         # unit
```

Contas úteis: `ana@` (usuária), `carla@` (admin), `marco@` (moderador),
`prefeitura@` (selo), `secretaria@` (pedido de selo pendente) — senha
`Cidade@123`.
