# Plano — Produção sem mock (Minha Cidade)

**Objetivo:** colocar o app em produção no Vercel + Supabase Cloud, sem mock, com todas as lacunas de produto (B2–B5) resolvidas.

**Escopo de decisão do usuário (já respondido):**
- Domínio: subdomínio da Vercel inicialmente (sugestão de domínio para compra futura)
- Cidade de lançamento: todas as cidades (não só Cariacica/ES) → B5 (runbook de curadoria de bairros) é obrigatório
- Supabase: Free tier
- SMTP: Brevo Free (300 e-mails/dia) — SendGrid não tem mais plano grátis (ver docs/deploy-checklist.md §0)
- Google Cloud: já tem projeto
- Vercel: já tem conta
- Escopo: tudo (deploy técnico C2 + lacunas de produto B2–B5)

---

## Fase 0 — Correção pré-produção (bloqueante)

T0.1. Adicionar `grant usage on sequence shared.domain_events_id_seq to service_role` à migration `20261011000003_publication_create_publications.sql` (logo após os revokes). Sem isso, service_role não consegue gravar `domain_events` → HTTP 500 em amizade, denúncia, moderação.
T0.2. Rodar `supabase db reset` localmente e re-rodar suíte e2e (mobile + desktop) até verde.
T0.3. `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` — todos limpos.

---

## Fase 1 — Supabase Cloud

T1.1. Criar projeto na Supabase Cloud (região `sa-east-1`, Free tier).
T1.2. `npx --yes supabase link --project-ref ` na raiz do repo.
T1.3. `npx --yes supabase db push` — aplica as 13 migrations em ordem (não roda seed).
T1.4. Conferir bucket `publication-media` criado pela migration 0003; limite de 10 MiB e WebP já estão no Route Handler `/api/publications/media`.
T1.5. Agendar job `pg_cron` `analytics-daily-refresh` (SQL do deploy-checklist seção 1, item 5).
T1.6. Conceder papel `admin` ao primeiro usuário via SQL Editor: `update identity.profiles set role='admin' where id='<uuid>'`.

---

## Fase 2 — Auth + Email

T2.1. Supabase Auth → Configurar Site URL `https://<subdominio>.vercel.app` e Redirect URL `https://<subdominio>.vercel.app/auth/callback`.
T2.2. Template de confirmação de e-mail: usar `supabase/templates/confirmation.html` (link aponta para `/auth/callback?token_hash=...`).
T2.3. SMTP Brevo: criar conta (free), verificar remetente, gerar SMTP key e configurar no Supabase (Authentication → SMTP Settings: smtp-relay.brevo.com:587).
T2.4. Google OAuth: Google Cloud → Credenciais → origem autorizada `https://<subdominio>.vercel.app`; redirect `https://<projeto>.supabase.co/auth/v1/callback`. Colar Client ID/Secret no Supabase (Auth → Providers → Google).

---

## Fase 3 — Vercel

T3.1. Conectar repositório GitHub na Vercel, root directory `apps/web`.
T3.2. Variáveis de ambiente (Production):
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL do Supabase Cloud
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → chave publishable/anon
- `SUPABASE_SERVICE_ROLE_KEY` → chave secret (server-only)
- `NEXT_PUBLIC_SITE_URL` → `https://<subdominio>.vercel.app`
- `TRUSTED_PROXY` → `1`
T3.3. Build padrão (`npm run build`), Node 22.
T3.4. Deploy automático no push; conferir build verde.

---

## Fase 4 — Pós-deploy (verificações, na ordem)

