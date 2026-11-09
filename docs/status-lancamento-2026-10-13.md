# Status — Lançamento local + B2G (handoff de retomada)

> Escrito em 2026-10-13 ao pausar a execução do plano
> `docs/planos/1791856023122-lancamento-local-e-b2g.md`.
> **Objetivo da sessão que retomar:** terminar o plano, na ordem A→B→C.
> Este documento é a fonte da verdade do andamento; o plano segue sendo o contrato.

## 1. Contexto da missão (uma leitura só)

Usuário vende o produto para prefeitura/órgão (B2G). Deploy é **só configuração**
(repositório remoto, Vercel, Supabase cloud, OAuth de produção, domínio) — **fora do
escopo de execução**, fica como checklist (C2). O foco é:

1. **Rodar local 100% sem erros** (clone novo → 1 comando → tudo funciona, incluindo
   console limpo do navegador e e2e).
2. **Fechar as lacunas de produto que travam a venda**: UI de concessão do selo
   institucional e promoção de moderador (hoje inexistentes — só existem no papel da
   spec), `/transparencia` com números reais, rate limit por IP, runbook de curadoria
   de bairros de novo município (produto é nacional; só Cariacica/ES tem bairros).

Decisões já tomadas com o usuário (não reabrir):
- Local usa **e-mail/senha**; login Google é config de produção.
- A cidade compradora não define arquitetura (cidades são dados).
- O plano cobre as duas frentes: execução local 100% + lacunas de produto.

## 2. Ambiente (fatos que economizam tempo)

