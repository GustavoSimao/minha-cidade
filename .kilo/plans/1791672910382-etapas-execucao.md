# Plano de execução por etapas — Minha Cidade

Levantamento do repo em 2026-10-10 e plano de trabalho em etapas. Fonte de verdade geral:
`docs/plano-reescrita-ddd.md` (decisões D1–D15, fases 0–12). Este arquivo quebra o trabalho
restante em etapas executáveis, na ordem de dependência.

## Estado verificado hoje

| Item | Situação |
|---|---|
| Fase 0 (fundação repo) | concluída — Next 16.4 + React 19 + TS + Tailwind 4 + Vitest; CI em `.github/workflows/ci.yml` |
| Fase 1 (documentos) | concluída — `docs/00-product`, `01-process`, `02-design` (C4, design system, ADRs 0001–0021), `03-data`, `04-contexts` |
| Fase 2 (Identity & Access) | código e migration concluídos — `identity.profiles` + trigger + RLS; rotas `/login`, `/cadastro`, `/auth/callback`, `/perfil/{username}`, `/perfil/editar`, `/termos`, `/privacidade` |
| Git | inicializado, branch `master`, **zero commits** — todo o trabalho está untracked |
| Aplicação da migration Fase 2 | **pendente** — `20261010000001_identity_create_profiles.sql` ainda não rodou no projeto Supabase (ação manual) |
| Seeds | só existe `supabase/seed/README.md`; `ibge-localidades.sql` e `dev-seed.sql` referenciados **não existem** |
| Fases 3–12 | pendentes |

## Achados da varredura (atenção ao executar)

1. `identity.profiles` tem `city_id bigint` e `neighborhood_id uuid` **sem FK** — os
   comentários dizem "FK criada na Fase 3". A migration de Geography precisa adicionar as
   FKs, não só criar as tabelas.
2. `docs/03-data/catalogo-ibge.md` determina copiar a fonte oficial de Cariacica para
   `supabase/seed/sources/` com `fonte`, `data` e `hash` em `shared.app_metadata`.
3. Nome definitivo do repo no GitHub segue indefinido (ADR-0003 sugere `minha-cidade-web`;
   a pasta é `minha-cidade`) — decidir antes do primeiro push.
4. Regra fixa do repo (AGENTS.md): antes de escrever código Next.js 16, ler os guias em
   `apps/web/node_modules/next/dist/docs/` — esta versão tem breaking changes.

## Regras transversais (valem para toda etapa)

- Ordem obrigatória por contexto (D4): **spec → migration → domínio → aplicação →
  infraestrutura → tela → teste**. Nada de código sem spec correspondente.
- Spec no template de `docs/04-contexts/README.md`; ERD atualizado se o schema mudar;
  `docs/03-data/dicionario-dados.md` atualizado a cada coluna nova/morta.
- Definition of Done (`docs/01-process/workflow.md` §2): spec no PR; invariantes com teste
  de unidade; RLS testada negativamente; lint/typecheck/test/build verdes; tela conferida
  em 375px e 1280px; sem `any`/`console.log` novos.
- Integração entre contextos só por IDs e eventos — nunca JOIN entre schemas (D7);
  casos de uso no servidor (D8).
- Commits Conventional Commits com escopo do contexto (`feat(geography): ...`);
  branch `feat/<contexto>-<descricao>`.
- Validação mínima por etapa: `npm run lint --prefix apps/web`,
  `npm run typecheck --prefix apps/web`, `npm run test --prefix apps/web`,
  `npm run build --prefix apps/web`.

---

## Etapa 0 — Fechar a base (pré-requisito de tudo)

- [ ] Decidir o nome do repo no GitHub (`minha-cidade` vs `minha-cidade-web`) e refletir em README/ADRs.
- [ ] Conferir `.gitignore` (`.env.local` de `apps/web` não pode ser versionado) e fazer o **commit inicial** na branch principal (`main`, renomeando `master` se mantivermos a convenção da CI, que escuta `main`).
- [ ] Preencher `apps/web/.env.local` a partir de `.env.example` com os dados do painel Supabase.
- [ ] **Aplicar a migration da Fase 2** no Supabase (SQL Editor ou `supabase db push`) e confirmar: schemas `shared`/`identity`, tabela `profiles`, trigger `on_auth_user_created`, políticas RLS ativas.
- [ ] Conferir manual no painel: Google provider ativo, redirect `http://localhost:3000/auth/callback`, buckets `avatars`, `covers`, `publication-media`.
- [ ] Rodar os 4 comandos de validação locais e confirmar verde.

