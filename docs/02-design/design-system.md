# Design System — tokens e regras

Base para as telas. Objetivo: consistência, acessibilidade AA e performance em celular.

## 1. Princípios

- **Mobile-first:** projetar em 375px de largura; desktop é o caso estendido.
- **Toque antes de mouse:** alvo mínimo 44×44px, espaçamento entre alvos ≥ 8px.
- **Conteúdo antes de chrome:** barras e menus não roubam altura em telas pequenas.
- **Servidor por padrão:** componentes de servidor; cliente só onde há interação/Realtime.
- **Progressivo:** PWA instalável, conteúdo legível offline.

## 2. Tokens

> A referência canônica é `referencia-rede-social-local/` (ADR-0024): verde azulado, coral,
> âmbar de categoria, papel branco e fundo verde muito claro. O coral de ações foi escurecido
> no app para manter contraste AA com texto branco; o restante da referência é preservado.

### Cor

| Token | Uso | Valor | Contraste (AA) |
|---|---|---|---|
| `--color-brand-600` | ações e links | teal `#0b6c70` | 6.19:1 em branco |
| `--color-brand-700` | hover de ação/link | `#075155` | 9.06:1 em branco |
| `--color-brand-50` | fundo de destaque, hover | `#dceeed` | — |
| `--color-brand-100` | chip institucional | `#c4e0de` | — |
| `--color-accent` | ação coral | `#b54230` | 5.55:1 em branco |
| `--color-idea` | marcador de ideia | âmbar `#d59b26` | decorativo; rótulo usa `#966811` |
| `--color-surface` | fundo da página | `#f2f7f5` | — |
| `--color-surface-raised` | cartões, cabeçalho (papel) | `#ffffff` | — |
| `--color-border-subtle` | bordas de cartão | `#dfe8e6` | — |
| `--color-text-strong` | títulos | `#17353b` | 12.8:1 em branco |
| `--color-text-body` | corpo de texto | `#52686c` | 5.91:1 em branco |
| `--color-text-muted` | metadados, datas | `#5f7073` | 5.18:1 em branco |
| `--color-success` | confirmações | `#4d7c0f` | — |
| `--color-danger` | remover, negar, erro | `#b53832` | 5.29:1 em `#fff0ec` |
| `--color-danger-hover` | hover do destrutivo | `#a83a35` | — |
| `--color-warning` | atenção, badge "moderação" | `#8a5a00` | 5.50:1 em `#fff6de` |
| `--color-danger-bg` / `-border` | fundo/borda de erro | `#fff0ec` / `#e9c4c0` | — |
| `--color-warning-bg` / `-border` | fundo/borda de atenção | `#fff6de` / `#eed8ad` | — |
| `--color-idea-text` / `-border` | rótulo e borda da categoria Ideia | `#966811` / `#eed8ad` | — |
| `--color-success-bg` | fundo de confirmação | `#f1f7e4` | — |

Tokens implementados em `apps/web/src/app/globals.css` (`@theme` do Tailwind 4). Os aliases
`surface`, `text-*` e `border-*` mantêm as páginas antigas na mesma paleta. Cores de estado
vêm dos tokens semânticos acima.

Estados de foco sempre visíveis: anel de 3px em `--color-brand-600` com offset de 2px.

### Espaçamento e superfícies

- Escala de 4px: `4, 8, 12, 16, 20, 24, 32, 48`.
- Cartões: raio de 14–16px; botões 12px; chips pílulas; badges radius 6px.
- Sombra de cartão: `--shadow-stamp` (`2px 2px 0 rgb(23 53 59 / 0.08)`).

### Tipografia

| Token | Tamanho / peso | Uso |
|---|---|---|
| `font-display text-2xl` bold | 24px/700 | título de página e número de estatística |
| `font-display text-xl` bold | 20px/700 | subtítulo de seção |
| `text-base` | 16px/400 | corpo de texto e **todo campo de formulário** |
| `text-sm` medium | 14px/500 | rótulos, botões secundários |
| `text-xs` | 12px/400 | metadados (mínimo absoluto; nada abaixo disso) |

