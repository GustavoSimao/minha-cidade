-- Fase 5 — Engagement (reações, comentários, salvamentos)
-- Spec: docs/04-contexts/engagement.md
-- Decisões: P4, P8, P9, P10, P13, P29 (e D6, D7, D8)
--
-- ATENÇÃO — ambiente Supabase:
--   * Depende das migrations de Publication (Fase 4) e Identity (Fase 2).
--   * `publication.publications`/`identity.profiles` em FK: mesmo padrão já
--     documentado nas Fases 2–4 (integração por ID; a aplicação nunca faz JOIN
--     entre contextos — D7).
--   * Reversível: drop schema engagement cascade (não afeta as publicações).

create schema if not exists engagement;

-- ---------------------------------------------------------------- tabelas

-- E1: reação única por usuário/publicação (toggle faz a alternância).
create table if not exists engagement.reactions (
  id             uuid primary key default gen_random_uuid(),
  publication_id uuid not null references publication.publications(id) on delete cascade,
  user_id        uuid not null references identity.profiles(id) on delete cascade,
  type           text not null check (type in ('support', 'oppose')),
  created_at     timestamptz not null default now(),
  constraint reactions_user_publication_uk unique (publication_id, user_id)
);

comment on table engagement.reactions is
  'Reação apoio/oposição, uma por usuário e publicação. Spec: docs/04-contexts/engagement.md';

create index if not exists reactions_publication_idx
  on engagement.reactions (publication_id);

-- E3/E4/E5: comentário de 2–2.000 caracteres, identificado ou anônimo;
-- anonimato e autor imutáveis (E5); edição em até 15 min; ocultação é da
-- moderação (E10 — Fase 7).
create table if not exists engagement.comments (
  id             uuid primary key default gen_random_uuid(),
  publication_id uuid not null references publication.publications(id) on delete cascade,
  author_id      uuid,           -- anulável: NULL = conta encerrada, conteúdo anonimizado (I8)
  content        text not null check (char_length(trim(content)) between 2 and 2000),
  is_anonymous   boolean not null default false,
  edited_at      timestamptz,
  hidden_at      timestamptz,
  hidden_by      uuid references identity.profiles(id),
  deleted_at     timestamptz,
  created_at     timestamptz not null default now()
);

comment on table engagement.comments is
  'Comentários de publicação (2–2.000 caracteres, anonimato opcional). Spec: docs/04-contexts/engagement.md';

create index if not exists comments_publication_created_idx
  on engagement.comments (publication_id, created_at desc);

