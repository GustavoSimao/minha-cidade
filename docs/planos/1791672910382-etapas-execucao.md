# Plano completo de execução — Minha Cidade (atualizado 2026-10-11)

Fonte da verdade geral: `docs/plano-reescrita-ddd.md` (decisões D1–D15, fases 0–12).
Este arquivo organiza **todo o trabalho restante** em etapas executáveis, na ordem de
dependência. As Fases 0–4 já foram implementadas (ver situação abaixo).

## Situação em 2026-10-11

| Item | Situação |
|---|---|
| Fases 0–2 | concluídas (fundação, documentos, Identity & Access) |
| Fase 3 (Geography) | **concluída** — spec, migration `20261011000002_geography_*`, seeds IBGE (5.571 municípios) + 100 bairros de Cariacica (fonte oficial LC 171/2025), domínio, APIs `/api/geography/*`, seletor em cascata |
| Fase 4 (Publication + feed) | **concluída** — spec, migration `20261011000003_publication_*`, domínio, `/publicar`, `/feed` paginado, `/publicacao/{id}`, upload WebP com magic bytes, outbox `shared.domain_events` |
| Git | 4 commits **locais** em `main` (nada enviado ao GitHub): `fc3efd5` commit inicial, `100b531` cliente Supabase compartilhado, `50a819d` Geography, `9014847` Publication |
| Migrations aplicadas | **nenhuma ainda** — as 3 migrations existem em `supabase/migrations/` mas nunca rodaram |
| Banco usado | nenhum — não existe `.env.local`, projeto Supabase na nuvem não foi criado |
| Testes | 87 verdes (domínio + casos de uso); lint/typecheck/build verdes |

**Regra de commits a partir de agora (pedido do usuário):** nada de commit novo até o
projeto rodar localmente com verificação do usuário. As mudanças das próximas etapas
ficam na árvore de trabalho; o commit único (ou por fase) acontece depois do "ok, roda".
Os 4 commits locais existentes são **mantidos** (decisão do usuário em 2026-10-11) e
**nada sobe para o GitHub ou outras plataformas** até ele autorizar.

---

# BLOCO A — Rodar localmente (antes de qualquer fase nova)

**Resposta direta à pergunta "Supabase precisa ser agora?": não — e você escolheu o
caminho local com Docker.** O projeto tem `supabase/config.toml` completo (Postgres 17,
Auth, Storage, Studio, Inbucket). Com o **Supabase CLI + Docker** sobe uma stack local
equivalente e **eu aplico as migrations e os seeds** via `supabase db reset`. O projeto
na nuvem só é necessário no deploy (Vercel) e para testar o login do Google — e-mail/senha
cobre tudo localmente.

## Etapa 1 — Subir o stack local e validar ponta a ponta

- [ ] **Verificar pré-requisitos:** Docker Desktop rodando (`docker info`) e Supabase CLI
  instalada (`supabase --version`; se faltar: `scoop install supabase` ou baixar do
  release no GitHub — o CLI é um binário único, sem instalação).
- [ ] **Corrigir a ordem dos seeds (bug encontrado):** `supabase db reset` executa os
  `.sql` de `supabase/seed/` em ordem alfabética — `bairros-cariacica.sql` rodaria
  **antes** de `ibge-localidades.sql` e falharia na FK (a cidade Cariacica ainda não
  existe). Renomear para `01-ibge-localidades.sql` e `02-bairros-cariacica.sql`, ajustar
  `gerar-ibge.ps1` (caminho de saída) e o `README.md` dos seeds.
- [ ] **Subir o stack:** `supabase start` (na raiz do repo). Anotar a saída: API URL
  (`http://127.0.0.1:54321`), `anon key`, `service_role key`, Inbucket (`:54324`).
- [ ] **Aplicar migrations + seeds:** `supabase db reset` (aplica as 3 migrations na
  ordem e depois os seeds; idempotente — pode rodar quantas vezes quiser).
- [ ] **Conferir no banco local** (queries no final de cada seed):
  - `select count(*) from geography.cities;` → 5571
  - `select count(*) from geography.neighborhoods where city_id = 3201308;` → 100
  - `select count(*) from publication.publications;` → 0
  - schemas `shared`, `identity`, `geography`, `publication` presentes.
