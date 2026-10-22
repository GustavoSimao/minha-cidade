# AGENTS.md — Minha Cidade

> Este arquivo é a fonte de verdade de processo para qualquer agente que trabalhe neste repo.
> O `apps/web/AGENTS.md` é bloco gerado automaticamente pelo `next dev` (não editar).
> Skills de design vivem em `.kilo/skills/` e agentes em `.kilo/agents/` — ver
> `.kilo/plans/1791829052316-kilo-permissoes-e-agents.md` para o desenho completo.

## Guia de modelos

Escolha o modelo conforme as capacidades necessárias, o contexto disponível e a complexidade
da tarefa. As recomendações abaixo indicam papéis especializados do Kilo quando forem úteis;
elas não fixam um provedor ou identificador de modelo e não impedem que o agente atual execute
o trabalho quando tiver as capacidades necessárias.

| Família de tarefa | Capacidade recomendada | Agente Kilo |
|---|---|---|
|---|---|---|
| produto / PRD | Síntese de produto e análise de requisitos | `@product-owner` |
| spec / plano / código | Raciocínio técnico e capacidade de trabalhar com o repositório | `@spec-writer`, `@plan-tasks`, `@task-executor` |
| design / UI (quando exige leitura de imagens) | Análise visual e capacidade de trabalhar com a stack frontend | `@design-reviewer` |
| revisão read-only de código | Análise cuidadosa sem modificar arquivos | `@clean-code-reviewer` |

Use um agente Kilo especializado quando isso melhorar o resultado e estiver disponível. Não
interrompa a tarefa apenas porque o modelo atual difere de uma recomendação: avalie suas
capacidades reais, informe qualquer limitação concreta e prossiga com o trabalho possível.

## Permissões e aprovações

A política vive em `.kilo/kilo.jsonc` (projeto, versionado) e complementa o global
`~/.config/kilo/kilo.jsonc`. Regra de avaliação: topo para baixo, **a última regra que casa
vence** — por isso o fallback `"*": "ask"` vem primeiro e os allows depois.

- **Allow automático:** leitura de arquivos; `npm`/`node`/`npx` (lint, typecheck, test, build);
  `git` somente leitura (status/diff/log/show/branch/ls-files); Supabase **local**
  (`status`, `start`, `stop`, `db reset`); inspeção de Docker (`ps`, `images`, `compose ps/logs/config/up`);
  utilitários de leitura do PowerShell.
- **Sempre pergunta (fallback):** git `commit`/`add`/`push`/`reset`/`clean`; Docker
  `down`/`stop`/`rm`/`prune`/`exec`; Supabase **remoto** (`db push`, `link`, `secrets`);
  `Remove-Item`; `curl`; `Invoke-WebRequest`; qualquer comando fora da lista.
- **Rede:** `webfetch`/`websearch` pedem confirmação — um fetch pode vazar segredo do `.env.local`.
- **Segredos:** `edit` é negado em `**/.env`, `**/.env.*`, `**/*.pem`, `**/*.key`
  (a `service_role` key vive em `apps/web/.env.local`).
- **Desvio consciente da D1** do plano de permissões: `supabase db reset/start/stop` estão em
  allow porque o ciclo migration → `db reset` → seed é parte da validação de cada fase; o
  impacto é só no Postgres local. Supabase remoto continua em ask.

## Modo plan (planejamento)

Quando a sessão está no agente **plan**, o trabalho é **só planejamento**: ler, investigar e
escrever o plano em `.kilo/plans/`. Nesse modo as permissões de escrita e execução ficam
**bloqueadas** — nenhum `edit` em arquivo do projeto e nenhum comando que altere estado
(`npm run`, `supabase`, `git commit`, `Remove-Item`, `curl`).

A allowlist de `bash`/`edit` de `.kilo/kilo.jsonc` vale para o agente **code**: no modo plan
manda a restrição read-only do próprio agente, que é mais restritiva e vem primeiro. Tarefa que
precise executar algo sai do plano e roda no `@task-executor` ou no agente code.

**Ressalva de sessão:** mudança de arquivo de config **não afeta a sessão corrente** — as
regras injetadas na sessão continuam valendo até abrir uma sessão nova. Após alterar
`.kilo/kilo.jsonc`, validar em sessão nova (ver item 1 da validação em
`.kilo/plans/1791829052316-kilo-permissoes-e-agents.md`).

## Economia de tokens — invocação condicional

Skills e agentes **só** são carregados quando a tarefa pertence à família descrita na
descrição de cada um. Nunca pré-carregue skills "por precaução": carregar skill errada custa
contexto e tokens sem beneficiar a tarefa. Se a descrição não casar com a tarefa, não invoque.

Skills disponíveis neste repo (`.kilo/skills/`):

- `avoid-ai-design` — usar **apenas** em auditoria, revisão ou rewrite de UI frontend
  existente (telas, componentes). Nunca para backend, API, migrations, docs ou ingestão.
- `better-design` — usar **apenas** ao criar ou alterar UI com design system (tokens,
  componentes shadcn). Nunca para tarefas fora de interface.

Comando `/modelo` (`.kilo/command/modelo.md`): recomenda capacidades e agentes Kilo conforme a
família da tarefa, sem exigir identificadores específicos de modelo.
