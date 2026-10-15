-- Fase 10 — Rate limit por IP (B4/P16)
-- Spec: docs/04-contexts/moderation.md (M9)
-- Decisões: P16 (limites), ADR-0017 (IP só é confiável atrás de proxy), D6/D7.
--
-- Antes a linha de limite era sempre por usuário (`user_id`). Agora o contador
-- tem um **sujeito**: `user` (uuid) ou `ip` (endereço, texto). As linhas antigas
-- são convertidas (backfill); a chave única passa a ser
-- (subject_type, subject_id, scope, window, window_start).
--
-- A coluna `window` ('hour' | 'day') separa os contadores do mesmo escopo: na
-- primeira hora do dia UTC (00:00–01:00) o início da janela horária e o do dia
-- coincidem, e sem ela os dois limites dividiriam a mesma linha.
--
-- Linhas de IP nascem com `user_id` nulo (não há FK para perfil) e são
-- lidas/escritas pelo service_role — a política de RLS de usuário continua
-- valendo só para as próprias linhas (`auth.uid() = user_id`).

alter table moderation.rate_limits
  add column if not exists subject_type text not null default 'user';

alter table moderation.rate_limits
  alter column subject_type drop default;

alter table moderation.rate_limits
  add column if not exists subject_id text not null default '';

-- Backfill: toda linha existente é de usuário.
update moderation.rate_limits
set subject_id = user_id::text
where subject_id = '' or subject_id is null;

-- `user_id` deixa de ser obrigatório (linhas de IP não têm perfil).
alter table moderation.rate_limits
  alter column user_id drop not null;

-- Janela do contador (hour/day): linhas antigas ficam com 'day' quando o
-- `window_start` é meia-noite UTC (a janela diária), 'hour' caso contrário.
-- (`window` é palavra reservada do Postgres — sempre entre aspas.)
alter table moderation.rate_limits
  add column if not exists "window" text;

update moderation.rate_limits
set "window" = case
  when window_start = date_trunc('day', window_start) then 'day'
  else 'hour'
end
where "window" is null;

alter table moderation.rate_limits
  alter column "window" set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'rate_limits_window_check'
      and conrelid = 'moderation.rate_limits'::regclass
  ) then
    null;
  else
    alter table moderation.rate_limits
      add constraint rate_limits_window_check check ("window" in ('hour', 'day'));
  end if;
end
$$;

-- Nova chave única por sujeito e janela.
alter table moderation.rate_limits
  drop constraint if exists rate_limits_unique_window;
alter table moderation.rate_limits
  add constraint rate_limits_unique_window
  unique (subject_type, subject_id, scope, "window", window_start);

-- ---------------------------------------------------------------- verificações

-- Toda linha tem sujeito preenchido e um tipo conhecido.
do $$
begin
  if exists (select 1 from moderation.rate_limits where subject_id = '') then
    raise exception 'rate_limits com subject_id vazio após backfill';
  end if;
end
$$;

insert into shared.app_metadata (key, value)
values ('schema.moderation.version', '3')
on conflict (key) do update set value = excluded.value, updated_at = now();
comment on column moderation.rate_limits.subject_type is
  'Sujeito do contador: user (uuid em subject_id) ou ip (endereço em subject_id)';

comment on column moderation.rate_limits.subject_id is
  'Identificador do sujeito dentro do tipo (uuid do perfil ou endereço IP)';

comment on column moderation.rate_limits."window" is
  'Tipo da janela: hour (hora cheia) ou day (meia-noite UTC) — evita a colisão dos contadores do mesmo escopo na primeira hora do dia UTC';
