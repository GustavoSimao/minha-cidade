-- Fase 8 — Notification (notificações in-app)
-- Spec: docs/04-contexts/notification.md
-- Decisões: P29 (e D6, D7, D8)
--
-- ATENÇÃO — ambiente Supabase:
--   * Depende das migrations de Identity (Fase 2) e shared (Fase 1/4 — outbox).
--   * `identity.profiles` em FK: integração por ID (D7).
--   * Adicionar "notification" em schemas/extra_search_path do config.toml e
--     recriar a stack (ver procedimento no README).
--   * Reversível: drop schema notification cascade.

create schema if not exists notification;

-- ---------------------------------------------------------------- tabelas

-- N1/N3/N4: notificação destinada a um usuário, tipo fechado, payload mínimo.
create table if not exists notification.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references identity.profiles(id) on delete cascade,
  type       text not null check (type in ('comment_added', 'publication_supported', 'publication_opposed', 'friend_requested', 'friend_accepted')),
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

comment on table notification.notifications is
  'Notificações in-app (N1–N7). Spec: docs/04-contexts/notification.md';

create index if not exists notifications_user_unread_idx
  on notification.notifications (user_id, created_at desc)
  where read_at is null;

-- N6: eventos já materializados (idempotência do trigger).
create table if not exists notification.processed_events (
  event_id     bigint primary key,
  processed_at timestamptz not null default now()
);

comment on table notification.processed_events is
  'Eventos do outbox já materializados (idempotência — N6).';

-- -------------------------------------------------- consumo do outbox (N2/N3/N4/N6)

-- Mapeia eventos dos contextos (publication.publication_* via engagement,
-- social_graph.friend_*) para notificações. Um único trigger no momento do
-- INSERT no outbox: não existe "remover/atualizar" de evento.
create or replace function notification.materialize_from_outbox()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
  payload     jsonb := new.payload;
  kind        text;
begin
  -- N6: idempotência (concorrência: inserção dupla não cria duas notificações).
  begin
    insert into notification.processed_events (event_id) values (new.id);
  exception when unique_violation then
    return new;
  end;

  kind := new.name;

  -- N2: nunca notifica o próprio autor da ação.
  if kind in ('comment.added', 'publication.supported', 'publication.opposed') then
    -- Publicações: o dono é o author_id da publicação referenciada.
    select author_id into target_user
      from publication.publications
     where id = (payload ->> 'publicationId')::uuid;

    if target_user is null or target_user = (payload ->> 'userId')::uuid then
      return new;
    end if;

    insert into notification.notifications (user_id, type, payload)
    values (
      target_user,
      case kind
        when 'comment.added' then 'comment_added'
        when 'publication.supported' then 'publication_supported'
        else 'publication_opposed'
      end,
      payload || jsonb_build_object('eventName', kind)
    );

    return new;
  end if;

  if kind = 'friend.requested' then
    insert into notification.notifications (user_id, type, payload)
    values ((payload ->> 'targetId')::uuid, 'friend_requested', payload);

    return new;
  end if;

  if kind = 'friend.accepted' then
    insert into notification.notifications (user_id, type, payload)
    values ((payload ->> 'requesterId')::uuid, 'friend_accepted', payload);

    return new;
  end if;

  -- Eventos sem notificação correspondente (ex.: content.reported) são
  -- ignorados sem erro — o outbox é compartilhado.

  return new;
end;
$$;

drop trigger if exists domain_events_materialize_notification on shared.domain_events;
create trigger domain_events_materialize_notification
  after insert on shared.domain_events
  for each row execute function notification.materialize_from_outbox();

-- ---------------------------------------------------------------- RLS (nega por padrão)

alter table notification.notifications enable row level security;

-- N5: só o dono lê e marca como lida.
drop policy if exists "dono vê as próprias notificações" on notification.notifications;
create policy "dono vê as próprias notificações"
  on notification.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "dono marca como lida" on notification.notifications;
create policy "dono marca como lida"
  on notification.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on schema notification from anon, authenticated;
grant usage on schema notification to authenticated;

grant select, update on notification.notifications to authenticated;

revoke all on function notification.materialize_from_outbox() from anon, authenticated;

-- service_role: plataforma (limpeza/entrega futura; trigger roda como owner).
grant usage on schema notification to service_role;
grant select, insert, update, delete on notification.notifications to service_role;
grant select, insert on notification.processed_events to service_role;

-- supabase_auth_admin: nenhum trigger de notificação em auth.users.

-- ---------------------------------------------------------------- Realtime (D8)

alter table notification.notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'notification'
       and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notification.notifications;
  end if;
end
$$;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.notification.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
