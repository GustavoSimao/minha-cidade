# ADR-0003 — Repositório novo para o app e repositório separado para analytics

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D3

## Contexto
O repo anterior (`laravel/laravel` + 7 módulos composer locais) estava inconsistente:
views defasadas, módulos sem models, contradições de stack e nenhum dado de produção.
Reescrever sobre aquele histórico traria legado sem valor.

## Decisão
Criar repo novo `minha-cidade-web` para o produto e repo separado
`minha-cidade-analytics` para a camada Python. O repo antigo foi deletado; apenas o
plano (com o schema de referência no Apêndice A) foi preservado.

## Consequências
- Base limpa, sem dívida de legado nem migrations conflitantes.
- Repo de analytics nasce como peça de portfólio independente, com própria CI.
- Nenhuma migração de dados necessária (não existiam dados de produção).
