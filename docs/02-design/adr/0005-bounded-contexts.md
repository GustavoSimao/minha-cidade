# ADR-0005 — Bounded contexts do Minha Cidade

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D5, D15

## Contexto
O produto tem domínios distintos (identidade, localização, publicações, engajamento,
relações sociais, moderação, notificações, análise). No sistema anterior tudo estava
acoplado em views e models compartilhados.

## Decisão
Oito bounded contexts, com regra de dependência explícita:

| Contexto | Responsabilidade |
|---|---|
| Identity & Access | cadastro, login, perfil, username, sessão |
| Geography | cidades e bairros (IBGE), endereços, geolocalização opcional |
| Publication | publicações (problema/ideia, anônimas), eventos (v2) |
| Engagement | reações, comentários, salvamentos |
| Social Graph | amizades |
| Moderation | denúncias, ações administrativas |
| Notification | notificações in-app |
| Analytics | métricas, agregações, transparência |

Publication, Engagement e Social Graph dependem de Identity e Geography. Moderation e
Notification são consumidores de eventos. Analytics é read-only.

## Consequências
- Cada contexto tem spec, schema, testes e telas próprios.
- Mudanças ficam contidas; vocabulário ubíquo por contexto.
- Exige disciplina para não criar atalhos entre contextos (ver ADR-0006/0007).
