# Geography — Especificação

Contexto responsável por **onde** as coisas acontecem: cidades (catálogo público IBGE) e
bairros (catálogo municipal curado). Fonte da verdade deste domínio; o código em
`apps/web/src/contexts/geography/` e a migration `supabase/migrations/*_geography_*`
implementam exatamente o que está aqui.

- **Versão:** 1.0 · **Data:** 2026-10-10 · **Decisões:** P11, P12, ADR-0010, ADR-0015

## 1. Propósito e linguagem ubíqua

| Termo | Significado exato neste contexto |
|---|---|
| **Cidade** | município brasileiro identificado pelo **código IBGE de 7 dígitos** (`geography.cities.id`) |
| **UF** | unidade federativa do município, sigla oficial de 2 letras |
| **Slug** | forma normalizada e única do nome, usada em URLs e buscas (`nome-uf`) |
| **Bairro** | subdivisão oficial de um município, de catálogo curado (`geography.neighborhoods`); **só existe bairro cadastrado para municípios com fonte oficial** |
| **Fonte curada** | origem oficial do catálogo de bairros (ex.: `lc_171_2025`), com URL e data registradas |
| **Lançamento** | município de estreia do produto: **Cariacica/ES** (código IBGE `3201308`) |
| **Seleção** | escolha em cascata cidade → bairro feita pelo usuário; o usuário **nunca cria** cidade ou bairro |

Fronteira: Geography é contexto **de referência** — não publica eventos de domínio; outros
contextos referenciam cidades/bairros **apenas por ID** (D7). O vínculo do perfil com a
localização vive em `identity.profiles` (Fase 2) e é integrado aqui pelas FKs criadas
nesta fase.

## 2. Invariantes

1. **G1** — Toda cidade tem código IBGE único (7 dígitos) e uma UF válida (27 siglas).
2. **G2** — Toda cidade tem `slug` único, derivado de `nome-uf` normalizado (minúsculas,
   sem acentos, `[a-z0-9-]`), porque nomes de município se repetem entre UFs.
3. **G3** — Todo bairro pertence a exatamente uma cidade; `slug` de bairro é único
   **dentro da cidade** (`unique (city_id, slug)`).
4. **G4** — Um bairro só pode ser selecionado **junto da sua cidade**: o par
   `(neighborhood_id, city_id)` precisa existir em `geography.neighborhoods`. A regra é
   garantida no banco por FK composta a partir de `identity.profiles`
   `(neighborhood_id, city_id) → geography.neighborhoods (id, city_id)`.
5. **G5** — Usuário (inclusive autenticado) **nunca** cria, edita ou remove cidade/bairro:
   catálogo é leitura pública; escrita só por `service_role` (seed e curadoria).
6. **G6** — Bairro é **opcional**: cidade sem bairro é seleção válida. Em município sem
   lista curada, a seleção de bairro fica indisponível e a exibição mostra
   "Bairro não informado" (P12).
7. **G7** — O seed é **idempotente** (`on conflict`) e versionado: a contagem de municípios
   confere com a origem IBGE (**5.571 municípios na API em 2026-10-10**; era 5.570) e toda
   UF tem ao menos um município.
8. **G8** — Todo bairro curado registra `source` e `source_url` da fonte oficial; a fonte é
   preservada em `supabase/seed/sources/` com `fonte`, `data` e hash SHA-256 em
   `shared.app_metadata`.

## 3. Entidades e value objects

- **`City`** (entidade, id = código IBGE)
  - `id: number` (7 dígitos) · `uf: Uf` · `name: string` (nome oficial com acentos)
  - `slug: string` (derivado, único) · `ibgeSyncedAt: Date | null`
- **`Neighborhood`** (entidade, id = uuid)
  - `id: string` · `cityId: number` · `name: string` · `slug: string`
  - `source: string` (ex.: `lc_171_2025`, `lei_4772_2010`, `ibge_subdistritos`)
  - `sourceUrl: string | null` · `createdAt: Date`
- **`Uf`** (VO): sigla de 2 letras entre as 27 oficiais; `all()` devolve a lista.
- **`LocationSelection`** (VO do par): `cityId` + `neighborhoodId?`; `neighborhoodId`
  `null` é válido (G6); par inválido (bairro de outra cidade) é rejeitado (G4).

## 4. Casos de uso

| Caso de uso | Entrada | Efeito | Evento |
|---|---|---|---|
| `SearchCities` | termo (≥2 chars), UF opcional, limite | lista cidades por nome/slug, UF primeiro na ordenação | — |
| `ListNeighborhoodsByCity` | cityId | lista bairros da cidade por nome; vazio = município sem curadoria (G6) | — |
| `GetCity` | cityId | cidade ou `NotFound` | — |
| `ValidateLocationSelection` | cityId, neighborhoodId? | valida G4 (bairro pertence à cidade) e G6 (bairro pode ser nulo); devolve os nomes para exibição | — |
| `GetLocationLabels` | cityId?, neighborhoodId? | devolve `{ cityName, neighborhoodName }` para projeções (ex.: perfil público) | — |

## 5. Eventos de domínio

