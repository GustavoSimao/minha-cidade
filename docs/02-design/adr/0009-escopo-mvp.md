# ADR-0009 — Escopo do MVP v1

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D9

## Contexto
O produto poderia portar tudo o que o sistema anterior tinha planejado (eventos,
notificações por e-mail, verificação, busca, moderação avançada) ou entregar primeiro um
núcleo utilizável por pessoas reais em celular e PC.

## Decisão
MVP v1 = auth (Google + e-mail/senha) + perfil + publicações (problema/ideia, anônimas,
com fotos) + feed por bairro/cidade + reações + amizade + comentários + denunciar com
rate limit e admin mínimo + notificação in-app + PWA.

Fora de escopo na v1: eventos com data/local/participação, notificações por e-mail/push,
verificação de e-mail/telefone, busca textual, moderação avançada, app nativo em loja.

## Consequências
- Entregável testável por usuários reais em prazo curto.
- Publicar (o coração do produto) existe desde a primeira versão.
- Schema de eventos fica documentado para v2, sem implementação.
