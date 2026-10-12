---
description: Mostra a tabela de modelos por familia de tarefa e alerta (texto sobrio, sem emoji) se o modelo da sessao nao serve para a tarefa informada. Uso: /modelo <descricao da tarefa>
---

Leia a tarefa informada em `$ARGUMENTS`.

1. **Classifique a familia da tarefa**: produto/PRD, spec/plano/codigo, design/UI, revisao de
   codigo, ou outra (fora das familias).
2. **Compare com a tabela**:

   | Familia | Modelo | Agente |
   |---|---|---|
   | produto / PRD | `minimax/minimax-m2.7:free` | `@product-owner` |
   | spec / plano / codigo | `stepfun/step-3.7-flash:free` | `@spec-writer`, `@plan-tasks`, `@task-executor` |
   | design / UI (exige leitura de imagens) | `stepfun/step-3.7-flash:free` | `@design-reviewer` |
   | revisao read-only de codigo | `nvidia/nemotron-3.5-lightning:free` | `@clean-code-reviewer` |

3. **Verifique o modelo desta sessao**: ele aparece no seu system prompt
   ("You are powered by the model named ...").
4. **Se a familia exigir algo que o modelo atual nao tem** (ex.: design/UI em modelo
   texto-only), alerte ANTES de qualquer trabalho. Formato do alerta — texto sobrio, sem
   emoji, sem marcadores decorativos:

   > Modelo atual: <modelo>. A tarefa e da familia <familia>, que exige <requisito>.
   > Recomendacao: <@agente> (<modelo>), ou Tab para trocar de agente, ou /models para
   > trocar o modelo. Continuo assim mesmo?

5. **Se casar**, confirme em uma linha que o modelo atual serve e siga com a tarefa.
6. **Economia de tokens**: so carregue agentes ou skills quando a tarefa casar com a
   descricao de cada um; nunca pre-carregue por precaucao.
