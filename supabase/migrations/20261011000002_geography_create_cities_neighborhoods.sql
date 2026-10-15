-- Fase 3 — Geography
-- Spec: docs/04-contexts/geography.md
-- Decisões: P11, P12, ADR-0010, ADR-0015 (e D2, D6, D7)
--
-- ATENÇÃO — ambiente Supabase:
--   * Depende da migration da Fase 2 (schema `identity` com a tabela `profiles`),
--     cujas colunas `city_id`/`neighborhood_id` recebem FK aqui.
--   * Catálogo é público para leitura; escrita somente via service_role (seed).
--   * Reversível: drop schema geography cascade (apaga as FKs de identity.profiles).

create schema if not exists geography;

-- --------------------------------------------------------------- utilidades

-- Normaliza texto para slug: minúsculas, sem acentos, só [a-z0-9-].
create or replace function geography.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
           regexp_replace(
             lower(extensions.unaccent(coalesce(value, ''))),
             '[^a-z0-9]+',
             '-',
             'g'))
$$;

-- ---------------------------------------------------------------- tabelas

create table if not exists geography.cities (
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

comment on table geography.cities is
  'Municípios do catálogo IBGE. Spec: docs/04-contexts/geography.md';

create table if not exists geography.neighborhoods (
  id          uuid primary key default gen_random_uuid(),
  city_id     bigint not null references geography.cities(id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 2 and 120),
  slug        text not null,
  source      text not null check (source in
               ('ibge_subdistritos', 'lei_4772_2010', 'lc_171_2025')),
  source_url  text,
  lat         double precision,                     -- opcional (evolução para raio)
  lng         double precision,
  created_at  timestamptz not null default now(),
  constraint neighborhoods_city_slug_uk unique (city_id, slug)   -- G3
);

comment on table geography.neighborhoods is
  'Bairros de catálogo curado por município (G8). Spec: docs/04-contexts/geography.md';

-- Alvo da FK composta de identity.profiles (G4).
create unique index if not exists neighborhoods_id_city_uidx
  on geography.neighborhoods (id, city_id);

create index if not exists neighborhoods_city_name_idx
  on geography.neighborhoods (city_id, slug);

create index if not exists cities_uf_id_idx
  on geography.cities (uf, id);

-- ------------------------------------------------- integração com Identity

-- FKs das colunas criadas na Fase 2 (sem FK, por decisão documentada).
alter table identity.profiles
  drop constraint if exists profiles_city_fk;
alter table identity.profiles
  add constraint profiles_city_fk
  foreign key (city_id) references geography.cities(id) not valid;
alter table identity.profiles validate constraint profiles_city_fk;

-- FK composta: o bairro precisa pertencer à cidade informada (G4).
alter table identity.profiles
  drop constraint if exists profiles_neighborhood_city_fk;
alter table identity.profiles
  add constraint profiles_neighborhood_city_fk
  foreign key (neighborhood_id, city_id)
  references geography.neighborhoods (id, city_id) not valid;
alter table identity.profiles validate constraint profiles_neighborhood_city_fk;

-- ---------------------------------------------------------------- RLS (G5)

alter table geography.cities enable row level security;
alter table geography.neighborhoods enable row level security;

drop policy if exists "cidades são públicas para leitura" on geography.cities;
create policy "cidades são públicas para leitura"
  on geography.cities for select
  to anon, authenticated
  using (true);

drop policy if exists "bairros são públicos para leitura" on geography.neighborhoods;
create policy "bairros são públicos para leitura"
  on geography.neighborhoods for select
  to anon, authenticated
  using (true);

-- Sem política de insert/update/delete: escrita apenas por service_role (G5).

-- ---------------------------------------------------------------- permissões

revoke all on schema geography from anon, authenticated;
grant usage on schema geography to anon, authenticated;
grant select on geography.cities to anon, authenticated;
grant select on geography.neighborhoods to anon, authenticated;

revoke all on function geography.slugify(text) from anon, authenticated;

-- service_role: papel de plataforma usado pelos seeds (catálogo IBGE/bairros).
-- Na nuvem o Supabase já concede estes privilégios; no ambiente local (CLI) o papel
-- existe sem eles — por isso o grant explícito (idempotente).
grant usage on schema geography to service_role;
grant select, insert, update, delete on geography.cities to service_role;
grant select, insert, update, delete on geography.neighborhoods to service_role;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.geography.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
