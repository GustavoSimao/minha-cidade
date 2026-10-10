# Convenções de schema Postgres

Regras obrigatórias para migrations do Supabase. Fonte da verdade: `docs/02-design/adr/0006`.

## 1. Nomenclatura

- **schemas:** snake_case, um por contexto (`identity`, `geography`, `publication`,
  `engagement`, `social_graph`, `moderation`, `notification`, `analytics`, `shared`).
- **tabelas:** plural, snake_case, **sem prefixo de contexto** (o schema já é o contexto):
  `identity.profiles`, `publication.publications`.
- **colunas:** snake_case; `id` como PK sempre `bigint generated always as identity` ou
  `uuid` (definir por contexto na spec); `created_at`/`updated_at` `timestamptz not null
  default now()`.
- **chaves estrangeiras:** apenas dentro do mesmo contexto. Cruzamento de contexto usa ID
  simples + evento (ADR-0007).
- **índices:** `idx_<tabela>_<colunas>`; únicos `uq_<tabela>_<colunas>`.

## 2. Tipos e enums

- Enums criados no schema do contexto (`publication.publication_type`) e usados em colunas.
- Textos longos em `text` (não `varchar(255)` sem motivo).
- Valores monetários em `numeric(10,2)`; datas/horas sempre `timestamptz`.
- JSON apenas para dados opacos e versionados (`jsonb`), com coluna `schema_version`
  quando a estrutura for relevante.

## 3. Migrations

- Um arquivo por mudança, nome `YYYYMMDDHHMMSS_<contexto>_<descricao>.sql`.
- Sempre aditiva e revisável; `down` documentado em comentário quando viável.
- Nunca alterar dado de produção em migration sem plano de backfill.
- Nenhuma migration apaga coluna usada por tela sem depreciação prévia.

## 4. Restrições e integridade

- Invariantes de domínio no banco quando forem baratas (unique, check, not null).
- `check` para enums de status quando enum Postgres for excessivo.
- Exclusão em cascata apenas dentro do mesmo contexto; entre contextos, exclusão lógica
  (`hidden_at`) para preservar histórico de moderação.

## 5. Auditoria e eventos

- Tabelas sujeitas a moderação têm `hidden_at timestamptz` e `hidden_by uuid` (exclusão
  lógica), nunca `delete` físico em conteúdo denunciado.
- Eventos de domínio em `shared.domain_events` (`id`, `name`, `payload jsonb`,
  `occurred_at`, `context`), escritos na mesma transação do fato.

## 6. Segurança

- `alter default privileges` para negar acesso público a schemas de contexto.
- RLS habilitada em **toda** tabela com dado de usuário; política de negação por padrão.
- Funções `security definer` apenas quando necessárias, com `search_path` fixo.
