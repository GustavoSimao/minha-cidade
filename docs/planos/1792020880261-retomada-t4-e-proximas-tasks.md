# Plano — Retomada: fechar T4 (filtros do feed) e fila seguinte

Criado em 2026-10-14 ~23:40 (modo plan), em resposta a "onde paramos / o que tem que
fazer?". Estado **verificado por leitura do working tree** nesta sessão — nada foi
executado. Implementação: agente code / `@task-executor` (modo plan não executa).

## Onde paramos (verificado agora)

- **Nada commitado desde `1e373a3` (12/10)**; último commit de código é `9014847`
  (Publication, 10/10). Todo o trabalho vive no working tree.
- Fontes da verdade do andamento: `docs/status-execucao-2026-10-14.md` e
  `docs/planos/1791938523555-retomada-pos-b1-b4.md` (seção "ESTADO DE EXECUÇÃO",
  atualizada ~04:00 de hoje). Este plano só **confirma** o estado e detalha o próximo passo.
- Fase 0 (V0) ✅: `db reset` limpo, 208 testes unit, lint/typecheck/build verdes,
  e2e 62/62 antes das mudanças de T4.
- T2 (foto/capa do perfil) ✅ e T3 (busca de pessoas) ✅ — com e2e 07-perfil 10/10 e
  12-descoberta 12/12.
- **T4 (UI de filtros do feed) 🔄 — parou exatamente aqui.** Código escrito e
  compilando; dois testes e2e falhando, ambos com causa conhecida e fix de 1 linha.
  Confirmei nesta sessão que **nada mudou desde o handover**: os dois defeitos seguem
  no lugar descrito abaixo.

## Task 1 — T4: corrigir os dois defeitos e deixar o 03-feed verde

### 1a. `apps/web/src/shared/ui/feed-filters.tsx:176-185` — botão "Buscar" zera resultados

Hoje o handler faz `setTerm("")` + `setSearchRequest({ term: "", loading: false,
items: cityOptions, error: null })`. Quando o clique acontece durante o debounce
(`loading: true`), `cityOptions` sai vazio (o memo só inclui itens quando
`!loading`, linha 56) e o `cleanup` do efeito (linha 98) cancela o fetch pendente —
a busca nunca completa e o chip "Cariacica — ES" não aparece (falha do teste
`03-feed.spec.ts:46-47`).

Correção: **não limpar o termo**; re-disparar a busca:

```tsx
onClick={() => {
  setSearchRequest({ term, loading: true });
}}
```

O efeito com debounce (linhas 68-99) refaz o fetch com `term`. Com o input vazio a
rota `/api/geography/cities` aceita `q=""` e devolve a lista default
(`cities/route.ts:9,13` — só rejeita termo com 1 char) — comportamento aceitável.

### 1b. `apps/web/tests/e2e/03-feed.spec.ts:65-70` — URL do "filtro sem resultado"

A URL atual `/feed?cidade=3205309&tipo=nada` **não esvazia o feed**: `tipo=nada` é
inválido e não filtra, e Vitória tem a publicação da ciclovia. Trocar por bairro
inexistente em Cariacica:

```ts
await page.goto("/feed?cidade=3201308&bairro=00000000-0000-0000-0000-000000000000");
```

O estado vazio já existe: `feed/page.tsx:126` mostra "Nenhum resultado para os
filtros" quando há filtro ativo e zero itens.

### Validação da Task 1

```
npx playwright test 03-feed --reporter=line     # 14 testes
npx playwright test --reporter=line             # suíte completa, mobile + desktop
npm test -- --run                               # unitários
npm run lint; npm run typecheck; npm run build  # em apps/web
```

## Task 2 — T5: selo institucional no card do feed e em `publicacao/[id]`

Verificado: `Badge tone="institutional"` aparece **só** em
`app/perfil/[username]/page.tsx:126` e `app/perfil/editar/page.tsx:87`. Falta:

