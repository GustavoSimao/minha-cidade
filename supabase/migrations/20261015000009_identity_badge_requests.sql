-- B2/P13 — jornada 6 do PRD: "órgão público solicita o selo com evidência".
-- Até aqui a concessão era só direta no /admin (conceder-selo, ADR-0016). Esta
-- migration cria a fila de solicitações: o órgão pede com link oficial, o admin
-- aprova/rejeita. A concessão em si continua pelo mesmo caminho (GrantBadge →
-- verified_org via service_role — invariante I5 intacta).

create table if not exists identity.badge_requests (

  id              uuid primary key default gen_random_uuid(),

  user_id         uuid not null references identity.profiles(id) on delete cascade,

  org_name        text not null check (char_length(trim(org_name)) between 3 and 120),

  evidence_url    text not null check (evidence_url ~* '^https?://'),

  evidence_email  text check (
    evidence_email is null
    or evidence_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),

  message         text check (message is null or char_length(message) <= 500),

  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),

  decided_by      uuid references identity.profiles(id) on delete set null,

  decided_at      timestamptz,

  decision_reason text check (decision_reason is null or char_length(decision_reason) <= 500),

  created_at      timestamptz not null default now(),

  updated_at      timestamptz not null default now()

);

-- Uma solicitação pendente por usuário (segunda só depois da decisão).
create unique index if not exists badge_requests_one_pending
  on identity.badge_requests (user_id)
  where status = 'pending';

-- Fila do admin: pendentes primeiro, mais antigos no topo.
create index if not exists badge_requests_queue
  on identity.badge_requests (status, created_at);

comment on table identity.badge_requests is
  'Solicitações de selo institucional (P13): o órgão pede com evidência, o admin decide. Spec: docs/04-contexts/identity-access.md';

comment on column identity.badge_requests.evidence_url is
  'Link oficial da evidência (ADR-0016: URL ou e-mail de domínio oficial)';

comment on column identity.badge_requests.decided_by is
  'Admin que aprovou/rejeitou (nulo enquanto pendente)';

-- ---------------------------------------------------------------- RLS

alter table identity.badge_requests enable row level security;

-- Dono lê e cria apenas as próprias linhas.
drop policy if exists "dono vê os próprios pedidos" on identity.badge_requests;
create policy "dono vê os próprios pedidos"
  on identity.badge_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "dono cria o próprio pedido" on identity.badge_requests;
create policy "dono cria o próprio pedido"
  on identity.badge_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Sem acesso anônimo (o pedido é de conta autenticada) e sem update direto:
-- aprovar/rejeitar é ação de admin via service_role (mesmo padrão do selo).
revoke all on identity.badge_requests from anon;
grant select, insert on identity.badge_requests to authenticated;

-- service_role: a fila do /admin e as decisões passam pelo cliente de serviço.
grant select, insert, update on identity.badge_requests to service_role;

-- supabase_auth_admin: nenhum trigger em auth.users aqui.

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.identity.version', '2')
on conflict (key) do update set value = excluded.value, updated_at = now();
