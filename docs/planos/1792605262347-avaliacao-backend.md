# Plano de avaliacao — backend Minha Cidade

## Situacao atual (apos leitura completa do repo)

O front-end esta **finalizado em versao final** e o backend (ddd por bounded contexts) esta **totalmente implementado** em codigo. Nao ha funcionalidade em falta entre o que o plano `docs/plano-reescrita-ddd.md` descreve e o que esta em `src/`.

### O que esta implementado (8 bounded contexts)

| Contexto | Dominio | Aplicacao | Infraestrutura (Supabase) | Interfaces (Server Actions) |
|---|---|---|---|---|
| identity | Profile, FullName, Role, Username, VerifiedOrg | UpdateMyProfile, CloseMyAccount, RequestBadge, ListMyBadgeRequest | profile-repository, auth-gateway, badge-request-repository | signIn, signUp, signOut, google, updateProfile, closeAccount, requestBadge |
| geography | City, Neighborhood, UF | ResolveLocationSelection | city-repository, neighborhood-repository | — |
| publication | Publication, PublicationType, PublicationMedia, Title, Content | CreatePublication, UpdateMyPublication, DeleteMyPublication, ListFeed, GetPublication | publication-repository, author-directory, location-validator, storage | — |
| engagement | Reaction, Comment, Bookmark, ReactionType | ToggleReaction, AddComment, EditMyComment, DeleteMyComment, SavePublication, UnsavePublication, ListPublicationComments, GetEngagementSummary | engagement-repository | — |
| social-graph | Friendship, UserPair | SendFriendRequest, CancelFriendRequest, AcceptFriendRequest, RejectFriendRequest, Unfriend, ListFriends, GetRelationshipForViewer, CountFriends, ListIncoming/OutgoingFriendRequests, SuggestFriends, DiscoverRandomPeople, SearchProfiles | friendship-repository, profile-lookup | send/cancel/accept/reject/unfriend |
| moderation | ReportReason, ModerationAction, RateLimitPolicy | EnforceRateLimit, ReportContent, ListModerationQueue, StaffGate, GrantBadge, RevokeBadge, ListBadgeRequests, ApproveBadgeRequest, RejectBadgeRequest, PromoteModerator, DemoteModerator, ApplyModerationAction, ListModerationActions | moderation-repository, badge-request-adapters | reportContent, hide/restore/remove, grant/revoke/promote/demote, approve/reject badge |
| notification | Notification, NotificationType | ListMyNotifications, CountMyUnreadNotifications, MarkNotificationAsRead, MarkAllNotificationsAsRead | notification-repository | markNotificationRead, markAllNotificationsRead |
| analytics | — | GetTransparencyMetrics | analytics-repository | — |

### Migrations (13) — todas criadas
identity_create_profiles, geography_create_cities_neighborhoods, publication_create_publications, platform_create_storage_buckets, engagement_create_reactions_comments_bookmarks, social_graph_create_friendships, moderation_create_reports_actions_limits, notification_create_notifications, identity_badge_requests, moderation_extend_staff_actions, analytics_create_daily_metrics, moderation_rate_limit_by_ip, identity_add_website.

### Seeds (3) — todas criadas
01-ibge-localidades.sql (5.571 municipios IBGE), 02-bairros-cariacica.sql (100 bairros), 03-dev-seed.sql (13 usuarios, senha Cidade@123).

### Rotas da app (18+) — todas criadas
`/`, `/login`, `/cadastro`, `/auth/callback`, `/perfil/{username}`, `/perfil/editar`, `/publicar`, `/publicacao/{id}`, `/amigos`, `/amigos/buscar`, `/amigos/descobrir`, `/amigos/{username}`, `/amigos/solicitacoes`, `/salvos`, `/admin`, `/notificacoes`, `/solicitar-selo`, `/transparencia`, `/explorar`, `/termos`, `/privacidade`.

### Qualidade do codigo (estado do ultimo commit)
- Unit: 240/240 passando
- Lint/typecheck: limpos
- Build: verde (35 rotas)
- E2E: 104/104 passando

## O que falta para o backend estar "no ar"

Nada falta de codigo. O backend nao esta funcionando porque a **infraestrutura local esta desligada** (status da sessao anterior: ambiente desligado a pedido). Para colocar o backend em funcionamento sao necessarios 4 passos, sem alterar nenhum arquivo:

1. **Iniciar Docker Desktop** (ja verificado que o daemon responde)
2. **Subir a stack Supabase local**: `supabase start` (Postgres :54322, API :54321, Studio :54323, Inbucket :54324)
3. **Aplicar migrations e seeds**: `supabase db reset` (idempotente, apaga e recria o banco local)
4. **Regenerar `.env.local` e iniciar o Next.js**: `npm run setup --prefix apps/web` (escreve chaves da stack local) e `npm run dev --prefix apps/web` (porta 3000)

## Parecer sobre as skills disponíveis

### `.claude/skills/avoid-ai-design`
- **Descricao:** Audita e reescreve UI frontend para remover padroes de design generico de IA ("AI slop"). Cobre HTML/CSS e React/Tailwind/shadcn.
- **Aplica a esta tarefa?** **NAO.** A tarefa é backend / infraestrutura / subir a stack. Esta skill e exclusiva para interface existente (telas, componentes, revisao de design).
- **Recomendacao:** Nao carregar.

### `.claude/skills/better-design`
- **Descricao:** Constrói e melhora interfaces de producao com o Better Design MCP (design system, componentes, UX, fluxos).
- **Aplica a esta tarefa?** **NAO.** E para criacao/redesenho de UI, nunca para backend, API, migrations ou infraestrutura.
- **Recomendacao:** Nao carregar.

### Agentes disponíveis (`.claude/agents/`)
Para uma eventual fase de implementacao ou revisao posterior:

| Agente | Para que serve | Aplica agora? |
|---|---|---|
| `@task-executor` | Implementa UMA tarefa por vez (migration, dominio, aplicacao, infra, tela, teste), roda lint/typecheck/test e para | Sim — se houver tarefa de codigo a executar |
| `@clean-code-reviewer` | Revisao read-only de codigo (naming, SRP, DRY, funcoes pequenas, tratamento de erro, testes) | Sim — para auditoria posterior |
| `@design-reviewer` | Revisao read-only de UI/UX (mobile-first, WCAG AA, estados vazio/loading/erro) | NAO — nao e tarefa de UI |
| `@spec-writer` | Escreve spec tecnica a partir de PRD aprovado | NAO — specs ja estao escritas |
| `@product-owner` | Transforma ideia em PRD | NAO — produto ja esta definido |
| `@plan-tasks` | Transforma spec aprovada em tasks.md ordenado | NAO — planejamento ja esta feito |

## Plano de acao (implementacao por outro agente)

Como este agente esta em **modo plan** (somente leitura, sem edicao de arquivos, sem comandos mutantes), a execucao deve ser feita por um agente com permissao de codigo (`@task-executor` ou agente code):

```
1. Iniciar Docker Desktop (caso parado)
2. supabase start                            # sobe stack local
3. supabase db reset                         # migrations + seeds
4. npm run setup --prefix apps/web           # regenera .env.local
5. npm run dev --prefix apps/web             # inicia Next.js na porta 3000
6. Validar: http://localhost:3000, build, typecheck, testes
```

## Perguntas em aberto (para o usuario)

Nenhuma decisao de design esta em aberto. O codigo esta completo e validado. A unica necessidade e operacional: subir a infraestrutura local.