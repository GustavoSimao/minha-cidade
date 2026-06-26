# Minha Cidade

Plataforma de participação cidadã para mobilizar comunidades locais. Moradores podem denunciar problemas, propor ideias, criar eventos e apoiar causas da sua cidade.

[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com/)
[![Livewire](https://img.shields.io/badge/Livewire-4-FB70A9?style=flat&logo=livewire&logoColor=white)](https://livewire.laravel.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## Stack

- **Backend:** Laravel 13 + PHP 8.4
- **Frontend:** Livewire 4 + Volt + Blade + Tailwind CSS + Vite
- **Banco:** MySQL 8.0
- **Auth:** Laravel Breeze (Livewire stack)
- **Arquitetura:** Modular (app-modules/)

## Estrutura

```
app-modules/
├── Identity/        → Usuários, autenticação, perfil
├── Geography/       → Endereços (polimórfico), cidades, bairros
├── Publication/     → Publicações (problema, ideia), eventos
├── Community/       → Comentários, reações, amizades, participações
├── Moderation/      → Denúncias
├── Verification/    → Verificação de email/telefone
└── Notification/    → Notificações
```

```
resources/views/
├── layouts/                     → Layouts do Breeze (app, guest)
├── components/
│   ├── shared/                  → Componentes Blade reutilizáveis
│   └── modules/
│       ├── identity/            → stat-icon, tab-icon, publication-type-badge
│       └── community/           → empty-state
├── livewire/
│   ├── identity/                → profile-tabs
│   ├── community/               → friendship-button, reaction-button
│   ├── pages/auth/              → Volt pages (Breeze)
│   ├── pages/profile/           → Volt pages (Breeze)
│   └── layout/                  → Navigation (Breeze)
└── profile-public.blade.php     → Página pública de perfil
```

## Como rodar

```bash
# Instalar dependências PHP
composer install

# Instalar dependências frontend
npm install && npm run build

# Configurar banco
cp .env.example .env
php artisan key:generate

# Configurar MySQL no .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=minha_cidade
DB_USERNAME=root
DB_PASSWORD=suasenha

# Rodar migrations
php artisan migrate

# Rodar servidor
php artisan serve
```

Acesse `http://localhost:8000/register` para criar sua conta.

## Funcionalidades

### Prontas
- **Autenticação completa** — registro, login, logout, redefinição de senha, verificação de email (Laravel Breeze + Livewire Volt)
- **Perfil público** (`/perfil/{username}`) — foto, capa, bio, estatísticas (amigos, publicações, eventos, causas)
- **Abas de conteúdo** — publicações, eventos, causas apoiadas e sobre
- **Amizade** — solicitar, aceitar, recusar e desfazer amizade (mão dupla, sem seguidores)
- **Reações em tempo real** — apoio/oposição via Livewire
- **Gerenciamento de perfil** — editar nome, email, senha, deletar conta (`/profile`)
- **Endereços polimórficos** — perfil, publicação, evento
- **Username automático** — gerado a partir do nome no cadastro, único

### Em desenvolvimento
- Criação de publicações (problema, ideia, evento)
- Eventos com data, local e participação
- Comentários nas publicações
- Feed baseado em localização (bairros/cidade)

### Planejado
- Denúncias de conteúdo
- Notificações
- Verificação de email/telefone
- Busca de publicações e usuários
- Mobile (NativePHP)

## Banco de dados

18 tabelas distribuídas em 7 módulos:

| Módulo | Tabelas |
|---|---|
| Identity | `users`, `profiles` |
| Geography | `addresses` (polimórfico) |
| Publication | `publications`, `events` |
| Community | `comments`, `reactions`, `participations`, `friends`, `bookmarks` |
| Moderation | `reports` |
| Verification | `verification_tokens` |
| Notification | `notifications` |

## Status

Projeto em desenvolvimento ativo. Estrutura modular, autenticação funcional, perfil público com Livewire e banco MySQL concluídos.