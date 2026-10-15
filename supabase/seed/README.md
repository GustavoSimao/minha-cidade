# Seeds de dados
#
# Ordem de execução (alfabética — `supabase db reset` roda todos os .sql da pasta):
#   1. 01-ibge-localidades.sql  -> cidades e UFs (IBGE, gerado por gerar-ibge.ps1)
#   2. 02-bairros-cariacica.sql -> 100 bairros de Cariacica/ES (fonte oficial LC 171/2025)
#   3. 03-dev-seed.sql          -> dados de desenvolvimento (perfis, publicações)
#
# 03-dev-seed.sql é APENAS LOCAL e cria 13 usuários com e-mail confirmado
# (login sem Inbucket; senha única Cidade@123) — entre eles o canal institucional
# prefeitura-cariacica (selo), o moderador marco-andrade e a secretaria-meio-ambiente
# (com uma solicitação de selo PENDENTE em identity.badge_requests, para a fila do
# /admin e a demo B2G).
# NB: GoTrue exige colunas de token preenchidas com string vazia nos inserts em
# auth.users (senão o login falha com "Database error querying schema").
#
# Idempotência obrigatória: usar ON CONFLICT ... DO NOTHING / DO UPDATE, para que o
# seed possa rodar repetidamente sem duplicar linhas.
#
# Escrita: os seeds rodam com service_role (ou no SQL Editor) — as políticas RLS do
# contexto Geography não permitem escrita por anon/authenticated (invariante G5).
#
# Fontes oficiais (regra de sobrevivência, G8): documentos copiados/transcritos em
# sources/, com fonte, data e hash SHA-256 registrados em shared.app_metadata:
#   sources/lc1712025-listagem-bairros.txt  — transcrição da "LISTAGEM DOS BAIRROS" da
#       Lei Complementar 171/2025 (anexo cartográfico, GPU/SEMDEC, 02/09/2025),
#       extraída do PDF oficial (URL no topo de 02-bairros-cariacica.sql; o PDF de 54 MB
#       não é versionado — transcrição e URL com hash em shared.app_metadata).
#   sources/l47722010-cariacica.html — Lei 4772/2010 (delimitação original dos bairros).
#
# Curar bairros de um novo município: docs/03-data/runbook-curadoria-bairros.md
# (cidades já estão completas: 5.571 municípios IBGE; bairros são curados por
# município — só Cariacica/ES tem lista no lançamento).
#
# Regenerar o catálogo IBGE:  pwsh supabase/seed/gerar-ibge.ps1
# (exige acesso à Internet; revalidar a contagem de municípios contra a API).
