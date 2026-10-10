# Design System — tokens e regras

Base para as telas. Objetivo: consistência, acessibilidade AA e performance em celular.

## 1. Princípios

- **Mobile-first:** projetar em 375px de largura; desktop é o caso estendido.
- **Toque antes de mouse:** alvo mínimo 44×44px, espaçamento entre alvos ≥ 8px.
- **Conteúdo antes de chrome:** barras e menus não roubam altura em telas pequenas.
- **Servidor por padrão:** componentes de servidor; cliente só onde há interação/Realtime.
- **Progressivo:** PWA instalável, conteúdo legível offline.

## 2. Tokens

### Cor

| Token | Uso | Valor | Contraste (AA) |
|---|---|---|---|
| `--color-brand-600` | ações primárias, links ativos | indigo 600 `#2563eb` | 4.5:1 em branco |
| `--color-brand-50` | fundo de destaque, chips | indigo 50 `#eef2ff` | — |
| `--color-surface` | fundo da página | `#f8fafc` | — |
| `--color-surface-raised` | cartões, cabeçalhos | `#ffffff` | — |
| `--color-border` | bordas de cartão | `#e2e8f0` | — |
| `--color-text-strong` | títulos | `#0f172a` | 15:1 em branco |
| `--color-text` | corpo de texto | `#334155` | 10:1 em branco |
| `--color-text-muted` | metadados, datas | `#64748b` | 4.6:1 em branco |
| `--color-success` | confirmações | `#16a34a` | — |
| `--color-danger` | remover, negar, erro | `#dc2626` | 4.5:1 em branco |
| `--color-warning` | atenção | `#d97706` | — |

Estados de foco sempre visíveis: anel de 2px em `--color-brand-600` com offset de 2px.

### Espaçamento e raio

- Escala de 4px: `4, 8, 12, 16, 20, 24, 32, 48`.
- Cartão: raio `12px`; chip/pílula: raio `9999px`; botão: raio `8px`.
- Sombra de cartão: `0 1px 2px rgb(0 0 0 / 0.06)`.

### Tipografia

| Token | Tamanho / peso | Uso |
|---|---|---|
| `text-2xl` bold | 24px/700 | número de estatística |
| `text-xl` bold | 20px/700 | nome do perfil |
| `text-base` | 16px/400 | corpo de texto e **todo campo de formulário** |
| `text-sm` medium | 14px/500 | rótulos, botões secundários |
| `text-xs` | 12px/400 | metadados (evitar abaixo disso) |

Fonte do sistema (`system-ui`) para performance; sem webfont na primeira pintura.

## 3. Componentes obrigatórios

`Button` (variantes primary/secondary/danger, tamanhos sm/md), `TextInput`, `Textarea`,
`Select` (cidade/bairro em cascata), `Avatar` (com fallback gerado do nome), `Card`,
`EmptyState` (ícone + título + descrição + ação), `Badge` (tipo de publicação),
`ReactionBar` (apoio/oposição com contador), `CommentList`, `FriendshipButton`,
`ReportButton`, `Toast`, `Modal` (confirmação de ações destrutivas), `Skeleton` (carregamento).

## 4. Regras de tela

- **Feed:** lista de cartões; cada cartão tem tipo, título, 2 linhas de resumo, autor ou
  "Anônimo", tempo relativo, barra de reação e contagem de comentários. Imagem miniatura só
  em telas maiores.
- **Nova publicação:** formulário em tela cheia no celular; seleção de bairro obrigatória;
  upload com pré-visualização e indicação de progresso; aviso claro sobre anonimato.
- **Perfil público:** capa, avatar, nome, selo de verificado (futuro), papel/cargo, bio,
  contadores, botão de amizade e abas de conteúdo.
- **Admin:** tabela responsiva que vira lista de cartões no celular; ações sempre com
  confirmação.

## 5. Acessibilidade (checklist)

- Contraste AA em texto e componentes interativos.
- Todos os campos com `<label>` associado; erro anunciado com `aria-describedby`.
- Navegação completa por teclado; ordem de foco lógica; `:focus-visible` sempre visível.
- Ícones com `aria-label` ou texto alternativo.
- Respeitar `prefers-reduced-motion`.