1. Conferir se a projeção das listas de publication carrega `is_verified` /
   `verified_org`; ajustar o repositório de publication se não carregar.
2. Renderizar o selo ao lado do autor no card do feed e em `publicacao/[id]`.
3. e2e com o usuário `prefeitura-cariacica` do seed (atualizar o spec 03-feed, que
   hoje só cobre o selo no perfil).

## Task 3 — T6: runbook de curadoria de bairros (só doc)

Verificado: `docs/03-data/` não tem `runbook-curadoria-bairros.md` (só
convencoes-schema, catalogo-ibge, dicionario-dados, politica-rls). Escrever:
fonte oficial → transcrição em `supabase/seed/sources/` + hash em
`shared.app_metadata` → seed numerado idempotente → validar contagem → `db reset`.
Registrar no README/geography: cidades = 5.571 municípios completos; bairros =
curados por município (só Cariacica/ES no lançamento).

## Task 4 — S1–S6: Hub "Amigos" (decisões D-1…D-9 já travadas)

Nenhuma iniciada. Seguir a seção "Fase 1B" do plano
`docs/planos/1791938523555-retomada-pos-b1-b4.md` (banco/projeção → Identity →
Social Graph → interface → perfil → testes/docs). S1 e parte de S2 já foram feitas
junto com T2 (coluna `show_neighborhood` + projeção I7 condicionada) — **revisar se
falta algum ponto de leitura** antes de reimplementar.

## Task 5 — Incongruências (seção "Fase 2" do plano de retomada)

A1 feed com sessão/convite de bairro; A3 dropdown no sininho; A3b link `/admin` no
cabeçalho (staff); A4 Realtime de amizades ou ajuste do README; B1–B4 derivas de doc
(README 12 usuários, dicionário 5º tipo, `status-lancamento`, ADR do desvio B2);
A6–A8 casos de uso de Identity/Publication (páginas chamam repositório direto).

## Task 6 — Fase 3: verificação integrada + commits

`db reset` 2× (idempotência) → build → start → e2e mobile+desktop → Lighthouse `/` e
`/feed`. **Commits somente após o "ok, roda" do usuário**, um por contexto
(`feat(publication)`, `feat(identity)`, `feat(social-graph)`, `docs:`, ...).

## Ambiente, armadilhas e validação

Não duplicado aqui de propósito — usar as seções "Ambiente", "Armadilhas" e
"Comandos de validação" de `docs/status-execucao-2026-10-14.md` (Docker no ar,
`npm run dev` em apps/web reutilizado pelo Playwright, `npx --yes supabase`,
armadilhas de server-only em cliente, FormData de checkbox, HMR stale, PowerShell
sem heredoc). Observações abertas do task-observer já conhecidas e cobertas por essas
armadilhas: 0001 (fronteira cliente/servidor invisível ao typecheck) e 0002 (HMR
stale até reiniciar o dev).

## Fora de escopo

D1/D2 (desafios, salas — só registro); deploy/OAuth produção/domínio (configuração);
bairros de outros municípios (dados — só runbook); repo Python de analytics (Fase 11).

## Notas

- Modo plan não executa: todas as tasks acima são para o `@task-executor`, uma por
  vez, com lint/typecheck/teste/build verdes antes de seguir.
- Commits só após "ok, roda" (regra combinada, não reabrir).

## Registro de execução (2026-10-14 ~21:00–22:00, agente code)

**Tasks 1–3 concluídas e validadas.** O que foi feito além do previsto está marcado.

- **Task 1 (T4) ✅** — `feed-filters.tsx`: botão "Buscar" agora faz
  `setSearchRequest({ term, loading: true })` (mantém o termo); removidos o memo
  `cityOptions` e o estado `selectedCity` (ficaram sem uso). `03-feed.spec.ts`:
  URL do estado vazio trocada para `/feed?cidade=3201308&bairro=00000000-...`.