## Etapa 1 — Fase 3: Geography

- [ ] Escrever `docs/04-contexts/geography.md` (template completo: linguagem ubíqua, invariantes, entidades, casos de uso, eventos, DDL, RLS em linguagem natural, endpoints, testes derivados).
- [ ] Decisões a fixar na spec (P11/P12): lançamento em Cariacica/ES; bairro opcional fora dos municípios curados; usuário nunca cria bairro — só seleciona cidade → bairro.
- [ ] Migration `supabase/migrations/2026101xxxxxx_geography.sql`: `geography.cities` (id = código IBGE) e `geography.neighborhoods` conforme `docs/03-data/catalogo-ibge.md` §4; **adicionar as FKs `identity.profiles.city_id/neighborhood_id`**; RLS: leitura pública, sem escrita para anon/authenticated (seed por service_role); `shared.app_metadata` com versão do schema.
- [ ] Gerar `supabase/seed/ibge-localidades.sql` a partir da API do IBGE (estados + 5.570 municípios), idempotente (`on conflict do nothing`), com `ibge_synced_at`.
- [ ] Curadoria de bairros de Cariacica (fontes: Lei 4772/2010 + LC 171/2025 + mapa da prefeitura, já catalogadas em `docs/03-data/catalogo-ibge.md`): lista no seed com `source`/`source_url`; copiar documento-fonte para `supabase/seed/sources/` e registrar `fonte`, `data`, `hash` em `shared.app_metadata`.
- [ ] Domínio: `src/contexts/geography/domain` (value objects Cidade/Bairro, slug, invariantes) + testes de unidade.
- [ ] Aplicação: casos de uso de listagem/busca de cidades e bairros em cascata; infraestrutura: repositórios Supabase.
- [ ] Interface: seletor em cascata cidade → bairro com busca, usável em 375px; aplicável também em `/perfil/editar` (campos já existem no perfil).
- [ ] Teste de seed: roda limpo em banco novo é idempotente; contagem de municípios confere com a origem; toda UF tem ≥ 1 município; bairro duplicado na mesma cidade falha no `unique (city_id, slug)`.
- [ ] Atualizar dicionário de dados e `docs/04-contexts/README.md` (status da Geography).

## Etapa 2 — Fase 4: Publication + feed

- [ ] Spec `docs/04-contexts/publication.md`. Decisões a tomar antes (já mapeadas): formatos/ordem das imagens, comportamento das reações ao apagar publicação (P7, P14, P15).
- [ ] Migration do schema `publication` (`publications`, `publication_media`), RLS: leitura pública; escrita só do dono; anonimato nunca vaza em leitura pública.
- [ ] Domínio: `Publication` (tipo `problem|idea`, `is_anonymous`, título, corpo), evento `PublicationCreated`.
- [ ] Application/infra: casos de uso no servidor (D8); upload em `publication-media` com redimensionamento no cliente para WebP (máx. 1600px, 3 imagens, 10 MiB) e validação de magic bytes no servidor (P15).
- [ ] Feed: rota/feed pública paginada, filtros bairro/cidade/tipo, ordenação recente, sem ranking (P8).
- [ ] Ligação com Geography: publicação referencia `city_id`/`neighborhood_id` por ID, sem JOIN entre schemas (D7).
- [ ] Testes de invariantes + e2e publicando com foto anônima e vendo no feed.

## Etapa 3 — Fase 5: Engagement

- [ ] Spec `engagement.md`; migration (reactions com unique usuário/publicação, comments, bookmarks); RLS.
- [ ] Domínio: `Reaction` (apoio/oposição, toggle — mesmo tipo remove, outro troca), `Comment` (anonimato opcional, editável 15 min — P14/P10), eventos `PublicationSupported`, `CommentAdded`.
- [ ] Realtime no cliente com `supabase-js` (contadores e novos comentários).
- [ ] Validação: toggle em dois clientes; comentário aparece sem recarregar; teste de constraint de unicidade.

## Etapa 4 — Fase 6: Social Graph

- [ ] Decidir antes (já mapeada): constraint anti-duplicata A↔B — sentinela ordenada vs. índice em expressão.
- [ ] Spec `social-graph.md` (estados `none|pending_sent|pending_received|friends`; ações enviar/cancelar/aceitar/desfazer — Apêndice A preserva o comportamento validado).
- [ ] Migration (`friendships` com constraint único lógico), domínio, RLS (lista pública; escrita só do envolvido).
- [ ] Telas: botão de amizade no perfil público, lista de amigos e solicitações.
- [ ] Validação: duplicata nos dois sentidos barrada; fluxo completo em e2e mobile.

