# Status e retomada — Design (2026-10-12)

> Documento de handoff da sessão que executou o plano de design
> (`docs/planos/1791837096489-design-correcao-completude-identidade.md`).
> Escrever aqui o estado real: o que ficou pronto, o que falta e como retomar.

## O que foi feito

### Etapa A — bugs (todos fechados)

| # | Item | Estado |
|---|---|---|
| A1 | classes `text-primary`/`border-primary`/`bg-primary/10` (inexistentes) → tokens `brand-*` | feito |
| A2 | rota `/transparencia` criada (placeholder honesto, sem números inventados) | feito |
| A3 | alvos de toque de 44px nos links do cabeçalho | feito |
| A4 | tipografia mínima de 12px (`text-xs`) | feito |
| A5 | "Salvo (remover)" / "Amigos (desfazer)" sem `variant="danger"` | feito |

### Etapa B — completude do design system

| # | Item | Estado |
|---|---|---|
| B1 | novos componentes: `EmptyState`, `Skeleton`, `ConfirmDialog`, `Select`, `Textarea`, ícones SVG (`icon.tsx`) | feito |
| B2 | aplicados em todo o app: estados vazios e confirmações destrutivas (apagar publicação, encerrar conta, remover conteúdo) | feito |
| B3 | `next/image` + `images.remotePatterns` do Supabase | feito |
| B4 | feed conforme design system: resumo `line-clamp-2`, miniatura só `sm+`, contadores de apoio/oposição/comentários via integração por ID (D7, sem JOIN entre schemas) | feito |
| B5 | perfil público: contadores (amigos, publicações, causas apoiadas) e lista de publicações; publicação anônima só aparece para o dono (P4) | feito |
| B6 | publicar com prévia, remover e progresso por arquivo (XHR) | feito |
| B7 | barra inferior mobile (Feed/Publicar/Avisos/Perfil) com área segura | feito |
| B8 | PWA: `app/manifest.ts`, ícones PNG (script próprio), service worker com cache só de leitura pública | feito |
| B9 | tokens derivados, larguras padronizadas, mensagem de publicação oculta (só para o autor), docs atualizados | feito |

### Etapa C — identidade visual (ADR-0022)

Direção **"praça/municipal"**: concreto frio `#ececea`, papel branco, tinta escura, acento único
verde-garrafa `#1e5b45`, display serifado do sistema nos títulos, raio 8px, sombra-stamp.
Nomes dos tokens preservados — só os valores mudaram.

> Nota: a primeira proposta da direção era "concreto quente + ocre". Foi **descartada** porque o
> detector `avoid-ai-design` marca o par creme + ocre/terracota como SD1 ("Claude look"). A troca
> aconteceu antes de aplicar a paleta; 19 pares de contraste conferidos (mínimo 4.56:1, todos AA).

### Validação

- `npm run lint`, `npm run typecheck`, `npm run test` (**184 testes**, 3 novos em
  `aggregate-counts`) e `npm run build` — tudo verde.
- Detector `avoid-ai-design` (`node .claude/skills/avoid-ai-design/scripts/detect.mjs apps/web/src`):
  **0 achados** (P0/P1/P2).
- Rotas conferidas em `next dev` **e** em `next start` (porta 3100, depois desligado): `/`,
  `/feed`, `/transparencia`, `/termos`, `/publicacao/[id]`, `/perfil/{username}`, `/login`,
  `/manifest.webmanifest` — todas 200.

### Arquivos que valem conhecer ao retomar

- `apps/web/src/app/globals.css` — tokens da identidade (`@theme`).
- `apps/web/src/shared/ui/` — componentes novos (`empty-state`, `skeleton`, `confirm-dialog`,
  `select`, `text-area`, `icon`, `pwa/register-sw`).
- `apps/web/scripts/generate-pwa-icons.mjs` — gera os ícones; **trocar a paleta exige regerar**
  (`node apps/web/scripts/generate-pwa-icons.mjs`) e copiar `icon-512`/`icon-192` para
  `src/app/icon.png` e `src/app/apple-icon.png`.
- `docs/02-design/adr/0022-identidade-visual-praca-municipal.md` — a decisão de identidade.

## O que falta

### Bloqueador de critério de aceite