-- E6: salvamento privado (lista "ler depois" do usuário).
create table if not exists engagement.bookmarks (
  user_id        uuid not null references identity.profiles(id) on delete cascade,
  publication_id uuid not null references publication.publications(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (user_id, publication_id)
);

comment on table engagement.bookmarks is
  'Salvamentos privados por usuário. Spec: docs/04-contextos/engagement.md';

-- ------------------------------------------------- I8: anonimizar ao encerrar conta

-- Mesmo princípio da Fase 4: encerrar a conta preserva o conteúdo da
-- comunidade como anônimo em vez de apagar (comentários), e as reações e
-- salvamentos do usuário desaparecem (cascade nas FKs de user_id).
create or replace function engagement.anonymize_comments_on_profile_delete()
returns trigger
language plpgsql
as $$
begin
  update engagement.comments
     set author_id = null,
         is_anonymous = true
   where author_id = old.id
     and deleted_at is null;

  delete from engagement.comments
   where author_id = old.id
     and deleted_at is not null;

  return old;
end;
$$;

drop trigger if exists comments_anonymize_on_profile_delete on identity.profiles;
create trigger comments_anonymize_on_profile_delete
  before delete on identity.profiles
  for each row execute function engagement.anonymize_comments_on_profile_delete();

-- -------------------------------------------------- invariantes na escrita (E5/E10)

create or replace function engagement.enforce_comment_writes()
returns trigger
language plpgsql
as $$
begin
  -- E5: autor e anonimato são imutáveis (como em Publication — P7/P14).
  if new.author_id is distinct from old.author_id then
    raise exception 'autor do comentário é imutável'
      using errcode = 'restrict_violation';
  end if;

  if new.is_anonymous <> old.is_anonymous then
    raise exception 'anonimato do comentário é imutável'
      using errcode = 'restrict_violation';
  end if;

  -- E5: edição somente nos primeiros 15 minutos.
  if (new.content, new.edited_at) is distinct from (old.content, old.edited_at)
     and new.created_at < now() - interval '15 minutes' then
    raise exception 'comentário só pode ser editado em até 15 minutos'
      using errcode = 'restrict_violation';
  end if;

  -- E5: apagar é lógico (deleted_at); ocultar é da moderação (E10).
  if new.deleted_at is not null and old.deleted_at is null then
    new.hidden_at := null;
    new.hidden_by := null;
  end if;

  if (new.hidden_at, new.hidden_by) is distinct from (old.hidden_at, old.hidden_by)
     and new.deleted_at is null
     and auth.role() <> 'service_role' then
    raise exception 'ocultação de comentário é ação de moderação'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_enforce_writes on engagement.comments;
create trigger comments_enforce_writes
  before update on engagement.comments
  for each row execute function engagement.enforce_comment_writes();

-- ---------------------------------------------------------------- RLS (nega por padrão)

alter table engagement.reactions enable row level security;
alter table engagement.comments enable row level security;
alter table engagement.bookmarks enable row level security;

-- Reações são públicas para leitura (contadores sem login).
drop policy if exists "reações são públicas para leitura" on engagement.reactions;
create policy "reações são públicas para leitura"
  on engagement.reactions for select
  to anon, authenticated
  using (true);

-- Uma reação por usuário: só o dono escreve (E1 — toggle é update do dono).
drop policy if exists "usuário gerencia a própria reação" on engagement.reactions;
create policy "usuário gerencia a própria reação"
  on engagement.reactions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comentários: leitura pública das não apagadas/não ocultas; o autor vê as
-- próprias (inclusive apagada por ele) — mesma regra validada em Publication.
drop policy if exists "comentários são públicos para leitura" on engagement.comments;
create policy "comentários são públicos para leitura"
  on engagement.comments for select
  to anon, authenticated
  using (
    (deleted_at is null and hidden_at is null)
    or auth.uid() = author_id
  );

drop policy if exists "usuário comenta" on engagement.comments;
create policy "usuário comenta"
  on engagement.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "autor edita/apaga o próprio comentário" on engagement.comments;
create policy "autor edita/apaga o próprio comentário"
  on engagement.comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Salvamentos: privados (sem anon) — só o dono lê e escreve (E6).
-- update: o repositório faz upsert (idempotente, E6) e o Postgres exige
-- INSERT + SELECT + UPDATE para INSERT ... ON CONFLICT DO UPDATE.
drop policy if exists "dono vê os próprios salvamentos" on engagement.bookmarks;
create policy "dono vê os próprios salvamentos"
  on engagement.bookmarks for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- permissões de schema

revoke all on schema engagement from anon, authenticated;
grant usage on schema engagement to anon, authenticated;

grant select on engagement.reactions to anon, authenticated;
grant select, insert, update, delete on engagement.reactions to authenticated;

grant select on engagement.comments to anon;
grant select, insert, update on engagement.comments to authenticated;

grant select, insert, update, delete on engagement.bookmarks to authenticated;

revoke all on function engagement.enforce_comment_writes() from anon, authenticated;

-- service_role: plataforma (moderação — Fase 7 — e consumo do outbox).
grant usage on schema engagement to service_role;
grant select, insert, update, delete on engagement.reactions to service_role;
grant select, insert, update, delete on engagement.comments to service_role;
grant select, insert, update, delete on engagement.bookmarks to service_role;
grant usage on schema shared to service_role;
grant select, insert on shared.domain_events to service_role;
grant usage on schema extensions to service_role;
grant execute on function extensions.unaccent(text) to service_role;

-- supabase_auth_admin: o trigger comments_anonymize_on_profile_delete roda quando
-- o Auth apaga auth.users (encerramento de conta — Identity I8).
grant usage on schema engagement to supabase_auth_admin;
grant select, update, delete on engagement.comments to supabase_auth_admin;

-- ---------------------------------------------------------------- Realtime (D8)

-- Sem replica identity full e sem estar na publicação supabase_realtime, o
-- cliente não recebe eventos de DELETE/UPDATE.
alter table engagement.reactions replica identity full;
alter table engagement.comments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'engagement'
       and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table engagement.reactions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'engagement'
       and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table engagement.comments;
  end if;
end
$$;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.engagement.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
