# Plano — Retomada: Lançamento local 100% + lacunas B2G

Criado em 2026-10-13, ao responder "onde paramos?". Consolida o estado **verificado hoje**
e a sequência exata para concluir o plano `1791856023122-lancamento-local-e-b2g.md`.

## Hierarquia de planos (não reabrir)

| Plano | Papel |
|---|---|
| `docs/plano-reescrita-ddd.md` | plano grande, Fases 0–12. Fases 0–8 ✅, Fase 9 (PWA) ✅ via plano de design (ADR-0022). Fases 10–12 pendentes |
| `docs/planos/1791856023122-lancamento-local-e-b2g.md` | **contrato em execução** (Track A local 100%, B lacunas de produto, C docs) |
| `docs/status-lancamento-2026-10-13.md` | handoff — fonte da verdade do andamento |

## Estado verificado nesta sessão (evidência)

- `supabase/migrations/20261011000003_publication_create_publications.sql:29` tem só
  `revoke all on sequence shared.domain_events_id_seq from anon, authenticated;` —
  **o `grant usage ... to service_role` ainda não existe** (bloqueio confirmado, não só pelo handoff).
- `apps/web/tests/e2e/` com `helpers.ts` + 10 specs (01…10) ✅;
  `playwright.config.ts` com projetos mobile 375×667 e desktop 1280×720, `workers: 1` ✅.
- `apps/web/package.json`: scripts `test:e2e`, `test:e2e:ui`, `setup` ✅; `@playwright/test` instalado ✅.
- `.github/workflows/ci.yml`: **sem job e2e** (só lint/typecheck/test/build).
- Git: último commit `9014847` (Publication). Nada do trabalho desde então está commitado —
  working tree sujo por design. **Regra vigente: nenhum commit sem o "ok, roda" do usuário.**

## Decisões já travadas (não reabrir)

- Local = e-mail/senha; login Google é config de produção (C2).
- Deploy é **configuração**: escrever `docs/deploy-checklist.md`, não executar.
- Cidades são dados de catálogo; a cidade compradora não define arquitetura.
- Migration em banco só local pode ser editada no próprio arquivo (não existe banco em nuvem).

## Tarefas (ordem exata)

### T1 — Destravar os eventos de domínio (BUG 1, ~5 min)
1. Em `supabase/migrations/20261011000003_publication_create_publications.sql`, logo após a
   linha 29 (`revoke all on sequence ...`), adicionar:
   `grant usage on sequence shared.domain_events_id_seq to service_role;`
2. `npx --yes supabase db reset` (Docker Desktop precisa estar rodando).
3. Validar: criar/aceitar amizade e denunciar pelo app (ou pelos use cases) e conferir
   `select count(*) from shared.domain_events;` > 0 — antes era 0.

### T2 — Suíte e2e verde nos dois viewports (A3)
1. `npx playwright test` em `apps/web` — repetir até 0 falhas em **mobile e desktop**.
2. Cada falha: reproduzir → teste de regressão (unit, se for domínio/aplicação) → corrigir na
   camada certa → revalidar. NÃO remendar invariante de domínio na UI.
3. **BUG 2 pendente de verificação:** conferir se `/perfil/[username]` ainda quebra no
   prerender. Se persistir: `await connection()` na página ou `<Suspense>`; investigar
   `publicacao/[id]/page.tsx:112` (`?? new Date()`) só se o erro apontar para lá.
4. Resultado de partida conhecido: 17 passed / 9 failed (desktop), causas já corrigidas,
   aguardando revalidação.

### T3 — Regressão das 4 portas
`npm test` (esperado 184+), `npm run lint`, `npm run typecheck`, `npm run build` — todos verdes.

### T4 — Job e2e no CI (opcional, marcar como tal se travar)
`.github/workflows/ci.yml`: serviço Docker + `npx --yes supabase db reset` +
`npx playwright install --with-deps chromium` + `npm run test:e2e`.