| Item | Valor / observação |
|---|---|
| Stack local | Docker Desktop (precisa estar rodando); `supabase start` na raiz |
| CLI Supabase | **NÃO está no PATH** — usar `npx --yes supabase ...` (script de setup resolve sozinho) |
| Container Postgres | `supabase_db_minha-cidade` (`docker exec ... psql -U postgres -d postgres`) |
| App | http://localhost:3000 (`npm run dev` em `apps/web/`) |
| E-mail de confirmação | **Mailpit** em http://127.0.0.1:54324 (NÃO é Inbucket): `GET /api/v1/search?query=to:<email>`, `GET /api/v1/message/{id}` → campo `HTML` |
| Chaves | CLI 2.120.0 imprime formato novo (`sb_publishable_...`/`sb_secret_...`); ambas funcionam em REST/Auth/Admin local (testado). O script de setup extrai os dois formatos |
| Senha do seed | `Cidade@123` para todos os 12 usuários |
| PowerShell 5.1 | sem `&&`; cuidado com escape inline — use arquivos `.cjs` temporários em `C:\Users\gusta\AppData\Local\Temp\kilo\` (há vários de exemplo lá) |
| Testes unitários | `npm test` em `apps/web` — **184 verdes na última execução** (após todas as mudanças da A3: writers de evento, connection(), RelativeTime, bio getter) |
| Next.js | 16.4.0 com **Cache Components** ativos; ler `node_modules/next/dist/docs/` antes de mexer em render (regra do AGENTS.md) |

## 3. Andamento por task do plano

### A1 — Bootstrap em 1 comando — ✅ CONCLUÍDA e verificada
- `apps/web/scripts/setup-local.mjs`: checa Docker → sobe stack (`npx supabase start`)
  → `db reset` se banco não migrado → gera `apps/web/.env.local` a partir de
  `supabase status` → `npm install` se preciso → imprime URLs e usuários.
- Idempotente (verificado). Fallbacks: CLI via npx; chaves novo/legado.
- `apps/web/package.json`: script `"setup": "node --no-deprecation scripts/setup-local.mjs"`.
- README reescrito: caminho rápido, tabela de problemas conhecidos, tabela de 4+ usuários.
- Armadilhas já resolvidas no script: `shell:true` quebrava o SQL com espaços (docker
  exec); parsing da tabela `│` (U+2502) da CLI nova; checagem de idempotência via
  `information_schema.tables`.

### A2 — Seed de demonstração — ✅ CONCLUÍDA e verificada (`db reset` aplicado)
- `supabase/seed/03-dev-seed.sql` reescerto: **12 usuários** (4 originais + `elena-matos`,
  `fabio-neres`, `graca-lima`, `heitor-batista`, `iris-veiga`, `joao-paiva`,
  `prefeitura-cariacica` (**selo institucional** via service_role no update),
  `marco-andrade` (moderador)); 12 publicações em 7 bairros (1 do canal oficial com
  recapeamento); 16 reações, 8 comentários, 5 salvamentos, 7 amizades, 4 denúncias no
  alvo da fila + 2 abaixo do limite (P21).
- `full_name` da conta institucional = "Prefeitura de Cariacica" (username
  `prefeitura-cariacica` — username é imutável, I2).

### A3 — Suíte e2e Playwright — 🔄 EM ANDAMENTO (parte pronta, bugs achados e corrigidos)
**Pronto:**
- `@playwright/test` instalado (devDep) + Chromium instalado (`npx playwright install chromium`).
- `apps/web/playwright.config.ts`: projetos **mobile 375×667** e **desktop 1280×720**,
  `workers: 1`, `fullyParallel: false`, webServer `npm run dev` (reusa servidor ativo),
  trace on-first-retry.
- `apps/web/tests/e2e/`: `helpers.ts` (signUpFreshUser com confirmação via Mailpit,
  signIn/signOut `exact:true`, publish, chooseLocation, collectPageErrors),
  `fixtures/foto.png` (PNG 16×16, CRC corrigido), specs `01-cadastro-login`,
  `02-publicar`, `03-feed`, `04-engajamento`, `05-amizade`, `06-moderacao`,
  `07-perfil`, `08-transparencia` (placeholder honesto até B3), `09-console`, `10-layout`.
- Scripts: `test:e2e` e `test:e2e:ui`.

**DOIS BUGS REAIS DO PRODUTO achados pelos e2e (a razão da track A existir):**

**BUG 1 — eventos de domínio nunca eram gravados / quebravam ações (CORRIGIDO, falta validar):**
`shared.domain_events` é service_role-only por design (`revoke all ... from anon,
authenticated` na migration `...0011_0003`), mas os **5 escritores** usavam o cliente do
usuário. Efeitos: amigos (enviar/aceitar/cancelar) e denúncia/ocultar moderação davam
**HTTP 500**; publicação/engajamento falhavam silenciosamente (notificações nunca
materializavam; `select count(*) from shared.domain_events` era 0).
Correção aplicada nos 5 pontos (usar `createServiceRoleClient()`):
- `apps/web/src/contexts/publication/infrastructure/supabase/publication-repository.ts` (create + softDelete)
- `apps/web/src/contexts/engagement/infrastructure/supabase/engagement-repository.ts`
- `apps/web/src/contexts/social-graph/infrastructure/supabase/friendship-repository.ts`
- `apps/web/src/contexts/moderation/infrastructure/supabase/moderation-repository.ts`
- ⚠️ **AINDA FALHA**: `permission denied for sequence domain_events_id_seq` — falta o
  grant de USAGE na sequence para service_role.

**PRÓXIMO PASSO #1 (5 minutos, fazer primeiro ao retomar):**
```sql
-- supabase/migrations/20261011000003_publication_create_publications.sql,
-- logo após as linhas do "revoke all on sequence shared.domain_events_id_seq ...":
grant usage on sequence shared.domain_events_id_seq to service_role;
```
(Editar a migration existente é seguro: **não existe banco em nuvem** — nunca houve
deploy; alternativa seria migration nova `20261016000009_...`.) Depois:
`npx --yes supabase db reset` e re-rodar a suíte.

**BUG 2 — `Date.now()` durante o prerender (Next 16 Cache Components):**
- `site-header.tsx`: adicionado `await connection()` antes de ler a sessão (guia
  "authentication-with-cache-components").
- `app/feed/page.tsx`: `timeAgo()` com `Date.now()` removido → novo componente cliente
  `apps/web/src/shared/ui/relative-time.tsx` ( SSR entre data absoluta, cliente troca
  pelo relativo).
- `app/perfil/editar/page.tsx`: `profile.toPublicView(new Date()).bio` →
  `profile.bio` (getter novo adicionado em `contexts/identity/domain/profile.ts`).
- ⚠️ **NÃO VERIFICADO** se ainda resta erro de prerender em `/perfil/[username]`
  (o erro aparecia com fetch falhando c/ a mensagem do prerender). Após as correções,
  re-testar; se persistir, investigar `publicacao/[id]/page.tsx:112`
  (`?? new Date()` — lazy, **não** deveria ser o causador) e aplicar `await connection()`
  na página ou envolver a leitura em `<Suspense>`.

**Estado da suíte na última execução parcial (desktop):** 17 passed / 9 failed — todas as
falhas têm causa conhecida e as correções acima já foram aplicadas mas **não re-validadas**.
Falta: `npx playwright test` verde nos DOIS projetos; job e2e no CI
(`.github/workflows/ci.yml`, Docker + `npx --yes supabase db reset`, `npx playwright
install --with-deps chromium`) — recomendado, pode ser marcado opcional se travar.

### A4 — Lighthouse ≥ 90 (mobile) — ⬜ NÃO INICIADA
`npm run build && npm start` (porta 3100) → `npx lighthouse http://localhost:3100
--only-categories=performance,accessibility,best-practices --preset=mobile` em `/` e
`/feed`. Corrigir achados < 90; registrar scores em `docs/status-design-2026-10-12.md`.

### A5 — Verificação integrada — ⬜ NÃO INICIADA
`db reset` do zero ×2 (idempotência) → build → start → e2e → Lighthouse → checklist
manual no README. Aceite: nada quebra, nenhum passo manual não documentado.

### B1 — Moderation trail: badge/promoção — ⬜ NÃO INICIADA
Migration nova: `moderation_actions.action` + `grant_badge`,`revoke_badge`,
`promote_moderator`,`demote_moderator`; `target_type` + `profile`. Docs:
`docs/03-data/dicionario-dados.md` e `docs/04-contexts/moderation.md` §4.

### B2 — Identity: selo + promoção (use case + UI) — ⬜ NÃO INICIADA
Spec `docs/04-contexts/identity-access.md` §4. Hoje `identity/application/use-cases.ts`
só tem `UpdateMyProfile`/`CloseMyAccount`. Implementar 4 use cases (staff-only via
`requireStaff`, escrita service_role, trilha em `moderation_actions` com B1, eventos no
outbox) + seção nova em `/admin` (busca username → conceder selo c/ nome do órgão,
revogar, promover/despromover moderador; ConfirmDialog). Testes unit + e2e. Isso é o que
permite "canal oficial" da prefeitura sem SQL.

### B3 — Analytics + `/transparencia` real — ⬜ NÃO INICIADA (maior task)
Spec `docs/04-contexts/analytics.md` primeiro → migration (schema `analytics`,
`daily_metrics(day, city_id, neighborhood_id, publications, problems, ideas, comments,
supports)`, funções `security definer` POR contexto sem JOIN entre schemas (D7),
job `pg_cron` diário; fallback rota admin documentado) → adicionar `analytics` em
`supabase/config.toml` (`schemas` + `extra_search_path`, com o stop/start documentado)
→ instalar `recharts` → use case `GetTransparencyMetrics` (12 meses, sem PII) → página
com gráfico de linha + barras + `Skeleton`/`EmptyState` → testes unit + e2e
(substituir o placeholder do `08-transparencia.spec.ts`).

### B4 — Rate limit por IP — ⬜ NÃO INICIADA
`moderation.rate_limits` hoje é só `user_id` (**status-design-2026-10-12.md afirma
errado que suporta `subject_type`** — corrigir o doc). Migration: `subject_type text
default 'user'`, `subject_id text default ''`, `user_id` anulável, unique novo, backfill.
Ports/repo/aplicação recebem sujeito (user|ip); IP de `x-forwarded-for` (só confiável
atrás do proxy); local sem proxy → IP ignorado (documentar). Limite 30 publicações/hora
por IP (ADR-0017).

### B5 — Runbook de curadoria de bairros — ⬜ NÃO INICIADA (só doc)
`docs/03-data/`: passo a passo para curar bairros de um novo município comprador (fonte
oficial → transcrição em `supabase/seed/sources/` + hash em `shared.app_metadata` →
seed numerado idempotente → validar contagem). Reutiliza o processo da Fase 3.

### C1 — Corrigir derivas doc↔código — ⬜ NÃO INICIADA
dicionário (`rate_limits` sujeito, `moderation_actions` actions), README (nº usuários
seed, status rate limit), **ADR-0023** registrando o enum de motivos implementado
(`discurso_odio`, `conteudo_ilegal`) em substituição à lista da ADR-0017 (ADRs imutáveis).

### C2 — `docs/deploy-checklist.md` — ⬜ NÃO INICIADA (só doc, config-only)
Repo GitHub (recomendo nome `minha-cidade`), push, Vercel (root `apps/web`, envs),
Supabase cloud + `db push`, OAuth Google produção, domínio + SPF/DKIM, backup,
Lighthouse em produção, smoke pós-deploy. **Não executar** — deploy é configuração.

## 4. Lacunas encontradas FORA do plano (decidir depois, não implementar por conta)

1. **Feed não tem UI de filtros** — filtros cidade/bairro/tipo funcionam só por query
   string (`/feed?cidade=3201308&tipo=idea`). PRD §4/README prometem filtros; numa demo
   B2G isso aparece. E2E testa via URL (contrato funcional coberto por unit do ListFeed).
2. **Selo institucional aparece só na página do perfil**, não no card do feed nem na
   página da publicação (P13 é o carro-chefe da venda B2G — aparece pouco).
3. **`perfil/[username]` talvez ainda gere erro de prerender** (ver BUG 2 — re-testar).

## 5. Sequência exata para retomar

```
1. (grant usage na sequence — item 3, PRÓXIMO PASSO #1) → npx --yes supabase db reset
2. npx playwright test   (apps/web) até verde em mobile E desktop
3. npm test / npm run typecheck / npm run lint / npm run build  (regressão das mudanças)
4. Job e2e no CI (opcional)
5. A4 Lighthouse → A5 verificação integrada
6. B1 → B2 → B3 → B4 → B5 → C1 → C2 (ordem do plano; workflow spec→migration→
   domínio→aplicação→infra→tela→teste em cada uma)
7. Ao concluir: rodar o DoD global do plano (seção 8 do plano) e reportar
```

## 6. Estado da máquina ao pausar

- Docker Desktop: rodando (stack local ativa, banco migrado com seed atual).
- Dev server: ativo em background (`npm run dev`, :3000) — reusado pelo Playwright.
- Nada commitado; working tree com as mudanças descritas acima.
- PC será desligado: ao voltar, `docker desktop start` + `npm run setup --prefix apps/web`
  (idempotente) + `npm run dev --prefix apps/web` e seguir a seção 5.

## 7. Estado de verificação ao pausar

- `npm run typecheck` (apps/web): **limpo** com todas as mudanças.
- `npm test` (unit): **184/184 verdes**.
- `npx playwright test`: **ainda com falhas** (bloqueado no grant da sequence — passo #1).
- Nenhum commit feito; working tree com: script de setup, seed expandido, config+specs+e2e,
  fixture, correções dos 5 escritores de evento, `connection()` no header, RelativeTime,
  getter `bio`, README, este doc e o banner de status no plano.
