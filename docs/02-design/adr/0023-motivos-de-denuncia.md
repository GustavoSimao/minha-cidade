# ADR-0023 — Conjunto fechado de motivos de denúncia

- **Status:** Aceito
- **Data:** 2026-10-13
- **Decisões do plano:** P17 (moderação mínima), C1 do plano de lançamento local

## Contexto

A ADR-0017 registrou o motivo de denúncia como uma lista fechada de 5 valores
(`spam`, `conteudo_inapropriado`, `informacao_falsa`, `assedio`, `outro`). A
implementação da Fase 6 (`moderation.reports.reason`, domínio `ReportReason`)
saiu com uma lista **diferente** — 6 valores, trocando dois nomes e somando dois
motivos que a operação de verdade precisava separar:

| ADR-0017 (registrado) | Implementado (Fase 6) |
|---|---|
| `spam` | `spam` |
| `conteudo_inapropriado` | — (substituído por `discurso_odio` + `assedio`) |
| `informacao_falsa` | `informacao_falsa` |
| `assedio` | `assedio` |
| `outro` | `outro` |
| — | `conteudo_ilegal` |

A divergência foi encontrada na virada do lançamento local (C1: derivas
doc↔código) e ficou registrada no dicionário de dados errado até aqui.

## Decisão

O conjunto implementado é o correto e passa a ser a fonte da verdade:

`spam`, `discurso_odio`, `informacao_falsa`, `conteudo_ilegal`, `assedio`,
`outro` (6 valores, invariante M3).

- `discurso_odio` (ódio contra grupo) e `assedio` (assédio/ameaça a pessoa)
  são motivos distintos: o primeiro olha o alvo da ofensa, o segundo a relação
  de perseguição — a fila de moderação trata os dois com prioridades diferentes.
- `conteudo_ilegal` separa o que é crime do que é apenas inapropriado — a
  delegacia/MP precisa enxergar esse recorte sozinho.
- `conteudo_inapropriado` sai: era genérico demais e viraria balde. O que não
  encaixa nos outros cai em `outro` com descrição obrigatória na prática.

## Consequências

- A lista da ADR-0017 (seção "Decisão") fica **superseded por esta ADR**; o
  dicionário de dados foi corrigido para os 6 valores.
- Migração de dados: as linhas antigas `conteudo_inapropriado` precisariam de
  migração de reclassificação — no lançamento local o banco é recriado do zero
  (`db reset`), então não há dado a converter; em produção futura, o mapa é
  `conteudo_inapropriado` → `outro`.
- O domínio (`ReportReason`) e o CHECK do banco são a âncora; qualquer novo
  motivo exige nova ADR alterando os dois de uma vez.
