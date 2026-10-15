# Publication — Especificação

Contexto responsável pelo **conteúdo publicado** pelos moradores (problemas e ideias) e
pelo **feed** público que o exibe. Fonte da verdade deste domínio; o código em
`apps/web/src/contexts/publication/` e a migration `supabase/migrations/*_publication_*`
implementam exatamente o que está aqui.

- **Versão:** 1.0 · **Data:** 2026-10-10 · **Decisões:** P1, P3, P7, P8, P14, P15 (e D7, D8, D11)

## 1. Propósito e linguagem ubíqua

| Termo | Significado exato neste contexto |
|---|---|
| **Publicação** | conteúdo de um morador sobre seu bairro: um **problema** ou uma **ideia** |
| **Tipo** | `problem` \| `idea` — enum fechado, definido na criação e **imutável** |
| **Anonimato** | publicação cuja leitura pública **não expõe** o autor; o autor real permanece no banco, visível só para moderação (D11) |
| **Mídia** | até 3 imagens por publicação, no bucket `publication-media` (Storage) |
| **Feed** | lista pública paginada de publicações, filtrada por bairro/cidade/tipo, ordenada por mais recente — **sem ranking** (P8) |
| **Exclusão lógica** | apagar = marcar `deleted_at`; some do feed e do perfil, permanece no banco para moderação (P14) |
| **Ocultar** | `hidden_at`/`hidden_by` — moderação esconde temporariamente; reversível (P18, Fase 7) |

Fronteira: autor é referenciado por `author_id` (ID de `identity.profiles` — integração
por ID, D7); localização por `city_id`/`neighborhood_id` (Geography). Nunca JOIN entre
schemas: a composição de nomes é feita na aplicação.

## 2. Invariantes

1. **P1** — Toda publicação tem tipo `problem` ou `idea`, definido na criação e imutável.
2. **P2** — Título entre 5 e 120 caracteres; corpo entre 10 e 5.000 caracteres (após trim).
3. **P3** — Toda publicação tem autor (`author_id`), criada por usuário **autenticado com
   e-mail confirmado** (I9/P3).
4. **P4** — A leitura pública de publicação anônima **nunca** expõe `author_id`; a
   identidade real permanece no banco e só é acessível a moderação (D11).
5. **P5** — Máximo de **3 imagens** por publicação; upload limitado a **10 MiB** por
   arquivo; o cliente redimensiona para **WebP (máx. 1600px)** antes do envio; o servidor
   valida **magic bytes** (RIFF/WEBP) — nunca confia na extensão (P15).
6. **P6** — Publicação exige `city_id`; em município com lista curada de bairros (ex.:
   Cariacica), `neighborhood_id` é **obrigatório** e validado contra Geography (G4);
   fora dele, bairro é opcional e a exibição mostra "Bairro não informado" (P12).
7. **P7** — O autor edita livremente título/corpo/mídia (`edited_at` atualizado); **não**
   pode trocar tipo, autor, cidade ou anonimato após criar (P14).
8. **P8** — Apagar é **exclusão lógica** (`deleted_at`): some do feed e do perfil; dados
   preservados para moderação (P14).
9. **P9** — Publicação oculta (`hidden_at`) ou apagada **não aparece** em nenhuma leitura
   pública.
10. **P10** — Eventos com data/local/participação são **fora de escopo na v1** (D9); o
    schema reserva documento, sem tabela `events`.

## 3. Entidades e value objects

- **`Publication`** (entidade, id = uuid)
  - `authorId: string` · `type: PublicationType` · `title: Title` · `content: Content`
  - `isAnonymous: boolean` · `cityId: IbgeCode` · `neighborhoodId: string | null`
  - `editedAt: Date | null` · `hiddenAt`/`hiddenBy` (moderação) · `deletedAt: Date | null`
  - `createdAt: Date` · `media: PublicationMedia[]` (0..3)
