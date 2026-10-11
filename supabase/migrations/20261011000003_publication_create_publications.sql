-- Fase 4 — Publication
-- Spec: docs/04-contexts/publication.md
-- Decisões: P1, P3, P7, P8, P14, P15 (e D7, D8, D11)
--
-- ATENÇÃO — ambiente Supabase:
--   * Depende das migrations da Fase 2 (identity) e da Fase 3 (geography).
--   * Apagar é exclusão lógica (P8): não há política de delete via API.
--   * Reversível: drop schema publication cascade.

create schema if not exists publication;

-- ---------------------------------------------------------------- outbox (D7)

-- Eventos de domínio publicados no Postgres (definição da Fase 0). Consumidores
-- leem esta tabela; publicación não faz JOIN entre schemas.
create table if not exists shared.domain_events (
  id           bigserial primary key,
  context      text not null,
  name         text not null,
  aggregate_id text not null,
  payload      jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);

create index if not exists domain_events_context_name_idx
  on shared.domain_events (context, name, id);

revoke all on shared.domain_events from anon, authenticated;
revoke all on sequence shared.domain_events_id_seq from anon, authenticated;

-- ---------------------------------------------------------------- tabelas

create table if not exists publication.publications (
  id               uuid primary key default gen_random_uuid(),
  author_id        uuid references identity.profiles(id) on delete cascade,
                            -- anulável: NULL = conta encerrada, conteúdo anonimizado (I8/P4)
  type             text not null check (type in ('problem','idea')),
  title            text not null check (char_length(trim(title)) between 5 and 120),
  content          text not null check (char_length(trim(content)) between 10 and 5000),
  is_anonymous     boolean not null default false,
  city_id          bigint not null references geography.cities(id),
  neighborhood_id  uuid,
  edited_at        timestamptz,
  hidden_at        timestamptz,
  hidden_by        uuid references identity.profiles(id),
  deleted_at       timestamptz,
  created_at       timestamptz not null default now()
);

comment on table publication.publications is
  'Publicações (problema/ideia) e seu ciclo de vida. Spec: docs/04-contexts/publication.md';

-- G4/P6: o bairro precisa pertencer à cidade informada.
alter table publication.publications
  drop constraint if exists publications_neighborhood_city_fk;
alter table publication.publications
  add constraint publications_neighborhood_city_fk
  foreign key (neighborhood_id, city_id)
  references geography.neighborhoods (id, city_id) not valid;
alter table publication.publications validate constraint publications_neighborhood_city_fk;

-- P8/P9: feed público = não apagadas e não ocultas.
create index if not exists publications_feed_idx
  on publication.publications (city_id, neighborhood_id, created_at desc)
  where deleted_at is null and hidden_at is null;

create index if not exists publications_author_idx
  on publication.publications (author_id, created_at desc)
  where deleted_at is null;

create table if not exists publication.publication_media (
  publication_id   uuid not null references publication.publications(id) on delete cascade,
  path             text not null,
  position         smallint not null check (position between 1 and 3),
  byte_size        integer not null check (byte_size between 1 and 10485760),
  width            integer,
  height           integer,
  primary key (publication_id, position)
);

comment on table publication.publication_media is
  'Até 3 imagens WebP por publicação (bucket publication-media). Spec: docs/04-contexts/publication.md';

-- ------------------------------------------------- I8: anonimizar ao encerrar conta

-- Encerramento de conta (Identity I8): antes de apagar o perfil, as publicações
-- próprias são anonimizadas (autor Some -> NULL, is_anonymous = true). O cascade
-- apagaria as linhas; este trigger preserva o conteúdo como anônimo.
create or replace function publication.anonymize_on_profile_delete()
returns trigger
language plpgsql
as $$
begin
  update publication.publications
     set author_id = null,
         is_anonymous = true
   where author_id = old.id
     and deleted_at is null;

  delete from publication.publications
   where author_id = old.id
     and deleted_at is not null;

  return old;
end;
$$;

drop trigger if exists publications_anonymize_on_profile_delete on identity.profiles;
create trigger publications_anonymize_on_profile_delete
  before delete on identity.profiles
  for each row execute function publication.anonymize_on_profile_delete();

-- ---------------------------------------------------------------- RLS

alter table publication.publications enable row level security;
alter table publication.publication_media enable row level security;

-- Leitura pública (projeção anônima é responsabilidade da aplicação — P4).
drop policy if exists "publicações são públicas para leitura" on publication.publications;
create policy "publicações são públicas para leitura"
  on publication.publications for select
  to anon, authenticated
  using (deleted_at is null and hidden_at is null);

-- Escrita somente do dono.
drop policy if exists "usuário insere a própria publicação" on publication.publications;
create policy "usuário insere a própria publicação"
  on publication.publications for insert
  to authenticated
  with check (auth.uid() = author_id);

-- P7/P8: atualização só do dono; hidden_at/hidden_by só service_role (moderação).
drop policy if exists "usuário atualiza a própria publicação" on publication.publications;
create policy "usuário atualiza a própria publicação"
  on publication.publications for update
  to authenticated
  using (auth.uid() = author_id and deleted_at is null)
  with check (auth.uid() = author_id);

create or replace function publication.enforce_publication_writes()
returns trigger
language plpgsql
as $$
begin
  -- P4: autor nunca muda depois de criado.
  if new.author_id is distinct from old.author_id then
    raise exception 'autor da publicação é imutável'
      using errcode = 'restrict_violation';
  end if;

  -- P1: tipo é imutável.
  if new.type <> old.type then
    raise exception 'tipo da publicação é imutável'
      using errcode = 'restrict_violation';
  end if;

  -- P8: exclusão é lógica (deleted_at preenchido pelo dono).
  if new.deleted_at is not null and old.deleted_at is null then
    new.hidden_at := null;
    new.hidden_by := null;
  end if;

  -- Ocultar/restaurar (hidden_at/hidden_by) é exclusivo da moderação.
  if (new.hidden_at, new.hidden_by) is distinct from (old.hidden_at, old.hidden_by)
     and new.deleted_at is null
     and auth.role() <> 'service_role' then
    raise exception 'ocultação é ação de moderação'
      using errcode = 'insufficient_privilege';
  end if;

  -- P7: edição marca edited_at.
  if (new.title, new.content) is distinct from (old.title, old.content)
     and new.edited_at is null then
    new.edited_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists publications_enforce_writes on publication.publications;
create trigger publications_enforce_writes
  before update on publication.publications
  for each row execute function publication.enforce_publication_writes();

-- Mídia: leitura pública; escrita apenas do dono da publicação.
drop policy if exists "mídia da publicação é pública para leitura" on publication.publication_media;
create policy "mídia da publicação é pública para leitura"
  on publication.publication_media for select
  to anon, authenticated
  using (true);

drop policy if exists "dono gerencia a mídia da publicação" on publication.publication_media;
create policy "dono gerencia a mídia da publicação"
  on publication.publication_media for all
  to authenticated
  using (
    exists (
      select 1 from publication.publications p
       where p.id = publication_media.publication_id
         and p.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from publication.publications p
       where p.id = publication_media.publication_id
         and p.author_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------- permissões

revoke all on schema publication from anon, authenticated;
grant usage on schema publication to anon, authenticated;
grant select, insert, update on publication.publications to authenticated;
grant select on publication.publications to anon;
grant select on publication.publication_media to anon, authenticated;
grant insert, update, delete on publication.publication_media to authenticated;

revoke all on function publication.anonymize_on_profile_delete() from anon, authenticated;
revoke all on function publication.enforce_publication_writes() from anon, authenticated;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.publication.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