### T5 — Lighthouse ≥ 90 mobile (A4)
`npm run build && npm start` (porta 3100) → `npx lighthouse http://localhost:3100
--only-categories=performance,accessibility,best-practices --preset=mobile` em `/` e `/feed`.
Corrigir abaixo de 90; registrar scores em `docs/status-design-2026-10-12.md` (seção Lighthouse).

### T6 — Verificação integrada (A5)
`db reset` 2× seguidas (idempotência, sem duplicar seed) → build → start → e2e → Lighthouse →
checklist manual do README. Aceite: nada quebra e nenhum passo manual fica não documentado.

### T7→T13 — Track B e C, na ordem do plano (workflow spec→migration→domínio→aplicação→infra→tela→teste)
- **B1** migration `20261016000009` (+`grant_badge`,`revoke_badge`,`promote_moderator`,
  `demote_moderator`; `target_type` + `profile`) + docs dicionário/moderation §4.
- **B2** 4 use cases de Identity (`GrantVerifiedOrg`, `RevokeVerifiedOrg`, `PromoteModerator`,
  `DemoteModerator`) staff-only + UI nova em `/admin` (busca username, ConfirmDialog) + testes
  unit/e2e. **É o que habilita o "canal oficial" da prefeitura sem SQL.**
- **B3** spec `docs/04-contexts/analytics.md` → migration `20261016000010` (schema `analytics`,
  `daily_metrics`, funções security definer por contexto sem JOIN entre schemas — D7, pg_cron,
  `analytics` no `config.toml` com stop/start documentado) → `recharts` → use case
  `GetTransparencyMetrics` → página `/transparencia` real (substitui o placeholder do spec 08).
- **B4** rate limit por IP: `subject_type`/`subject_id` em `moderation.rate_limits`, backfill,
  sujeito (user|ip) nos ports/repo, IP de `x-forwarded-for` (só atrás de proxy), 30 pub/h por IP
  (ADR-0017); corrigir a afirmação errada em `status-design-2026-10-12.md`.
- **B5** runbook de curadoria de bairros em `docs/03-data/` (só doc).
- **C1** derivas doc↔código: dicionário, README, ADR-0023 (enum de motivos implementado:
  `discurso_odio`, `conteudo_ilegal`, substituindo a lista da ADR-0017).
- **C2** `docs/deploy-checklist.md` (só doc — execução é config, fora daqui).

## Riscos

| Risco | Tratamento |
|---|---|
| e2e flaky (upload, timing) | sem assert de Realtime; waits explícitos; `trace on first retry`; rodar em série |
| Prerender/Cache Components (Next 16) | ler `node_modules/next/dist/docs/` antes de mexer em render; `connection()`/`<Suspense>` |
| Novo schema exige stop/start | procedimento já documentado no README |
| `db reset` recria seed (UUIDs novos) | lookups por slug; nunca fixar UUID de bairro |

## Validação final (DoD do plano de lançamento, seção 8)

`npm run setup` do zero; lint/typecheck/test/build verdes; e2e verde em mobile e desktop;
Lighthouse ≥ 90 nos 3 eixos em `/` e `/feed`; `db reset` 2× idempotente; `/transparencia` com
números conferidos; `/admin` concede/revoga selo e promove/despromove; rate limit por IP testado;
runbook publicado; deploy-checklist escrito.

## Como retomar a máquina

```
docker desktop start
npm run setup --prefix apps/web      # idempotente: stack + db reset + .env.local
npm run dev --prefix apps/web
```
Usuários do seed (12, senha `Cidade@123`); e-mail de confirmação em Mailpit
http://127.0.0.1:54324.

## Notas de execução

- Implementação exige agente code/`@task-executor` (modo plan não executa). Pela tabela do
  AGENTS.md, a família de código recomenda `stepfun/step-3.7-flash:free`.
- Commits somente após "ok, roda" do usuário; mensagens no estilo do repo (prefixo do contexto).
- Ambiente local: PowerShell 5.1 (sem `&&`); arquivos `.cjs` temporários em
  `C:\Users\gusta\AppData\Local\Temp\kilo\` para scripts de escape.
