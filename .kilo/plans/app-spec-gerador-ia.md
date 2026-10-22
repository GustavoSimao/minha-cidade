# Especificação Completa — Minha Cidade (App Social Comunitário)

## Stack e Arquitetura
- Next.js 16.4 (App Router), React 19, TypeScript 5, Tailwind 4
- Supabase local (CLI/Docker): Postgres + Auth + Realtime + Storage
- Server Actions (`useActionState`) para escrita; leitura via Server Components
- Realtime (D8) para contadores e comentários; sem coluna de contador (P8/E9)
- Invariante D7: sem JOIN entre schemas de contexto — integração por ID

---

## Telas e Rotas

| Rota | Propósito | Componentes principais | Status |
|---|---|---|---|
| `/` | Feed público paginado (problemas/ideias) | `FeedFilters`, lista de cartões de publicação, `EmptyState` | Implementado |
| `/login` | Login (e-mail/senha ou Google) | Formulário de autenticação | Implementado |
| `/cadastro` | Cadastro com aceite de termos | Formulário de cadastro | Implementado |
| `/perfil/{username}` | Perfil público | Capa, avatar, contadores, lista de publicações, `FriendButton` | Implementado |
| `/perfil/editar` | Edição do próprio perfil | `ProfileForm`, `CloseAccountForm` | Implementado |
| `/publicar` | Criar publicação | `PublicationForm` (tipo, título, texto, mídia, localização, anonimato) | Implementado |
| `/publicacao/{id}` | Detalhe da publicação | Título, conteúdo, mídia, `EngagementSection` (reações, comentários, salvar, denúncia) | Implementado |
| `/salvos` | Lista privada de publicações salvas | Lista de publicações salvas pelo usuário | Implementado |
| `/amigos/{username}` | Lista pública de amigos | Lista de amigos do perfil | Implementado |
| `/amigos/solicitacoes` | Pedidos de amizade pendentes | Lista de solicitações | Implementado |
| `/notificacoes` | Central de notificações | Lista de notificações com marcar como lida | Implementado |
| `/admin` | Fila de moderação | Cartões de denúncias (ocultar/restaurar/remover) | Implementado |
| `/transparencia` | Página de transparência | Moderação, limites, privacidade, políticas | **Não implementado (bug D2)** |

---

## Componentes Obrigatórios (Design System)

`Button`, `TextField`, `Textarea`, `Select`, `Avatar`, `Card`, `EmptyState`, `Badge`, `ReactionBar`, `CommentList`, `FriendshipButton`, `ReportButton`, `ConfirmDialog`, `Skeleton`, ícones SVG inline (`shared/ui/icon.tsx`).

**Sem usar:** paleta crua do Tailwind (`red-50`, `amber-100`, etc.), emoji como ícone, `Toast` flutuante (sucesso/erro é inline via `Alert`).

---

## Tokens de Design (de `globals.css`)

| Token | Uso | Valor |
|---|---|---|
| `--color-brand-600` | ações primárias, links | `#1e5b45` |
| `--color-brand-700` | hover de ação | `#174835` |
| `--color-brand-50` | fundo de destaque | `#eaf3ee` |
| `--color-brand-100` | chip institucional | `#d3e6dc` |
| `--color-surface` | fundo da página | `#ececea` |
| `--color-surface-raised` | cartões, cabeçalho | `#ffffff` |
| `--color-border-subtle` | bordas de cartão | `#d8d9d6` |
| `--color-text-strong` | títulos (serif) | `#1c1917` |
| `--color-text-body` | corpo | `#44403c` |
| `--color-text-muted` | metadados | `#6a6357` |
| `--color-success` | badge "Ideia", confirmações | `#4d7c0f` |
| `--color-danger` | remover, erro | `#b3261e` |
| `--shadow-stamp` | sombra dura de cartão | `2px 2px 0 rgb(28 25 23 / 0.08)` |

Tipografia: títulos em serif (`ui-serif`, Georgia), corpo em `system-ui`. Sem webfont no primeiro paint.
Espaçamento: escala de 4px (4, 8, 12, 16, 20, 24, 32, 48). Cartão: raio 8px. Botão: raio 8px.

---

## Modelo de Dados (Resumo)

**identity.profiles**: id (uuid PK), username (único), full_name, bio (≤2000), phone, avatar_path, cover_path, website, role, verified_org, is_verified, city_id, neighborhood_id, show_neighborhood, created_at, updated_at

**publication.publications**: id, author_id (FK profiles), type (problem|idea), title (5-120), content (10-5000), is_anonymous, city_id, neighborhood_id, edited_at, hidden_at, deleted_at, created_at

**publication.publication_media**: publication_id, path, position (1-3), byte_size (≤10MiB), width, height

**engagement.reactions**: publication_id, user_id, type (support|oppose), created_at (unique user+publication)

**engagement.comments**: publication_id, author_id (nullable), content (2-2000), is_anonymous, edited_at, hidden_at, deleted_at, created_at

**engagement.bookmarks**: user_id, publication_id (private)

**social-graph.friendships**: sentinela ordenada user_low < user_high, status (pending|accepted|removed)

**moderation.reports**: user_id, reportable (polimórfico), reason (fechado), status (pending)

**notification.notifications**: tipos fechados, lida/not lida

---

## Regras de Negócio (Invariantes)

- **P4**: publicação anônima não expõe autor em leitura pública (só o dono vê a própria como anônima)
- **P7**: só título/corpo/mídia são editáveis; tipo, autor, local, anonimato imutáveis
- **P8**: exclusão é lógica (`deleted_at`); feed público = não apagado e não oculto
- **P14**: edição de comentário só nos primeiros 15 min; autor e anonimato imutáveis
- **E1**: uma reação por usuário/publicação; mesmo tipo remove, outro troca (toggle)
- **E6**: salvamento é privado (só o dono vê)
- **M9**: limite 5 publicações/hora e 20/dia; 20 comentários/hora
- **D7**: sem JOIN entre schemas; integração por ID
- **I7**: projeção pública nunca expõe e-mail/telefone; bairro só se `show_neighborhood` = true

---

## O que já está implementado (não requer novo spec)

Feed paginado com filtros cidade/bairro/tipo; publicação com até 3 imagens WebP; reações apoio/oposição com contadores; comentários (anonimato, edição 15min, soft-delete); salvamentos privados; amizades; notificações Realtime; fila de moderação; perfil público e edição; encerramento de conta com senha.

---

## O que falta implementar (pronto para IA front-end gerar)

1. **Grade de postagens do autor no perfil** (`/perfil/{username}`) — filtrar feed por `author_id`, exibir em grade 3:4 (Instagram style)
2. **Múltiplas imagens no feed** — o feed já recebe `media` array, mas UI só mostra miniatura em `sm:grid`
3. **Botão de compartilhamento** em `/publicacao/{id}` (Web Share API com fallback clipboard)
4. **Campo website/link no perfil** (migration já criada, faltam UI em `/perfil/editar` e exibição em `/perfil/{username}`)
5. **Página `/transparencia`** (bug D2 — link no cabeçalho existe, rota não)
6. **Contadores derivados no perfil** (apoios/oposições/comentários recebidos) via agregação
7. **Busca global no cabeçalho** (não especificada)

---

## Validação
- `npm run test` (vitest, 240 testes passam)
- `npm run typecheck` (tsc --noEmit)
- `npm run lint` (eslint)
- `supabase db reset` + seed para validar RLS e triggers
