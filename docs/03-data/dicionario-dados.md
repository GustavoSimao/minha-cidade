# Dicionário de dados (v1)

Estrutura alvo por contexto (detalhe final em cada `spec.md`). Deriva do Apêndice A do plano
e já incorpora as correções de modelagem necessárias.

## identity

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `profiles` | `id` | uuid (PK, = `auth.users.id`) | espelha o usuário do Supabase Auth |
| | `username` | text unique, **imutável** | gerado do nome na criação; vazio ⇒ `usuario-` + 8 aleatórios; colisão ⇒ `-1`, `-2` |
| | `full_name` | text not null | |
| | `bio` | text | |
| | `phone` | text | **privado** (só o dono) |
| | `avatar_path` | text | objeto no bucket `avatars` |
| | `cover_path` | text | objeto no bucket `covers` |
| | `role` | text check in ('user','moderator','admin') | atribuído só por admin (`service_role`) |
| | `verified_org` | text | nome do órgão; preenchido **somente** com selo institucional (P13) |
| | `is_verified` | boolean default false | espelho do selo: `true` quando `verified_org` não é nulo |
| | `city_id` | bigint | ID externo; FK para `geography.cities(id)` criada na Fase 3 |
| | `neighborhood_id` | uuid | ID externo; opcional fora dos municípios curados; FK composta `(neighborhood_id, city_id)` → `geography.neighborhoods (id, city_id)` (G4) |
| | `termos_aceitos_em` | timestamptz | aceite dos termos/privacidade (P22); privado |
| | `created_at`/`updated_at` | timestamptz | |

> **Corrigido em relação ao sistema anterior:** sem `email` duplicado (a fonte é o Auth),
> sem contadores como `string` (`events_created`, `supported_causes`, `social_links`),
> mídia em Storage em vez de múltiplas colunas `image_1..3`.

## geography

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `cities` | `id` | bigint (PK, código IBGE) | 5.571 municípios + 27 UFs no seed (API IBGE em 2026-10-10) |
| | `uf` | char(2) check (27 siglas) | |
| | `name` | text | nome oficial com acentos |
| | `slug` | text unique | `nome-uf` normalizado (G2) |
| | `ibge_synced_at` | timestamptz | última sincronização com a API |
| | `created_at` | timestamptz | |
| `neighborhoods` | `id` | uuid | |
| | `city_id` | bigint → `cities(id)` | |
| | `name`/`slug` | text | `unique (city_id, slug)` (G3) |
| | `source` | text check | `ibge_subdistritos` \| `lei_4772_2010` \| `lc_171_2025` (G8) |
| | `source_url` | text | URL da fonte oficial |
| | `lat`/`lng` | double precision | opcional (evolução para raio) |
| | `created_at` | timestamptz | |

RLS: leitura pública (`anon`/`authenticated`); escrita somente `service_role` (G5).
Seed: `ibge-localidades.sql` (IBGE, gerado) + `bairros-cariacica.sql` (100 bairros de
Cariacica/ES, fonte LC 171/2025).

## publication

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `publications` | `id` | uuid | |
| | `author_id` | uuid, **anulável** | dono; `NULL` quando a conta foi encerrada (P4); **nunca** exposto quando `is_anonymous` |
| | `type` | enum `problem` \| `idea` | |
| | `title`/`content` | text | |
| | `is_anonymous` | boolean default false | |
| | `city_id` | bigint | |
| | `neighborhood_id` | uuid | obrigatório em municípios com lista curada (ex.: Cariacica) |
| | `edited_at` | timestamptz | última edição do autor (P14); nulo = nunca editado |
| | `hidden_at`/`hidden_by` | timestamptz/uuid | moderação (exclusão lógica, reversível) |
| `publication_media` | `publication_id`, `path`, `position`, `kind` | | até 3 imagens; Storage `publication-media` |
| `events` (v2, documentado) | `publication_id`, `starts_at`, `ends_at`, `location`, `kind`, `external_link`, `max_participants`, `price` | | fora de escopo na v1 |

## engagement

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `reactions` | `publication_id`, `user_id`, `type` | enum `support` \| `oppose` | **unique (user_id, publication_id)**; toggle remove/troca |
| `comments` | `publication_id`, `author_id`, `content`, `is_anonymous` | | `hidden_at` para moderação; edição só nos primeiros 15 min (P14) |
| `bookmarks` | `user_id`, `publication_id` | | privado (só o dono) |

## social_graph

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `friendships` | `requester_id`/`addressee_id` | uuid | **constraint único lógico** impede duplicata A↔B |
| | `status` | enum `pending` \| `accepted` \| `removed` | enviar, cancelar (apaga), aceitar, recusar (apaga), desfazer (removed); lista pública; sem bloqueio |

## moderation

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `reports` | `reporter_id`, `reportable` (tipo + id), `reason`, `description`, `status` | `reason` enum `spam`/`conteudo_inapropriado`/`informacao_falsa`/`assedio`/`outro`; `status` `pending`/`resolved`/`rejected` | só autenticado com e-mail confirmado; **unique (reporter_id, reportable_type, reportable_id)**; sem auto-denúncia |
| `moderation_actions` | `actor_id`, `action`, `target_type`, `target_id`, `reason`, `created_at` | `action`: `hide`/`restore`/`remove`/`resolve_report`/`grant_badge`/`promote_moderator` | trilha obrigatória de toda ação (P18); ninguém modera a própria conta |
| `rate_limits` | `subject_type` (`user`/`ip`), `subject_id`, `action`, `window_start`, `count` | | aplicado na camada de aplicação (P16) |

## notification

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `notifications` | `user_id`, `type`, `payload jsonb`, `read_at` | `type`: `friend_requested`/`friend_accepted`/`publication_supported`/`comment_added` | in-app + Realtime (P19); sem e-mail/push na v1 |

## analytics (leitura pública)

| Tabela | Coluna | Tipo | Observação |
|---|---|---|---|
| `analytics_metrics.daily_metrics` | `day`, `city_id`, `neighborhood_id`, `publications`, `problems`, `ideas`, `supports`, `comments`, `active_users`, `reports` | | materializada por pg_cron; **sem PII** |
| `analytics.snapshots` | `day`, `dataset`, `payload` | | escrita apenas pelo ETL Python |

## shared

| Objeto | Uso |
|---|---|
| `shared.domain_events` | eventos de domínio (`context`, `name`, `payload`, `occurred_at`) |
| `shared.app_metadata` | versão do seed IBGE, versão do schema |
