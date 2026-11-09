# Plano — Rodar 100% local + lacunas de produto para venda B2G

> **STATUS DE EXECUÇÃO (2026-10-13, pausa):** A1 ✅, A2 ✅, A3 🔄 (suite pronta; faltam
> grant da sequence + re-run). A4/A5/B/C ⬜. **Ler antes de continuar:
> `docs/status-lancamento-2026-10-13.md`** (contexto completo, 2 bugs reais achados
> pelos e2e, próximos passos numerados).

> Gerado em 2026-10-13. Base: análise do repo (`docs/`, migrations, código em `apps/web/src`).
> Decisões do usuário: (1) deploy é configuração — fora do escopo detalhado; (2) produto é
> nacional, a cidade compradora não define arquitetura (cidades são dados de catálogo);
> (3) local usa e-mail/senha — login Google é config de produção; (4) plano cobre execução
> local 100% + lacunas de produto que travam a venda a prefeitura/órgão.

## 1. Situação verificada (evidência)

**Pronto e verde localmente:** Fases 0–8 + PWA + identidade visual (ADR-0022); 184 testes
unitários; lint/typecheck/build verdes; 8 bounded contexts com spec+migration+código.

**Lacunas verificadas no código (não só nos docs):**

| # | Lacuna | Evidência |
|---|---|---|
| L1 | Sem e2e: Playwright não instalado, `tests/e2e/` não existe, CI só roda unit | `package.json` sem `@playwright/test`; `vitest.config.ts` inclui só `src/**/*.test.ts` |
| L2 | Lighthouse ≥ 90 nunca medido em build de produção | só verificação manual de rotas 200 no `next start` (status-design) |
| L3 | `/transparencia` é placeholder sem números | `app/transparencia/page.tsx` — "métricas ainda estão sendo preparadas" |
| L4 | Schema `analytics` não existe (nem no `config.toml`), sem job | migrações vão até `...0008_notification`; `schemas` não lista `analytics` |
| L5 | UI de admin não concede selo nem promove moderador — casos de uso do spec nunca implementados | `identity/application/use-cases.ts` só tem `UpdateMyProfile`/`CloseMyAccount`; `/admin` só tem fila+trilha |
| L6 | `moderation_actions.action` não aceita `grant_badge`/`promote_moderator` | migration `...0007`: `check (action in ('hide','restore','remove','report_resolved'))` |
| L7 | Rate limit só por usuário; `rate_limits` **não** tem `subject_type` (status-design-2026-10-12.md está errado) | migration `...0007`: `user_id not null`, `unique (user_id, scope, window_start)` |
| L8 | Bairros só de Cariacica; outras 5.570 cidades mostram "Bairro não informado" | seed `02-bairros-cariacica.sql`; ADR-0015 |
| L9 | Seed de demo fraco (4 usuários, poucas publicações) | `03-dev-seed.sql` |
| L10 | Setup local manual e cheio de quirks documentados (Docker, keys mudam no reset, `.env.local` gitignored, template de e-mail, schema novo exige stop/start) | README; plano §status |

## 2. Definição de "100% local sem erros" (aceite da Track A)

Partindo de clone novo + Docker rodando, com **um comando de bootstrap**:

1. Stack sobe (`supabase start` + `db reset` + `.env.local` gerado automaticamente).
2. Cadastro com confirmação (Inbucket), login e-mail/senha, publicar com foto, reagir,
   comentar, salvar, amizade, denunciar, moderar em `/admin`, notificações — tudo funciona.
3. `npm run build && npm start` + suíte e2e verde (viewports 375px e 1280px).
4. Lighthouse mobile ≥ 90 em Performance, Acessibilidade e Best Practices em `/` e `/feed`.
5. `db reset` rodado 2× seguidas sem erro e sem duplicar (idempotência).

## 3. Track A — Execução local 100%

### A1. Bootstrap em 1 comando
- Criar `apps/web/scripts/setup-local.mjs`: verifica Docker ativo → `supabase start` →
  lê `supabase status` (anon key, service_role key) → escreve `apps/web/.env.local`
  (gitignored) → `npm install` → imprime próximos passos e URLs (app :3000, Inbucket :54324).
