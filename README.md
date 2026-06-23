# Minha Cidade

Plataforma de participação cidadã para mobilizar comunidades locais. Os moradores podem denunciar problemas, propor ideias, criar eventos e apoiar causas da sua cidade.

## Stack

- **Backend:** Laravel 13 + PHP 8.4
- **Frontend:** Livewire + Blade + Tailwind CSS
- **Banco:** MySQL 8.0
- **Mobile:** NativePHP
- **Arquitetura:** Modular (app-modules/)

## Estrutura

```
app-modules/
├── Identity/        → Usuários, autenticação, perfil
├── Geography/       → Endereços (polimórfico), cidades
├── Publication/     → Publicações (problema, ideia, evento)
├── Community/       → Comentários, reações, amizades, participações
├── Moderation/      → Denúncias
├── Verification/    → Verificação de email/telefone
└── Notification/    → Notificações
```

## Como rodar

```bash
# Instalar dependências
composer install

# Configurar banco
cp .env.example .env
php artisan key:generate

# Rodar migrations
php artisan migrate

# Criar usuário
php artisan tinker
App\Models\User::create([
    'name' => 'Seu Nome',
    'email' => 'seu@email.com',
    'password' => bcrypt('123456'),
    'username' => 'seuuser',
]);

# Rodar servidor
php artisan serve
```

Acesse `http://localhost:8000/perfil/seuuser`

## Funcionalidades

- Cadastro e login de usuários
- Perfil público com foto, bio e cidade
- Criação de publicações (problema, ideia, evento)
- Sistema de apoio e contra-apoio
- Comentários nas publicações
- Amizades (solicitar, aceitar, recusar)
- Eventos com data, local e participação
- Denúncias de conteúdo
- Notificações

## Status

Projeto em desenvolvimento. Estrutura e banco de dados definidos, modelagem de dados concluída.
