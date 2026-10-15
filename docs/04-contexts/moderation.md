# Contexto: Moderation (denúncias, fila e ações)

Status: **em desenvolvimento (Fase 7)** — spec criada em 2026-10-12, junto com a
migration e o código. Decisões: P26, P28, P10 (e D6, D7, D15).

O que este contexto **não** faz: publicar, interagir, notificar. Faz **a defesa
da comunidade**: denunciar, julgar na fila e agir com trilha de auditoria.

## 1. Objetivo

Proteger a praça pública sem transformar o app em tribunal: o morador **denuncia**
com motivo fechado; a moderação vê uma **fila** ordenada por volume, age com
**ocultar/restaurar/remover** e toda ação fica na **trilha**. Enquanto não há
ação, o conteúdo continua visível (P10: não existe denúncia que derruba conteúdo
automaticamente).

## 2. Linguagem ubíqua

| Termo | Significado |
|---|---|
| Denúncia | Relato de um usuário sobre publicação ou comentário, com motivo fechado |
| Fila de moderação | Alvos com **3 ou mais denúncias** de usuarios distintos, pendentes |
| Ocultar | Esconder o conteúdo do público sem apagá-lo (reversível) |
| Restaurar | Reverter a ocultação |
| Remover | Exclusão lógica definitiva (autor não desfaz) |
| Trilha | Registro imutável de toda ação da moderação |
| Moderador/Anti-admin | Papel em `identity.profiles.role` |

## 3. Invariantes

| # | Regra |
|---|---|
| M1 | Denunciar exige conta com **e-mail confirmado** e conteúdo ainda visível |
| M2 | **Uma denúncia por usuário/alvo** (não é votar várias vezes) |
| M3 | Motivo é **fechado** (enum de 6 valores) |
| M4 | Denúncia **não** altera visibilidade do alvo (P10) |
| M5 | Ocultar/restaurar/remover exige papel **moderador** (remover: só **admin**) |
| M6 | Remover é definitivo para o autor (exclusão lógica — P8) |
| M7 | Toda ação gera registro na trilha (quem, quando, por quê) |
| M8 | Denunciar a própria publicação é permitido? **Não** — não faz sentido; barrado |
| M9 | Limites (P16): 5 publicações/hora e 20/dia por usuário; 20 comentários/hora; 10 denúncias/dia; **30 publicações/hora por IP** — o IP só é lido de `x-forwarded-for`/`x-real-ip` com `TRUSTED_PROXY=1` (ADR-0017); sem proxy, o teto por IP não se aplica |

## 4. Modelo de domínio

**Denúncia** (`moderation.reports`): `id`, `reporter_id`, `reportable_type`
(`publication` | `comment`), `reportable_id`, `reason` (enum fechado M3),
`details`, `created_at`. Única por (reporter_id, reportable_type, reportable_id).

**Ação de moderação** (`moderation.moderation_actions`): `id`, `actor_id`,
`action` (`hide` | `restore` | `remove` | `report_resolved` | `grant_badge` |
`revoke_badge` | `promote_moderator` | `demote_moderator`), `target_type`
(`publication` | `comment` | `report` | `profile`), `target_id`, `reason`,
`created_at`. Append-only (M7).

**Limite de uso** (`moderation.rate_limits`): `subject_type` (`user` | `ip`),
`subject_id` (uuid do perfil ou endereço), `scope`
(`publication` | `comment` | `report`), `window_start`, `count`. Única por
(subject_type, subject_id, scope, window_start) — contadores de janela
deslizante. Linhas de usuário mantêm `user_id` (FK/analytics); linhas de IP
têm `user_id` nulo e são lidas/escritas pelo service_role.

**Janelas:** `publication_hourly` (limite 5), `publication_daily` (limite 20),
`publication_ip_hourly` (limite 30), `comment_hourly` (20), `report_daily` (10).

## 5. Regras de aplicação

- **Denunciar**: sessão confirmada (M1); alvo visível (M4); motivo fechado (M3);
  não é o próprio conteúdo (M8); uma vez por alvo (M2); dentro do limite de
  denúncias (M9). Evento `content.reported` no outbox.
- **Publicar/Comentar**: antes da ação, `EnforceRateLimit` confere os tetos do
  usuário e, quando o pedido vem de proxy confiável, o teto por IP (30
  publicações/hora — ADR-0017). Cada teto estourado incrementa seu próprio
  contador ao consumir a ação.
- **Listar fila**: alvos de publicação ou comentário com ≥ 3 denúncias
  pendentes, ordenados por volume; o alvo é enriquecido por ID na aplicação
  (sem JOIN — D7).
