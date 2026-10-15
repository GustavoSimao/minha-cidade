-- Fase 8 — Moderation: ações de staff sobre perfis (B2)
-- Spec: docs/04-contexts/moderation.md §4 (M5/M7)
-- Decisões: M5 (ações sensíveis), M7 (trilha append-only), B2 do plano de lançamento.
--
-- Habilita na trilha `moderation.moderation_actions` as ações de staff da
-- Fase 8 (B2) — selo de canal oficial (verified_org), promoção/rebaixamento de
-- moderador — e as decisões sobre solicitações de selo (P13/B2). O alvo
-- `profile` continua valendo para todas elas. A trilha segue append-only; quem
-- executa as mudanças em `identity.profiles` é o service_role (a escrita em
-- profiles de outro usuário não tem política de usuário — M5).
--
-- Reversível: recriar os CHECK com a lista anterior (ver migration 0007).

-- Ações: acrescenta grant_badge, revoke_badge, promote_moderator, demote_moderator,
-- approve_badge_request e reject_badge_request.
alter table moderation.moderation_actions
  drop constraint if exists moderation_actions_action_check;
alter table moderation.moderation_actions
  add constraint moderation_actions_action_check
  check (action in (
    'hide', 'restore', 'remove', 'report_resolved',
    'grant_badge', 'revoke_badge', 'promote_moderator', 'demote_moderator',
    'approve_badge_request', 'reject_badge_request'
  ));

-- Alvo: acrescenta profile (ações de staff sobre a conta, não sobre conteúdo).
alter table moderation.moderation_actions
  drop constraint if exists moderation_actions_target_type_check;
alter table moderation.moderation_actions
  add constraint moderation_actions_target_type_check
  check (target_type in ('publication', 'comment', 'report', 'profile'));

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value)
values ('schema.moderation.version', '2')
on conflict (key) do update set value = excluded.value, updated_at = now();