- **`PublicationType`** (VO): `problem` | `idea`.
- **`Title`** (VO): 5–120 caracteres. **`Content`** (VO): 10–5.000 caracteres.
- **`PublicationMedia`** (VO): `path` (objeto no Storage), `position` (1..3), `byteSize`,
  `width`/`height` opcionais.
- **`PublicationAuthorView`** (projeção pública): `authorId` é `null` quando
  `isAnonymous` (P4).

## 4. Casos de uso

| Caso de uso | Entrada | Efeito | Evento |
|---|---|---|---|
| `CreatePublication` | tipo, título, corpo, anônimo, cityId, neighborhoodId, media[] | valida P1–P6; grava; ordena mídia | `PublicationCreated` |
| `UpdateMyPublication` | id, título, corpo, media[] | só o autor; `edited_at`; tipo/autor/local/anônimo imutáveis (P7) | `PublicationUpdated` |
| `DeleteMyPublication` | id | só o autor; exclusão lógica (P8) | `PublicationDeleted` |
| `GetPublication` | id | leitura pública (projeção anônima — P4) ou `NotFound` (P9) | — |
| `ListFeed` | cityId?, neighborhoodId?, type?, cursor, limite | pública, paginada, recente primeiro, sem ranking (P8) | — |
| `ListAuthorPublications` | authorId, limite | pública, mais recentes primeiro; usada no perfil | — |
| `CountAuthorPublications` | authorId | contagem pública (contador do perfil) | — |

`CreatePublication` exige sessão com e-mail confirmado (P3) — a verificação é feita na
camada de aplicação via porta de sessão, antes de qualquer escrita.

## 5. Eventos de domínio (publicados em `shared.domain_events`)

`PublicationCreated { publicationId, authorId, type, cityId, neighborhoodId, isAnonymous }` ·
`PublicationUpdated { publicationId, changed[] }` · `PublicationDeleted { publicationId }`

Consumidores: `engagement` (reações/comentários), `notification` (Fase 8),
`moderation` (denúncias — Fase 7), `analytics` (leituras — Fase 10).

## 6. Schema (DDL)

```sql
create schema if not exists publication;

create table publication.publications (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid not null references identity.profiles(id) on delete cascade,
  type             text not null check (type in ('problem','idea')),
  title            text not null check (char_length(trim(title)) between 5 and 120),
  content          text not null check (char_length(trim(content)) between 10 and 5000),
  is_anonymous     boolean not null default false,
  city_id          bigint not null references geography.cities(id),
  neighborhood_id  uuid,                                   -- FK + par com city_id em migration (G4/P6)
  edited_at        timestamptz,
  hidden_at        timestamptz,
  hidden_by        uuid references identity.profiles(id),
  deleted_at       timestamptz,                            -- exclusão lógica (P8)
  created_at       timestamptz not null default now()
);

create index publications_feed_idx
  on publication.publications (city_id, neighborhood_id, created_at desc)
  where deleted_at is null and hidden_at is null;

create table publication.publication_media (
  publication_id   uuid not null references publication.publications(id) on delete cascade,
  path             text not null,                          -- objeto no bucket publication-media
  position         smallint not null check (position between 1 and 3),
  byte_size        integer not null check (byte_size between 1 and 10485760),   -- 10 MiB (P5)
  width            integer,
  height           integer,
  primary key (publication_id, position)
);
```