- Script `npm run setup` em `apps/web/package.json`.
- Atualizar README "Como rodar": clone novo = `npm run setup --prefix apps/web` +
  `npm run dev --prefix apps/web`. Registrar os quirks conhecidos (chaves, template de
  e-mail, schema novo) numa seção "problemas conhecidos e soluções".
- **Verificar:** rodar o fluxo completo do zero num clone limpo.
- **Spec/docs:** README (fonte da verdade de setup).

### A2. Seed de demonstração (demo de venda nacional)
- Estender `03-dev-seed.sql` (idempotente, padrão `on conflict`/`not exists` já usado):
  ~12 perfis em ≥3 bairros de Cariacica; ~10 publicações (problema/ideia, algumas anônimas,
  em vários bairros); comentários; reações; amizades aceitas; **1 conta institucional com
  `verified_org`** (ex.: "Prefeitura de Cariacica") escrita via `service_role`
  (`set_config('request.jwt.claim.role','service_role',false)` — padrão já usado no seed);
  4+ denúncias de usuários distintos num alvo para popular a fila do `/admin`.
- Sem mídia no seed (caminho de upload é demonstrado ao vivo).
- **Verificar:** `db reset` 2× sem duplicar; `/admin` mostra a fila; feed variado.

### A3. Suíte e2e Playwright (nunca existiu)
- Instalar `@playwright/test`; `playwright.config.ts` (webServer `next dev`, baseURL
  `localhost:3000`, projetos **mobile 375×667** e **desktop 1280×720**, `trace on-first-retry`).
- Testes em `tests/e2e/` (estrutura já documentada no README), partindo de seed fresco:
  1. cadastro e-mail → confirmação via API do Inbucket (`http://127.0.0.1:54324`) → `/feed`;
  2. login e-mail/senha (usuário do seed);
  3. publicar problema **com foto** (fixture em `tests/e2e/fixtures/`) → aparece no feed;
  4. filtros do feed por bairro/tipo;
  5. reagir (toggle) + comentar + salvar → `/salvos`;
  6. amizade entre dois usuários do seed (solicitar/aceitar/lista pública);
  7. denunciar → entrar como admin do seed → fila com 3+ → ocultar → 404 para terceiro;
  8. escolher cidade/bairro em `/perfil/editar` → perfil público reflete;
  9. **sem erros de console** nas rotas principais (`/`, `/feed`, `/publicacao/{id}`, `/admin`);
  10. `/transparencia` renderiza números (depois de B3).
- Realtime: não assertar tempo real em e2e (flaky) — conta com recarregamento.
- CI: job e2e em `.github/workflows/ci.yml` (Docker service + Supabase local) — recomendado,
  mas pode ser marcado opcional se travar o pipeline.
- **Verificar:** `npx playwright test` verde nos 2 viewports após `db reset` fresco.

### A4. Lighthouse ≥ 90 (mobile, build de produção local)
- `npm run build && npm start` (porta 3100, como já feito no status-design) →
  `npx lighthouse http://localhost:3100 --only-categories=performance,accessibility,best-practices --preset=mobile`
  em `/` e `/feed`.
- Corrigir achados abaixo de 90; registrar scores finais em
  `docs/status-design-2026-10-12.md` (seção "Lighthouse").
- **Aceite:** ≥ 90 nos 3 eixos, nas 2 rotas.

### A5. Verificação integrada "100% local"
- Roteiro final documentado no README: `db reset` do zero → build → start → e2e →
  Lighthouse → clique-a-clique manual (checklist no README ou doc de status).
- **Aceite:** tudo verde sem nenhum passo manual não documentado.

## 4. Track B — Lacunas de produto para a venda (nacional)

> Workflow do repo vale: spec → migration → domínio → aplicação → infra → tela → teste.

