# Plano — Design: correções, completude e identidade visual

> Gerado em 2026-10-12 a partir da varredura de design de `apps/web` + `docs/02-design`.
> Escopo aprovado: **corrigir bugs + completar design system/fluxos + nova identidade visual**.
> Escopo de implementação: somente `apps/web`, `docs/02-design`, `docs/04-contexts` (specs) e
> `supabase/migrations` (as tarefas que alteram comportamento de domínio exigem spec atualizada — DoD).

## Contexto (achados que motivam o plano)

Bugs verificados no código:

- D1 classes `text-primary`/`border-primary`/`bg-primary/10` não existem (token é `brand-*`) —
  `reaction-buttons.tsx:62`, `comment-item.tsx:107`, `perfil/[username]/page.tsx:149`,
  `admin/page.tsx:96`, `amigos/[username]/page.tsx:45`.
- D2 `/transparencia` linkado no cabeçalho sem rota (`site-header.tsx:51`).
- D3 links de navegação com alvo de toque < 44px (`site-header.tsx:44-81`).
- D4 `text-[10px]` (`comment-item.tsx:58`) e `text-[11px]` (`notification-bell.tsx:60`).
- D5 `variant="danger"` em ações não destrutivas (`save-button.tsx:59`, `friend-button.tsx:127`).

Divergências doc ↔ código: feed sem resumo/reação/contador (D6), publicar sem preview/progresso (D7),
perfil sem contadores e sem conteúdo próprio (D8), componentes obrigatórios ausentes (D9),
`<img>` em vez de `next/image` (D10), paleta crua fora dos tokens (D11), larguras inconsistentes (D12),
emoji como ícone + assets do starter em `public/` (D13), PWA inexistente (D14), dicionário de dados
desatualizado em `friendships` (D15), publicação oculta devolve 404 genérico (D16).

## Decisões travadas

1. Nomes semânticos de token **não mudam** (`brand`, `surface`, `text-*`, `success/danger/warning`,
   `radius-card`) — a Etapa C altera apenas valores, para não gerar churn nos componentes.
2. Feedback de sucesso de formulários continua **inline** (padrão `state.message`/`Alert`); `Toast` do
   design system §3 fica como **desvio documentado** em `design-system.md`, não implementado.
3. `/transparencia` vira placeholder honesto nesta etapа; métricas reais continuam na Fase 10
   (analytics no banco + Recharts) — fora deste plano.
4. Ações destrutivas (apagar publicação, encerrar conta, remover conteúdo na moderação) passam a exigir
   confirmação via `ConfirmDialog`.
5. Service worker cacheia **apenas** leitura pública (`/feed`, `/publicacao/*`, assets estáticos);
   nunca rotas autenticadas (`/salvos`, `/notificacoes`, `/admin`, `/perfil/editar`).
6. `dicionario-dados.md` e specs de contexto são atualizadas no mesmo change (workflow §1).

---

## Etapa A — corrigir os bugs (D1–D5)

- [ ] **A1. Tokens `primary` → `brand-*`** — substituir nos 5 arquivos; estado ativo da reação fica
      `border-brand-600 bg-brand-50 text-brand-700`.
- [ ] **A2. Criar `src/app/transparencia/page.tsx`** — placeholder com `metadata`, `EmptyState`,
      texto explicando que as métricas chegam com a camada de analytics (sem números inventados).
- [ ] **A3. Alvos de toque no cabeçalho** — `min-h-11 inline-flex items-center` nos links de navegação.
- [ ] **A4. Tipografia mínima** — `text-[10px]`/`text-[11px]` → `text-xs`; no contador do sininho usar
      `min-w-6 px-1` para caber "99+" a 12px.
- [ ] **A5. Semântica de cor** — `SaveButton` "salvo" → `secondary`; `FriendButton` estado `friends` →
      `secondary` (danger fica só para apagar/remover/encerrar).

**Validação A:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (apps/web) e
conferência visual em 375px.

---

## Etapa B — completar design system e fluxos (D6–D16)

### B1. Componentes base novos (`src/shared/ui/`)
- [ ] `empty-state.tsx` — `EmptyState({ icon?, title, description, action? })`.
- [ ] `skeleton.tsx` — `Skeleton` + `CardSkeleton`.
- [ ] `confirm-dialog.tsx` — `role="dialog"` + `aria-modal`, Escape fecha, foco no diálogo ao abrir,
      variantes `default`/`danger`; client component.
- [ ] `select.tsx` — wrapper de `<select>` nativo com `label`/`id` (mata string de classes duplicada).
- [ ] `textarea.tsx` — idem para `<textarea>`.

### B2. Aplicar os componentes
- [ ] Trocar `<select>`/`<textarea>` crus por `Select`/`Textarea` em `location-picker.tsx`,
      `report-button.tsx`, `comment-form.tsx`, `publication-form.tsx`, `publication-edit-form.tsx`,
      `profile-forms.tsx`, `comment-item.tsx`.
