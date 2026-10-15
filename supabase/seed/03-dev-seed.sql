-- 03-dev-seed.sql — dados de desenvolvimento (APENAS local)
--
-- Idempotente: pode rodar repetidas vezes (`supabase db reset`) sem duplicar.
-- Lookup por slug/nome: os IDs de bairros são gerados (gen_random_uuid) pelo
-- seed 02 a cada reset — nunca fixar UUID de bairro aqui.
--
-- Objetivo: alimentar uma demonstração de venda (B2G) completa — perfis variados
-- em vários bairros, publicações de problema e ideia, canal institucional da
-- prefeitura com selo, engajamento, amizades e uma fila de moderação povoada.
--
-- Usuários criados (senha única para todos: Cidade@123):
--   ana@minhacidade.dev        — Ana Souza              (user)     Bairro Boa Sorte
--   bruno@minhacidade.dev      — Bruno Lima             (user)     Bairro Aparecida
--   carla@minhacidade.dev      — Carla Dias             (admin)    Bairro Alto Lage
--   daniel@minhacidade.dev     — Daniel Rocha           (user)     Bairro Boa Sorte
--   elena@minhacidade.dev      — Elena Matos            (user)     Bairro Boa Sorte
--   fabio@minhacidade.dev      — Fábio Neres            (user)     Bairro Campo Grande
--   graca@minhacidade.dev      — Graça Lima             (user)     Bairro Bela Vista
--   heitor@minhacidade.dev     — Heitor Batista         (user)     Bairro Flexal I
--   iris@minhacidade.dev       — Iris Veiga             (user)     Bairro Campo Grande
--   joao@minhacidade.dev       — João Paiva             (user)     Bairro Cariacica Sede
--   prefeitura@minhacidade.dev — Prefeitura Cariacica   (user + selo institucional)
--   marco@minhacidade.dev      — Marco Andrade          (moderator) Bairro Bela Vista
-- E-mails já confirmados (email_confirmed_at preenchido; confirmed_at é coluna
-- gerada pelo GoTrue) — login direto, sem passar pelo Inbucket (o fluxo de
-- confirmação é testado no cadastro manual feito pela interface).

create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------ auth.users
-- O trigger on_auth_user_created (Fase 2) cria identity.profiles automaticamente
-- a partir de raw_user_meta_data.name. ON CONFLICT não dispara o trigger.

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                       email_confirmed_at, confirmation_token, recovery_token,
                       email_change_token_new, email_change,
                       raw_app_meta_data,
                       raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'ana@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Ana Souza"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'bruno@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Bruno Lima"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
   'carla@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Carla Dias"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated',
   'daniel@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Daniel Rocha"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated',
   'elena@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Elena Matos"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated',
   'fabio@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Fábio Neres"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated',
   'graca@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Graça Lima"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '88888888-8888-4888-8888-888888888888', 'authenticated', 'authenticated',
   'heitor@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Heitor Batista"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   '99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated',
   'iris@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Iris Veiga"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   'abababab-abab-4bab-8bab-abababababab', 'authenticated', 'authenticated',
   'joao@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "João Paiva"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000',
   'bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc', 'authenticated', 'authenticated',
   'prefeitura@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
   now(), '', '', '', '',
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"name": "Prefeitura Cariacica"}'::jsonb, now(), now()),
   ('00000000-0000-0000-0000-000000000000',
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd', 'authenticated', 'authenticated',
    'marco@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
    now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Marco Andrade"}'::jsonb, now(), now()),
   -- 13� usu�rio: �rg�o com solicita��o de selo pendente (demo B2G � P13/B2).
   ('00000000-0000-0000-0000-000000000000',
    'dededede-dede-4ded-8ded-dededededede', 'authenticated', 'authenticated',
    'secretaria@minhacidade.dev', crypt('Cidade@123', gen_salt('bf', 10)),
    now(), '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"name": "Secretaria Meio Ambiente"}'::jsonb, now(), now())
on conflict (id) do nothing;

-- --------------------------------------------------------------- auth.identities
-- GoTrue exige a identidade de e-mail para signInWithPassword funcionar.

insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                             created_at, updated_at)
select gen_random_uuid(), u.id, u.email,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now()
  from auth.users u
 where u.email in ('ana@minhacidade.dev', 'bruno@minhacidade.dev',
                   'carla@minhacidade.dev', 'daniel@minhacidade.dev',
                   'elena@minhacidade.dev', 'fabio@minhacidade.dev',
                   'graca@minhacidade.dev', 'heitor@minhacidade.dev',
                    'iris@minhacidade.dev', 'joao@minhacidade.dev',
                    'prefeitura@minhacidade.dev', 'marco@minhacidade.dev',
                    'secretaria@minhacidade.dev')
   and not exists (
     select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'email'
   );