### B1. Trilha de moderação com ações institucionais (migration)
- Nova migration `supabase/migrations/20261016000009_moderation_extend_actions.sql`:
  - `action`: + `grant_badge`, `revoke_badge`, `promote_moderator`, `demote_moderator`;
  - `target_type`: + `profile`.
- Atualizar `docs/03-data/dicionario-dados.md` e `docs/04-contexts/moderation.md` §4.

### B2. Identity: concessão de selo e promoção de moderador (use case + UI)
- **Spec:** `docs/04-contexts/identity-access.md` §4 — marcar os 4 casos de uso antes
  "pendentes Fase 7": `GrantVerifiedOrg`, `RevokeVerifiedOrg`, `PromoteModerator`,
  `DemoteModerator`. Eventos `VerifiedOrgGranted/Revoked`, `RoleChanged` (já listados no §5).
- **Domínio/aplicação:** exigir staff (`requireStaff`, padrão do `/admin`); escrita via
  `service_role` (trigger I4/I5 só permite service_role — padrão existente); gravar trilha em
  `moderation_actions` com a ação correspondente (B1); publicar evento no outbox.
  Restrição: só `admin` promove/conc selo; ninguém altera a própria conta (ADR-0017).
- **UI (`/admin`, seção nova, staff-only):** busca por username → cartão do perfil →
  conceder selo (campo nome do órgão) / revogar / promover moderador / despromover;
  `ConfirmDialog` nas ações; mensagem inline de resultado.
- **Testes:** unit com repositório fake (não-staff falha; auto-ação falha; trilha gravada);
  e2e (admin concede selo "Prefeitura de Cariacica" → badge aparece em perfil público e
  publicações; `user` comum recebe 404 em `/admin`).
- **Entrega de valor:** é o que permite o "canal oficial" da prefeitura sem SQL manual.

### B3. Analytics + `/transparencia` com números reais
- **Spec primeiro:** escrever `docs/04-contexts/analytics.md` (template do README).
- **Migration `20261016000010_analytics_create_daily_metrics.sql`:**
  - schema `analytics`; `daily_metrics(day date, city_id bigint, neighborhood_id uuid null,
    publications int, problems int, ideas int, comments int, supports int)`,
    `unique (day, city_id, neighborhood_id)`; RLS: `select` público, sem escrita via API.
  - funções `security definer` **por contexto** (sem JOIN entre schemas — D7):
    `publication.daily_publication_stats(day)`, `engagement.daily_comment_stats(day)`,
    `engagement.daily_reaction_stats(day)`; job `analytics.refresh_daily_metrics(day)` no
    schema analytics unindo por IDs.
  - pg_cron: `cron.schedule('analytics-daily', '15 3 * * *', ...)` (fallback documentado:
    rota admin chamando a função — Vercel Cron; decidir no deploy).
  - `supabase/config.toml`: adicionar `analytics` em `schemas`/`extra_search_path` +
    registrar o procedimento stop/start já documentado.
- **App:** instalar `recharts` (escolha já registrada em D14/ADR-0014); use case
  `GetTransparencyMetrics` (série de 12 meses, filtro por bairro opcional, sem PII);
  página `/transparencia` com linha (publicações por tipo, 12 meses) + barras (top bairros),
  `Skeleton` de carregamento e `EmptyState` honesto se não houver dados.
- **Testes:** unit do use case com repositório fake (range, agregação, vazio); e2e: números
  da página conferem com `select count(*)` no banco do seed.

### B4. Rate limit por IP (escala pública)
- **Migration:** `rate_limits` → `subject_type text not null default 'user'`,
  `subject_id text not null default ''`, `user_id` anulável,
  `unique (subject_type, subject_id, scope, window_start)`; backfill das linhas atuais.
- **Aplicação:** port/repositório passam a receber sujeito (`user` | `ip`); IP extraído de
  `x-forwarded-for`/`x-real-ip` — confiável só atrás do proxy da plataforma; limite
  30 publicações/hora por IP (ADR-0017). Local sem proxy: IP ignorado (documentado).
