# Seeds de dados
#
# Ordem de execução:
#   1. ibge-localidades.sql  -> cidades e bairros (gerado, ver docs/03-data/catalogo-ibge.md)
#   2. dev-seed.sql          -> dados de desenvolvimento (perfis, publicações, amizades)
#
# Idempotência obrigatória: usar ON CONFLICT ... DO NOTHING / DO UPDATE, para que o
# seed possa rodar repetidamente sem duplicar linhas.
