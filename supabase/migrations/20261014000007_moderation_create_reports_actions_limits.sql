-- Fase 7 — Moderation (denúncias, fila, trilha, limites)
-- Spec: docs/04-contexts/moderation.md
-- Decisões: P10, P16, P26, P28 (e D6, D7, D15)
--
-- ATENÇÃO — ambiente Supabase:
--   * Depende das migrations de Identity (Fase 2), Publication (Fase 4) e
--     Engagement (Fase 5).
--   * `identity.profiles` em FK: integração por ID (D7).
--   * Ações de moderação escrevem publication.publications/engagement.comments
--     pelo **service_role** (os triggers das Fases 4/5 só permitem ocultação
--     com esse papel).
--   * Adicionar "moderation" em schemas/extra_search_path do config.toml e
--     recriar a stack (ver procedimento no README).
--   * Reversível: drop schema moderation cascade.

create schema if not exists moderation;

-- ---------------------------------------------------------------- tabelas

-- M2/M3: uma denúncia por (usuário, alvo); motivo fechado.
create table if not exists moderation.reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null references identity.profiles(id) on delete cascade,
  reportable_type text not null check (reportable_type in ('publication', 'comment')),
  reportable_id  uuid not null,
  reason         text not null check (reason in ('spam', 'discurso_odio', 'informacao_falsa', 'conteudo_ilegal', 'assedio', 'outro')),
  details        text,
  created_at     timestamptz not null default now(),
  constraint reports_unique_per_user_target unique (reporter_id, reportable_type, reportable_id)
);

comment on table moderation.reports is
  'Denúncias de conteúdo (motivo fechado, uma por usuário/alvo). Spec: docs/04-contexts/moderation.md';

create index if not exists reports_target_idx
  on moderation.reports (reportable_type, reportable_id);

-- M7: trilha append-only de ações da moderação.
create table if not exists moderation.moderation_actions (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid not null references identity.profiles(id) on delete set null,
  action       text not null check (action in ('hide', 'restore', 'remove', 'report_resolved')),
  target_type  text not null check (target_type in ('publication', 'comment', 'report')),
  target_id    uuid not null,
  reason       text,
  created_at   timestamptz not null default now()
);

comment on table moderation.moderation_actions is
  'Trilha de auditoria da moderação (append-only). Spec: docs/04-contexts/moderation.md';

-- M9/P16: contadores de janela deslizante.
create table if not exists moderation.rate_limits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references identity.profiles(id) on delete cascade,
  scope        text not null,
  "window"     text not null check ("window" in ('hour', 'day')),
  window_start timestamptz not null,
  count        integer not null default 0 check (count >= 0),
  updated_at   timestamptz not null default now(),
  constraint rate_limits_unique_window unique (user_id, scope, "window", window_start)
);

comment on table moderation.rate_limits is
  'Limites de uso (P16) por usuário e janela. Spec: docs/04-contexts/moderation.md';

comment on column moderation.rate_limits."window" is
  'Tipo da janela do contador: hour (hora cheia) ou day (meia-noite UTC) — separa os contadores do mesmo escopo, que colidem na primeira hora do dia UTC';

-- ---------------------------------------------------------------- RLS (nega por padrão)

alter table moderation.reports enable row level security;
alter table moderation.moderation_actions enable row level security;
alter table moderation.rate_limits enable row level security;

-- Denúncia: o usuário cria a sua (leitura é só do service_role — evita expor
-- quem denunciou).
drop policy if exists "usuário cria a própria denúncia" on moderation.reports;
create policy "usuário cria a própria denúncia"
  on moderation.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- Limites: o próprio usuário lê e incrementa o seu contador.
drop policy if exists "usuário gerencia os próprios limites" on moderation.rate_limits;
create policy "usuário gerencia os próprios limites"
  on moderation.rate_limits for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- permissões de schema

revoke all on schema moderation from anon, authenticated;
grant usage on schema moderation to authenticated;

grant insert on moderation.reports to authenticated;
grant select, insert, update on moderation.rate_limits to authenticated;

-- service_role: fila, trilha e aplicação das ações (M5/M7).
grant usage on schema moderation to service_role;
grant select, insert, update, delete on moderation.reports to service_role;
grant select, insert on moderation.moderation_actions to service_role;
grant select, insert, update, delete on moderation.rate_limits to service_role;

-- supabase_auth_admin: nenhum trigger de moderação em auth.users.

-- ---------------------------------------------------------------- Realtime (D8)

alter table moderation.reports replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'moderation'
       and tablename = 'reports'
  ) then
    alter publication supabase_realtime add table moderation.reports;
  end if;
end
$$;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.moderation.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
