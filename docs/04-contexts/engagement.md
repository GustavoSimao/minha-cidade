# Contexto: Engagement (reações, comentários, salvamentos)

Status: **em desenvolvimento (Fase 5)** — spec criada em 2026-10-11, junto com a
migration e o código. Decisões: P10, P11, P13, P15, P16, P19, P23, P25, P26, P29
(e D4, D6, D7, D8, D9, D10, D12).

MVP local: **sem IA**. Só o que o morador faz à mão — comentar, apoiar/opor,
salvar. IA entra na Fase 10, e sempre com revisão humana (P10, D9).

O que este contexto **não** faz: feed, login, perfil, denúncia, amizade,
notificação. Faz **a interação em cima de uma publicação**.

---

## 1. Objetivo

Aumentar participar na cidade (P19) com interações simples e auditáveis sobre
publicações: comentar, apoiar/opor (uma reação por pessoa, trocável) e salvar
para ler depois (privado). Contadores são derivados das interações — sem
contador desincronizado.

MVP: apoiar/opor + comentar + salvar. Enquete entra depois (P13).

## 2. Linguagem ubíqua

| Termo | Significado |
|---|---|
| Reação | Posição do usuário sobre uma publicação: **apoio** ou **oposição**. Uma por pessoa/publicação |
| Apoiar | Reação positiva ("concordo/quero isso") |
| Opor | Reação negativa ("discordo") |
| Salvar (bookmark) | Guardar uma publicação na lista privada do usuário |
| Comentário | Resposta textual (2–2.000 caracteres) a uma publicação, identificada ou anônima |
| Editar comentário | Corrigir o próprio comentário em até **15 minutos** |
| Apagar comentário | Exclusão lógica (some para todos) |

## 3. Invariantes

| # | Regra |
|---|---|
| E1 | Reação única por usuário/publicação (constraint única). Reagir de novo com o mesmo tipo **remove**; com o outro **troca** |
| E2 | Só é possível reagir/comentar/salvar em publicação **visível** (não apagada, não oculta — P9) |
| E3 | Comentário: 2–2.000 caracteres (trim); não vazio; sem comentário em comentário (chat com seções é o precedente do Telegram — P13, não é o modelo adotado) |
| E4 | Comentário pode ser **anônimo** (como a publicação — P4) |
| E5 | Comentário edita apenas o **próprio** e em até **15 minutos**; apaga apenas o próprio |
| E6 | Salvamento é **privado** (só o dono vê a própria lista — RLS) |
| E7 | Apagar a publicação apaga as reações e comentários (cascade) |
| E8 | Reagir/comentar/salvar exige **conta com e-mail confirmado** (P3, mesmo critério do publicação) |
| E9 | Contadores são **derivados** por agregação (sem coluna de contador — sem desincronização) |
| E10 | Ocultar comentário é ação de moderação (service_role) — Fase 7 |

## 4. Modelo de domínio

**Reação** (`engagement.reactions`): `id`, `publication_id`, `user_id`, `type`
(`support` | `oppose`), `created_at`. Única por (publication_id, user_id).

**Comentário** (`engagement.comments`): `id`, `publication_id`, `author_id`,
`content` (2–2.000), `is_anonymous`, `edited_at`, `hidden_at`, `hidden_by`,
`deleted_at`, `created_at`. Soft-delete pelo autor; ocultação pela moderação.

**Salvamento** (`engagement.bookmarks`): `user_id`, `publication_id`,
`created_at`. PK (user_id, publication_id); privado.

Projeção pública de comentário (análoga à de publicação — P4): autor identificado
vem de `identity.profiles` pela projeção pública (I7), anônimo não expõe autor.
**Sem JOIN entre contextos** (D7): a aplicação resolve autores em lote pelo
repositório de perfis.

## 5. Regras de aplicação (P10)