-- ---------------------------------------------------------- completar perfis
-- service_role setado: os triggers I4/I5 só permitem mudar role/selo com este
-- papel; a sessão de seed não tem JWT, então injetamos o claim.
-- A conta institucional (Prefeitura Cariacica) recebe o selo P13.

select set_config('request.jwt.claim.role', 'service_role', false);

-- full_name é a informação pública; username (gerado pelo slugify do nome no
-- Auth) é imutável (I2). A conta institucional mantém o nome curto no Auth e
-- recebe o nome oficial aqui.
update identity.profiles set full_name = 'Prefeitura de Cariacica'
 where username = 'prefeitura-cariacica';

update identity.profiles p set
  bio = v.bio,
  phone = v.phone,
  city_id = 3201308, -- Cariacica/ES
  neighborhood_id = (
    select n.id from geography.neighborhoods n
     where n.city_id = 3201308 and n.slug = v.bairro
  ),
  role = v.role,
  verified_org = v.verified_org,
  is_verified = v.verified_org is not null,
  termos_aceitos_em = now()
  from (values
    ('ana-souza',
     'Moro no Boa Sorte desde que nasci. Curto jardinagem e futebol de várzea.',
     '(27) 99911-2222', 'boa-sorte', 'user', null),
    ('bruno-lima',
     'Pai de duas, motorista de app e reclamador profissional de buracos.',
     '(27) 98833-4444', 'aparecida', 'user', null),
    ('carla-dias',
     'Servidora pública, trabalho com participação social.',
     '(27) 3221-5000', 'alto-lage', 'admin', null),
    ('daniel-rocha',
     'Mecânico, pai de pet e viciado em campeonato de dominó na praça.',
     '(27) 99877-1212', 'boa-sorte', 'user', null),
    ('elena-matos',
     'Professora da rede municipal. Acredito em escola aberta para o bairro.',
     '(27) 99744-8899', 'boa-sorte', 'user', null),
    ('fabio-neres',
     'Feirante há 20 anos. Organizo a galera do futebol de sábado.',
     '(27) 99633-5522', 'campo-grande', 'user', null),
    ('graca-lima',
     'Enfermeira aposentada, faço crochê e cuido da horta da vizinhança.',
     '(27) 99522-7070', 'bela-vista', 'user', null),
    ('heitor-batista',
     'Motoboy e estudante de arquitetura. Quero ver o bairro mais arborizado.',
     '(27) 99411-3636', 'flexal-i', 'user', null),
    ('iris-veiga',
     'Dona de casa, três filhos. Reclamo muito de esgoto — e com razão.',
     '(27) 99388-4747', 'campo-grande', 'user', null),
    ('joao-paiva',
     'Serralheiro. Conserto o que dá na minha rua e no quarteirão.',
     '(27) 99277-1919', 'cariacica-sede', 'user', null),
    ('prefeitura-cariacica',
     'Canal oficial da Prefeitura Municipal de Cariacica. Publicamos obras, '
     'serviços e respostas às demandas da comunidade.',
     '(27) 3246-1000', 'cariacica-sede', 'user', 'Prefeitura de Cariacica'),
    ('marco-andrade',
     'Moderador da comunidade. Analista de sistemas da SEMAD.',
     '(27) 99166-2828', 'bela-vista', 'moderator', null),
    ('secretaria-meio-ambiente',
     'Secretaria Municipal de Meio Ambiente de Cariacica.',
     '(27) 3246-2000', 'cariacica-sede', 'user', null)
  ) as v(username, bio, phone, bairro, role, verified_org)
  where p.username = v.username;