- **Ocultar/Restaurar/Remover**: só papel adequado (M5); remove exige admin;
  registra trilha (M7); escreve `hidden_at`/`deleted_at` do alvo via
  **service_role** (os triggers das Fases 4/5 exigem esse papel para ocultação).
- **Ações de conta (Fase 8/B2)**: exclusivas do **admin** (M5). Busca do alvo por
  username (projeção pública I7, sem e-mail/telefone). `GrantBadge` exige nome do
  órgão válido (3–120 caracteres) e perfil sem selo; `RevokeBadge` exige selo
  existente; `PromoteModerator` só promove usuário comum; `DemoteModerator` não
  rebaixa usuário comum nem a si mesmo. Selo e `is_verified` mudam juntos
  (constraint I5 de `identity.profiles`), sempre via service_role — as
  invariantes I4/I5 do banco só permitem essa escrita com esse papel. Todas
  registram trilha (M7) e evento no outbox.

## 6. Regras de interface

- Em `/publicacao/{id}` e em comentários do próprio usuário: link **Denunciar**
  com formulário (motivo + detalhe opcional).
- `/admin` (só staff): fila ordenada; ações por alvo; trilha visível.
- `/admin` (só admin): seção **Contas** — busca por username e as ações de selo
  institucional e promoção/rebaixamento. Moderador vê o resultado da busca, sem
  os botões (M5).
- Usuário comum que acessar `/admin` recebe 404 (não existe para ele).

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `insert` em `reports` | `authenticated` com `auth.uid() = reporter_id` (M1/M2/M8 pela app) |
| `select` em `reports` | **nenhum** para `authenticated` — a fila é lida pelo service_role; o usuário não vê denúncias (evita expor quem denunciou) |
| `insert` em `moderation_actions` | **nenhum** via API — trilha é escrita pelo service_role (M7) |
| `select` em `moderation_actions` | staff via service_role (a trilha pública/entregável fica para fase futura) |
| `select`/`insert`/`update` em `rate_limits` | `authenticated` com `auth.uid() = user_id`; `service_role` total |

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| POST | `denunciar` *(server action)* | `targetType`, `targetId`, `reason`, `details` | cria denúncia | M1–M4, M8, M9 |
| GET | `/admin` | sessão (staff) | fila + trilha | 404 para não-staff |
| POST | `ocultar` *(server action)* | `targetType`, `targetId`, `reason` | oculta | M5/M7 |
| POST | `restaurar` *(server action)* | `targetType`, `targetId`, `reason` | reverte | M5/M7 |
| POST | `remover` *(server action)* | `targetType`, `targetId`, `reason` | remove (lógico) | M5 (admin)/M7 |
| POST | `resolver-denuncia` *(server action)* | `reportId`, `resolution` | marca resolvida | M7 |
| POST | `conceder-selo` *(server action)* | `username`, `orgName`, `reason` | concede selo (I5) | M5 (admin) |
| POST | `revogar-selo` *(server action)* | `username`, `reason` | revoga selo (I5) | M5 (admin) |
| POST | `promover-moderador` *(server action)* | `username`, `reason` | promove | M5 (admin) |
| POST | `rebaixar-moderador` *(server action)* | `username`, `reason` | rebaixa | M5 (admin) |

Eventos no outbox: `content.reported`, `content.hidden`, `content.restored`,
`content.removed`, `profile.badge_granted`, `profile.badge_revoked`,
`profile.promoted`, `profile.demoted`.

## 9. Testes derivados

**Unidade (domínio):**
- `ReportReason` rejeita valor fora do conjunto (M3).
- `Report` rejeitar reporter = autor do alvo (M8).
- Limites: `RateLimitPolicy` calcula a janela (hora/dia) e compara com o teto.

**Unidade (aplicação, repositórios fake):**
- denunciar sem sessão/confirmação falha (M1).
- denunciar duas vezes o mesmo alvo falha (M2).
- denunciar o próprio conteúdo falha (M8).
- acima do limite diário falha (M9).
- ocultar/restaurar/remover por não-staff falha (M5); remover por moderador
  comum falha (M5); ações geram trilha (M7).
- fila só lista alvo com ≥ 3 denúncias.

**Integração (stack local, manual/API):**
- unique (reporter, alvo) barra duplicata (M2).
- RLS: usuário comum não lê denúncias; staff oculta via service_role e o alvo
  desaparece do feed (M4/triggers das Fases 4/5 exigem service_role).
