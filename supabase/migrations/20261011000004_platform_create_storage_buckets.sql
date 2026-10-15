-- Buckets do Storage (plataforma, compartilhados por todos os contextos).
--
-- ATENÇÃO — ambiente Supabase:
--   * Nenhuma migration anterior criava buckets: sem eles, upload de avatar/capa e o
--     Route Handler /api/publications/media falham. A Fase 2 deixava isso como ação
--     manual; agora fica versionado aqui.
--   * `avatars` e `covers` são públicos (leitura por URL pública no perfil);
--     `publication-media` é PRIVADO (leituras por URL assinada de 1h — spec §7).
--   * Idempotente: ON CONFLICT (id) DO NOTHING.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',            'avatars',            true,  10485760, null),
  ('covers',             'covers',             true,  10485760, null),
  ('publication-media',  'publication-media',  false, 10485760, array['image/webp'])
on conflict (id) do nothing;

-- service_role: upload (Route Handler /api/publications/media) e URLs assinadas rodam
-- com este papel. Na nuvem o Supabase já concede estes privilégios; no ambiente local
-- (CLI) o papel existe sem eles — por isso o grant explícito (idempotente).
grant usage on schema storage to service_role;
grant select, insert, update, delete on storage.buckets to service_role;
grant select, insert, update, delete on storage.objects to service_role;

insert into shared.app_metadata (key, value)
values ('storage.buckets.version', '1')
on conflict (key) do update set value = excluded.value, updated_at = now();