- [ ] Estados vazios com `EmptyState` em: feed, `notificacoes`, `salvos`, `amigos/[username]`,
      `amigos/solicitacoes`, `/admin` (fila e trilha), `comment-list`, amigos no perfil.
- [ ] `ConfirmDialog` em: `DeletePublicationButton`, `CloseAccountForm`, ação "Remover" do
      `ModerationActions`.

### B3. Imagens (`next/image`)
- [ ] `next.config.ts`: `images.remotePatterns` para o host do Supabase (derivar de
      `NEXT_PUBLIC_SUPABASE_URL`, incluindo `127.0.0.1` em dev); `formats: ["image/webp"]`.
- [ ] Substituir `<img>` em `avatar.tsx`, `feed/page.tsx`, `publicacao/[id]/page.tsx`; miniatura do
      feed com `sizes` adequado; remover os `eslint-disable` de `no-img-element`.

### B4. Feed conforme design system §4
- [ ] Resumo com `line-clamp-2`; miniatura só em `sm+` (`hidden sm:grid`); linha com contagem de
      apoio/oposição e de comentários (link para a publicação).
- [ ] Contadores no feed exigem mudança de comportamento: **migration** criando
      `publication.feed_counts` (view) ou RPC equivalente com `grant select` para `anon`/`authenticated`,
      sem expor `author_id` quando `is_anonymous`; `SupabasePublicationRepository.listFeed` passa a
      devolver os contadores; **atualizar `docs/04-contexts/publication.md`** e o dicionário de dados;
      teste de unidade do mapper.

### B5. Perfil público
- [ ] Estender a projeção pública (`identity`) com `publicationsCount` e `supportedCausesCount`
      (contagem por ID, sem JOIN entre schemas — D7); **atualizar `identity-access.md`** + repositório.
- [ ] Nova aba/lista "Publicações" do próprio usuário em `perfil/[username]` usando
      `listByAuthor` do contexto publication (esconder `is_anonymous` de terceiros, P4);
      **atualizar `publication.md`**.
- [ ] `listByAuthor` no repositório + caso de uso; estado vazio com `EmptyState`.

### B6. Publicar
- [ ] Pré-visualização das imagens enviadas (miniatura + nome + remover) e indicação de progresso
      (`XMLHttpRequest` ou `fetch` + estado por arquivo), respeitando o limite de 3 e 10 MiB.

### B7. Navegação mobile
- [ ] Barra inferior fixa em `sm:hidden` com 4 abas (Feed, Publicar, Notificações, Perfil),
      `min-h-11`, `aria-current`, `pb-[env(safe-area-inset-bottom)]`; links secundários
      (Salvos, Amizades, Transparência) saem do header em mobile e ficam no perfil/rodapé.

### B8. PWA (ADR-0013)
- [ ] `public/manifest.webmanifest` (name/short_name, `start_url: /feed`, `display: standalone`,
      `background_color`/`theme_color` com token `brand-600`).
- [ ] Ícones 192/512 + maskable + `apple-touch-icon` (substituir os SVGs do starter; **apagar**
      `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` de `public/`).
- [ ] Service worker versionado (client component de registro) com cache-first de assets,
      network-first de `/feed`, **exclusão** de rotas autenticadas e de POST; aviso de "novo
      conteúdo disponível".

### B9. Consistência e docs
- [ ] Tokens derivados em `globals.css` (`--color-danger-bg`, `--color-danger-border`, `warning-*`,
      `success-*`, `--color-brand-hover`) e uso em `badge.tsx`, `form.tsx` (fim de `amber-50`,
      `red-50`, `red-700`, `green-50`).
- [ ] Larguras: leitura `max-w-2xl` (corrigir `/salvos`), gestão `/admin` `max-w-4xl`.
- [ ] Publicação oculta/removida pela moderação devolve mensagem própria (não 404 genérico):
      `GetPublication` passa a distinguir "não existe" de "oculta/removida"; **atualizar
      `publication.md`** + teste.
- [ ] Substituir emojis (🔔, ✓) por ícones SVG inline com `aria-hidden` + rótulo textual.
- [ ] `docs/03-data/dicionario-dados.md`: `friendships` → `user_low`/`user_high`/`requested_by`/
      `responded_by`.
- [ ] `docs/02-design/design-system.md`: registrar o desvio de `Toast`, os novos componentes
      (`EmptyState`, `Skeleton`, `ConfirmDialog`, `Select`, `Textarea`), a barra inferior mobile e
      as regras de cache do service worker.

**Validação B:** lint/typecheck/test/build; `supabase db reset` com conferência do seed
(5571 cidades, 100 bairros, 3 buckets, 3 usuários) e teste negativo de RLS na view de contadores;
375/768/1280.

---

## Etapa C — identidade visual (sair do padrão shadcn/índigo)

- [ ] **C1. Diagnóstico de "AI tells"** — carregar a skill `avoid-ai-design` e rodar
      `scripts/detect.mjs` em `apps/web/src`; registrar os achados no plano de execução.
