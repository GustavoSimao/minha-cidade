---
description: Recomenda capacidades e agentes Kilo por familia de tarefa, sem fixar identificadores de modelo. Uso: /modelo <descricao da tarefa>
---

Leia a tarefa informada em `$ARGUMENTS`.

1. **Classifique a familia da tarefa**: produto/PRD, spec/plano/codigo, design/UI, revisao de
   codigo, ou outra (fora das familias).
2. **Consulte as capacidades recomendadas e os agentes Kilo especializados** em `AGENTS.md`.
   As recomendações são genéricas e não fixam provedor nem identificador de modelo.

3. Considere as capacidades do modelo atual e use um agente especializado quando isso melhorar
   o resultado e estiver disponível. Não interrompa a tarefa por uma diferença nominal de
   modelo; explique limitações concretas e prossiga com o trabalho possível.
4. **Economia de tokens**: so carregue agentes ou skills quando a tarefa casar com a
   descricao de cada um; nunca pre-carregue por precaucao.
