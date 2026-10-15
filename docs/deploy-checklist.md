# Checklist de deploy (configuração)

> **Escopo:** este documento descreve **o que configurar** para publicar o Minha
> Cidade. A execução do deploy é uma ação de produção — não foi feita durante o
> lançamento local (plano `1791856023122`, C2) e exige contas reais
> (Supabase Cloud, Vercel, domínio).

## 1. Supabase Cloud (banco + Auth + Storage)

1. **Criar o projeto** na Supabase Cloud (região mais próxima do público alvo —
   ex.: `sa-east-1`).
2. **Aplicar as migrations:**
   ```bash
   npx --yes supabase link --project-ref <ref>
   npx --yes supabase db push     # 11 migrations na ordem
   ```
   O seed **não** roda em produção (é dado de desenvolvimento).
3. **Auth:**
   - Site URL e Redirect URLs: `https://<dominio>` (+ `https://<dominio>/auth/callback`).
   - Provedor **Google** (Client ID/Secret do Google Cloud) — é o que habilita o
     login social (ADR-0011). Localmente fica desabilitado.
   - Template de confirmação de e-mail: usar
     `supabase/templates/confirmation.html` (link aponta para `/auth/callback?token_hash=...`).
   - SMTP próprio para e-mails transacionais (o SMTP compartilhado tem limite
     baixo e cai em spam).
4. **Storage:** o bucket `publication-media` é criado pela migration 0003; conferir
   limites (o app impõe 10 MiB e WebP no servidor — Route Handler
   `/api/publications/media`).
5. **pg_cron / pg_net:** agendar o job de analytics (equivale ao
   `analytics-daily-refresh` local):
   ```sql
   select cron.schedule(
     'analytics-daily-refresh',
     '20 3 * * *',
     $cron$ select analytics.refresh_daily_metrics(((now() at time zone 'UTC')::date - 1)) $cron$
   );
   ```

## 2. Vercel (aplicação Next.js)

1. **Repositório conectado**, root directory `apps/web` (é o único workspace com
   `package.json`).
2. **Variáveis de ambiente (Production/Preview):**

   | Variável | Onde vem |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Cloud → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Cloud → chave publishable/anon |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Cloud → chave **secret** (server-only; nunca `NEXT_PUBLIC_`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<dominio>` (links absolutos nos e-mails) |
   | `TRUSTED_PROXY` | `1` — a Vercel sobrescreve `x-forwarded-for`, então o limite por IP (P16/ADR-0017) passa a valer |

3. **Domínio próprio** + redirecionamento www → apex (ou o contrário, um só).
4. **Build/Install:** comandos padrão (`npm run build`); Node 22 (mesma versão do CI).

## 3. Google OAuth (produção)

1. Google Cloud → APIs & Services → **Tela de consentimento** com domínio verificado.
2. **Credenciais OAuth:** origem autorizada `https://<dominio>`; redirect
   `https://<supabase-project>.supabase.co/auth/v1/callback`.
3. Colar Client ID/Secret no painel do Supabase (Authentication → Providers → Google).

## 4. Pós-deploy (verificações, na ordem)

- [ ] `/` carrega e lista o conteúdo publicado (a home é o feed; banco prod vem vazio —
      publicar manualmente para validar).
- [ ] Cadastro com confirmação de e-mail chega (SMTP configurado).
- [ ] Login Google funciona (tela de consentimento aprovada).
- [ ] Publicar com foto (WebP aparece); apoio/comentário/salvar.
- [ ] `/transparencia` vazio até o primeiro job (03:20 UTC) — estado vazio honesto.
- [ ] `/admin` com o primeiro admin: `update identity.profiles set role='admin' where id='<uuid>'`
      pelo SQL Editor (a UI admin não concede admin — só moderador, M5).
- [ ] Rate limit por IP ativo (a Vercel é proxy confiável — `TRUSTED_PROXY=1`).
- [ ] Certificado do domínio emitido e redirect HTTP → HTTPS.
- [ ] `supabase db push` de qualquer migration nova passa a ser passo do
      trabalho — **nunca** editar banco prod à mão sem migration versionada.

## 5. O que **não** está neste deploy

- E-mail/push de notificação (P19 é in-app + Realtime).
- Modo escuro e i18n.
- Analytics Python/Fase 11 (`analytics.snapshots`) — a transparência usa os
  snapshots SQL da Fase 10; o ETL Python, se um dia entrar, é outro projeto.