-- --------------------------------------------------- solicita��o de selo (P13/B2)
-- Jornada 6 do PRD: o �rg�o pede o selo com evid�ncia (link oficial); a decis�o
-- � manual do admin no /admin. UUID fixo + ON CONFLICT: idempotente. A pend�ncia
-- alimenta a fila do admin e a demo B2G.

insert into identity.badge_requests
  (id, user_id, org_name, evidence_url, evidence_email, message, status)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
   (select id from identity.profiles where username = 'secretaria-meio-ambiente'),
   'Secretaria de Meio Ambiente de Cariacica',
   'https://cariacica.es.gov.br/meio-ambiente',
   'meioambiente@cariacica.es.gov.br',
   'Somos a secretaria respons�vel pelas �reas verdes do munic�pio e queremos '
   'responder as demandas da comunidade com o canal oficial.',
   'pending')
on conflict (user_id) where status = 'pending' do nothing;

-- ------------------------------------------------------------- publicações
-- UUIDs fixos + ON CONFLICT: idempotente. Sem mídia (teste de upload é manual
-- pela interface). Todos os invariantes da Fase 4 respeitados (título 5–120,
-- conteúdo 10–5000, bairro obrigatoriamente da cidade informada).

insert into publication.publications
  (id, author_id, type, title, content, is_anonymous, city_id, neighborhood_id, created_at)
values
  -- Ana — Boa Sorte
  ('aaaaaaaa-0001-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'problem',
   'Buraco na Rua Principal atrapalha o trânsito',
   'O buraco em frente ao número 400 já existe há três meses. Dois motociclistas '
   'caíram nesta semana. A prefeitura foi acionada mas nada até agora.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'boa-sorte'),
   now() - interval '2 days'),

  ('aaaaaaaa-0001-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111', 'idea',
   'Horta comunitária no terreno baldio da esquina',
   'Que tal transformarmos aquele terreno baldio da Rua Principal com a viela em '
   'horta comunitária? Cada família cuida de um canteiro e a colheita é dividida.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'boa-sorte'),
   now() - interval '1 day'),

  -- Bruno — Aparecida
  ('aaaaaaaa-0001-4000-8000-000000000003',
   '22222222-2222-4222-8222-222222222222', 'problem',
   'Poste de iluminação apagado há duas semanas',
   'Três postes da Rua das Palmeiras estão apagados. O trecho fica muito escuro '
   'à noite e já houve assalto por aqui.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'aparecida'),
   now() - interval '12 hours'),

  -- Bruno — anônima
  ('aaaaaaaa-0001-4000-8000-000000000004',
   '22222222-2222-4222-8222-222222222222', 'problem',
   'Lixo acumulado na praça depois da feira',
   'A limpeza da praça não acontece desde que a feira mudou de dia. O lixo fica '
   'até a outra semana e atrai ratos e mosquitos.',
   true, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'aparecida'),
   now() - interval '6 hours'),

  -- Carla (admin) — Alto Lage
  ('aaaaaaaa-0001-4000-8000-000000000005',
   '33333333-3333-4333-8333-333333333333', 'idea',
   'Mutirão de limpeza do córrego no Alto Lage',
   'Proponho um mutirão no primeiro sábado do mês para limpar o trecho do córrego '
   'que passa atrás da escola. A prefeitura cede as ferramentas, a gente cede a mão de obra.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'alto-lage'),
   now() - interval '3 hours'),

  -- Carla — Vitória (sem bairro: feed por cidade inteira)
  ('aaaaaaaa-0001-4000-8000-000000000006',
   '33333333-3333-4333-8333-333333333333', 'idea',
   'Ciclovia ligando o Centro ao Jardim Camburi',
   'Uma ciclovia contínua na avenida principal tiraria carros da rua e daria '
   'segurança para quem pedala para o trabalho.',
   false, 3205309, -- Vitória/ES (IBGE)
   null,
   now() - interval '1 hour')