- **Task 2 (T5) ✅** — `PublicAuthor` (ports da publication) ganhou
  `isVerified`/`verifiedOrg`; `SupabaseAuthorDirectory` passou a projetá-los;
  `Badge` ganhou prop `testId`; selo `institutional` renderizado no card do feed
  (`feed/page.tsx`) e em `publicacao/[id]`; e2e 03-feed cobre os dois lugares
  (`institutional-badge`).
- **Task 3 (T6) ✅** — novo `docs/03-data/runbook-curadoria-bairros.md`;
  `catalogo-ibge.md` §6 aponta para ele; `supabase/seed/README.md` ganhou o ponteiro
  e a contagem correta de usuários do dev-seed (12, não 3).
- **Bug extra 1 (regressão do T2, corrigido)** — `profile-forms.tsx` renderizava
  `<img src="">` (escondido por CSS) em `/perfil/editar`, quebrando o spec
  09-console (erro de console). Agora o `<img>` só renderiza quando há URL.
- **Bug extra 2 (limite de uso, corrigido com migration + teste)** — os contadores
  `moderation.rate_limits` usavam a chave `(subject, scope, window_start)` sem o
  **tipo** da janela: entre 00:00 e 01:00 UTC o início da janela horária e o da
  diária coincidem (meia-noite), os dois limites compartilhavam a mesma linha e a
  4ª publicação da hora já era bloqueada (o teste unitário falhava justamente
  nessa faixa do dia). Correção: coluna `"window"` (`hour`/`day`, palavra
  reservada — sempre entre aspas) na chave; migrations 20261014000007 e
  20261016000011 editadas; porta/aplicação/repositório passam `policy.window`;
  dicionário de dados atualizado; teste de regressão com relógio falso em
  00:30 UTC (`hora e dia não compartilham contador...`).
- **Validação final** — unit 209/209 (208 + regressão), e2e **82/82** (mobile +
  desktop, exit 0), lint/typecheck/build verdes; prod (`next start`) serviu
  `/feed?cidade=3201308` 200 com o selo institucional no HTML.
- **Armadilha nova (observação 0003 do task-observer)** — a suíte e2e emite ruído
  `[WebServer] ... unstable value Date.now() while prerendering` (worker de
  validação das Cache Components do Next 16 em dev) **sem que os testes falhem**;
  o veredito sai da linha de resumo/exit code. O `background_process monitor` tem
  teto de 200 linhas e esconde o resumo — rodar suítes longas redirecionando para
  `$env:TEMP\kilo\*.log` e grepar.

**Pendente (tasks 5–6 do plano, na ordem):** incongruências (A1, A3, A3b, A4,
B1–B4, A6–A8) e Fase 3 (db reset 2×, build, start, e2e, Lighthouse + commits
após "ok, roda"). Observação: a Task 2 removeu a deriva B1 do
`supabase/seed/README.md`; a do README raiz segue pendente na Task 5.

## Registro de execução 3 (2026-10-15 ~13:00–14:10, agente code) — S1–S6 Hub Amigos

**Executado e validado — task 4 do plano fechada.**

- **S1/S2 (já vinham de T2/T3):** `show_neighborhood` + projeção I7 condicional +
  busca de pessoas. Nada refeito.
- **S3:** portas novas em `ProfileLookup` (`findOwnNeighborhoodId`,
  `listPeopleByNeighborhood`, `listPeople` — devolvem `PersonCard`) implementadas
  via duas listas públicas na API de Identity (`listPublicViewsByNeighborhood`/
  `listPublicViews` — a projeção I7 continua em um lugar só). Use cases
  `SuggestFriends` (mesmo bairro; exclui própria pessoa, amigos e pendentes nos
  dois sentidos; opt-out continua sugerível — D-6; limite 10) e
  `DiscoverRandomPeople` (plataforma; `exclude[]` com teto 20; limite 5) +
  `ListOutgoingFriendRequests` (enviados com cancelar — C2). 11 testes unit novos.
