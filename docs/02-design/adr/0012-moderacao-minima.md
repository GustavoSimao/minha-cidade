# ADR-0012 — Proteção mínima para feed público: denunciar, rate limit e admin

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D12

## Contexto
Feed público com post anônimo atrai spam e abuso rapidamente. Sem camada de moderação, o
produto fica inutilizável em dias.

## Decisão
Na v1: botão **denunciar** em publicação, comentário e perfil; **rate limit** por usuário
autenticado e por IP na camada de aplicação; painel **`/admin`** mínimo com fila de
denúncias e ações ocultar/restaurar/remover/resolver, restrito aos papéis `admin` e
`moderator` via RLS.

## Consequências
- Abuso é tratável sem trabalho manual infinito.
- Rate limit implementado na aplicação (tabela própria), deixando o Postgres livre de
  lógica de infraestrutura.
- Moderação avançada (palavras bloqueadas, shadowban, auditoria) fica para v2.
