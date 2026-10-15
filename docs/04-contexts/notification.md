# Contexto: Notification (notificações in-app)

Status: **em desenvolvimento (Fase 8)** — spec criada em 2026-10-12, junto com a
migration e o código. Decisões: P29 (e D6, D7, D8, D15).

MVP: **só in-app** (sininho). E-mail e push ficam fora desta fase.

O que este contexto **não** faz: publicar, interagir, denunciar. Faz **avisar o
morador** do que aconteceu com o conteúdo dele.

## 1. Objetivo

Confirmar interações sem virar spam: quando alguém comenta, apoia, opõe, envia
pedido de amizade ou aceita, o dono do conteúdo vê um aviso no **sininho**, em
tempo real (D8). Nada de agregação sofisticada nesta fase — a entrega é direta,
a leitura marca como lida.

## 2. Linguagem ubíqua

| Termo | Significado |
|---|---|
| Notificação | Aviso in-app destinado a um usuário sobre um evento do sistema |
| Sininho | Ícone do cabeçalho com contagem de não lidas |
| Marcar como lida | `read_at` preenchido; some da contagem |
| Evento de origem | Linha em `shared.domain_events` (outbox — D7) |

## 3. Invariantes

| # | Regra |
|---|---|
| N1 | Notificação tem **um destinatário** (`user_id`) — nunca broadcast |
| N2 | O destinatário **não** é o autor da ação (não se notifica a si mesmo) |
| N3 | Tipos são **fechados**: `comment_added`, `publication_supported`, `publication_opposed`, `friend_requested`, `friend_accepted` |
| N4 | `payload` é jsonb com o mínimo para o link (`publicationId`, `actorId`, `kind`) |
| N5 | Só o dono lê e marca como lida (RLS) |
| N6 | Consumo do outbox é **idempotente** (evento processado uma vez — `processed_events`) |
| N7 | Notificação não some sozinha (retenção longa; limpeza é tarefa futura) |

## 4. Modelo de domínio

**Notificação** (`notification.notifications`): `id`, `user_id`, `type` (enum
fechado), `payload` jsonb, `read_at`, `created_at`.

**Evento processado** (`notification.processed_events`): `evento_id` — garante
idempotência (N6).

## 5. Regras de aplicação

- **Materialização**: trigger no banco (ou worker mínimo) lê
  `shared.domain_events` e cria a notificação a partir do tipo do evento,
  aplicando N2/N3/N4 e marcando o evento como processado (N6).
- **Listar**: mais recentes primeiro, paginado, só do dono (N5).
- **Marcar como lida**: uma, ou todas.

## 6. Regras de interface

- Sininho no cabeçalho com **contagem de não lidas** e lista suspensa.
- **Realtime (D8)**: notificação nova chega sem recarregar a página.
- Cada item linka para o conteúdo (`payload.publicationId`) ou perfil.

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select`/`update` em `notifications` | `authenticated` com `auth.uid() = user_id` (N5) |
| `insert` em `notifications` | **nenhum** via API — escrita pelo trigger do outbox (service_role) |
| `select` em `processed_events` | nenhum via API (controle interno) |

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| GET | `/notificacoes` | sessão | lista completa | 401 sem sessão |
| POST | `marcar-lida` *(server action)* | `id` ou `all` | marca leitura | N5 |
| — | trigger `materialize_notification` | linha do outbox | notificação criada | N2/N3/N6 |

Realtime: `notification.notifications` na publicação `supabase_realtime` com
`replica identity full`.

## 9. Testes derivados

**Unidade (domínio):**
- `NotificationType` rejeita valor fora do conjunto (N3).
- `Notification` rejeita `userId` vazio (N1).
- mapeamento evento → notificação ignora eventos sem destinatário válido (N2).

**Unidade (aplicação, repositórios fake):**
- listar traz só as do dono (N5).
- marcar lida de outro usuário falha (N5).
- evento repetido não gera segunda notificação (N6).

**Integração (stack local, manual/API):**
- trigger materializa notificação ao inserir no outbox; contagem cresce.
- Realtime entrega entre dois usuários.