on conflict (id) do nothing;

-- Publicações da demo expandida — mais bairros, canal institucional (selo P13)
-- e uma publicação anônima. Mesmos invariantes da Fase 4.

insert into publication.publications
  (id, author_id, type, title, content, is_anonymous, city_id, neighborhood_id, created_at)
values
  -- Elena — Boa Sorte
  ('bbbbbbbb-0001-4000-8000-000000000001',
   '55555555-5555-4555-8555-555555555555', 'problem',
   'Calçada quebrada em frente à escola municipal',
   'A calçada da entrada da escola está toda quebrada. Cadeirantes e pais com '
   'carrinho de bebê passam pela rua, arriscando acidente no horário de saída.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'boa-sorte'),
   now() - interval '20 hours'),

  -- Fábio — Campo Grande
  ('bbbbbbbb-0001-4000-8000-000000000002',
   '66666666-6666-4666-8666-666666666666', 'idea',
   'Feira de trocas no campo de areia todo último sábado',
   'Proponho uma feira de trocas: leva o que não usa, troca por o que precisa. '
   'Sem dinheiro, sem desperdício. A associação de moradores topou ceder o espaço.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'campo-grande'),
   now() - interval '15 hours'),

  -- Graça — Bela Vista
  ('bbbbbbbb-0001-4000-8000-000000000003',
   '77777777-7777-4777-8777-777777777777', 'problem',
   'Esgoto a céu aberto na viela atrás do mercado',
   'A vala de esgoto transbordou e escorre pela viela. O cheiro é insuportável '
   'e as crianças da rua estão com alergia na pele.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'bela-vista'),
   now() - interval '8 hours'),

  -- Heitor — Flexal I
  ('bbbbbbbb-0001-4000-8000-000000000004',
   '88888888-8888-4888-8888-888888888888', 'idea',
   'Ponto de ônibus coberto na parada da entrada do bairro',
   'A parada em frente à padaria não tem nenhuma cobertura. No verão o sol '
   'castiga e na chuva todo se molha. Um abrigo simples resolveria.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'flexal-i'),
   now() - interval '4 hours'),

  -- Canal institucional — Prefeitura de Cariacica (selo P13 aparece no feed)
  ('bbbbbbbb-0001-4000-8000-000000000005',
   'bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc', 'problem',
   'Recapeamento da Avenida Central começa em 10 de novembro',
   'A Secretaria de Obras informa que o recapeamento da Avenida Central, no '
   'trecho entre a praça e a ponte, começa em 10 de novembro, com previsão de '
   '20 dias. O trânsito será alternado nos dois sentidos.',
   false, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'cariacica-sede'),
   now() - interval '2 hours'),

  -- João — anônima (Cariacica Sede)
  ('bbbbbbbb-0001-4000-8000-000000000006',
   'abababab-abab-4bab-8bab-abababababab', 'problem',
   'Terreno baldio virou depósito de lixo irregular',
   'O terreno da esquina está servindo de despejo de entulho e móveis velhos. '
   'Além do foco de dengue, está bloqueando a passagem de pedestres.',
   true, 3201308,
   (select n.id from geography.neighborhoods n where n.city_id = 3201308 and n.slug = 'cariacica-sede'),
   now() - interval '90 minutes')
on conflict (id) do nothing;

-- --------------------------------------------------- engajamento (Fase 5)
-- Reações (E1), comentários identificados e anônimos (E4) e salvamentos (E6)
-- para as publicações acima — ids fixos + ON CONFLICT: idempotente.