- [ ] **C2. Gate de decisão com o usuário** — apresentar 2–3 direções estéticas (da referência
      `aesthetic-directions.md` da skill) adequadas a um produto cívico de bairro; **recomendação
      padrão: direção "praça/municipal"** — paleta quente de concreto e ocre, tipografia display
      serifada do sistema para títulos + grotesk para interface, bordas mais retas e sombra dura
      discreta (evitando o par cream/terracota e o near-black/acid-green, ambos catálogo de tells).
      Confirmar antes de C3.
- [ ] **C3. Novos tokens** (só valores) em `globals.css @theme`: paleta `brand-*`, `surface`,
      `surface-raised`, `border-subtle`, `text-strong/body/muted`, `success/danger/warning`,
      `--font-display`, `--radius-*`, `--shadow-card`. Manter os nomes semânticos (decisão 1).
- [ ] **C4. Tipografia** — `--font-display` com stack do sistema (sem webfont na primeira pintura,
      regra de performance do design system) aplicada a `h1`/números de destaque.
- [ ] **C5. Aplicar nas superfícies** — home, cartão do feed, página da publicação, perfil,
      cabeçalho/rodapé, `EmptyState`, botões/inputs/badges. `/admin` mantém funcional, sem redesign.
- [ ] **C6. Documentar** — novo **ADR-0022 (identidade visual)** com contexto, decisão,
      consequências e alternativas descartadas; reescrever a tabela de tokens e a seção de
      tipografia de `design-system.md`; revisar `manifest.webmanifest` (cores) e ícones.
- [ ] **C7. Verificação** — contraste AA em todos os pares novo-token (texto/borda/interativo),
      re-rodada do detector de tells, Lighthouse mobile (Performance/Acessibilidade/Best Practices)
      em `/` e `/feed`.

**Validação C:** lint/typecheck/test/build; contraste AA conferido par a par; Lighthouse ≥ 90 nos
três eixos após B3 + B8.

---

## Riscos

| Risco | Mitigação |
|---|---|
| `next/image` com URL assinada do Storage quebra imagem | `remotePatterns` cobre host do Supabase + `127.0.0.1`; validar em dev e no build |
| Service worker servindo conteúdo velho/rota privada | cache versionado, lista de exclusão de rotas autenticadas, sem cache de POST |
| View/RPC de contadores vazar autoria anônima | `grant select` só das colunas de contagem; teste negativo de RLS |
| Paleta nova falhar contraste AA | verificação par a par antes de aplicar (C7) |
| Etapa C gerar churn nos componentes | nomes de token preservados; B9 elimina paleta crua antes |
| Mudança de comportamento sem spec | tarefas B4/B5/B9 marcadas com atualização obrigatória de spec (DoD) |

## Fora de escopo

Métricas reais de `/transparencia` (Fase 10), repo Python de analytics (Fase 11), deploy/domínio
(Fase 12), suíte Playwright (Fase 9), modo escuro (registrar como fora de escopo no design system).

## Ordem de execução

A → B1/B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → (gate C2) → C3 → C4 → C5 → C6 → C7.

---

## Execução (2026-10-12)

**Etapas A, B e C entregues.** Resumo do que ficou pronto:

- **A** bugs corrigidos; **B** componentes, estados vazios, confirmações destrutivas, `next/image`,
  feed com contadores (integração por ID/ID-driven, D7), perfil com contadores e publicações
  (anonimato preservado para terceiros — P4), upload com prévia/progresso, barra inferior mobile,
  PWA (manifest + ícones gerados + service worker só de leitura pública).
- **C** identidade "praça/municipal" (ADR-0022): concreto frio, papel, tinta, acento verde-garrafa,
  display serifado do sistema, raio 8px, sombra-stamp. **A primeira proposta (creme + ocre) foi
  descartada** porque o detector do repo marca esse par como SD1 ("Claude look") — paleta trocada
  antes de aplicar, 19 pares de contraste conferidos (mínimo 4.56:1).
- **Detector `avoid-ai-design`: 0 achados** (P0/P1/P2) ao final.
- Validação: lint, typecheck, 184 testes (3 novos em `aggregate-counts`) e build de produção verdes;
  rotas conferidas em dev e em `next start`.

**Achado de execução — ruído em dev:** na primeira requisição após subir o `next dev`, o log mostra
`Date.now() ... while prerendering` apontando para `SiteHeaderSlot`. Investigado: **não ocorre no
build de produção** (todas as rotas 200 e sem erro em `next start`); é artefato do passe de
prerender do Turbopack em dev, com `cacheComponents` ligado. Mitigação aplicada mesmo assim: o
cabeçalho passou a ler a projeção pública do perfil em vez de montar a entidade `Profile`
(que carrega `DomainEvent.occurredAt = new Date()`), evitando leitura de relógio no render
logado.

**Pendente conhecido:** Lighthouse (Performance/Acessibilidade ≥ 90) precisa de navegador real —
rodar no DevTools do navegador sobre o `npm run build` + `npm start`, não em dev.