- [ ] **Criar `apps/web/.env.local`** (gitignored) com as chaves locais:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (local), `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- [ ] **Smoke test manual (você faz, eu ajudo no que der):**
  1. `npm run dev --prefix apps/web` e abrir `http://localhost:3000`.
  2. Cadastrar com e-mail/senha em `/cadastro` (aceite dos termos marcado).
  3. Abrir o Inbucket (`http://127.0.0.1:54324`), confirmar o e-mail (dispara o trigger
     que cria `identity.profiles`).
  4. Em `/perfil/editar`: escolher Cariacica → bairro (a cascata busca na API IBGE em
     memória) e salvar.
  5. Em `/publicar`: criar um problema com foto no bairro; conferir no `/feed` e em
     `/publicacao/{id}` (editar e apagar a própria publicação).
  6. Rodar `supabase db reset` de novo e confirmar que tudo volta ao estado limpo.
- [ ] **Registrar o passo a passo** no README (seção "Como rodar local" com os comandos
  do CLI e o Inbucket) — hoje o README só descreve o caminho com projeto na nuvem.

**Bloqueadores conhecidos desta etapa (tratar se aparecerem):**
- `extensions.unaccent` — usado por `identity.slugify`/`geography.slugify`; disponível
  na imagem local. Se faltar, criar `create extension if not exists unaccent;` na
  migration de Geography antes das funções.
- Google OAuth local exige Client ID/Secret próprios; sem eles, usar e-mail/senha.
- Storage local: os buckets `avatars`, `covers` e `publication-media` precisam existir —
  a migration da Fase 2 NÃO cria buckets (ação manual no painel/local). Criar via
  Studio (`http://127.0.0.1:54323`) ou `supabase storage` — **tarefa nova** encontrada
  aqui: acrescentar `insert into storage.buckets ...` em uma migration para os 3 buckets.

---

# BLOCO B — Fases 5 a 12 (uma bounded context por fase)

Ordem obrigatória em cada fase (D4): **spec → migration → domínio → aplicação →
infraestrutura → tela → teste → docs**. Ao fim de cada fase: os 4 comandos de validação
(`lint`, `typecheck`, `test`, `build` em `apps/web`), tela conferida em 375px e 1280px, e
atualização do dicionário de dados + status em `docs/04-contexts/README.md` e
`docs/plano-reescrita-ddd.md`.

## Etapa 2 — Fase 5: Engagement (reações, comentários, salvamentos)

- [ ] Spec `docs/04-contexts/engagement.md`. Decisões a fixar (P10/P14/P15): reação com o
  mesmo tipo remove, com o outro troca; comentário anônimo opcional, editável só nos
  primeiros 15 minutos; exclusão de publicação some com reações/comentários (cascade);
  salvamento é privado (só o dono vê).
- [ ] Migration `engagement`: `reactions` (`unique (user_id, publication_id)`),
  `comments` (`content` 2–2.000, `is_anonymous`, `edited_at`, `hidden_at`), `bookmarks`
  (`unique (user_id, publication_id)`); RLS: leitura pública de reações/comentários,
  bookmarks só do dono; escrita só autenticado dono; moderação só `service_role`.
- [ ] Domínio: `Reaction` (apoio/oposição, toggle), `Comment`, `Bookmark` + invariantes
  (reações em publicação apagada/oculta são rejeitadas; comentário em publicação própria
  permitido).
- [ ] Aplicação: `ToggleReaction`, `AddComment`, `EditMyComment`, `DeleteMyComment`,
  `SavePublication`, `UnsavePublication`, `ListComments` (paginado), contadores da
  publicação (apoios/oposições/comentários) — casos de uso no servidor (D8).
- [ ] Infraestrutura: repositórios Supabase + **contadores derivados** (nada de contador
  em coluna — ler com agregação coerente com P8).
- [ ] Interface: botões apoio/oposição e contadores em `/publicacao/{id}`; lista de
  comentários com formulário; botão salvar; **Realtime** (`supabase-js` no cliente — D8
  permite Realtime) atualizando contadores e novos comentários.
- [ ] Integração: eventos `publication.supported`, `comment.added` no outbox (já existe
  `shared.domain_events`).
- [ ] Testes: toggle em dois clientes (remoção/troca), unicidade por constraint,
  comentar em publicação apagada falha, bookmark invisível para terceiros, edição após
  15 min rejeitada.
- [ ] Validação: 375px/1280px; lint/typecheck/test/build.

## Etapa 3 — Fase 6: Social Graph (amizades)

- [ ] Decisão a fixar antes (já mapeada): anti-duplicata A↔B — **sentinela ordenada**
  (`user_low < user_high` com `check` e `unique (user_low, user_high)`; recomendado —
  simples e portável) vs. índice em expressão.