Geography não publica eventos (contexto de referência). Consumidores dos seus dados:
`identity` (localização do perfil), `publication` (Fase 4), `engagement`/`social-graph`
(filtros), `analytics` (agregações).

## 6. Schema (DDL)

```sql
create schema if not exists geography;

create table geography.cities (
  id             bigint primary key,                -- código IBGE (7 dígitos)
  uf             char(2) not null,
  name           text not null check (char_length(trim(name)) between 2 and 120),
  slug           text not null unique,              -- nome-uf (G2)
  ibge_synced_at timestamptz,
  created_at     timestamptz not null default now(),
  constraint cities_uf_valida check (uf in ('AC','AL','AM','AP','BA','CE','DF','ES',
    'GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC',
    'SE','SP','TO'))
);

create table geography.neighborhoods (
  id          uuid primary key default gen_random_uuid(),
  city_id     bigint not null references geography.cities(id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 2 and 120),
  slug        text not null,
  source      text not null check (source in ('ibge_subdistritos','lei_4772_2010','lc_171_2025')),
  source_url  text,
  lat         double precision,                     -- opcional (evolução para raio)
  lng         double precision,
  created_at  timestamptz not null default now(),
  constraint neighborhoods_city_slug_uk unique (city_id, slug)   -- G3
);

-- alvo da FK composta de identity.profiles (G4)
create unique index neighborhoods_id_city_uidx
  on geography.neighborhoods (id, city_id);

create index neighborhoods_city_name_idx on geography.neighborhoods (city_id, slug);

-- integração com Identity (Fase 2 criou as colunas sem FK)
alter table identity.profiles
  add constraint profiles_city_fk
  foreign key (city_id) references geography.cities(id) not valid;
alter table identity.profiles validate constraint profiles_city_fk;

alter table identity.profiles
  add constraint profiles_neighborhood_city_fk
  foreign key (neighborhood_id, city_id)
  references geography.neighborhoods (id, city_id) not valid;
alter table identity.profiles validate constraint profiles_neighborhood_city_fk;

create index if not exists cities_uf_id_idx on geography.cities (uf, id);
```

Índice de busca de cidades por prefixo de slug alimenta o `SearchCities`
(`slug like termo%`); a lista completa de bairros cabe em memória (Cariacica = 100).

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select` em `geography.cities` | `anon` e `authenticated` (catálogo público) |
| `select` em `geography.neighborhoods` | `anon` e `authenticated` |
| `insert`/`update`/`delete` | **ninguém** via API (G5) — escrita só `service_role` no seed/curadoria |

Teste negativo correspondente: `authenticated` não consegue inserir em `cities` nem em
`neighborhoods`.

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| GET | `/api/geography/cities?q=&uf=&limit=` | termo (≥2), UF opcional, limite ≤50 | `{ cities: [{ id, name, uf, slug }] }` | 400 termo curto |
| GET | `/api/geography/neighborhoods?cityId=` | cityId | `{ neighborhoods: [{ id, name, slug }] }` | 400 cityId inválido, 404 cidade inexistente |
| POST | `/perfil/editar` *(server action da Fase 2)* | `cityId`, `neighborhoodId` | valida G4/G6 antes de salvar | par inconsistente (G4) |

Os handlers são **leituras públicas** servidas pelo Route Handler (D8: casos de uso no
servidor; o cliente consome JSON mínimo, sem linha crua do banco).

## 9. Testes derivados

**Unidade (domínio):**
- `Uf` aceita as 27 siglas e rejeita `XX`/`sp` minúsculo.
- `City.slugFrom("Cariacica", "ES")` → `cariacica-es`; nomes repetidos entre UFs geram
  slugs distintos (`bom-jesus-pi` ≠ `bom-jesus-rs`).
- `Neighborhood` rejeita `cityId` ausente e slug vazio.
- `LocationSelection` aceita `neighborhoodId` nulo (G6) e rejeita par cujo bairro não
  pertence à cidade (G4, no caso de uso).

**Seed (banco):**
- seed roda duas vezes seguidas sem duplicar linhas (G7).
- contagem de `cities` confere com a origem (5.570) e cada UF tem ≥ 1 município.
- Cariacica (`3201308`) tem 100 bairros, todos com `source`/`source_url` (G8).
- inserção de bairro duplicado na mesma cidade falha no `unique (city_id, slug)`.
- `authenticated` não insere em `cities`/`neighborhoods` (G5).

**E2E (Fase 9, Playwright):** buscar "Cariacica" no seletor, escolher bairro, salvar
perfil e ver a localização no perfil público; trocar de cidade limpa o bairro.

## 10. Dependências e o que fica para outras fases

- **Depende de:** API de localidades do IBGE (catálogo de municípios) e da legislação
  municipal de Cariacica (catálogo de bairros) — ambas espelhadas em `supabase/seed/`.
- **Integra:** `identity.profiles.city_id/neighborhood_id` recebem FK nesta fase.
- **Fica para a Fase 4:** `publication.publications` referencia `city_id`/`neighborhood_id`
  de Geography por ID (D7), para o feed por bairro/cidade.
- **Fica para a Fase 10:** agregações de bairro em `analytics_metrics` (leitura read-only).
