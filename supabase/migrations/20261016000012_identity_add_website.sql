-- Adicionar campo website ao perfil (opcional, URL pública)
-- Fase 2 — Identity & Access
-- Spec: docs/04-contexts/identity-access.md

alter table if exists identity.profiles
  add column if not exists website text check (website is null or char_length(website) <= 2048);

comment on column identity.profiles.website is
  'Link público opcional do perfil (site, portfólio, redes sociais). Spec: docs/04-contexts/identity-access.md';

-- Atualizar metadados de versão
update shared.app_metadata
set value = '2', updated_at = now()
where key = 'schema.identity.version';