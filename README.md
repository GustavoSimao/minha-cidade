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
