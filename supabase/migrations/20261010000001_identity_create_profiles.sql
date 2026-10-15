-- Fase 2 — Identity & Access
-- Spec: docs/04-contexts/identity-access.md
-- Decisões: P1–P6, P13, P22 (e D2, D6, D8)
--
-- ATENÇÃO — ambiente Supabase:
--   * `auth.users` é gerenciado pelo Supabase Auth. A referência
--     `references auth.users(id)` é intencional e permitida (não é um bounded context
--     nosso): quem cria o usuário é o Auth, e o perfil é criado por trigger.
--   * Rodar no SQL Editor do projeto ou via `supabase db push`.
--   * Reversível: drop schema identity cascade (apaga também os perfis).

-- Extensões (Supabase instala no schema "extensions").
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------- schemas dos contextos

create schema if not exists shared;
create schema if not exists identity;

-- ---------------------------------------------------------------- kernel compartilhado

-- Metadados do sistema: versão de seed, versão de schema por contexto.
create table if not exists shared.app_metadata (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

revoke all on shared.app_metadata from anon, authenticated;

-- ---------------------------------------------------------------- funções utilitárias

-- Normaliza texto para slug: minúsculas, sem acentos, espaços -> hífen, só [a-z0-9-].
create or replace function identity.slugify(value text)
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

-- ---------------------------------------------------------------- tabela

create table if not exists identity.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text not null unique,
  full_name         text not null check (char_length(trim(full_name)) between 2 and 120),
  bio               text check (bio is null or char_length(bio) <= 2000),
  phone             text,
  avatar_path       text,
  cover_path        text,
  role              text not null default 'user'
                    check (role in ('user', 'moderator', 'admin')),
  verified_org      text check (verified_org is null
                      or char_length(trim(verified_org)) between 3 and 120),
  is_verified       boolean not null default false,
  city_id           bigint,     -- FK para geography.cities criada na Fase 3
  neighborhood_id   uuid,       -- FK para geography.neighborhoods criada na Fase 3
  show_neighborhood boolean not null default true,  -- I7: exibir o bairro no perfil público

  termos_aceitos_em timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- I5: o selo e o nome do órgão não podem existir separados
  constraint profiles_verified_org_consistent
    check ((verified_org is null) = (is_verified = false))
);

create index if not exists profiles_city_neighborhood_idx
  on identity.profiles (city_id, neighborhood_id);

-- ------------------------------------------------- I2/I4/I5: invariantes na escrita

create or replace function identity.enforce_profile_invariants()
returns trigger
language plpgsql
as $$
begin
  -- I2: username é imutável para qualquer papel, inclusive service_role.
  if new.username <> old.username then
    raise exception 'username é imutável'
      using errcode = 'restrict_violation';
  end if;

  -- I4: papel só muda por service_role (admin no painel).
  if new.role <> old.role and auth.role() <> 'service_role' then
    raise exception 'role só pode ser alterado por administrador'
      using errcode = 'insufficient_privilege';
  end if;

  -- I5: selo institucional só é concedido por service_role.
  if (new.verified_org, new.is_verified)
       is distinct from (old.verified_org, old.is_verified)
     and auth.role() <> 'service_role' then
    raise exception 'selo institucional só pode ser concedido por administrador'
      using errcode = 'insufficient_privilege';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_enforce_invariants on identity.profiles;
create trigger profiles_enforce_invariants
  before update on identity.profiles
  for each row execute function identity.enforce_profile_invariants();

-- ------------------------------------------------- I1/I3: perfil criado pelo Auth

-- I3: username gerado do nome; vazio -> 'usuario-' + 8 aleatórios; colisão -> sufixo.
-- SECURITY DEFINER: o trigger roda no contexto do Auth (supabase_auth_admin), que não
-- passa na política RLS de insert em profiles. Como definer do owner (postgres), o
-- insert do perfil próprio é feito com privilégio de owner — sem abrir a escrita para
-- os clientes (as policies de insert/update continuam valendo para anon/authenticated).
create or replace function identity.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base  text := identity.slugify(coalesce(new.raw_user_meta_data ->> 'name', 'usuario'));
  uname text := coalesce(nullif(base, ''), 'usuario-' || substr(pg_catalog.md5(pg_catalog.random()::text), 1, 8));
  n     integer := 1;
begin
  while exists (select 1 from identity.profiles where username = uname) loop
    uname := base || '-' || n;
    n := n + 1;
  end loop;

  insert into identity.profiles (id, username, full_name)
  values (new.id, uname, coalesce(nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), ''), 'Usuário'));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function identity.handle_new_user();

-- ---------------------------------------------------------------- RLS (nega por padrão)

alter table identity.profiles enable row level security;

-- Leitura pública (I7): a projeção pública é responsabilidade da aplicação, que nunca
-- seleciona email/phone de outro usuário.
drop policy if exists "perfis são públicos para leitura" on identity.profiles;
create policy "perfis são públicos para leitura"
  on identity.profiles for select
  to anon, authenticated
  using (true);

-- Escrita somente do próprio perfil.
drop policy if exists "usuário insere o próprio perfil" on identity.profiles;
create policy "usuário insere o próprio perfil"
  on identity.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "usuário atualiza o próprio perfil" on identity.profiles;
create policy "usuário atualiza o próprio perfil"
  on identity.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Encerramento de conta (I8): a aplicação apaga via service_role após anonimizar
-- publicações; política local permite ao dono remover a própria linha.
drop policy if exists "usuário remove o próprio perfil" on identity.profiles;
create policy "usuário remove o próprio perfil"
  on identity.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------- permissões de schema

revoke all on schema identity from anon, authenticated;
grant usage on schema identity to anon, authenticated;
grant select, insert, update, delete on identity.profiles to authenticated;
grant select on identity.profiles to anon;

-- service_role: papel de plataforma usado por seed, admin e encerramento de conta.
-- Na nuvem o Supabase já concede estes privilégios; no ambiente local (CLI) o papel
-- existe sem eles — por isso o grant explícito (idempotente).
grant usage on schema identity to service_role;
grant select, insert, update, delete on identity.profiles to service_role;

-- supabase_auth_admin: papel com que o Auth (gotrue) se conecta ao banco para rodar
-- o trigger on_auth_user_created, que insere em identity.profiles (I1/I3). Sem estes
-- grants o cadastro falha com 500 ("permission denied for schema identity").
grant usage on schema identity to supabase_auth_admin;
grant select, insert, update, delete on identity.profiles to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

-- identity.slugify usa extensions.unaccent (disparado pelo trigger a cada cadastro).
grant usage on schema extensions to supabase_auth_admin, service_role;
grant execute on function extensions.unaccent(text) to supabase_auth_admin, service_role;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.identity.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();

comment on table identity.profiles is
  'Perfil de produto, 1:1 com auth.users. Spec: docs/04-contexts/identity-access.md';
