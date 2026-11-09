# Checklist de deploy (configuração)

> **Escopo:** este documento descreve **o que configurar** para publicar o Minha
> Cidade. A execução do deploy é uma ação de produção — não foi feita durante o
> lançamento local (plano `1791856023122`, C2) e exige contas reais
> (Supabase Cloud, Vercel, Brevo, Google Cloud).

## 0. Stack 100% gratuita (custo R$ 0)

| Peça | Serviço / plano | Limites do free que importam |
|---|---|---|
| Banco + Auth + Storage + Realtime + pg_cron | Supabase **Free** | 500 MB de banco, 1 GB de storage; **projeto pausa após 7 dias sem uso** (reativa no painel) |
| Hospedagem Next.js | Vercel **Hobby** | uso **não comercial**; ao vender (B2G) migrar para Pro ou outro host |
| Domínio | subdomínio `https://<app>.vercel.app` | sem custo; domínio próprio é opcional (~R$ 40/ano `.com.br`) |
| E-mail transacional (SMTP) | **Brevo Free** | 300 e-mails/dia, remetente verificado por e-mail (não exige domínio próprio) |
| Login social | Google OAuth | gratuito; escopos básicos (`email`, `profile`) não exigem verificação do app |
| CI | GitHub Actions | gratuito em repo público |

> **Não use SendGrid:** o plano gratuito acabou em maio/2025 (hoje é trial de 60 dias).
> Resend também é grátis (3.000/mês), mas exige domínio próprio verificado — só vale
> depois de comprar um domínio. O SMTP embutido do Supabase não serve para produção
> (só envia para membros do time e com limite de poucos e-mails por hora).

## 1. Supabase Cloud (banco + Auth + Storage)

1. **Criar o projeto** na Supabase Cloud (região mais próxima do público alvo —
   ex.: `sa-east-1`).
2. **Aplicar as migrations:**
   ```bash
   npx --yes supabase link --project-ref <ref>
   npx --yes supabase db push     # 13 migrations na ordem
   ```
   `db push` **não** roda seed. Em produção carregar **só os dados de referência**
   (sem eles não há cidade/bairro para publicar):
   ```bash
   psql "<connection string do painel: Connect → Session pooler>" -f supabase/seed/01-ibge-localidades.sql
   psql "<mesma string>" -f supabase/seed/02-bairros-cariacica.sql
   ```
   **Nunca** rodar `03-dev-seed.sql` em produção (cria contas com senha pública).
   Alternativa sem `psql`: colar cada arquivo no SQL Editor (o 01 tem ~500 KB).
3. **Schemas expostos na API** (obrigatório — senão o app dá erro em toda tela):
   Project Settings → Data API → *Exposed schemas* e *Extra search path*: adicionar
   `shared, identity, geography, publication, engagement, social_graph, moderation,
   notification, analytics` (mesma lista de `supabase/config.toml` `[api] schemas`).
4. **Auth:**
   - Site URL e Redirect URLs: `https://<dominio>` (+ `https://<dominio>/auth/callback`).
   - Provedor **Google** (Client ID/Secret do Google Cloud) — é o que habilita o
     login social (ADR-0011). Localmente fica desabilitado.
   - Template de confirmação de e-mail: usar
     `supabase/templates/confirmation.html` (link aponta para `/auth/callback?token_hash=...`).
   - SMTP próprio (Brevo Free): criar conta em brevo.com, verificar o e-mail
     remetente (Senders), gerar uma **SMTP key** e preencher em Authentication →
     SMTP Settings: host `smtp-relay.brevo.com`, porta `587`, usuário = login SMTP
     do Brevo, senha = SMTP key. Sem isso o cadastro não recebe confirmação.
5. **Storage:** o bucket `publication-media` é criado pela migration 0003; conferir
   limites (o app impõe 10 MiB e WebP no servidor — Route Handler
   `/api/publications/media`).
6. **pg_cron:** a migration `20261016000010` já agenda o job `analytics-daily-refresh`.
   Conferir em Integrations → Cron (ou `select * from cron.job;`). Só se não aparecer,
   agendar à mão:
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

3. **Domínio:** usar o `https://<app>.vercel.app` gerado (grátis). Domínio próprio é
   opcional e pago; se comprar, configurar um só host (www → apex ou o contrário).
4. **Build/Install:** comandos padrão (`npm run build`); Node 22 (mesma versão do CI).

## 3. Google OAuth (produção)

1. Google Cloud → APIs & Services → **Tela de consentimento** (tipo externo, escopos
   só `email`/`profile`, publicar como "Em produção" — não exige verificação).
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