T4.1. `/` carrega e lista o feed (banco prod começa vazio — publicar manualmente para validar).
T4.2. Cadastro com confirmação de e-mail chega (Brevo).
T4.3. Login Google funciona (tela de consentimento aprovada).
T4.4. Publicar com foto (WebP aparece); apoio/comentário/salvar.
T4.5. `/transparencia` vazio até o primeiro job (03:20 UTC) — estado vazio honesto.
T4.6. `/admin` com o primeiro admin (feito em T1.6); fila de denúncias; ocultar/restaurar/resolver.
T4.7. Rate limit por IP ativo (`TRUSTED_PROXY=1`).
T4.8. Certificado do domínio/Vercel emitido, HTTPS ativo.
T4.9. Lighthouse mobile ≥ 90 (Performance, Acessibilidade, Best Practices) em `/` e `/feed`.

---

## Fase 5 — Lacunas de produto (bloqueam venda B2G)

T5.1 (B2): Migration `moderation_actions.action` + `grant_badge`, `revoke_badge`, `promote_moderator`, `demote_moderator`; `target_type` + `profile`. Docs: `dicionario-dados.md`, `moderation.md` §4.
T5.2 (B2): 4 use cases staff-only (`requireStaff`, escrita service_role, trilha em `moderation_actions`, eventos outbox) + seção em `/admin`: busca username → conceder/revogar selo c/ nome do órgão, promover/despromover moderador (ConfirmDialog). Testes unit + e2e.
T5.3 (B3): Spec `analytics.md` → migration schema `analytics` + `daily_metrics` + funções `security definer` sem JOIN entre schemas → `pg_cron` diário → `analytics` em `supabase/config.toml` → use case `GetTransparencyMetrics` (12 meses, sem PII) → página com gráfico linha + barras + Skeleton/EmptyState → testes unit + e2e (substituir placeholder `08-transparencia.spec.ts`).
T5.4 (B4): Migration `moderation.rate_limits`: `subject_type text default 'user'`, `subject_id text default ''`, `user_id` anulável, unique novo, backfill. Ports/repo/aplicação recebem sujeito (user|ip); IP de `x-forwarded-for`; limite 30 publicações/hora por IP. Corrigir `status-design-2026-10-12.md` que afirma ter `subject_type`.
T5.5 (B5): Runbook de curadoria de bairros: passo a passo para novo município (fonte oficial IBGE → transcrição em `supabase/seed/sources/` + hash em `shared.app_metadata` → seed numerado idempotente → validar contagem). Reutiliza processo da Fase 3.

---

## Fase 6 — Correções derivas doc↔código (C1)

T6.1. Dicionário de dados: `rate_limits` sujeito, `moderation_actions` actions.
T6.2. README: nº usuários do seed, status rate limit.
T6.3. ADR-0023: registro do enum de motivos de denúncia implementado (`discurso_odio`, `conteudo_ilegal`) em substituição à lista da ADR-0017 (ADRs imutáveis).

---

## Custos estimados (MVP)

| Item | Custo | Notas |
|------|-------|-------|
| Supabase Cloud Free | R$ 0 | 500 MB DB, 2 projetos; suficiente para MVP |
| Vercel Hobby | R$ 0 | Build + deploy no subdomínio `vercel.app` |
| Brevo Free | R$ 0 | 300 e-mails/dia; suficiente para confirmações |
| Google Cloud OAuth | R$ 0 | Gratuito para login social |
| Domínio próprio (futuro) | ~R$ 40–60/ano | `.com.br`, opcional — começar no subdomínio |

**Total inicial: R$ 0.** Domínio próprio só quando comprar; nada é cobrado antes disso.

---

## Critério de aceitação

- Build verde no Vercel; app carrega em `https://<subdominio>.vercel.app`
- Cadastro + confirmação de e-mail funcionam (Brevo)
- Login Google funciona
- Publicar/engajamento/moderação sem HTTP 500 (bug da sequence corrigido)
- `/admin` com selo institucional e promoção de moderador funcionando via UI
- `/transparencia` com métricas reais (não placeholder)
- Rate limit por IP ativo
- Lighthouse mobile ≥ 90
- E2e verde em mobile + desktop

---

**Próximo passo:** você confirma que quero começar pela Fase 0 (correção da sequence + validação local) ou quer ajustar algo no plano antes?