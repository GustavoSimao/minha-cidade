# ADR-0010 — Localização por catálogo IBGE com lat/lng opcional

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D10

## Contexto
O feed "por bairro/cidade" é o core do produto. Havia três modelos: catálogo IBGE,
PostGIS com raio (GPS), ou texto livre.

## Decisão
Tabelas `geography.cities` e `geography.neighborhoods` **semeadas da API de Localidades do
IBGE**, seleção obrigatória em cascata (cidade → bairro). Coluna `lat/lng` opcional em
publicações/perfis para evolução; extensão PostGIS disponível no Supabase, mas não
obrigatória na v1.

## Consequências
- Feed consistente e analisável (bairros canônicos) — material riquíssimo para analytics.
- Sem depender de permissão de GPS no celular.
- Seed idempotente versionado; atualização documentada.
- Busca por raio fica como evolução (ADR futuro), sem retrabalho de schema.
