# Seeds de dados
#
# Ordem de execução:
#   1. ibge-localidades.sql    -> cidades e UFs (IBGE, gerado por gerar-ibge.ps1)
#   2. bairros-cariacica.sql   -> 100 bairros de Cariacica/ES (fonte oficial LC 171/2025)
#   3. dev-seed.sql            -> dados de desenvolvimento (perfis, publicações, amizades)
#                                (criado nas fases dos contextos correspondentes)
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
#       extraída do PDF oficial (URL no topo de bairros-cariacica.sql; o PDF de 54 MB
#       não é versionado — hash do arquivo original conferido na curadoria).
#   sources/l47722010-cariacica.html — Lei 4772/2010 (delimitação original dos bairros).
#
# Regenerar o catálogo IBGE:  pwsh supabase/seed/gerar-ibge.ps1
# (exige acesso à Internet; revalidar a contagem de municípios contra a API).
