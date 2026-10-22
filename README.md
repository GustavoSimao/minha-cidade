# Minha Cidade

Plataforma de participação cidadã: moradores publicam problemas e ideias do seu bairro, recebem apoio dos vizinhos, comentam e se conectam — usável no celular e no PC, sem instalar aplicativo de loja.

---

## O produto

### O problema

Moradores de bairro enxergam todos os dias o que precisa ser melhorado — um buraco na rua, uma lâmpada apagada, lixo acumulado, uma praça que poderia existir — mas não têm um canal simples para registrar isso, saber se outras pessoas sentem o mesmo, ou acompanhar se a prefeitura está de olho. Reclamações se perdem em grupos de WhatsApp, e-mails não têm retorno, e não existe um lugar onde a comunidade possa se organizar em torno de uma ideia e medir o apoio que ela tem.

### A solução

**Minha Cidade** é uma rede social de bairro. Um morador publica um problema ou uma ideia com foto (ou anonimamente, se preferir), e vizinhos do mesmo bairro podem apoiar, se opor, comentar e salvar para acompanhar depois. Quanto mais apoio uma publicação recebe, mais visível ela fica — criando pressão legítima e organizada sobre a gestão pública.

Também existe um canal direto entre moradores e a prefeitura: a administração municipal tem um selo institucional, responde a demandas, e a plataforma publica números agregados (transparência) para que qualquer pessoa veja o que está sendo feito e o que ainda está pendente.

### Para quem é

| Público | O que faz na plataforma |
|---|---|
| Morador | Publica problemas/ideias, apoia e comenta publicações do bairro, faz amizades, salva publicações, recebe notificações |
| Prefeitura / servidores | Responde a demandas, exibe selo institucional, modera conteúdo, acessa fila de moderação e contas |
| Moderador | Analisa denúncias, oculta/restaura/remove publicações, acompanha a trilha de moderação |

### O que você pode fazer

- **Publicar** um problema ou ideia com fotos e localização (cidade + bairro)
- **Apoiar ou se opor** a publicações de outros moradores
- **Comentar** e salvar publicações para acompanhar depois
- **Criar amizades** com moradores do mesmo bairro e receber sugestões de pessoas próximas
- **Receber notificações** em tempo real sobre interações nas suas publicações
- **Acompanhar a transparência** — números públicos agregados da administração

---

## Começando (localhost)

Pré-requisitos: Docker Desktop rodando + Supabase CLI.

```bash
# 1. Sobe a stack local (Docker), aplica migrations, seeds e gera o .env.local
npm run setup --prefix apps/web

# 2. Inicia o Next.js
npm run dev --prefix apps/web
# → http://localhost:3000
```

O script `apps/web/scripts/setup-local.mjs` é idempotente: se a stack já estiver ativa, ele apenas regera o `.env.local` e confirma o estado.

### Usuários de teste (seed)

Todos com senha `Cidade@123` e e-mail já confirmado:

| E-mail | Quem | Papel |
|---|---|---|
| ana@minhacidade.dev | Ana Souza | morador, Boa Sorte |
| bruno@minhacidade.dev | Bruno Lima | morador, Aparecida |
| carla@minhacidade.dev | Carla Dias | admin (moderação) |
| daniel@minhacidade.dev | Daniel Rocha | morador, Boa Sorte |
| elena@minhacidade.dev | Elena Matos | morador, Flexal |
| fabio@minhacidade.dev | Fabio Ramos | morador, Campo Grande |
| graca@minhacidade.dev | Graça Nunes | morador, Porto de Santana |
| heitor@minhacidade.dev | Heitor Batista | morador, Bela Vista |
| iris@minhacidade.dev | Iris Veiga | morador, Jardim Campo Grande |
| joao@minhacidade.dev | João Pedro Alves | morador, Rosa da Penha |
| prefeitura@minhacidade.dev | Prefeitura de Cariacica | selo institucional |
| marco@minhacidade.dev | Marco Andrade | moderador |
| secretaria@minhacidade.dev | Secretaria de Meio Ambiente | solicitação de selo pendente |

Cadastros novos pela interface recebem e-mail de confirmação capturado pelo **Inbucket** (`http://127.0.0.1:54324`).

### Comandos úteis

```bash
npm run lint --prefix apps/web      # lint
npm run typecheck --prefix apps/web # TypeScript
npm run test --prefix apps/web      # testes de unidade (vitest)
npm run test:e2e --prefix apps/web  # testes e2e (Playwright)
npm run build --prefix apps/web     # build de produção
```

---

## Parte técnica

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, TypeScript |
| Backend / Banco | Supabase (Postgres 17, Auth, Storage, Realtime, pg_cron) |
| Testes | vitest (unidade), Playwright (e2e) |
| Deploy | Vercel |
| PWA | instalável, service worker com cache de leitura pública |

### Estrutura do repositório

```
apps/web/                  app Next.js
  src/contexts/<ctx>/      bounded contexts (DDD): domínio, aplicação, infraestrutura, interfaces
  src/shared/kernel/       Entity, ValueObject, Identifier, Result, DomainEvent
  src/shared/ui/           componentes de interface
  src/app/                 rotas e páginas (App Router)
  src/proxy.ts             renovação de sessão e proteção de rotas
supabase/
  config.toml              schemas por contexto
  migrations/              migrations SQL
  seed/                    seed idempotente (IBGE + desenvolvimento)
docs/                      fonte da verdade (PRD, processo, design, dados, contextos)
```

### Rotas principais

| Rota | O que faz |
|---|---|
| `/` | feed público de publicações (filtros cidade/bairro/tipo, paginação) |
| `/login`, `/cadastro` | entrar e cadastrar (e-mail/senha ou Google) |
| `/perfil/{username}` | perfil público |
| `/perfil/editar` | editar perfil e encerrar conta |
| `/publicar` | criar publicação (problema/ideia, fotos, anonimato) |
| `/publicacao/{id}` | publicação, apoio/oposição, comentários, salvar |
| `/amigos` | hub de amizades: amigos, solicitações, sugestões do bairro |
| `/salvos` | publicações salvas (privado) |
| `/admin` | fila de moderação e contas (staff) |
| `/notificacoes` | notificações in-app |
| `/transparencia` | números públicos agregados |

### Arquitetura

O código segue DDD com **bounded contexts** — um schema Postgres e uma pasta de código por contexto (identity, geography, publication, engagement, social-graph, moderation, notification, analytics). A camada `shared/kernel` concentra building blocks de domínio.

Documentação detalhada por contexto está em `docs/04-contexts/`. O plano geral está em `docs/plano-reescrita-ddd.md`.

### Deploy (Vercel)

1. Importe o repositório em <https://vercel.com/new> com **Root Directory = `apps/web`**.
2. Defina as variáveis de ambiente de produção (mesmas de `.env.local`, com `NEXT_PUBLIC_SITE_URL` apontando para o domínio final).
3. Deploy automático por push; preview por pull request.

### Contribuindo

1. Abra uma issue descrevendo a mudança.
2. Crie um branch a partir de `main`.
3. Implemente seguindo o fluxo: spec → migration → domínio → aplicação → infraestrutura → tela → teste.
4. Rode `lint`, `typecheck` e `test` antes de abrir o pull request.

---

## Licença

Privado — Minha Cidade.