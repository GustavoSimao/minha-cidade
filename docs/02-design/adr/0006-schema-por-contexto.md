# ADR-0006 — Espelhamento de contexto no código e um schema Postgres por contexto

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D6

## Contexto
Bounded contexts só valem se estiverem refletidos na estrutura do código e do banco;
caso contrário viram nomes bonitos sobre um big ball of mud.

## Decisão
- Código: `apps/web/src/contexts/<ctx>/{domain,application,infrastructure,interfaces}`,
  com domínio puro (sem framework) e kernel compartilhado em `src/shared/kernel`.
- Banco: **um schema Postgres por contexto** (`identity`, `geography`, `publication`,
  `engagement`, `social_graph`, `moderation`, `notification`, `analytics`) mais o schema
  `shared` para tipos comuns.

## Consequências
- Fica óbvio onde cada coisa mora; revisão de schema contextualizada.
- Migrations por contexto, com nomes `YYYYMMDDHHMMSS_<contexto>_<descricao>.sql`.
- Consultas entre contextos exigem junção na aplicação ou evento — nunca JOIN entre
  schemas de contextos diferentes (ADR-0007).