- **Docs:** `moderation.md` M9 e dicionário; **corrigir a afirmação errada** do
  `status-design-2026-10-12.md` ("rate_limits já suporta subject_type").
- **Testes:** unit da política e do use case com os dois tipos de sujeito.

### B5. Runbook de curadoria de bairros (onboarding nacional)
- Doc em `docs/03-data/` (seção do `catalogo-ibge.md` ou arquivo novo): passo a passo para
 (curar bairros do município comprador — fonte oficial (lei/mapa) → transcrição em
  `supabase/seed/sources/` + SHA-256 em `shared.app_metadata` → seed numerado idempotente →
  validar contagem vs. fonte → conferir G4/G6. Reutiliza o processo da Fase 3 (Cariacica).
- **Sem código.** É o que torna qualquer prefeitura onboardable dado o produto nacional.

### B6. Fora de escopo (registrado, não esquecer)
- Agregação de notificações ("3 pessoas apoiaram") — decisão em aberto do Fase 8, futura.
- Modo escuro (ADR-0022 alternativa 4), eventos (v2), notificação e-mail/push, busca textual.

## 5. Track C — Documentação e deriva

- C1. Corrigir derivas doc↔código: dicionário (`rate_limits`, `moderation_actions`);
  README (4 usuários no seed, não 3; status do rate limit); ADR novo (**0023**) registrando
  o enum de motivos implementado (`discurso_odio`, `conteudo_ilegal`) em substituição à
  lista da ADR-0017 (ADRs são imutáveis — substituição cria ADR novo).
- C2. `docs/deploy-checklist.md` (config-only, **execução fora deste plano**): nome do repo
  no GitHub (recomendo `minha-cidade`), push, Vercel (root `apps/web`, envs), Supabase
  cloud + `db push`, Google OAuth de produção (redirect do domínio), domínio + SPF/DKIM
  (ADR-0011/0019), backup, Lighthouse em produção, smoke pós-deploy.

## 6. Riscos

| Risco | Mitigação |
|---|---|
| pg_cron indisponível no plano Supabase cloud | fallback rota admin/Vercel Cron já previsto em D14 |
| e2e flaky (Realtime, upload, timing) | sem assert de realtime; waits explícitos; `trace on-first-retry` |
| Service_role indevido em seed/admin | padrão existente (`set_config` do claim); revisão de diff |
| Lighthouse<90 por imagem/JS do feed | orçamento de correção em A4 antes de seguir para B |
| `db reset` não idempotente após novo seed | critério de aceite: reset 2× seguidas |

## 7. Perguntas em aberto (não bloqueiam o plano)

1. Nome do repo no GitHub — recomendo `minha-cidade` (só importa no deploy).
2. Domínio de produção — recomendo decidir antes do deploy (link de confirmação + Termos).
3. Quem promove `admin` além do seed? — recomendo manter só seed/SQL e documentar.
4. Métricas de `active_users` em `/transparencia`: recomendo **fora da v1** das métricas
   (contagem de autores distintos por dia, sem PII) — decidir ao escrever a spec (B3).

## 8. Ordem de execução e validação final

**Ordem:** A1 → A2 → A3 → A4 → A5 → B1 → B2 → B3 → B4 → B5 → C1 → C2.

**DoD global (tudo verde antes de encerrar):**
- [ ] `npm run setup` do zero funciona; README confere.
- [ ] `lint`, `typecheck`, `test` (unit) e `build` verdes.
- [ ] `npx playwright test` verde em mobile e desktop.
- [ ] Lighthouse ≥ 90 (3 eixos) em `/` e `/feed`, mobile.
- [ ] `db reset` 2× seguidas: idempotente, seed de demonstração completo.
- [ ] `/transparencia` com números conferidos contra o banco.
- [ ] `/admin` concede/revoga selo e promove/despromove moderador; trilha registra.
- [ ] Rate limit por IP implementado e testado; docs corrigidos.
- [ ] Runbook de curadoria de bairros publicado.
- [ ] `docs/deploy-checklist.md` escrito (execução = config, fora daqui).
