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
| Geography | [`geography.md`](geography.md) | **concluído** (Fase 3 — código + migration + seeds; aplicado no Supabase local) |
| Publication | [`publication.md`](publication.md) | **concluído** (Fase 4 — código + migration; aplicado no Supabase local) |
| Engagement | [`engagement.md`](engagement.md) | **concluído** (Fase 5 — código + migration + seeds + Realtime; aplicado no Supabase local) |
| Social Graph | [`social-graph.md`](social-graph.md) | **concluído** (Fase 6 — código + migration + seeds + Realtime; aplicado no Supabase local) |
| Moderation | [`moderation.md`](moderation.md) | **concluído** (Fase 7 — código + migration + seeds + rate limits; aplicado no Supabase local) |
| Notification | [`notification.md`](notification.md) | **concluído** (Fase 8 — código + migration + trigger do outbox; aplicado no Supabase local) |
| Analytics | [`analytics.md`](analytics.md) | pendente (Fase 10) |

## Regra

Spec primeiro, código depois. Um PR que muda comportamento sem mudar a spec do contexto
não passa em revisão (ver `docs/01-process/workflow.md`).
