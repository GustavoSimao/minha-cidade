# AGENTS.md — Minha Cidade

> Fonte de verdade de processo para **qualquer** agente de IA neste repo (Claude Code, Codex,
> Cursor, Copilot, Gemini etc.). Não depende de ferramenta: tudo aqui é texto e caminhos.
> `CLAUDE.md` só importa este arquivo. `apps/web/AGENTS.md` é gerado pelo `next dev` (não editar).

## Projeto

- App: `apps/web` (Next.js 16, React 19, TypeScript, Tailwind 4). Backend: Supabase (`supabase/`).
- Organização por bounded context em `apps/web/src/contexts/<ctx>/{domain,application,infrastructure,interfaces}`;
  compartilhado em `apps/web/src/shared`.
- Processo, Definition of Done e convenções de commit: `docs/01-process/workflow.md`.
- Produto: `docs/00-product/prd.md`. Specs: `docs/04-contexts/`. Dados/RLS: `docs/03-data/`. ADRs: `docs/02-design/adr/`.
- Planos e histórico de execução: `docs/planos/`.

## Comandos (rodar da raiz)

```bash
npm run setup --prefix apps/web      # Supabase local + migrations + seed + .env.local
npm run dev --prefix apps/web
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run test --prefix apps/web       # unit (vitest)
npm run test:e2e --prefix apps/web   # e2e (playwright, mobile + desktop; exige stack local)
npm run build --prefix apps/web
```

Gate de design (telas): `node .claude/skills/avoid-ai-design/scripts/detect.mjs <arquivos>` — P0 bloqueia.

## Regras de segurança

- Nunca ler, editar nem enviar `**/.env*`, `**/*.pem`, `**/*.key`. A `service_role` key vive em `apps/web/.env.local`.
- Pedir confirmação antes de: `git commit/add/push/reset/clean`, Docker `down/stop/rm/prune/exec`,
  Supabase **remoto** (`link`, `db push`, `secrets`), apagar arquivos, `curl`/requisições de rede.
- Liberado sem perguntar: leitura, scripts do `package.json`, `git` só leitura, Supabase **local**
  (`status`, `start`, `stop`, `db reset` — o ciclo migration → reset → seed é parte da validação).
- Nunca alterar banco de produção sem migration versionada.

## Papéis especializados (opcionais)

Definidos em `.claude/agents/*.md`. No Claude Code viram subagentes; em outras ferramentas, leia o
arquivo do papel e siga as instruções dele. Nenhum fixa modelo.

| Família de tarefa | Papel |
|---|---|
| produto / PRD | `product-owner` |
| spec / plano / código | `spec-writer`, `plan-tasks`, `task-executor` |
| design / UI (leitura de imagens) | `design-reviewer` |
| revisão read-only de código | `clean-code-reviewer` |

## Skills — invocação condicional

Em `.claude/skills/` (formato aberto `SKILL.md`, agentskills.io). Só carregar quando a tarefa
casar com a descrição; nunca pré-carregar "por precaução".

- `avoid-ai-design` — **apenas** auditoria, revisão ou rewrite de UI existente.
- `better-design` — **apenas** ao criar/alterar UI com design system (tokens, componentes).

## Modo planejamento

Ao planejar: só ler, investigar e escrever o plano em `docs/planos/<timestamp>-<slug>.md`.
Nenhuma edição em arquivo do projeto nem comando que altere estado até o plano ser aprovado.
