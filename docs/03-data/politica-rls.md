# Política de RLS (Row Level Security)

Regra dura: **toda tabela com dado de usuário tem RLS habilitada e negação por padrão.**
A política é escrita na spec do contexto em linguagem natural e testada de forma negativa.

## 1. Princípios

1. **Negar por padrão.** Criar a tabela com `enable row level security` e políticas
   explícitas; nunca confiar em "ninguém vai acertar a URL".
2. **Escopo mínimo.** A política concede o menor acesso possível: dono para escrita,
   público apenas onde o domínio exige (perfil e feed).
3. **Anonimato é invariante de leitura.** O autor anônimo não pode ser resolvido por
   consulta pública — a projeção pública de publicação anônima é feita por view/função que
   omite `author_id` (nunca pela policy deixando a coluna "escondida" no cliente).
4. ** `service_role` não é bypass de regra.** Usar apenas em código de servidor e ainda
   validar invariantes na aplicação (ADR-0008).
5. **Teste negativo obrigatório.** Para cada tabela: um usuário A não lê/escreve dado de B.

## 2. Padrões de política

| Situação | Política |
|---|---|
| Perfil público | `select` para `anon` e `authenticated`; `insert/update` só `auth.uid() = id` |
| Colunas protegidas do perfil | `username`, `role`, `verified_org`, `is_verified` e `termos_aceitos_em` **não** são atualizáveis por usuário: trigger `identity.enforce_profile_invariants()` bloqueia (só `service_role` altera) |
| Publicação visível | `select` para todos quando `hidden_at is null`; autor anônimo projetado sem `author_id` |
| Escrita de publicação | `insert` com `auth.uid() = author_id`; `update/delete` só autor ou admin |
| Mídia de publicação | `select` pública; `insert/delete` só pelo autor da publicação (via `publication_media`) |
| Reação e comentário | `insert` com `auth.uid() = user_id`; leitura pública |
| Salvamento (bookmark) | `select/insert/delete` só `auth.uid() = user_id` |
| Cidades e bairros | `select` pública; `insert` de bairro **não existe para usuário** (só seed/service_role); `update/delete` só admin |
| Amizade | `select` para os dois envolvidos; `insert` com `auth.uid() = requester_id`; `update` só quem recebeu (aceitar/recusar) |
| Denúncia | `insert` com `auth.uid() = reporter_id`; `select` só `admin`/`moderator` |
| Ações de moderação | `insert` só `admin`/`moderator`; `select` só `admin`/`moderator` |
| Rate limit | **sem acesso a usuário**: tabela interna da aplicação, nenhuma política pública |
| Notificação | `select/update` só `auth.uid() = user_id` |
| Métricas (`analytics`) | `select` para `anon`/`authenticated`; **sem `insert/update/delete` para ninguém** (escrita do job) |

**Regra de manutenção:** toda tabela nova deve entrar nesta tabela na mesma migration e na
spec do contexto. Tabela sem política RLS é considerada vulnerabilidade, não pendência.

## 3. Como testar

- Teste de integração com dois usuários (A e B) e um anônimo, cobrindo: leitura, escrita,
  alteração e exclusão — inclusive o caso "autor anônimo não é resolvível".
- Teste de que `/admin` é inacessível para papel `user`.
- Teste de que `username`, `role` e `verified_org` não mudam por `update` de usuário
  (trigger `identity.enforce_profile_invariants`).
- Os testes rodam na CI contra Postgres local (Supabase CLI) ou container de teste.

## 4. Papéis

- `anon`: visitante sem login.
- `authenticated`: usuário logado.
- `admin`, `moderator`: papéis de moderação, atribuídos manualmente em
  `identity.profiles.role` (nunca pelo cliente).
- `service_role`: só servidor, nunca no browser.