- **S4:** hub `/amigos` com 3 abas (`?tab=amigos|solicitacoes|sugestoes`) e
  contadores; `/amigos/descobrir` com cartões e "pular" acumulando `?exclude=`;
  estado vazio honesto com convite de bairro (D-8); `PersonRow` compartilhado;
  `/amigos/solicitacoes` redireciona para a aba; cabeçalho com "Amizades" →
  `/amigos` e novo link "Descobrir pessoas".
- **S5:** já coberto por T2 (checkbox em `ProfileForm`).
- **S6:** e2e `12-amigos-hub.spec.ts` (7 testes × 2 viewports) + docs
  (`social-graph.md` §6/§8, README).

**Lição de isolamento (importante):** a primeira versão do e2e mutava amizades da
Ana (seed) e passava isolada, mas quebrava na suíte completa — os dois projetos
de viewport rodam o mesmo arquivo em paralelo contra o mesmo banco. Reescrito com
usuários frescos (padrão do repo) e asserções de contagem por existência.

**Validação:** unit **240/240**, lint/typecheck limpos, build verde (30 rotas),
e2e **104/104** (13 specs, mobile + desktop, exit 0).

## Registro de execução 2 (2026-10-15 ~01:30–02:40, agente code)

**Varredura de bugs (auditoria read-only + verificação própria) e correções.**

Achados confirmados e corrigidos:

1. **P2 — `/?bairro=X` sem `cidade`** — o servidor filtrava, mas o seletor de bairro
   não inicializava (a cascata precisa da cidade na URL). Correção: `app/page.tsx`
   canonicaliza resolvendo a cidade dona do bairro e redirecionando
   `/?cidade=<ibge>&bairro=<id>`; nota na spec (`publication.md`); teste de
   regressão em `03-feed.spec.ts` (UUID do bairro vem da API, não fixo). Durante a
   verificação o fix quebrou uma vez (`cityId` é `IbgeCode`, não `number` —
   `cidade=[object Object]`) e foi pego pelo curl antes do e2e.
2. **P3 — sininho Realtime sem filtro de usuário** — o canal escutava INSERT em
   `notification.notifications` inteiro; contagem subia com notificação alheia até o
   `router.refresh()`. Correção: `userId` passado do `site-header` +
   `filter: user_id=eq....` no canal (`notification-bell.tsx`).
3. **P3 — perfil truncava em silêncio** — publicações com `limit: 20` sem aviso.
   Correção: "Mostrando as N mais recentes de M" quando há corte
   (`perfil/[username]/page.tsx`). Amigos já tinham contador + link "ver lista".
4. **P3 — 404 default** — criado `app/not-found.tsx` com identidade (EmptyState +
   voltar ao feed).

Validação: lint/typecheck limpos, unit 209/209, e2e 03-feed 16/16 (com o teste novo),
07-perfil + 09-console 26/26 (03+07+09 na mesma rodada), smoke manual das
canonicalizações (`/?bairro=…` e `/feed?bairro=…` → `/?cidade=3201308&bairro=…`).
Sem commit.

**Achados verificados OK (sem correção):** rate limit ligado em publicação
(5/h, 20/d, IP 30/h), comentário (20/h) e denúncia (10/dia); migration `"window"`
(constraint/backfill/unique/quoting) aplicada limpa; upload com magic bytes e
teto de 10 MiB; RLS de publicações com `or auth.uid() = author_id`; anonimização
no encerrar conta (triggers + grants); badge flow ponta a ponta; redirect `/feed`;
sw.js v2; smoke HTTP de 21 rotas (públicos 200, privados 307, inexistente 404).
**Não verificado:** OAuth Google (config produção), encerrar conta ponta a ponta
(sem e2e), marcar notificações como lidas (sem e2e).