## Etapa 5 — Fase 7: Moderação, rate limit e admin mínimo

- [ ] Spec `moderation.md`; definir limiar de "volume alto" na fila (inicial: 3+ denúncias).
- [ ] Migration (`reports`, `moderation_actions`); RLS: fila só para `admin`/`moderator`; denúncia só de autenticado com e-mail confirmado (P17).
- [ ] Rate limit na camada application: 5 publicações/hora, 20/dia, 20 comentários/hora, 10 denúncias/dia por usuário; 30 publicações/hora por IP (P16).
- [ ] `/admin`: fila ordenada por volume, ocultar/restaurar (moderador), remover + selo + promover papel (admin) (P18); conteúdo denunciado permanece visível até ação (P21).
- [ ] Validação: abuso além do limite bloqueado; RLS garante que só staff vê a fila.

## Etapa 6 — Fase 8: Notification (mínimo)

- [ ] Spec `notification.md`; decidir agregação de notificações similares ("3 pessoas apoiaram").
- [ ] Migration + domínio (`Notification` com `read_at`); 4 eventos in-app em tempo real (P19): amizade, comentário, reação, moderação.
- [ ] Sininho com contagem e Realtime; RLS por dono.
- [ ] Validação: notificação em tempo real; leitura só pelo dono.

## Etapa 7 — Fase 9: PWA, performance e acessibilidade

- [ ] Manifest + ícones + service worker (cache do shell e das últimas publicações lidas → leitura offline); versionamento de cache com aviso de "novo conteúdo disponível".
- [ ] Orçamento de performance: Server Components por padrão, `next/image`, otimização de mídia no upload.
- [ ] Acessibilidade: contraste AA, teclado, labels, foco visível, alvos de toque ≥ 44px.
- [ ] Testes Playwright em `tests/e2e/` (criados aqui, viewports mobile/desktop) + integrar na CI.
- [ ] Validação: Lighthouse mobile ≥ 90 nos três eixos; instalação no Android/"Adicionar à Tela" no iOS; leitura offline após visitar o feed.

## Etapa 8 — Fases 10 e 11: Analytics

- [ ] Definir a lista final de métricas de `/transparencia` (contagens por bairro, tipo, tempo — 12 meses, sem PII — P20).
- [ ] Fase 10: tabelas de métricas diárias + job `pg_cron` (fallback: GitHub Actions/Vercel Cron em rota admin autenticada); página `/transparencia` com Recharts lendo função SQL read-only.
- [ ] Fase 11: repo `minha-cidade-analytics` (uv, pandas, SQLAlchemy, Jupyter), ETL agendado no GitHub Actions gravando no schema `analytics`, notebooks reproduzíveis, dashboard Streamlit no Community Cloud **só com dados agregados**.
- [ ] Validação: números conferem com contagem direta no banco; ETL idempotente; dashboard sem PII.

## Etapa 9 — Fase 12: Rollout em produção

- [ ] Deploy na Vercel (Root Directory `apps/web`) com domínio próprio; variáveis de produção; `NEXT_PUBLIC_SITE_URL` final.
- [ ] Backups automáticos conferidos; redirects de auth atualizados no Supabase.
- [ ] Lighthouse mobile ≥ 95 nos três eixos em produção; PWA verificada em Android/iOS reais.
- [ ] Checklist final: docs de contexto no repo, ETL/Streamlit no ar, `/transparencia` conferida.

---

## Riscos específicos deste momento

| Risco | Mitigação |
|---|---|
| Repo sem nenhum commit — trabalho pode ser perdido | Etapa 0 faz o commit inicial antes de qualquer código novo |
| Migration da Fase 2 não aplicada — Fase 3 criaria FKs para tabelas ausentes | Aplicar e conferir na Etapa 0 antes da migration de Geography |
| Nome de repo indefinido | Decidir na Etapa 0; CI escuta `main` — a branch inicial deve ser `main` |
| Seed IBGE desatualizado | Script idempotente versionado + `ibge_synced_at` + teste de contagem |
| Bairros de Cariacica sem fonte rastreável | Fonte oficial copiada em `supabase/seed/sources/` com hash em `shared.app_metadata` |