insert into engagement.reactions (id, publication_id, user_id, type)
select gen_random_uuid(), p.id, u.id, r.type
  from (values
    ('aaaaaaaa-0001-4000-8000-000000000001', 'ana-souza',    'support'),
    ('aaaaaaaa-0001-4000-8000-000000000001', 'bruno-lima',   'support'),
    ('aaaaaaaa-0001-4000-8000-000000000002', 'bruno-lima',   'support'),
    ('aaaaaaaa-0001-4000-8000-000000000003', 'carla-dias',   'support'),
    ('aaaaaaaa-0001-4000-8000-000000000005', 'ana-souza',    'oppose'),
    ('bbbbbbbb-0001-4000-8000-000000000001', 'ana-souza',    'support'),
    ('bbbbbbbb-0001-4000-8000-000000000001', 'elena-matos',  'support'),
    ('bbbbbbbb-0001-4000-8000-000000000002', 'iris-veiga',   'support'),
    ('bbbbbbbb-0001-4000-8000-000000000002', 'fabio-neres',  'support'),
    ('bbbbbbbb-0001-4000-8000-000000000003', 'marco-andrade','support'),
    ('bbbbbbbb-0001-4000-8000-000000000003', 'iris-veiga',   'oppose'),
    ('bbbbbbbb-0001-4000-8000-000000000004', 'graca-lima',   'support'),
    ('bbbbbbbb-0001-4000-8000-000000000005', 'ana-souza',    'support'),
    ('bbbbbbbb-0001-4000-8000-000000000005', 'joao-paiva',   'support'),
    ('bbbbbbbb-0001-4000-8000-000000000005', 'elena-matos',  'support'),
    ('bbbbbbbb-0001-4000-8000-000000000006', 'heitor-batista','oppose')
  ) as r(publication_id, username, type)
  join publication.publications p on p.id = r.publication_id::uuid
  join identity.profiles u on u.username = r.username
on conflict (publication_id, user_id) do nothing;

insert into engagement.comments (id, publication_id, author_id, content, is_anonymous)
select gen_random_uuid(), p.id, u.id, c.content, c.is_anonymous
  from (values
    ('aaaaaaaa-0001-4000-8000-000000000001', 'carla-dias',
     'Registrei o pedido de reparo aqui na prefeitura. Vamos cobrar prazo.', false),
    ('aaaaaaaa-0001-4000-8000-000000000002', 'bruno-lima',
     'Adorei a ideia! Posso cuidar de um canteiro com meu filho.', false),
    ('aaaaaaaa-0001-4000-8000-000000000003', 'bruno-lima',
     'Moro na mesma rua, tambem passo por ali a noite.', false),
    ('aaaaaaaa-0001-4000-8000-000000000003', 'ana-souza',
     'Prefiro nao me identificar, mas o problema e real.', true),
    ('bbbbbbbb-0001-4000-8000-000000000001', 'elena-matos',
     'Já cai três alunos esse mês. A direção pediu urgência.', false),
    ('bbbbbbbb-0001-4000-8000-000000000005', 'prefeitura-cariacica',
     'Atendemos a demanda: a obra estava prevista no plano de mobilidade e foi '
     'antecipada. Pedimos desculpa pelo transtorno durante a execução.', false),
    ('bbbbbbbb-0001-4000-8000-000000000005', 'fabio-neres',
     'Boa notícia! Só tomem cuidado com a sinalização no acesso da escola.', false),
    ('bbbbbbbb-0001-4000-8000-000000000006', 'joao-paiva',
     'Prefiro nao me identificar, mas o terreno e da minha esquina tambem.', true)
  ) as c(publication_id, username, content, is_anonymous)
  join publication.publications p on p.id = c.publication_id::uuid
  join identity.profiles u on u.username = c.username
on conflict (id) do nothing;