- [ ] Spec `social-graph.md`: estados `none|pending_sent|pending_received|friends`;
  ações enviar / cancelar (apaga) / aceitar / recusar (apaga) / desfazer (`removed`) —
  Apêndice A preserva o comportamento validado; sem bloqueio de usuário.
- [ ] Migration `social_graph.friendships` com a constraint escolhida; RLS: lista de
  amigos pública; escrita só dos envolvidos; pedido não é editável pelo destinatário
  (só aceitar/recusar).
- [ ] Domínio: `Friendship` (transições de estado) + eventos `friend.requested`,
  `friend.accepted`, `friend.removed`.
- [ ] Aplicação: `SendFriendRequest`, `CancelFriendRequest`, `AcceptFriendRequest`,
  `RejectFriendRequest`, `Unfriend`, `ListFriends`, `ListPendingRequests`.
- [ ] Interface: botão de amizade no perfil público (`/perfil/{username}`), lista de
  amigos no perfil, aba de solicitações (como aceitar/recusar em `useOptimistic`).
- [ ] Testes: duplicata nos dois sentidos barrada; fluxo completo; não envolve terceiros.
- [ ] Validação: e2e mobile (Playwright entra na Fase 9; aqui, manual em 375px).

## Etapa 4 — Fase 7: Moderação, rate limit e admin mínimo

- [ ] Spec `moderation.md`. Decisões a fixar: limiar da fila por volume (**inicial: 3+
  denúncias** — P21); conteúdo denunciado segue visível até ação (P21/P10); denúncia só
  de autenticado com e-mail confirmado (P17); limites iniciais **5 publicações/hora,
  20/dia, 20 comentários/hora, 10 denúncias/dia por usuário; 30 publicações/hora por IP**
  (P16).
- [ ] Migration `moderation`: `reports` (`reason` enum `spam|conteudo_inapropriado|
  informacao_falsa|assedio|outro`; `status` `pending|resolved|rejected`; `unique
  (reporter_id, reportable_type, reportable_id)`), `moderation_actions` (trilha de toda
  ação — P18), `rate_limits` (`subject_type`, `subject_id`, `action`, `window_start`,
  `count`).
- [ ] RLS: fila de denúncias e ações só `admin`/`moderator` (via `identity.profiles.role`);
  denúncia: insert só autenticado (a checagem de e-mail confirmado é da aplicação).
- [ ] Domínio: `Report`, `ModerationAction`, `RateLimit` + invariantes (sem
  auto-denúncia; ninguém modera a própria conta — P18).
- [ ] Aplicação: `ReportContent`, `ListModerationQueue` (ordenada por volume),
  `HidePublication`, `RestorePublication`, `RemovePublication`, `ResolveReport`,
  `RejectReport`; **rate limiting na camada de aplicação** aplicado aos casos de uso de
  `publication`/`engagement` (P16) — ganchos nas portas já existentes.
- [ ] Interface: formulário de denúncia em `/publicacao/{id}`; `/admin` com fila,
  ações de ocultar/restaurar (moderador) e remover + promover papel + conceder selo
  (admin — P18, integra com `identity`).
- [ ] Testes: abuso além do limite bloqueado; RLS esconde a fila de não-staff; ação de
  moderação registra trilho; ocultar some do feed e é reversível.
- [ ] Validação: 375px/1280px; lint/typecheck/test/build.

## Etapa 5 — Fase 8: Notification (mínimo viável)

- [ ] Spec `notification.md`. Decisão a fixar: agregação de notificações similares
  ("3 pessoas apoiaram sua publicação" — **inicial: agregar por tipo+alvo nas últimas
  24h**).
- [ ] Migration `notification.notifications` (`user_id`, `type` `friend_requested|
  friend_accepted|publication_supported|comment_added|moderation|system`, `payload`
  jsonb, `read_at`); RLS: leitura/update de `read_at` só do dono.
- [ ] Aplicação/consumo do outbox: consumir `shared.domain_events` (publication,
  engagement, social_graph) e materializar notificações — job interno ou trigger
  simples (definir na spec).
- [ ] Interface: sininho com contagem de não lidas + lista; **Realtime** para chegar sem
  recarregar (P19).
- [ ] Testes: notificação chega em tempo real; leitura só pelo dono; agregação
  funcionando.
- [ ] Validação: 375px/1280px; lint/typecheck/test/build.

## Etapa 6 — Fase 9: PWA, performance e acessibilidade