- Alternar reação: mesmo tipo remove, outro tipo troca (uma reação por pessoa).
- Editar comentário: somente autor, só `content`/`edited_at`, em até 15 min.
- Apagar comentário: somente autor; `deleted_at` preenchido.
- Salvar/remover: idempotente (salvar duas vezes = um registro).
- Eventos no outbox: `comment.added`, `publication.supported`, `publication.opposed`,
  `publication.bookmarked` (consumidos por Moderação e Notificação nas Fases 7–8).

## 6. Regras de interface (P15/P16)

- Botões de reação com contador (apoio/oposição) e estado do usuário; otimista.
- Lista de comentários paginada (mais recentes primeiro) com formulário.
- Comentário do usuário logado mostra "editar" (dentro de 15 min) e "apagar".
- Botão salvar/remover na publicação; lista de salvos em `/salvos` (sessão).
- Realtime (D8): contadores e novos comentários chegam sem recarregar a página.
- Contadores em lote para o feed e para o perfil (`countsByPublicationIds`,
  `countSupportedByUser`) — leitura pública resolvida **por ID**, sem JOIN entre contextos
  (D7). A soma por publicação fica na função pura `application/aggregate-counts.ts`
  (`aggregatePublicationCounts`), testada sem banco.

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select` em `reactions` | `anon` e `authenticated` (leitura pública de contadores) |
| `insert`/`update`/`delete` em `reactions` | `authenticated` com `auth.uid() = user_id` |
| `select` em `comments` | `anon`/`authenticated`: não apagadas e não ocultas, **ou** o próprio autor (para ver o que apagou/oculto) |
| `insert` em `comments` | `authenticated` com `auth.uid() = author_id` |
| `update` em `comments` | `authenticated` com `auth.uid() = author_id`; trigger barra: autor imutável, anonimato imutável, edição só em 15 min, ocultação só service_role |
| `delete` em `comments` | `authenticated` dono (soft-delete por update; sem delete físico) |
| `select`/`insert`/`delete` em `bookmarks` | `authenticated` com `auth.uid() = user_id` (privado — sem `anon`) |

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| POST | `reagir` *(server action)* | `publicationId`, `type` | alterna (adiciona/remove/troca) | 401/403 |
| POST | `comentar` *(server action)* | `publicationId`, `content`, `anonimo` | cria | validação E3 |
| POST | `comentario/editar` *(server action)* | `commentId`, `content` | atualiza | E5 (autor/prazo) |
| POST | `comentario/apagar` *(server action)* | `commentId` | exclusão lógica | E5 |
| POST | `salvar` *(server action)* | `publicationId` | marca | 401 |
| POST | `remover-salvo` *(server action)* | `publicationId` | desmarca | 401 |
| GET | `/salvos` | sessão | lista privada de salvos | 401 |

Realtime: `engagement.reactions` e `engagement.comments` na publicação
`supabase_realtime` com `replica identity full`.

## 9. Testes derivados

**Unidade (domínio):**
- `ReactionType` rejeita valor fora de `support|oppose`.
- `Reaction` com mesmo tipo → remover; com outro → trocar.
- `Comment` rejeita 1 e 2.001 caracteres (E3).
- `Comment` edita só dentro de 15 min; `canEdit` false depois (E5).
- `Comment` anonimato não expõe autor na projeção pública (P4/E4).

**Unidade (aplicação, repositórios fake):**
- reagir sem sessão/sem confirmação falha (P3/E8).
- reagir duas vezes com o mesmo tipo remove (E1).
- comentar em publicação apagada/oculta falha (E2/P9).
- editar comentário de outro autor falha; após 15 min falha (E5).
- salvar/remover idempotente; salvamentos invisíveis a terceiros (E6).

**Integração (stack local, manual/API):**
- contadores derivados conferem com as linhas (E9).
- cascade: apagar publicação remove reações/comentários (E7).
- Realtime emite reação/comentário entre dois usuários.
