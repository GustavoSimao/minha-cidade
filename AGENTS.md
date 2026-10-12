# AGENTS.md — Minha Cidade

> Este arquivo é a fonte de verdade de processo para qualquer agente que trabalhe neste repo.
> O `apps/web/AGENTS.md` é bloco gerado automaticamente pelo `next dev` (não editar).
> Skills de design vivem em `.kilo/skills/` e agentes em `.kilo/agents/` — ver
> `.kilo/plans/1791829052316-kilo-permissoes-e-agents.md` para o desenho completo.

## Guia de modelos

Você sabe qual modelo está te powerizando: ele aparece no seu system prompt
("You are powered by the model named ..."). Antes de começar qualquer tarefa, compare com a
tabela abaixo:

| Família de tarefa | Modelo | Agente |
|---|---|---|
| produto / PRD | `minimax/minimax-m2.7:free` | `@product-owner` |
| spec / plano / código | `stepfun/step-3.7-flash:free` | `@spec-writer`, `@plan-tasks`, `@task-executor` |
| design / UI (exige leitura de imagens) | `stepfun/step-3.7-flash:free` | `@design-reviewer` |
| revisão read-only de código | `nvidia/nemotron-3.5-lightning:free` | `@clean-code-reviewer` |

**Regra do aviso**: se a tarefa pedida pertence a uma família e o modelo atual não tem o
requisito dessa família (ex.: design em modelo texto-only), **pare antes de trabalhar** e
aponte a recomendação. Formato do alerta — texto sóbrio, sem emoji, sem marcadores decorativos:

> Modelo atual: <modelo>. A tarefa é da família <família>, que exige <requisito>.
> Recomendação: <@agente> (<modelo>), ou Tab para trocar de agente, ou /models para trocar o
> modelo. Continuo assim mesmo?

## Economia de tokens — invocação condicional

Skills e agentes **só** são carregados quando a tarefa pertence à família descrita na
descrição de cada um. Nunca pré-carregue skills "por precaução": carregar skill errada custa
contexto e tokens sem beneficiar a tarefa. Se a descrição não casar com a tarefa, não invoque.

Skills disponíveis neste repo (`.kilo/skills/`):

- `avoid-ai-design` — usar **apenas** em auditoria, revisão ou rewrite de UI frontend
  existente (telas, componentes). Nunca para backend, API, migrations, docs ou ingestão.
- `better-design` — usar **apenas** ao criar ou alterar UI com design system (tokens,
  componentes shadcn). Nunca para tarefas fora de interface.

Comando `/modelo` (`.kilo/command/modelo.md`): imprime a tabela acima e alerta em caso de
mismatch entre a tarefa informada e o modelo da sessão.
