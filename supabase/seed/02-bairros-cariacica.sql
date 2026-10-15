-- Cariacica/ES — bairros curados (contexto Geography)
-- Spec: docs/04-contexts/geography.md (G3, G6, G8)
--
-- FONTE OFICIAL (curadoria registrada):
--   Lei Complementar 171/2025 (Plano Diretor Municipal), anexo cartográfico
--   "LISTAGEM DOS BAIRROS" — elaboração GPU/SEMDEC, data 02/09/2025.
--   URL: https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf
--   A listagem substitui os anexos cartográficos da Lei 4772/2010 (que delimitou os
--   100 bairros pelo POT); a LC 171/2025 é a fonte vigente e já inclui bairros criados
--   depois de 2010 (ex.: Ibiapaba, Lei 5822/2017 → número 36).
--   Transcrição íntegra preservada em supabase/seed/sources/lc1712025-listagem-bairros.txt
--   (extração da página 1 do PDF oficial; SHA-256 registrado em shared.app_metadata).
--   Lei 4772/2010 (origem histórica):
--   https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/html/l47722010.html
--
-- Idempotente: ON CONFLICT (city_id, slug) DO NOTHING (G3). Não apaga bairros
-- removidos da fonte — curadoria nova exige migração de remoção explícita.
--
-- Cidade: Cariacica/ES — código IBGE 3201308 (inserida por ibge-localidades.sql).
-- Contagem: 100 bairros.

insert into geography.neighborhoods (city_id, name, slug, source, source_url) values
  (3201308, 'Cruzeiro do Sul',        'cruzeiro-do-sul',        'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vasco da Gama',          'vasco-da-gama',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São Francisco',          'sao-francisco',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Palestina',         'vila-palestina',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Rosa da Penha',          'rosa-da-penha',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Itapemirim',             'itapemirim',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Jardim Botânico',        'jardim-botanico',        'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santa Bárbara',          'santa-barbara',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Morada de Santa Fé',     'morada-de-santa-fe',     'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santa Paula',            'santa-paula',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Bela Vista',             'bela-vista',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vista Linda',            'vista-linda',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Isabel',            'vila-isabel',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Bandeirantes',           'bandeirantes',           'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Caçaroca',               'cacaroca',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Alzira Ramos',           'alzira-ramos',           'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Jardim de Alah',         'jardim-de-alah',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Padre Gabriel',          'padre-gabriel',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Jardim Campo Grande',    'jardim-campo-grande',    'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Campo Belo',             'campo-belo',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São Benedito',           'sao-benedito',           'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Castelo Branco',         'castelo-branco',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vista Mar',              'vista-mar',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Sotelândia',             'sotelandia',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Bela Aurora',            'bela-aurora',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Maracanã',               'maracana',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Boa Sorte',              'boa-sorte',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São Conrado',            'sao-conrado',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vera Cruz',              'vera-cruz',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Jardim América',         'jardim-america',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Chácaras União',         'chacaras-uniao',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São Geraldo',            'sao-geraldo',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Parque Gramado',         'parque-gramado',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Rio Marinho',            'rio-marinho',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Foz do Rio Bubu',        'foz-do-rio-bubu',        'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Ibiapaba',               'ibiapaba',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Alice Coutinho',         'alice-coutinho',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Antônio Ferreira Borges','antonio-ferreira-borges','lc_171_2025','https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Cariacica Sede',         'cariacica-sede',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Prolar',                 'prolar',                 'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Merlo',             'vila-merlo',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Porto de Cariacica',     'porto-de-cariacica',     'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santa Luzia',            'santa-luzia',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São João Batista',       'sao-joao-batista',       'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Tucum',                  'tucum',                  'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Itacibá',                'itaciba',                'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Nova Brasília',          'nova-brasilia',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Oriente',                'oriente',                'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Alto Lage',              'alto-lage',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Expedito',               'expedito',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Sotema',                 'sotema',                 'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Alto Boa Vista',         'alto-boa-vista',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Itaquari',               'itaquari',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Rio Branco',             'rio-branco',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Itanguá',                'itangua',                'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Dom Bosco',              'dom-bosco',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santa Cecília',          'santa-cecilia',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Cajueiro',           'vila-cajueiro',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Padre Mathias',          'padre-mathias',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Progresso',         'vila-progresso',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Nova Rosa da Penha',     'nova-rosa-da-penha',     'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Valparaíso',             'valparaiso',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Nova Canaã',             'nova-canaa',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Porto Novo',             'porto-novo',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Presidente Médice',      'presidente-medice',      'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Flexal I',               'flexal-i',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Retiro Saudoso',         'retiro-saudoso',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Graúna',                 'grauna',                 'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Aparecida',              'aparecida',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Porto de Santana',       'porto-de-santana',       'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Nova Valverde',          'nova-valverde',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Bubu',                   'bubu',                   'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Campo Verde',            'campo-verde',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Prudêncio',         'vila-prudencio',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Cangaíba',               'cangaiba',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Planeta',                'planeta',                'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santana',                'santana',                'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Tabajara',               'tabajara',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santo Antônio',          'santo-antonio',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Novo Horizonte',         'novo-horizonte',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São Gonçalo',            'sao-goncalo',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Piranema',               'piranema',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vale dos Reis',          'vale-dos-reis',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Novo Brasil',            'novo-brasil',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Nova Campo Grande',      'nova-campo-grande',      'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vista Dourada',          'vista-dourada',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Mucuri',                 'mucuri',                 'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Independência',     'vila-independencia',     'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Flexal II',              'flexal-ii',              'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Serra do Anil',          'serra-do-anil',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Nova Esperança',         'nova-esperanca',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Operário',               'operario',               'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vila Capixaba',          'vila-capixaba',          'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Campo Grande',           'campo-grande',           'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Vale Esperança',         'vale-esperanca',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Campina Grande',         'campina-grande',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Santo André',            'santo-andre',            'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Formate',                'formate',                'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'Tiradentes',             'tiradentes',             'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  (3201308, 'São Geraldo II',         'sao-geraldo-ii',         'lc_171_2025', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf')
on conflict (city_id, slug) do nothing;

-- ---------------------------------------------------------------- metadados

insert into shared.app_metadata (key, value) values
  ('seed.geography.cariacica.fonte', 'Lei Complementar 171/2025 (Plano Diretor Municipal) - anexo LISTAGEM DOS BAIRROS, elaboracao GPU/SEMDEC'),
  ('seed.geography.cariacica.fonte_url', 'https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf'),
  ('seed.geography.cariacica.fonte_data', '2025-09-02'),
  ('seed.geography.cariacica.transcricao_sha256', '9E8C2A2049966E91FE3B186145E983E1A31F4BECE21CE6C89D60E7F52909BF9D'),
  ('seed.geography.ibge.fonte', 'API de localidades IBGE (/api/v1/localidades/estados/{uf}/municipios)'),
  ('seed.geography.ibge.fonte_url', 'https://servicodados.ibge.gov.br/api/v1/localidades'),
  ('seed.geography.ibge.municipios', '5571'),
  ('seed.geography.executado_em', to_char(now(), 'YYYY-MM-DD'))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Verificações rápidas (executar após o seed):
--   select count(*) from geography.neighborhoods where city_id = 3201308;   -- 100
--   select count(*) from geography.neighborhoods where source_url is null;  -- 0
