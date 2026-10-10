# ADR-0015 — Geografia: IBGE como base e bairros de fonte oficial curada

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P11, P12

## Contexto
O feed por bairro é o diferencial do produto. A premissa inicial era "usar o IBGE como base
para bairros". Verificação direta na API de Localidades
(`https://servicodados.ibge.gov.br/api/v1/localidades`):

| Município | `distritos` | `subdistritos` |
|---|---|---|
| Cariacica/ES (3201309) | `[]` | `[]` |
| Vitória/ES (3205309) | 1 distrito | 9 "Regiões Administrativas" — não são bairros |
| São Paulo/SP (3550308) | `[]` | `[]` |

O IBGE publica UFs, municípios, distritos e subdistritos — **não bairros urbanos**. Bairro
é dado municipal (lei do plano diretor / mapa oficial).

## Decisão
- **Cidades e UFs:** 100% IBGE (5.570 municípios, 27 UFs), seed idempotente versionado.
- **Bairros:** usar os **subdistritos do IBGE onde existirem** e, onde não existirem, a
  **lista oficial do município**, curada e versionada por nós com **fonte e data
  registradas**.
- O usuário **nunca cria bairro**: apenas seleciona cidade → bairro.
- **Lançamento:** Cariacica/ES com bairros curados (fonte oficial já localizada) + todas as
  cidades IBGE. Fora dos municípios com lista curada, bairro é **opcional** e a publicação
  exibe "Bairro não informado".

Fontes oficiais de Cariacica já identificadas:
- Mapa de bairros da prefeitura: `https://cariacica.es.gov.br/uploads/filemanager_files/mapas/BAIRROS_A1-compactado.pdf`
- Lei 4772/2010 (delimitação dos 100 bairros pelo POT): `https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/html/l47722010.html`

## Consequências
- Feed consistente e analisável (bairros canônicos), material de analytics confiável.
- Seed precisa de cópia do documento-fonte no repositório de dados, para sobreviver à
  mudança de URL da prefeitura.
- Novos municípios entram por curadoria sob demanda — documento, data e diff versionados.
- Geografia por raio (PostGIS) continua como evolução, sem retrabalho.
