# Minha Cidade

Uma plataforma de participação cidadã para aproximar moradores e iniciativas locais. Publique problemas e ideias do seu bairro, mobilize a comunidade e acompanhe informações públicas sobre a cidade.

> Projeto em desenvolvimento. A configuração descrita neste README é para uso local. Para publicar uma instância real, siga o [checklist de deploy](docs/deploy-checklist.md).

## O que você pode fazer

- Publicar problemas ou ideias com fotos e localização por cidade e bairro.
- Apoiar ou se opor a publicações, comentar e salvar conteúdo.
- Publicar anonimamente.
- Encontrar e se conectar com moradores da região.
- Receber notificações sobre interações.
- Consultar métricas públicas na página de transparência.
- Denunciar conteúdo e, para usuários autorizados, moderar publicações e contas.

## Tecnologias

- Next.js 16, React 19, TypeScript e Tailwind CSS 4.
- Supabase para banco de dados, autenticação, armazenamento e atualizações em tempo real.
- Vitest e Playwright para testes.
- Docker para executar o ambiente local do Supabase.

## Como executar localmente

### Pré-requisitos

- Node.js 22 e npm.
- Docker Desktop em execução.
- Supabase CLI.

Na raiz do repositório, prepare o ambiente local e inicie a aplicação:

```bash
npm run setup --prefix apps/web
npm run dev --prefix apps/web
```

Acesse [http://localhost:3000](http://localhost:3000). O comando de setup inicia o Supabase local, aplica as migrations e os dados de desenvolvimento, gera `apps/web/.env.local` e instala as dependências, se necessário.

O ambiente de demonstração é somente para desenvolvimento. Não use as contas de teste nem execute os seeds em um banco de produção. As contas compartilham uma senha conhecida, definida em [`supabase/seed/03-dev-seed.sql`](supabase/seed/03-dev-seed.sql).

### Serviços locais

- Supabase Studio: [http://127.0.0.1:54323](http://127.0.0.1:54323).
- Caixa de e-mail de desenvolvimento, Inbucket: [http://127.0.0.1:54324](http://127.0.0.1:54324).

## Comandos úteis

Execute os comandos a partir da raiz do repositório:

```bash
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm run test --prefix apps/web
npm run test:e2e --prefix apps/web
npm run build --prefix apps/web
```

## Estrutura do projeto

```text
apps/web/       Aplicação Next.js.
supabase/       Configuração local, migrations e dados de desenvolvimento.
docs/           Requisitos, arquitetura, dados e documentação dos contextos.
```

A aplicação é organizada por contextos de negócio. Cada contexto reúne suas regras e integrações. Componentes e recursos compartilhados ficam em `apps/web/src/shared`.

## Documentação

- [Visão e requisitos do produto](docs/00-product/prd.md).
- [Arquitetura e decisões técnicas](docs/02-design/).
- [Política de acesso aos dados e RLS](docs/03-data/politica-rls.md).
- [Documentação dos contextos](docs/04-contexts/).
- [Checklist para configurar o deploy](docs/deploy-checklist.md).

## Configuração e segurança

O setup local gera `apps/web/.env.local`, que é ignorado pelo Git. Use [`.env.example`](.env.example) como referência para os nomes das variáveis. Nunca publique arquivos `.env.local`, chaves privadas ou credenciais de produção. Configure `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente de servidor.

Antes de disponibilizar uma instância publicamente, configure o Supabase e o provedor de hospedagem conforme o [checklist de deploy](docs/deploy-checklist.md). A chave pública do Supabase não substitui as políticas de acesso do banco. Mantenha as migrations e as políticas RLS aplicadas.

## Contribuições

Issues e pull requests são bem-vindos. Para mudanças maiores, abra uma issue para discutir o escopo. Ao enviar uma contribuição, descreva claramente o que foi alterado e atualize a documentação e as migrations correspondentes, quando necessário.
