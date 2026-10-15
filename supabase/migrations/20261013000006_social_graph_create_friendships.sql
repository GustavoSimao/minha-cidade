-- Fase 6 — Social Graph (amizades)
-- Spec: docs/04-contexts/social-graph.md
-- Decisões: P25, P29 (e D6, D7, D8)
--
-- ATENÇÃO — ambiente Supabase:
--   * Depende das migrations de Identity (Fase 2) e Publication (Fase 4).
--   * `identity.profiles` em FK: integração por ID (D7) — a aplicação não faz
--     JOIN entre contextos.
--   * Adicionar "social_graph" em schemas/extra_search_path do config.toml e
--     recriar a stack (supabase stop && start) para o PostgREST carregar o
--     schema.
--   * Reversível: drop schema social_graph cascade.

create schema if not exists social_graph;

-- S2: sentinela ordenada (user_low < user_high) com unique no par —
-- impede A→B e B→A ao mesmo tempo. S3: check impede autorelacionamento.
create table if not exists social_graph.friendships (
  id             uuid primary key default gen_random_uuid(),
  user_low       uuid not null references identity.profiles(id) on delete cascade,
  user_high      uuid not null references identity.profiles(id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending', 'accepted')),
  requested_by   uuid not null references identity.profiles(id) on delete cascade,
  responded_by   uuid references identity.profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint friendships_par_uk unique (user_low, user_high),
  constraint friendships_sentinel_ck check (user_low < user_high)
);

comment on table social_graph.friendships is
  'Amizades mútuas com sentinela ordenada (S2). Spec: docs/04-contexts/social-graph.md';

create index if not exists friendships_user_low_idx
  on social_graph.friendships (user_low);
create index if not exists friendships_user_high_idx
  on social_graph.friendships (user_high);

-- -------------------------------------------------- invariantes na escrita (S4/S5)

create or replace function social_graph.enforce_friendship_writes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- S3: sem autorelacionamento (redundante com o check, mas com mensagem clara).
    if new.user_low = new.user_high then
      raise exception 'não é permitido ser amigo de si mesmo'
        using errcode = 'restrict_violation';
    end if;

    -- S4/S5: quem cria é sempre o solicitante, e participa do par.
    if new.requested_by not in (new.user_low, new.user_high) then
      raise exception 'solicitante precisa ser um dos dois usuários da amizade'
        using errcode = 'restrict_violation';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Par e solicitante são imutáveis depois de criados.
    if (new.user_low, new.user_high) is distinct from (old.user_low, old.user_high) then
      raise exception 'usuários da amizade são imutáveis'
        using errcode = 'restrict_violation';
    end if;

    if new.requested_by is distinct from old.requested_by then
      raise exception 'solicitante da amizade é imutável'
        using errcode = 'restrict_violation';
    end if;

    -- S4: só o destinatário responde; resposta só pending → accepted.
    if (new.status, new.responded_by) is distinct from (old.status, old.responded_by) then
      if old.status <> 'pending' then
        raise exception 'só um pedido pendente pode mudar de estado'
          using errcode = 'restrict_violation';
      end if;

      if new.status <> 'accepted' then
        raise exception 'resposta só pode aceitar o pedido'
          using errcode = 'restrict_violation';
      end if;

      if new.responded_by is null
         or new.responded_by not in (new.user_low, new.user_high)
         or new.responded_by = new.requested_by then
        raise exception 'resposta é exclusiva do destinatário do pedido'
          using errcode = 'insufficient_privilege';
      end if;
    end if;

    new.updated_at := now();
    return new;
  end if;

  return null;
end;
$$;

drop trigger if exists friendships_enforce_writes on social_graph.friendships;
create trigger friendships_enforce_writes
  before insert or update on social_graph.friendships
  for each row execute function social_graph.enforce_friendship_writes();

-- ---------------------------------------------------------------- RLS (nega por padrão)

alter table social_graph.friendships enable row level security;

-- Lista pública de amigos (leitura sem login).
drop policy if exists "amizades são públicas para leitura" on social_graph.friendships;
create policy "amizades são públicas para leitura"
  on social_graph.friendships for select
  to anon, authenticated
  using (true);

-- Enviar pedido: o solicitante sou eu e participo do par (S5).
drop policy if exists "usuário envia pedido de amizade" on social_graph.friendships;
create policy "usuário envia pedido de amizade"
  on social_graph.friendships for insert
  to authenticated
  with check (
    auth.uid() = requested_by
    and auth.uid() in (user_low, user_high)
  );

-- S4: só o destinatário responde (quem recebeu o pedido aceita).
-- A checagem fina (status pending→accepted, responded_by) é do trigger acima.
-- WITH CHECK explícita é obrigatória: sem ela o Postgres reutiliza a USING
-- (que exige status='pending') para validar a linha nova — e a linha nova tem
-- status='accepted', o que bloquearia todo aceite.
drop policy if exists "destinatário responde o pedido" on social_graph.friendships;
create policy "destinatário responde o pedido"
  on social_graph.friendships for update
  to authenticated
  using (
    status = 'pending'
    and auth.uid() in (user_low, user_high)
    and auth.uid() <> requested_by
  )
  with check (
    auth.uid() in (user_low, user_high)
    and auth.uid() <> requested_by
  );

-- S5/S6: participante remove a linha (cancelar, recusar ou desfazer).
drop policy if exists "participante remove a amizade" on social_graph.friendships;
create policy "participante remove a amizade"
  on social_graph.friendships for delete
  to authenticated
  using (auth.uid() in (user_low, user_high));

-- ---------------------------------------------------------------- permissões de schema

revoke all on schema social_graph from anon, authenticated;
grant usage on schema social_graph to anon, authenticated;

grant select on social_graph.friendships to anon, authenticated;
grant insert, update on social_graph.friendships to authenticated;
grant delete on social_graph.friendships to authenticated;

revoke all on function social_graph.enforce_friendship_writes() from anon, authenticated;

-- service_role: plataforma (analytics/exportações; consumo do outbox).
grant usage on schema social_graph to service_role;
grant select, insert, update, delete on social_graph.friendships to service_role;

-- supabase_auth_admin: nenhum trigger de grafo em auth.users.

-- ---------------------------------------------------------------- Realtime (D8)

alter table social_graph.friendships replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'social_graph'
       and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table social_graph.friendships;
  end if;
end
$$;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.social_graph.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