1. ~~**Lighthouse ≥ 90 (Performance, Acessibilidade, Boas Práticas)**~~ — **fechado em
   2026-10-13** no lançamento local (plano `1791856023122`, A4). Medido sobre build de produção
   (`npm start`, porta 3100), mobile, Lighthouse headless:

   | Rota | Performance | Acessibilidade | Boas Práticas |
   |---|---|---|---|
   | `/` | 99 | 100 | 100 |
   | `/feed` | 95 | 100 | 100 |

    Dois ajustes foram necessários no `/feed`: (a) os formatos `Intl` do `RelativeTime` são
    criados por card — hoistados para singleton do módulo (hidratação com dezenas de cards);
    (b) o link do avatar do autor não tinha nome acessível (quando o autor não tem foto) —
    acrescentado `aria-label="Perfil de {nome}"`.

2. ~~**Lighthouse ≥ 90 na home após a mudança de rota**~~ — **fechado em 2026-10-15**
   (plano `1792036500000`). A home passou a ser o feed (a landing de `/` foi removida e
   `/feed` redireciona para `/`). Medido sobre build de produção (`npm start`, porta 3100),
   mobile (375×667, `--throttlingMethod=simulate`), Lighthouse headless:

    | Rota | Performance | Acessibilidade | Boas Práticas |
    |---|---|---|---|
    | `/` (agora o feed) | 92 | 100 | 100 |

    A rota `/` deixou de ser estática (`○`) e virou dinâmica (`ƒ`); a medição confirma que
    o SSR do feed sustenta os três eixos ≥ 90.

### Fases do plano de reescrita (pendentes)

2. **Fase 10 — analytics/transparência**: schema `analytics`, migration `daily_metrics`, job
   pg_cron e a página `/transparencia` com números reais (hoje é placeholder honesto).
3. **Fase 11 — repo Python de analytics**: ETL + notebooks + dashboard (ADR-0014).
4. **Fase 12 — deploy**: Vercel + domínio próprio + remote do GitHub.

### Itens menores de produto (decididos, não implementados)

5. ~~**Rate limit por IP** (P18)~~ — **implementado em 2026-10-13** (plano de
   lançamento, B4). Correção de uma afirmação errada que existia aqui: a tabela
   `moderation.rate_limits` **não** tinha `subject_type`/`subject_id` — o banco
   só tinha `user_id`. A migration `20261016000011` acrescentou os dois campos
   (com backfill das linhas existentes), e `EnforceRateLimit` passou a aplicar o
   teto de 30 publicações/hora por IP. O IP só é lido de `x-forwarded-for`/
   `x-real-ip` quando `TRUSTED_PROXY=1` (ADR-0017) — em dev/local o teto por IP
   fica desligado.
6. **Agregação de notificações** (decisão em aberto): "3 pessoas apoiaram" em vez de uma
   notificação por interação — mexe no payload de `notification.notifications`.
7. **Seed de conteúdo por bairro**: hoje o seed tem 3 usuários e 6 publicações; o risco
   "ninguém usa sem conteúdo inicial" pede publicações de exemplo em mais bairros.
8. **Modo escuro**: fora de escopo, mas não registrado no design system.

### Decisões de produto ainda em aberto (da varredura inicial)

9. Nome do repositório no GitHub (`minha-cidade` vs `minha-cidade-web`).
10. Domínio de produção (aparece no link de confirmação de e-mail e nos termos).

## Como retomar amanhã

```powershell
# 1. subir a stack de dados (Docker Desktop precisa estar rodando)
docker desktop start          # ou abrir o Docker Desktop
npx supabase start            # APIs em http://127.0.0.1:54321

# 2. subir o app
npm run dev --prefix apps/web  # http://localhost:3000

# 3. validar antes de qualquer commit
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run test --prefix apps/web
npm run build --prefix apps/web
```

Login de teste (seed, e-mail já confirmado): `ana@minhacidade.dev` / `Cidade@123`.

Se paleta ou identidade mudar de novo: ajustar `globals.css`, regerar os ícones
(`node apps/web/scripts/generate-pwa-icons.mjs`) e atualizar `theme_color`/`background_color`
em `app/manifest.ts` e `viewport` em `app/layout.tsx`.