Display: `ui-serif, Georgia, "Times New Roman", serif` em títulos semânticos. Corpo: Manrope,
com `system-ui` como fallback. Campos mantêm pelo menos `16px` para evitar zoom automático no iOS.

## 3. Componentes obrigatórios

`Button` (variantes primary/secondary/danger, tamanhos sm/md), `TextField`, `Textarea`,
`Select` (cidade/bairro em cascata), `Avatar` (com fallback gerado do nome), `Card`,
`EmptyState` (ícone + título + descrição + ação), `Badge` (tipo de publicação),
`ReactionBar` (apoio/oposição com contador), `CommentList`, `FriendshipButton`,
`ReportButton`, `ConfirmDialog` (confirmação de ações destrutivas), `Skeleton` (carregamento)
e o conjunto de ícones SVG inline (`shared/ui/icon.tsx` — sem emoji como ícone).

Local: `apps/web/src/shared/ui/`. Todos os campos têm `<label>` associado e erro anunciado
com `aria-describedby`.

**Desvio consciente — `Toast`:** não há pilha de toasts. O retorno de sucesso/erro de
formulário é **inline** (abaixo do campo que originou a ação, via `Alert`/`role="alert"`),
porque todas as ações passam por server action com `useActionState` — toasts flutuantes
duplicariam essa informação e sumiriam antes da leitura.

## 4. Regras de tela

- **Feed:** lista de cartões; cada cartão tem tipo, título, 2 linhas de resumo (`line-clamp-2`),
  autor ou "Anônimo", contagem de apoio/oposição e de comentários. Imagem miniatura só em
  telas maiores (`hidden sm:grid`).
- **Nova publicação:** formulário em tela cheia no celular; seleção de bairro obrigatória;
  upload com pré-visualização (miniatura + nome + remover) e indicação de progresso por
  arquivo; aviso claro sobre anonimato.
- **Perfil público:** capa, avatar, nome, badge institucional, bio, contadores (amigos,
  publicações, causas apoiadas), botão de amizade e a lista de publicações. Publicação anônima
  **nunca** é associada ao autor em leitura pública — só o dono, no próprio perfil, a vê
  marcada como anônima (P4).
- **Admin:** fila em cartões com ações; toda ação destrutiva ("Remover") pede confirmação
  (`ConfirmDialog`); ocultar/restaurar são imediatas.
- **Publicação oculta/apagada:** 404 silencioso para terceiros (RLS esconde a linha). Para o
  autor, uma tela explica que a moderação ocultou (ou que ele apagou) e que ela continua
  visível só para ele (P21).
- **Navegação:** em `sm+` os links ficam no cabeçalho. No celular (< 640px) há barra inferior
  fixa com 4 destinos (Feed, Publicar, Avisos, Perfil), alvos de toque de 44px e padding de
  área segura (`env(safe-area-inset-bottom)`); o `<main>` reserva `pb-24` para não ficar
  atrás da barra. Links secundários (Salvos, Amizades, Transparência) ficam no perfil/rodapé.
- **PWA (ADR-0013):** `app/manifest.ts` + ícones em `public/icons/` (gerados por
  `apps/web/scripts/generate-pwa-icons.mjs`) e service worker em `public/sw.js`. O SW cacheia
  apenas leitura pública (shell, a home/`/` — que é o feed, assets) e **nunca** rota autenticada, `/api` ou
  método que não seja `GET`. Cores do manifesto seguem os tokens (`theme_color` = brand-600,
  `background_color` = surface) — trocar a paleta exige regerar os ícones.

## 5. Acessibilidade (checklist)

- Contraste AA em texto e componentes interativos.
- Todos os campos com `<label>` associado; erro anunciado com `aria-describedby`.
- Navegação completa por teclado; ordem de foco lógica; `:focus-visible` sempre visível.
- Ícones com `aria-label` ou texto alternativo.
- Respeitar `prefers-reduced-motion`.
