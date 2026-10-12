# Plano — Limpeza de permissões do Kilo + time de agentes (spec-first, clean code, design)

## Contexto e diagnóstico

Estados atuais no PC (verificado em 2026-10-12):

- **Global Kilo**: `C:\Users\gusta\.config\kilo\kilo.jsonc` — 250 linhas, com ~225 entradas de
  allow de bash acumuladas (muitas overfit: `p *`, `n *`, `1 *`, `f *`, `python - *`) e caminhos
  stale/typo em `external_directory` (`minha-cidadgo`, `C:\projetin\`, `minha-cidade-rewrite`).
- **opencode**: `C:\Users\gusta\.config\opencode\opencode.jsonc` está vazio (só `$schema`) — os
  configs **não** estão no opencode.
- **Projeto**: `.kilo/` só tem `.gitignore` e `plans/`; **não existe** `kilo.json`, comandos ou
  agentes no projeto.
- **Erro observado**: o ruleset ativo desta sessão é *deny-by-default* (`bash: * → deny` + allowlist
  read-only + proibição de `; | & > ` `$(`). Essas regras **não existem em nenhum arquivo** — foram
  injetadas na sessão (provavelmente persistidas em `~/.local/share/kilo/kilo.db`). Consequência:
  todos os allows do `kilo.jsonc` estão mortos nesta sessão (ex.: `ls` passa, `python -c` é negado
  apesar de permitido no arquivo). **Editar arquivo não conserta a sessão atual — só sessões novas.**

Objetivos: (1) política de permissões enxuta e funcional; (2) time de agentes customizados em
`.kilo/agents/`, todos usando **modelos gratuitos** do Kilo Gateway (sem cartão; limite keyless
~200 req/h/IP — evitar muitos subagentes em paralelo).

## Parte 1 — Permissões (`C:\Users\gusta\.config\kilo\kilo.jsonc`) — **[IMPLEMENTADO 12/10/2026]**

Bloco `"permission"` aplicado (backup em `kilo.jsonc.bak-20261012`; validado pelo Kilo).
Correção aplicada na implementação: **a última regra que casa vence** (confirmado na doc), por
isso o fallback `"*": "ask"` vai **no topo** do bloco `bash`, com os allows depois.

```jsonc
"permission": {
  "read": "allow",
  "external_directory": {
    "C:\\Users\\gusta\\AppData\\Local\\Temp\\*": "allow",
    "C:\\Users\\gusta\\.local\\share\\kilo\\plans\\*": "allow",
    "C:\\Users\\gusta\\.config\\*": "allow",
    "C:\\projetos\\*": "allow",
    "D:\\*": "allow"
  },
  "bash": {
    // fallback primeiro: ultima regra que casa vence
    "*": "ask",
    // dev commands do dia a dia
    "python *": "allow",
    "python -m *": "allow",
    "py *": "allow",
    "npm *": "allow",
    "node *": "allow",
    "npx *": "allow",
    "pytest *": "allow",
    "ruff *": "allow",
    "mypy *": "allow",
    // git: somente leitura
    "git status*": "allow",
    "git log*": "allow",
    "git show*": "allow",
    "git diff*": "allow",
    "git blame*": "allow",
    "git branch*": "allow",
    "git remote*": "allow",
    "git ls-files*": "allow",
    "git grep*": "allow",
    "git stash list*": "allow",
    "git rev-parse*": "allow",
    "git describe*": "allow",
    // docker: leitura e start/build de containers
    "docker compose ps*": "allow",
    "docker compose logs*": "allow",
    "docker compose config*": "allow",
    "docker compose up*": "allow",
    "docker compose build*": "allow",
    "docker compose run*": "allow",
    "docker ps*": "allow",
    "docker images*": "allow",
    "docker info*": "allow",
    // supabase: status é leitura
    "supabase status*": "allow",
    // utilitários de leitura do PowerShell
    "Get-ChildItem *": "allow",
    "Get-Content *": "allow",
    "Get-Location *": "allow",
    "Test-Path *": "allow",
    "ls *": "allow",
    // mutantes / destrutivos: sempre confirmar
    "git commit*": "ask",
    "git add*": "ask",
    "git push*": "ask",
    "git pull*": "ask",
    "git reset*": "ask",
    "git clean*": "ask",
    "git checkout .*": "ask",
    "git mv*": "ask",
    "git rm*": "ask",
    "docker compose down*": "ask",
    "docker compose stop*": "ask",
    "docker compose rm*": "ask",
    "docker compose exec*": "ask",
    "docker system prune*": "ask",
    "supabase *": "ask",
    "flyctl *": "ask",
    "curl*": "ask",
    "Invoke-WebRequest *": "ask",
    "Remove-Item *": "ask",
    "rmdir *": "ask",
    "Set-Content *": "allow",
    "Move-Item *": "ask",
    "Rename-Item *": "ask"
  }
}
```

Notas de implementação (aplicadas):
- **A última regra que casa vence** (confirmado na doc oficial) — `"*": "ask"` vai no **topo** do
  bloco `bash`; os allows e os `ask` específicos vêm depois e sobrescrevem o fallback.
- `git clean*` = `ask` (não allow): apaga trabalho não commitado.
- Glob nu (ex.: `git status` sem args) casa com `"git status*"` — validado em sessão nova.
- `Set-Content *` em allow (escrita de scripts auxiliares em `Temp/`); mover para `ask` se
  preferir. `git branch*` em allow inclui `git branch -D` — reversível via reflog.
- Validação do Kilo passou após a escrita do arquivo.

## Parte 2 — Time de agentes (`.kilo/agents/*.md`) — **[IMPLEMENTADO 12/10/2026]**

Criados e verificados via `kilo agent list` em ambos os repos (minha-cidade e meu-candidato):
`product-owner (all)`, `spec-writer`, `plan-tasks`, `task-executor`, `clean-code-reviewer`,
`design-reviewer` (subagent). Além do mapeamento de modelos, as permissões de cada agente foram
pregadas no frontmatter (revisores com `edit/bash: deny`). Nota: o validador de escrita exibe
"Failed to parse frontmatter: No context found for instance" para **qualquer** arquivo em
`.kilo/agents/` — bug da versão 7.8.8; o loader real carrega normalmente (comprovado pelo
`kilo agent list`).

Formato: markdown com frontmatter YAML (`description`, `mode`, `model`, `temperature`, `steps`,
`permission`); o corpo do arquivo é o system prompt. Carregados de `.kilo/agents/` (projeto) e
`~/.config/kilo/agents/` (global). Decisão D4 resolvida: **projeto** `.kilo/agents/` — agentes
citam os docs deste repo e ficam versionados no git.

### Modelos gratuitos — comparação (Kilo Gateway, sem cartão, ~200 req/h/IP)

| Modelo (ID) | Ctx / saída | Visão | Raciocínio | Pontos fortes (fontes: opencode.ai/data, BenchAlign, Vals) |
|---|---|---|---|---|
| `stepfun/step-3.7-flash:free` | 256K / 256K | sim | sim | **Coding 96/100** no comparativo OpenCode; tool use 55; lê imagem/vídeo (mockups, prints); open weights |
| `minimax/minimax-m2.7:free` | 205K / 131K | não | sim | Raciocínio 76 (melhor entre os gratuitos no BenchAlign 48.0 vs 43.0 do Nemotron Ultra); SWE Multilingual 76,5% |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M / 128K | não | sim | LiveCodeBench 86% (#3 open-weight); texto-only; melhor para digerir muitos docs de uma vez |
| `nvidia/nemotron-3.5-lightning:free` | 262K / 262K | não | sim | 30B A3B, rápido e barato (#17 em uso no OpenCode); ideal para revisores read-only |
| `inclusionai/ling-3.0-flash:free` | 262K / 33K | sim | sim | Tool call + structured output; alternativa de visão |
| `nex-agi/nex-n2.5-pro:free` | — | sim | sim | Modelo agêntico de coding com loop de feedback visual (altativa) |
| `kilo-auto/free` | 256K / ~10K | varia | varia | Rotaciona entre livres; **não usar como default dos agentes**: pode cair em modelo texto-only (quebra imagem) e tem saída de só ~10K tokens |

Decisão D3 = **pinado por agente** (responde à dúvida: no `auto/free` o roteador pode escolher
um modelo sem visão e a troca de modelo no meio da sessão muda limites de contexto/saída e pode
causar retrabalho — por isso cada agente tem modelo fixo, com fallback documentado).

### Mapeamento final (6 agentes)

| # | Arquivo | mode | modelo | fallback | permissões | Papel |
|---|---|---|---|---|---|---|
| 1 | `product-owner.md` | all | `minimax/minimax-m2.7:free` | `stepfun/step-3.7-flash:free` | edit só `docs/00-product/**`, bash deny | Transforma ideia em PRD: personas, problema, escopo in/out, critérios de aceite. Não escreve código. |
| 2 | `spec-writer.md` | subagent | `stepfun/step-3.7-flash:free` | `nvidia/nemotron-3-ultra-550b-a55b:free` | edit `docs/**` allow, bash deny | PRD aprovado → spec do bounded context em `docs/04-contexts/`: histórias, cenários, contratos de API, modelo de dados, políticas RLS. Lê mockups/prints (visão). |
| 3 | `plan-tasks.md` | subagent | `stepfun/step-3.7-flash:free` | `minimax/minimax-m2.7:free` | edit `docs/**`, bash deny | Spec → `tasks.md` ordenado seguindo o fluxo do repo: migration → domínio → aplicação → infraestrutura → tela → teste. Uma tarefa por vez. |
| 4 | `task-executor.md` | subagent | `stepfun/step-3.7-flash:free` | `nex-agi/nex-n2.5-pro:free` | edit `apps/web/**` + `supabase/**`, bash allowlist (npm/supabase/docker) | Implementa **uma** tarefa do `tasks.md`, roda lint/typecheck/test, para e reporta. Nunca inicia a tarefa seguinte sem OK. |
| 5 | `clean-code-reviewer.md` | subagent | `nvidia/nemotron-3.5-lightning:free` | `poolside/laguna-s-2.1:free` | edit/bash deny (só leitura) | Revisão：naming, SRP, DRY, funções pequenas, early return, tratamento de erro, testes. Saída: findings por severidade. |
| 6 | `design-reviewer.md` | subagent | `stepfun/step-3.7-flash:free` | `inclusionai/ling-3.0-flash:free` | edit/bash deny (só leitura) | UI/UX + design system: mobile-first, WCAG AA, estados vazio/loading/erro, tokens Tailwind 4, componentes em `src/shared/ui`. Lê prints de tela (visão). |

Cada prompt deve seguir: identidade em 1 frase → quando é invocado → workflow numerado →
não-objetivos explícitos → contrato de saída → regras de segurança (só ferramentas permitidas,
nunca inventar paths, verificar com ferramentas). Os agentes 2–4 citam `docs/01-process/` e
`docs/plano-reescrita-ddd.md` como fonte da verdade em vez de reinventar processo.

Metodologia "1 spec → depois 1 código" fica nos agentes 2→3→4 (spec aprovada → tarefas → executa
uma → verifica → próxima). Referência gratuita usada como inspiração: GitHub spec-kit
(constitution → specify → plan → tasks → implement → converge).

### Agentes extras (opcional — só criar se o usuário pedir depois)

- `refactorer.md` (refactors seguros, roda testes a cada passo), `test-writer.md` (vitest para
  domínio) e `ui-builder.md` (implementa telas no design system).
- Ou: `sdd-converge.md` (fecha o ciclo: confere spec vs código, atualiza docs) e
  `ddd-guardian.md` (fronteiras de bounded context, Result/outbox, imports entre contextos).

### Comandos opcionais (`.kilo/command/`)

Atalhos que roteiam para os agentes: `/spec`, `/tarefa`, `/revisar`, `/design-review`
(frontmatter com `agent:` + `description:`). Criar só se quiser — fora do escopo mínimo.

## Parte 3 — Aviso de modelo errado + skills de design (invocação condicional)

### 3.1 Aviso de modelo (AGENTS.md + comando `/modelo`)

Problema: os subagentes têm modelo pinado, mas a **sessão principal** usa o modelo que o
usuário escolheu — design em modelo texto-only passaria silencioso. Mecanismo: o agente sabe
seu modelo (system prompt: "You are powered by the model named ..."), então uma regra no
AGENTS.md (carregado em toda sessão) funciona como aviso always-on.

- minha-cidade: **criar** `AGENTS.md` na raiz (não existe hoje; o de `apps/web/` é bloco do
  `next dev` — não mexer).
- meu-candidato: **append** no `AGENTS.md` existente, com marcador `## Guia de modelos`.

Conteúdo da seção (igual nos dois projetos):

1. **Tabela família → modelo → agente** (a mesma do mapeamento de agentes):
   produto/PRD → `minimax/minimax-m2.7:free` (`@product-owner`); spec/plano/código →
   `stepfun/step-3.7-flash:free` (`@spec-writer` `@plan-tasks` `@task-executor`); design/UI
   (exige visão) → `stepfun/step-3.7-flash:free` (`@design-reviewer`); revisão read-only →
   `nvidia/nemotron-3.5-lightning:free` (`@clean-code-reviewer`).
2. **Regra do aviso**: compare o modelo do system prompt com a família da tarefa pedida; se a
   família exigir algo que o modelo não tem (ex.: visão para design), **pare no início** e
   alerte antes de trabalhar.
3. **Template do alerta — sem emoji, sem marcadores decorativos, texto sóbrio** (exigência do
   usuário: alertas de design com cara de assistente são lidos como IA):

   > Modelo atual: minimax/minimax-m2.7:free. A tarefa é da família design/UI, que exige
   > leitura de imagens. Recomendação: @design-reviewer (stepfun/step-3.7-flash:free), ou Tab
   > para trocar de agente, ou /models para trocar o modelo. Continuo assim mesmo?

4. **Regra de economia de tokens (D6)**: skills e agentes **só** são carregados/invocados
   quando a tarefa pertence à família descrita na descrição de cada um. Nunca pré-carregar
   skills "por precaução". Se a descrição não casar com a tarefa, não invocar.

Comando `/modelo` (`.kilo/command/modelo.md` nos dois repos): frontmatter com `description`;
corpo que imprime a tabela, deriva a família de `$ARGUMENTS`, e alerta em caso de mismatch
com o mesmo template sóbrio.

### 3.2 Skills de design — juntar camadas (não mesclar), zero conta

Pesquisa em 12/10/2026. `superdesign-skill` **eliminado** (exige CLI + login). Duas camadas MIT
que se compõem:

| Skill | Papel | Instalação |
|---|---|---|
| `funboy322/avoid-ai-design` (106★, MIT) | Auditoria/rewrite anti-"cara de IA": catálogo de 67 tells, scanner Node zero-dependência (`scripts/detect.mjs`, exit code 2 = gate de CI), `DESIGN.md` multi-página. Puro SKILL.md, roda offline | clone em `.kilo/skills/avoid-ai-design/` |
| `marvkr/better-design` (256★, MIT) | 31 design systems shadcn (Linear, Stripe, Supabase, Vercel…): tokens `globals.css`, overrides de componentes, princípios de UI, regras WCAG | clone em `.kilo/skills/better-design/`; usar `registry/<tema>/*.json` e `components/<tema>/` **locais** — sem MCP hospedado, sem API key, sem conta |

Fluxo unificado: `design-reviewer` valida tokens do tema escolhido (better-design) **e** roda o
scanner (avoid-ai-design); `task-executor` roda o scan antes de marcar tarefa de tela como feita.

Ajustes nos agentes (nos dois repos):
- `design-reviewer.md`: workflow ganha (a) conferência de tokens vs tema better-design adotado,
  (b) execução de `node .kilo/skills/avoid-ai-design/scripts/detect.mjs <path>`, (c) P0/P1 =
  blocker. Permissão bash: `"*": deny` **primeiro**, `"node *": allow` depois (o scanner precisa
  rodar; última regra que casa vence).
- `task-executor.md`: gate extra em tarefa de tela — scanner limpo (exit 0) antes do `- [x]`.
- `clean-code-reviewer.md`: sem mudança (fora da família design).

Trigger scope (D6): reforçar o `description` do frontmatter de cada `SKILL.md` clonado com
"usar quando / não usar quando" (edição mínima e documentada) + a regra geral no AGENTS.md.
Gastar token à toa carregando skill é pior que não ter a skill.

## Tarefas de implementação (em ordem)

Status: **Partes 1 e 2 implementadas em 12/10/2026** (permissões globais + 6 agentes nos dois
repos, verificados via `kilo agent list`). Resta a Parte 3:

1. Criar `AGENTS.md` na raiz de minha-cidade com a seção "Guia de modelos" (tabela, regra do
   aviso, template sóbrio, regra de economia de skills).
2. Append da mesma seção no `AGENTS.md` de meu-candidato (marcador `## Guia de modelos`).
3. Criar `.kilo/command/modelo.md` nos dois repos.
4. Clonar `funboy322/avoid-ai-design` → `.kilo/skills/avoid-ai-design/` nos dois repos;
   confirmar `SKILL.md` e `scripts/detect.mjs`; reforçar o `description` com o escopo de uso.
5. Clonar `marvkr/better-design` → `.kilo/skills/better-design/` nos dois repos; mover
   `skills/better-design/SKILL.md` para a raiz da pasta da skill (Kilo descobre
   `.kilo/skills/<nome>/SKILL.md`); manter `registry/` e `components/` acessíveis; reforçar o
   `description`.
6. Atualizar `design-reviewer.md` e `task-executor.md` nos dois repos (passos do scanner +
   tokens + regra D6).
7. Commit: `git add .kilo AGENTS.md` em cada repo (o `kilo.jsonc` global fica fora do git).

## Validação

1. Abrir **sessão nova** (a atual mantém as regras injetadas): testar `git status`, `git diff`,
   `docker compose ps`, `python --version`, `ls` — devem passar **sem prompt**; `git commit`,
   `docker compose down`, `supabase db reset`, `curl` devem **perguntar**; comando fora da lista
   cai no `"*": "ask"`.
2. `/agents` (ou Tab) deve listar os novos agentes; invocar cada um via `@` com uma tarefa tiny.
3. Confirmar que `clean-code-reviewer` e `design-reviewer` **não editam** nada (só relatório).
4. `task-executor` em 1 tarefa real: implementa, roda `npm run lint --prefix apps/web` e
   `npm run typecheck --prefix apps/web`, e para antes da próxima tarefa.
5. Se em sessão nova os comandões ainda forem negados → as regras vivem no `kilo.db`; investigar
   regras de sessão/Agent Manager antes de mexer no banco.
6. **Aviso de modelo**: em sessão principal com modelo texto-only, pedir trabalho de design →
   o alerta sóbrio aparece **antes** de qualquer edição.
7. **Economia de tokens**: tarefa não-design (ex.: migration/ingestão) → nenhuma skill é
   carregada (conferir o transcript da sessão).
8. **Scanner**: `node .kilo/skills/avoid-ai-design/scripts/detect.mjs <path de uma tela>` em
   cada repo — retorna findings rankeados (P0/P1/P2) e exit code 0 ou 2.
9. **better-design local**: testar `npx shadcn@latest add .kilo/skills/better-design/registry/<tema>/button.json`;
   se o CLI não aceitar path local, fallback documentado: copiar o `globals.css` de tokens do
   tema manualmente.
10. `/modelo` imprime a tabela e alerta a partir de `$ARGUMENTS`.

## Riscos e observações

- Modelos gratuitos têm rate limit (~200 req/h/IP no modo keyless) e catálogo instável — spawnar
  subagentes de forma sequenciada, não em paralelo; cada agente tem fallback documentado para
  trocar o modelo se o ID sair do catálogo.
- Edição de config **não afeta a sessão corrente**; sempre validar em sessão nova.
- AGENTS.md do projeto continua com o bloco do `next dev` (não mexer — é regenerado
  automaticamente).
- A CLI do shadcn pode não aceitar registry por path local — fallback: copiar os tokens do tema.
- Skills vendoradas no git: atualizar com `git pull` periódico; manter a edição do `description`
  mínima para facilitar re-merge.
- O aviso de modelo depende do nome do modelo estar no system prompt — válido nesta versão do
  Kilo; se o formato mudar em update, o aviso morre silenciosamente (rever ao atualizar).
- O scanner é heurístico: falsos positivos existem; usar `--min=P1` se ficar ruidoso e
  comentários `avoid-ai-design-ignore:` para escolhas deliberadas do design.

## Decisões (resolvidas com o usuário)

- **D1** política de bash: **read-only + dev commands automáticos; mutantes/destrutivos perguntam**
  (git commit/push/reset/clean, docker down/stop/rm/prune/exec, supabase start/stop/reset, flyctl,
  curl, Remove-Item). Racional discutido: o risco local principal é o próprio agente errar
  (`supabase db reset` sem querer, `git clean -fd` apagando trabalho, `curl` vazando a
  `service_role key` do `.env.local`) — injeção via dependência npm/issue/README existe, mas é
  secundária. A allowlist cobre o fluxo diário, então o atrito é só em comando raro.
- **D2** time: 6 subagentes (spec-first + clean code + design).
- **D3** modelos: **pinados por agente** conforme tabela de comparação (não usar `kilo-auto/free`
  como default — pode rotear para modelo texto-only e tem saída ~10K).
- **D4** local: projeto `.kilo/agents/` (versionado no git deste repo).
- **D5** skills de design: projeto `.kilo/skills/` **nos dois repos** (`avoid-ai-design` +
  `better-design`, ambos MIT, zero conta); `superdesign-skill` eliminado por exigir login/CLI.
- **D6** invocação condicional: skills e agentes **só** são carregados quando a tarefa casar
  com a descrição de cada um — nunca pré-carregar (economia de token).
- **D7** aviso de modelo: regra no AGENTS.md dos dois projetos + comando `/modelo`; alerta em
  texto sóbrio, **sem emoji** (alerta com cara de assistente é lido como IA).
