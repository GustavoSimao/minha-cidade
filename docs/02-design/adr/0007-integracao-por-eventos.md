# ADR-0007 — Integração entre contextos por IDs e eventos de domínio

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D7

## Contexto
Com um schema por contexto, a tentação natural é criar chaves estrangeiras entre schemas
(publicação → perfil, comentário → publicação de outro contexto), o que recria o
acoplamento que o DDD quis evitar.

## Decisão
Contextos se integram por:
1. **IDs** — um contexto guarda o identificador do outro (ex.: `publication.author_id`)
   sem FK cross-schema;
2. **Eventos de domínio** registrados em `shared.domain_events`, consumidos de forma
   assíncrona por notificação, moderação e métricas.

Nunca JOIN entre schemas de contextos diferentes; quem precisa de dados de outro contexto
os obtém pelo próprio repositório/consulta daquele contexto.

## Consequências
- Consistência eventual entre contextos (ex.: contador de publicações do perfil pode
  atrasar milissegundos/segundos) — aceitável e documentado.
- `shared.domain_events` vira peça central de observabilidade e de analytics.
- Exige cuidado para não duplicar regras que pertencem a outro contexto.