`neighborhood_id` recebe FK composta `(neighborhood_id, city_id) → geography.neighborhoods
(id, city_id)` (G4); a obrigatoriedade em município curado (P6) é regra de aplicação
consultando `geography.neighborhoods`.

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select` em `publications` | `anon` e `authenticated` — **projeção pública** (sem `author_id` quando anônima — P4; a projeção é responsabilidade da aplicação). Exceção validada no stack local: `or auth.uid() = author_id` — sem ela o **soft-delete falha por RLS**, porque a linha nova com `deleted_at` preenchido ficaria invisível para o próprio autor; o autor segue vendo as próprias publicações apagadas (a aplicação trata apagada como 404) |
| `insert` | `authenticated` com `auth.uid() = author_id` |
| `update` | `authenticated` com `auth.uid() = author_id` e `deleted_at is null` (P7/P8) |
| `delete` | **nenhum** via API — exclusão é lógica (`deleted_at`), feita por `update` (P8) |
| `select` em `publication_media` | `anon` e `authenticated` |
| `insert`/`update`/`delete` em `publication_media` | `authenticated` dono da publicação (via join com `publications`) |

Storage: bucket `publication-media` privado; leitura por URL assinada gerada no servidor;
escrita apenas pelo Route Handler autenticado (P5).

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| GET | `/` | `?cidade=&bairro=&tipo=&cursor=` | lista paginada (projeção pública); `/feed?…` redireciona para cá preservando os filtros; `bairro` sem `cidade` canonicaliza para a cidade dona do bairro | — |
| GET | `/publicacao/{id}` | id | publicação pública | 404 (P9) |
| GET | `/publicar` | sessão | formulário | 401 sem sessão |
| POST | `/publicar` *(server action)* | tipo, título, corpo, anônimo, cidade, bairro, paths de mídia | cria + redirect para a publicação | validação P1–P6 |
| POST | `/api/publications/media` *(route handler)* | arquivo (FormData) | `{ path }` | 400 magic bytes/tamanho, 401 |
| POST | `/publicacao/{id}/editar` *(server action)* | campos editáveis | atualiza (P7) | 403 não é o autor |
| POST | `/publicacao/{id}/apagar` *(server action)* | — | exclusão lógica (P8) | 403 |

Upload passa por **Route Handler** (e não por server action) porque o corpo pode chegar a
10 MiB — o limite de 1 MB de Server Actions do Next se aplicaria.

## 9. Testes derivados

**Unidade (domínio):**
- `PublicationType` rejeita valor fora de `problem|idea`.
- `Title` rejeita 4 e 121 caracteres; `Content` rejeita 9 e 5.001.
- `Publication` rejeita 4 mídias (P5) e posição fora de 1..3.
- `Publication` rejeita `cityId` ausente (P6).
- Projeção pública de publicação anônima tem `authorId = null` (P4).
- Atualização não altera tipo/autor/local/anonimato (P7 — regra da aplicação).

**Unidade (aplicação, repositórios fake):**
- criar com bairro de outra cidade falha (G4/P6).
- criar sem bairro em cidade **com** curadoria falha (P6).
- criar sem bairro em cidade **sem** curadoria passa (P12).
- editar por não-autor falha (403); apagar é lógico (P8).
- feed oculta apagada/oculta (P9) e pagina por cursor sem repetir (P8).

**Integração/RLS (quando houver banco de teste):**
- `anon` não insere em `publications`.
- usuário A não atualiza publicação de B.
- leitura pública não seleciona `author_id` de publicação anônima.

**E2E (Fase 9, Playwright):** publicar problema com foto anônima e ver no feed do bairro;
editar e apagar a própria publicação.

## 10. Dependências e o que fica para outras fases

- **Depende de:** `identity.profiles` (autor), `geography` (cidade/bairro — validação G4),
  Storage (`publication-media`).
- **Fica para a Fase 5:** reações e comentários (`engagement`) referenciando `publications.id`.
- **Fica para a Fase 7:** rate limiting por usuário/IP (P16) aplicado antes de
  `CreatePublication`; denúncias e ocultar/restaurar (`hidden_at`).
- **Fica para a Fase 4 (neste mesmo plano, item de risco):** anonimização das publicações
  no encerramento de conta (I8 do Identity) — ligada quando `publication.publications`
  existir.
- **Fica para a Fase 10:** agregações do feed em `analytics_metrics`.
