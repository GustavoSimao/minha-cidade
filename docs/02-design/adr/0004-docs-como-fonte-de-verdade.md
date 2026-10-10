# ADR-0004 — Documentação como fonte da verdade (spec por bounded context + C4 + ADR)

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D4

## Contexto
O dono do produto quer o projeto orientado a documentos, com documentação de produto,
processo, design e dados, de modo que o código seja construído **sobre** os documentos.

## Decisão
`docs/` é a fonte da verdade. Cada bounded context tem `spec.md` com linguagem ubíqua,
invariantes, casos de uso, eventos, ERD, endpoints e políticas RLS. PR não passa sem
spec atualizada quando o comportamento muda. C4 documenta arquitetura; ADRs registram
decisões (imutáveis).

## Consequências
- Contrato claro entre produto e implementação; onboarding mais rápido.
- Custo de manutenção da documentação — mitigado pelo Definition of Done
  (`docs/01-process/workflow.md`) que exige spec no mesmo PR.
- Risco de doc descolar do código; revisão mensal do glossário e do dicionário de dados.