insert into engagement.bookmarks (user_id, publication_id)
select u.id, p.id
  from (values
    ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-0001-4000-8000-000000000004'),
    ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-0001-4000-8000-000000000005'),
    ('55555555-5555-4555-8555-555555555555', 'bbbbbbbb-0001-4000-8000-000000000002'),
    ('77777777-7777-4777-8777-777777777777', 'bbbbbbbb-0001-4000-8000-000000000005'),
    ('99999999-9999-4999-8999-999999999999', 'aaaaaaaa-0001-4000-8000-000000000001')
  ) as b(user_id, publication_id)
  join identity.profiles u on u.id = b.user_id::uuid
  join publication.publications p on p.id = b.publication_id::uuid
on conflict (user_id, publication_id) do nothing;

-- --------------------------------------------------- amizades (Fase 6)
-- Ana ↔ Bruno: aceita (aparece para os dois lados). Carla → Ana: pendente
-- (Ana vê "aceitar" no perfil da Carla). Sentinela: user_low < user_high (S2).

insert into social_graph.friendships (id, user_low, user_high, status, requested_by, responded_by)
select gen_random_uuid(),
       least(a.id, b.id),
       greatest(a.id, b.id),
       f.status,
       rq.id,
       rs.id
  from (values
    ('ana-souza',   'bruno-lima', 'accepted', 'ana-souza',   'bruno-lima'),
    ('carla-dias',  'ana-souza',   'pending',  'carla-dias',  null),
    ('daniel-rocha', 'bruno-lima',  'pending',  'daniel-rocha', null),
    ('elena-matos',  'fabio-neres', 'accepted', 'elena-matos', 'fabio-neres'),
    ('graca-lima',   'heitor-batista', 'pending', 'graca-lima', null),
    ('marco-andrade', 'fabio-neres', 'accepted', 'marco-andrade', 'fabio-neres'),
    ('iris-veiga',   'graca-lima',  'accepted', 'iris-veiga',  'graca-lima')
  ) as f(solicitante, destinatario, status, requested_by, responded_by)
  join identity.profiles a on a.username = f.solicitante
  join identity.profiles b on b.username = f.destinatario
  join identity.profiles rq on rq.username = f.requested_by
  left join identity.profiles rs on rs.username = f.responded_by
on conflict (user_low, user_high) do nothing;

-- --------------------------------------------------- denúncias (Fase 7)
-- Alvo 0001 (da Ana): 4 denúncias de usuários distintos = na fila de
-- moderação (P10). Alvo bbbb...0003 (da Graça): 2 denúncias — abaixo do
-- limite de 3, então continua visível (P21), bom para demonstrar a regra.

insert into moderation.reports (id, reporter_id, reportable_type, reportable_id, reason, details)
select gen_random_uuid(), p.id, 'publication', r.publication_id::uuid, r.reason, r.details
  from (values
    ('bruno-lima', 'aaaaaaaa-0001-4000-8000-000000000001', 'informacao_falsa', 'o buraco nao existe nessa rua'),
    ('carla-dias', 'aaaaaaaa-0001-4000-8000-000000000001', 'spam', 'texto repetido de outra publicacao'),
    ('daniel-rocha', 'aaaaaaaa-0001-4000-8000-000000000001', 'outro', 'tom agressivo no texto'),
    ('elena-matos', 'aaaaaaaa-0001-4000-8000-000000000001', 'assedio', 'comentario ofensivo nos respostos'),
    ('heitor-batista', 'bbbbbbbb-0001-4000-8000-000000000003', 'discurso_odio', 'linguagem inadequada'),
    ('iris-veiga', 'bbbbbbbb-0001-4000-8000-000000000003', 'outro', 'informacao incompleta')
  ) as r(username, publication_id, reason, details)
  join identity.profiles p on p.username = r.username
on conflict (reporter_id, reportable_type, reportable_id) do nothing;

-- Transpar�ncia (Fase 10): backfill dos snapshots dos �ltimos 14 dias --
do $$
declare d date;
begin
  for d in select generate_series(current_date - 13, current_date, '1 day')::date loop
    perform analytics.refresh_daily_metrics(d);
  end loop;
end
$$;
