# Specs de bounded contexts

Cada contexto tem **um** `spec.md` que é a fonte da verdade daquele domínio. O código de
`apps/web/src/contexts/<ctx>/` implementa exatamente o que está especificado aqui; a
migration de `supabase/migrations/` materializa o schema descrito.

## Template obrigatório do `spec.md`

```markdown
# <Contexto> — Especificação

## 1. Propósito e linguagem ubíqua
(termos do domínio e seu significado exato neste contexto)

## 2. Invariantes
(regras que nunca podem ser violadas; cada uma vira teste)

## 3. Entidades e value objects
(atributos, tipos, validações, identidade)

## 4. Casos de uso
(comando → validações → evento de domínio publicado → efeitos)

## 5. Eventos de domínio
(nome, payload, quem consome)

## 6. Schema (DDL)
(tabelas, colunas, constraints, índices — igual à migration)

## 7. Políticas RLS
(em linguagem natural; teste negativo correspondente)

## 8. Endpoints / rotas
(método, path, entrada, saída, erros)

## 9. Testes derivados
(um caso por invariante + fluxos e2e)
```

## Contextos e status

| Contexto | Spec | Status |
|---|---|---|
| Identity & Access | [`identity-access.md`](identity-access.md) | **concluído** (Fase 2) |
| Geography | [`geography.md`](geography.md) | **concluído** (Fase 3 — código + migration + seeds; falta aplicar no Supabase) |
| Publication | [`publication.md`](publication.md) | **concluído** (Fase 4 — código + migration; falta aplicar no Supabase) |
| Publication | [`publication.md`](publication.md) | pendente (Fase 4) |
| Engagement | [`engagement.md`](engagement.md) | pendente (Fase 5) |
| Social Graph | [`social-graph.md`](social-graph.md) | pendente (Fase 6) |
| Moderation | [`moderation.md`](moderation.md) | pendente (Fase 7) |
| Notification | [`notification.md`](notification.md) | pendente (Fase 8) |
| Analytics | [`analytics.md`](analytics.md) | pendente (Fase 10) |

## Regra

Spec primeiro, código depois. Um PR que muda comportamento sem mudar a spec do contexto
não passa em revisão (ver `docs/01-process/workflow.md`).
