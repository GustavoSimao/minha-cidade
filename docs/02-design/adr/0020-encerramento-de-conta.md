# ADR-0020 — Encerramento de conta com anonimização das publicações

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P4

## Contexto
Controle dos próprios dados é expectativa básica (LGPD), mas apagar a conta em cascata
destruiria discussões e reações de outras pessoas em publicações daquela conta.

## Decisão
- **Encerrar conta** em `/perfil`, com confirmação por senha.
- **Exclusão em cascata** dos dados próprios: perfil, reações, comentários, amizades,
  notificações e salvamentos.
- **Publicações são anonimizadas, não apagadas**: `author_id` passa a `NULL` e
  `is_anonymous` é forçado — o conteúdo permanece como registro da comunidade.
- A exclusão do usuário em `auth.users` (via `service_role`) dispara o cascade do perfil.

## Consequências
- `publication.publications.author_id` precisa ser **anulável** (difere do schema original,
  onde era `not null`).
- Ordem importa: anonimizar publicações **antes** de apagar o perfil.
- Comentários do usuário são apagados (não anonimizados) — decisão consciente: comentário
  é conversa, não registro cívico.