- [ ] Manifest + ícones (192/512 + maskable) + service worker: cache do shell e das
  últimas publicações lidas (leitura offline); versionamento de cache com aviso de
  "novo conteúdo disponível".
- [ ] Orçamento de performance: Server Components por padrão; `next/image` nas telas
  novas; mídia já otimizada no upload (WebP ≤1600px) — auditar as telas novas.
- [ ] Acessibilidade: contraste AA, navegação por teclado, labels, foco visível, alvos de
  toque ≥ 44px (já é o padrão dos componentes — auditar as telas novas).
- [ ] **Playwright** em `apps/web/tests/e2e/` (novo): fluxos ponta a ponta — cadastro →
  perfil com bairro → publicar com foto → reagir/comentar → amizade; viewports mobile e
  desktop; integrar na CI (`ci.yml`).

## Etapa 7 — Fase 10: Analytics no banco + `/transparencia`

- [ ] Definir a lista final de métricas (P20): publicações por bairro/cidade, por tipo,
  por mês (12 meses), apoios, comentários, usuários ativos, denúncias — **sem PII**.
- [ ] Migration `analytics`: `analytics_metrics.daily_metrics` (PK `day+city_id+
  neighborhood_id+type`), função SQL read-only de agregação, job `pg_cron` diário
  (fallback: GitHub Actions/Vercel Cron chamando rota admin autenticada).
- [ ] Página `/transparencia` (substitui o placeholder): Server Component lendo a
  função read-only, Recharts, sem dado pessoal; contagem confere com SQL direto.

## Etapa 8 — Fase 11: Analytics Python (repo separado)

- [ ] Criar repo **`minha-cidade-analytics`** (uv, pandas, SQLAlchemy, Jupyter); ETL
  agendado no GitHub Actions gravando em `analytics.snapshots`; notebooks reproduzíveis;
  dashboard Streamlit no Community Cloud **só com dados agregados**.
- [ ] Validação: números conferem com o banco; ETL idempotente; dashboard sem PII.
- [ ] Decisão de nome do repo (ver Riscos) — alinhar com o nome do repo principal.

## Etapa 9 — Fase 12: Rollout em produção

- [ ] Criar projeto Supabase na nuvem; aplicar as migrations (`supabase db push` ou SQL
  Editor) e rodar os seeds; criar os 3 buckets; configurar Google provider e redirects
  de produção.
- [ ] Deploy na Vercel (Root Directory `apps/web`), variáveis de produção, domínio
  próprio, `NEXT_PUBLIC_SITE_URL` final; backups automáticos conferidos.
- [ ] Lighthouse mobile ≥ 95 nos três eixos em produção; PWA verificada em Android/iOS
  reais; checklist final de docs (contextos no repo, ETL no ar, `/transparencia` ok).

---

## Riscos e decisões em aberto (revisar com você em cada spec)

| Item | Estado | Quando decide |
|---|---|---|
| Ordem dos seeds para `db reset` | **bug corrigido nesta etapa** (renomear `01-`/`02-`) | Etapa 1 |
| Criação dos buckets (`avatars`, `covers`, `publication-media`) | **pendente** — nenhuma migration cria buckets; local e nuvem precisam deles | Etapa 1 (migration nova ou script) |
| `unaccent` no Postgres local | provavelmente ok; plano B documentado | Etapa 1 |
| Nome do repo no GitHub (`minha-cidade` vs `minha-cidade-web`) | indefinido — ADR-0003 sugere `minha-cidade-web` | só no primeiro push (Etapa 9) |
| Repo `minha-cidade-analytics` | depende do nome acima | Etapa 8 |
| Limiar da fila de moderação (3+ denúncias) | inicial definido; confirmar na spec | Etapa 4 |
| Agregação de notificações | regra inicial definida; confirmar na spec | Etapa 5 |
| Métricas finais de `/transparencia` | lista inicial definida; confirmar na spec | Etapa 7 |
| Commits | 4 commits locais existentes, **mantidos** (decisão do usuário); nada sobe para GitHub/plataformas até autorização; sem novos commits até você validar o rodar local | regra desta sessão |

## Ordem sugerida de execução

**Etapa 1** (rodar local) → **Etapa 2** (Engagement) → **Etapa 3** (Social Graph) →
**Etapa 4** (Moderação) → **Etapa 5** (Notification) → **Etapa 6** (PWA/e2e) →
**Etapa 7** (Analytics banco) → **Etapa 8** (Analytics Python) → **Etapa 9** (Rollout).
Cada etapa termina com validação verde e atualização de docs; o commit de cada fase
acontece só depois da sua verificação local.
