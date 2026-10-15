# Contexto: Social Graph (amizades)

Status: **em desenvolvimento (Fase 6)** — spec criada em 2026-10-12, junto com a
migration e o código. Decisões: P25, P29 (e D6, D7, D8, D15).

MVP: **amizades mútuas** — seguidores/feed de amigos fica para depois.

O que este contexto **não** faz: login, publicações, engajamento, denúncia,
notificação. Faz **a relação entre dois moradores**.

## 1. Objetivo

Dar à rede da cidade um vínculo de confiança simples: **amizade mútua**, com
estados explícitos (nenhum → pedido pendente → amigos), reversível dos dois
lados. Base para feed de amigos, menções e notificações.

## 2. Linguagem ubíqua

| Termo | Significado |
|---|---|
| Amizade | Vínculo mútuo entre dois usuários; não é seguir (P25) |
| Pedido de amizade | Convite enviado e ainda não respondido |
| Aceitar / Recusar | Respostas do destinatário a um pedido |
| Desfazer | Encerrar uma amizade existente (de qualquer lado) |
| Cancelar | Retirar o próprio pedido antes da resposta |

Estados possíveis: `none`, `pending_sent`, `pending_received`, `friends`.

## 3. Invariantes

| # | Regra |
|---|---|
| S1 | Amizade é **mútua**: não existe estado seguindo/só-seguidor |
| S2 | Um par de usuários tem **no máximo uma** linha de amizade (nenhum par duplicado, em nenhum sentido) |
| S3 | Não é permitido ser amigo de si mesmo (autorelacionamento proibido) |
| S4 | Pedido pendente só pode ser **aceito ou recusado pelo destinatário** |
| S5 | Só o remetente pode **cancelar** o próprio pedido |
| S6 | Amizade só pode ser **desfeita por um dos dois lados** |
| S7 | Perfil encerrado sai do grafo (cascade nas FKs; não sobra linha órfã) |

## 4. Modelo de domínio

**Amizade** (`social_graph.friendships`):

| Coluna | Tipo | Nota |
|---|---|---|
| `id` | uuid | identidade |
| `user_low` | uuid | `least(a, b)` — **sentinela ordenada** |
| `user_high` | uuid | `greatest(a, b)` — sentinela ordenada |
| `status` | text | `pending` \| `accepted` |
| `requested_by` | uuid | quem enviou o pedido |
| `responded_by` | uuid | quem aceitou/recusou |
| `created_at` / `updated_at` | timestamptz | — |

**Regra da sentinela (S2):** as colunas são sempre ordenadas
(`user_low = least(solicitante, destinatário)`, `user_high = greatest(...)`) e a
**unique (user_low, user_high)** impede A→B e B→A ao mesmo tempo. `check
(user_low < user_high)` garante S3.

Direção é derivada, não armazenada em pares: se `requested_by = eu` → pedido
enviado; senão → recebido.

## 5. Regras de aplicação

- **Enviar pedido**: nenhuma linha existente entre o par (S2); cria com
  `requested_by = eu`, `status = pending`; evento `friend.requested`.
- **Cancelar**: só o remetente (S5); remove a linha; evento `friend.request_cancelled`.
- **Aceitar**: só o destinatário (S4); vira `status = accepted` com
  `responded_by = eu`; evento `friend.accepted`.
- **Recusar**: só o destinatário (S4); remove a linha (sem estado "recusado"
  persistir é suficiente no MVP); evento `friend.rejected`.
- **Desfazer**: qualquer um dos dois (S6); remove a linha; evento `friend.removed`.

## 6. Regras de interface (P15/P16)

- Em `/perfil/{username}`: botão **Adicionar amigo** (nenhum vínculo),
  **Pedido enviado** (cancelar), **Aceitar**/**Recusar** (recebido), **Amigos ✓**
  (desfazer).
- Aba/página **Amigos** no perfil público (contagem + lista, leitura pública).
- **Hub `/amigos`** (privado) com 3 abas por query `?tab=amigos|solicitacoes|sugestoes`:
  amigos (com desfazer), solicitações **recebidas e enviadas** (cancelar — resolve
  C2) e sugestões do mesmo bairro. `/amigos/solicitacoes` redireciona para
  `/amigos?tab=solicitacoes`.
- **Descoberta** (`/amigos/descobrir`, privada): cartões de pessoas da plataforma
  com `?exclude=` acumulado pelo botão "pular" (teto de 20 ids); bairro aparece
  só quando `show_neighborhood` (I7). Sugestões/descoberta excluem a própria
  pessoa, amigos e pendentes nos dois sentidos; perfil com opt-out continua
  sugerível (D-6). Sem bairro próprio, a aba de sugestões convida a escolher
  bairro no perfil (D-8).
- Contadores no perfil resolvidos por consulta própria (sem JOIN entre contextos
  — D7; Identity pode expor contagem via repositório do grafo).

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select` em `friendships` | `anon` e `authenticated` (lista pública de amigos) |
| `insert` | `authenticated` com `auth.uid() = requested_by` **e** participante do par (`user_low`/`user_high`) |
| `update` | `authenticated` **destinatário** do pedido pendente (`requested_by <> auth.uid()`), só `pending → accepted` (trigger garante S4) |
| `delete` | `authenticated` participante do par (cancelar/recusar/desfazer — S5/S6) |

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| POST | `enviar-amizade` *(server action)* | `username` | cria pedido | S2 duplicado, S3 auto |
| POST | `cancelar-pedido` *(server action)* | `username` | remove | S5 não é remetente |
| POST | `aceitar-pedido` *(server action)* | `username` | aceita | S4 não é destinatário |
| POST | `recusar-pedido` *(server action)* | `username` | remove | S4 não é destinatário |
| POST | `desfazer-amizade` *(server action)* | `username` | remove | S6 |
| GET | `/amigos` | `?tab=` | hub privado: amigos, solicitações (recebidas + enviadas) e sugestões | 401 sem sessão |
| GET | `/amigos/descobrir` | `?exclude=` | descoberta de pessoas (cartões, "pular" acumula exclusões) | 401 sem sessão |
| GET | `/amigos/buscar` | `?q=` | busca de pessoas por nome/@username (T3) | 401 sem sessão |
| GET | `/amigos/solicitacoes` | — | redirect para `/amigos?tab=solicitacoes` | — |
| GET | `/amigos/{username}` | username | lista pública de amigos do perfil | — |

Eventos de domínio (outbox `shared.domain_events`, D7): `friend.requested`,
`friend.request_cancelled`, `friend.accepted`, `friend.rejected`, `friend.removed`.

## 9. Testes derivados

**Unidade (domínio):**
- sentinela ordena o par (S2) e rejeita `user_low = user_high` (S3).
- estado deriva corretamente: `pending_sent`, `pending_received`, `friends`,
  `none`.

**Unidade (aplicação, repositórios fake):**
- enviar pedido duplicado falha (S2).
- aceitar/recusar por não destinatário falha (S4); cancelar por não remetente falha (S5).
- desfazer por terceiro falha (S6); desfazer por qualquer lado funciona.
- amizade aceita aparece nas listas dos dois lados.

**Integração (stack local, manual/API):**
- constraint única barra A↔B duplicado nos dois sentidos (S2).
- RLS: terceiro não edita relação alheia.
