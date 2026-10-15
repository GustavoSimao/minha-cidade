-- Fase 10 — Analytics (snapshots diários para a página de transparência)
-- Spec: docs/04-contexts/analytics.md
-- Decisões: P20 (transparência), D6 (um schema por contexto), D7 (integração por ID),
--            T1 (cron) e T2 (nenhuma coluna identifica pessoa) do spec de analytics.
--
-- ATENÇÃO — ambiente Supabase:
--   * `analytics` precisa entrar em schemas/extra_search_path do config.toml
--     (feito nesta mesma migration: ver `alter database set ...`? NÃO — a config é
--     arquivo; este comentário documenta a ordem: config.toml primeiro, stack
--     recriada, depois a migration. O procedimento está no README.)
--   * As funções são SECURITY DEFINER: o cron e o service_role rodam o refresh
--     sem precisar de acesso direto aos schemas dos contextos.
--   * Nenhuma função faz JOIN entre schemas (D7): cada uma lê o(s) schema(s) do
--     seu próprio contexto e devolve números.
--   * Reversível: drop schema analytics cascade.

create schema if not exists analytics;

-- ---------------------------------------------------------------- tabela

-- T1: snapshot diário, só contagens — nenhuma coluna referencia pessoa.
-- T2: `active_authors` é o único dado derivado de perfil, e é uma CONTAGEM
-- distinta no dia (nunca uma lista).
create table if not exists analytics.daily_metrics (
  day                    date primary key,
  publications_problem   integer not null default 0 check (publications_problem >= 0),
  publications_idea      integer not null default 0 check (publications_idea >= 0),
  publications_anonymous integer not null default 0 check (publications_anonymous >= 0),
  active_authors         integer not null default 0 check (active_authors >= 0),
  supports               integer not null default 0 check (supports >= 0),
  opposes                integer not null default 0 check (opposes >= 0),
  comments               integer not null default 0 check (comments >= 0),
  reports                integer not null default 0 check (reports >= 0),
  moderation_hidden      integer not null default 0 check (moderation_hidden >= 0),
  moderation_removed     integer not null default 0 check (moderation_removed >= 0),
  new_users              integer not null default 0 check (new_users >= 0),
  refreshed_at           timestamptz not null default now()
);

comment on table analytics.daily_metrics is
  'Snapshots diários agregados para /transparencia (P20). Spec: docs/04-contexts/analytics.md';

-- ---------------------------------------------------------------- funções por contexto (D7)

-- Publication: publicações do dia por tipo, anônimas e autores distintos.
create or replace function analytics.daily_publication_counts(p_day date)
returns table (
  problems integer,
  ideas integer,
  anonymous integer,
  active_authors integer
)
language sql
security definer
set search_path = ''
as $$
  select
    count(*) filter (where p.type = 'problem')::integer,
    count(*) filter (where p.type = 'idea')::integer,
    count(*) filter (where p.is_anonymous)::integer,
    count(distinct p.author_id) filter (where p.author_id is not null)::integer
  from publication.publications p
  where (p.created_at at time zone 'UTC')::date = p_day
    and p.deleted_at is null;
$$;

-- Engagement: apoios, oposições e comentários vivos do dia.
create or replace function analytics.daily_engagement_counts(p_day date)
returns table (
  supports integer,
  opposes integer,
  comments integer
)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*)::integer from engagement.reactions r
      where r.type = 'support'
        and (r.created_at at time zone 'UTC')::date = p_day),
    (select count(*)::integer from engagement.reactions r
      where r.type = 'oppose'
        and (r.created_at at time zone 'UTC')::date = p_day),
    (select count(*)::integer from engagement.comments c
      where c.deleted_at is null
        and (c.created_at at time zone 'UTC')::date = p_day);
$$;

-- Moderation: denúncias criadas e ações aplicadas no dia.
create or replace function analytics.daily_moderation_counts(p_day date)
returns table (
  reports integer,
  hidden integer,
  removed integer
)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*)::integer from moderation.reports rp
      where (rp.created_at at time zone 'UTC')::date = p_day),
    (select count(*)::integer from moderation.moderation_actions a
      where a.action = 'hide'
        and (a.created_at at time zone 'UTC')::date = p_day),
    (select count(*)::integer from moderation.moderation_actions a
      where a.action = 'remove'
        and (a.created_at at time zone 'UTC')::date = p_day);
$$;

-- Identity: contas criadas no dia.
create or replace function analytics.daily_identity_counts(p_day date)
returns table (
  new_users integer
)
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer
  from identity.profiles p
  where (p.created_at at time zone 'UTC')::date = p_day;
$$;

-- Refresh do snapshot de um dia: chama as quatro funções por contexto e faz
-- upsert. Idempotente — rodar duas vezes no mesmo dia não duplica linha.
create or replace function analytics.refresh_daily_metrics(p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- `RETURNS TABLE` não cria tipo nomeado: as linhas vêm como `record`.
  pub record;
  eng record;
  mod record;
  ids record;
begin
  select * into pub from analytics.daily_publication_counts(p_day);
  select * into eng from analytics.daily_engagement_counts(p_day);
  select * into mod from analytics.daily_moderation_counts(p_day);
  select * into ids from analytics.daily_identity_counts(p_day);

  insert into analytics.daily_metrics as m (
    day, publications_problem, publications_idea, publications_anonymous,
    active_authors, supports, opposes, comments, reports, moderation_hidden,
    moderation_removed, new_users, refreshed_at
  ) values (
    p_day, pub.problems, pub.ideas, pub.anonymous, pub.active_authors,
    eng.supports, eng.opposes, eng.comments, mod.reports, mod.hidden,
    mod.removed, ids.new_users, now()
  )
  on conflict (day) do update set
    publications_problem = excluded.publications_problem,
    publications_idea = excluded.publications_idea,
    publications_anonymous = excluded.publications_anonymous,
    active_authors = excluded.active_authors,
    supports = excluded.supports,
    opposes = excluded.opposes,
    comments = excluded.comments,
    reports = excluded.reports,
    moderation_hidden = excluded.moderation_hidden,
    moderation_removed = excluded.moderation_removed,
    new_users = excluded.new_users,
    refreshed_at = excluded.refreshed_at;
end;
$$;

-- ---------------------------------------------------------------- RLS (leitura pública)

alter table analytics.daily_metrics enable row level security;

drop policy if exists "métricas são públicas para leitura" on analytics.daily_metrics;
create policy "métricas são públicas para leitura"
  on analytics.daily_metrics for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------- permissões de schema

revoke all on schema analytics from anon, authenticated;
grant usage on schema analytics to anon, authenticated;
grant select on analytics.daily_metrics to anon, authenticated;

-- A escrita é só pelas funções definer (cron/service_role): nenhum via API.
grant usage on schema analytics to service_role;
grant select, insert, update on analytics.daily_metrics to service_role;

-- ---------------------------------------------------------------- cron diário (T1)

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;

  if not exists (select 1 from cron.job where jobname = 'analytics-daily-refresh') then
    perform cron.schedule(
      'analytics-daily-refresh',
      '20 3 * * *',
      $cron$ select analytics.refresh_daily_metrics(((now() at time zone 'UTC')::date - 1)) $cron$
    );
  end if;
end
$$;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.analytics.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
