# Identity & Access — Especificação

Contexto responsável por **quem é o usuário**, como ele entra e o que o perfil público
mostra. Fonte da verdade deste domínio; o código em
`apps/web/src/contexts/identity/` e a migration `supabase/migrations/*_identity_*` implementam
exatamente o que está aqui.

- **Versão:** 1.0 · **Data:** 2026-10-10 · **Decisões:** P1–P6, P13, P22 (e D2, D6, D8)

## 1. Propósito e linguagem ubíqua

| Termo | Significado exato neste contexto |
|---|---|
| **Usuário** | identidade de autenticação gerenciada pelo **Supabase Auth** (`auth.users`) |
| **Perfil** | dados de produto do usuário (`identity.profiles`), 1:1 com o usuário |
| **Username** | identificador público e imutável usado na URL `/perfil/{username}` |
| **Papel** | `user`, `moderator` ou `admin` — define permissões de moderação (ADR-0017) |
| **Selo institucional** | destaque visual com nome do órgão, concedido por admin (P13) |
| **Conta encerrada** | perfil e dados próprios apagados; publicações anonimizadas (P4) |

Fronteira: autenticação (credencial, token, sessão) é do Supabase; **nunca** guardamos
senha neste contexto.

## 2. Invariantes

1. **I1** — Todo perfil tem exatamente um usuário do Auth (`profiles.id = auth.users.id`).
2. **I2** — `username` é **único** e **imutável** depois de criado (P5).
3. **I3** — `username` nunca é vazio; se a normalização do nome resultar em vazio, usa-se
   `usuario-` + 8 caracteres aleatórios (fallback).
4. **I4** — `role` ∈ {`user`, `moderator`, `admin`}; só `service_role` altera papel.
5. **I5** — `verified_org` só é preenchido quando há selo institucional; `is_verified` é
   espelho (`true` ⇔ `verified_org IS NOT NULL`). Usuário nunca define os dois (P13).
6. **I6** — `termos_aceitos_em` é preenchido no cadastro (checkbox obrigatório) e só o dono
   o lê (P22).
7. **I7** — Perfil público expõe apenas: nome, foto, capa, bio, cidade/bairro, papel,
   selo, contadores e lista de amigos. `email` e `phone` **nunca** são públicos (P6).
8. **I8** — Encerrar conta apaga o perfil em cascata e **anonimiza** publicações
   (`author_id = NULL`, `is_anonymous = true`) antes de apagar o perfil (P4).
9. **I9** — Escrever (publicar, comentar, amizade, denunciar) exige e-mail confirmado,
   exceto login social Google (P3, ADR-0019).

## 3. Entidades e value objects

- **`Profile`** (entidade, id = uuid do Auth)
  - `username: Username` · `fullName: FullName` · `bio: string?` · `phone: string?`
  - `avatarPath`/`coverPath: string?` (objetos do Storage)
  - `role: Role` · `verifiedOrg: VerifiedOrg | null`
  - `cityId: number | null` · `neighborhoodId: string | null`
  - `termsAcceptedAt: Date`
  - `createdAt`/`updatedAt`
- **`Username`** (VO): string normalizada; `static fromName(name)` aplica a regra de
  normalização; `static fallback()` gera `usuario-<8>`; válido se `/^[a-z0-9-]+$/`.
- **`Role`** (VO): enum fechado; `canModerate()` para `moderator`/`admin`.
- **`VerifiedOrg`** (VO): nome do órgão, 3–120 caracteres.
- **`FullName`** (VO): 2–120 caracteres após trim.

Regra de normalização do username (espelha a função SQL): trim → espaços viram `-` →
minúsculas → remove tudo que não é `[a-z0-9-]` → se vazio, fallback → se colide, sufixo
`-1`, `-2`… (a colisão é resolvida pelo repositório, que consulta o banco).

## 4. Casos de uso

| Caso de uso | Entrada | Efeito | Evento |
|---|---|---|---|
| `RegisterWithEmail` | nome, e-mail, senha, aceite dos termos | cria usuário no Auth; trigger cria perfil com username gerado e `role=user` | `UserRegistered` |
| `RegisterWithGoogle` | redirect OAuth | idem; e-mail já confirmado pelo Google | `UserRegistered` |
| `SignIn` / `SignOut` | e-mail+senha / sessão | sessão via `@supabase/ssr` | — |
| `GetPublicProfile` | username | devolve projeção **pública** (I7) ou `NotFound` | — |
| `GetMyProfile` | sessão | devolve perfil completo do dono | — |
| `UpdateMyProfile` | nome, bio, telefone, cidade/bairro, avatar, capa | atualiza apenas o próprio perfil; **não** altera username (I2), papel (I4) ou selo (I5) | `ProfileUpdated` |
| `ChooseNeighborhood` | cityId, neighborhoodId | define localização do perfil (feed passa a segmentar por bairro — P1) | `ProfileUpdated` |
| `GrantVerifiedOrg` *(admin)* | profileId, nome do órgão | define `verified_org`/`is_verified`; registra ação de moderação | `VerifiedOrgGranted` |
| `RevokeVerifiedOrg` *(admin)* | profileId | limpa selo; registra ação | `VerifiedOrgRevoked` |
| `RequestBadge` | órgão, URL da evidência, e-mail/mensagem opcionais | cria `badge_requests` pending (I9; uma pendência por usuário) | `BadgeRequested` |
| `ListMyBadgeRequest` | sessão | estado do próprio pedido (pending/approved/rejected + motivo) | — |
| `PromoteModerator` / `DemoteModerator` *(admin)* | profileId | altera `role`; registra ação | `RoleChanged` |
| `CloseMyAccount` | senha | anonimiza publicações → apaga perfil/dados próprios → apaga usuário do Auth (I8) | `AccountClosed` |

## 5. Eventos de domínio (publicados em `shared.domain_events`)

`UserRegistered { profileId, username }` · `ProfileUpdated { profileId, changed[] }` ·
`VerifiedOrgGranted { profileId, org }` · `RoleChanged { profileId, from, to }` ·
`AccountClosed { profileId, publicationsAnonymized }`

Consumidores: `notification` (eventos de amizade/reação — outras fases),
`analytics` (leituras), `moderation` (trilha).

## 6. Schema (DDL)

```sql
create schema if not exists identity;

create table identity.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  username         text not null unique,
  full_name        text not null check (char_length(trim(full_name)) between 2 and 120),
  bio              text check (bio is null or char_length(bio) <= 2000),
  phone            text,
  avatar_path      text,
  cover_path       text,
  role             text not null default 'user'
                   check (role in ('user','moderator','admin')),
  verified_org     text check (verified_org is null
                       or char_length(trim(verified_org)) between 3 and 120),
  is_verified      boolean not null default false,
  city_id          bigint,                       -- FK para geography.cities na Fase 3
  neighborhood_id  uuid,                         -- FK para geography.neighborhoods na Fase 3
  termos_aceitos_em timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- I2/I4/I5: imutabilidade e proteção de colunas
create function identity.enforce_profile_invariants() returns trigger
language plpgsql as $$
begin
  if new.username <> old.username then
    raise exception 'username é imutável';
  end if;
  if new.role <> old.role and auth.role() <> 'service_role' then
    raise exception 'role só pode ser alterado por admin';
  end if;
  if (new.verified_org, new.is_verified)
     is distinct from (old.verified_org, old.is_verified)
     and auth.role() <> 'service_role' then
    raise exception 'selo institucional só pode ser concedido por admin';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_enforce_invariants
  before update on identity.profiles
  for each row execute function identity.enforce_profile_invariants();

-- I3/I1: criação automática do perfil com username gerado
create function identity.handle_new_user() returns trigger
language plpgsql as $$
declare
  base  text := identity.slugify(coalesce(new.raw_user_meta_data->>'name', 'usuario'));
  uname text := coalesce(nullif(base, ''), 'usuario-' || substr(md5(random()::text), 1, 8));
  n     int := 1;
begin
  while exists (select 1 from identity.profiles where username = uname) loop
    uname := base || '-' || n;
    n := n + 1;
  end loop;

  insert into identity.profiles (id, username, full_name)
  values (new.id, uname, coalesce(new.raw_user_meta_data->>'name', 'Usuário'));

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function identity.handle_new_user();
```

Índice: `create index profiles_city_neighborhood_idx on identity.profiles (city_id,
neighborhood_id);` (usado pelo feed).

## 7. Políticas RLS

| Ação | Quem |
|---|---|
| `select` em `identity.profiles` | `anon` e `authenticated` (projeção pública é responsabilidade da aplicação — I7) |
| `insert` | `authenticated` com `auth.uid() = id` (a criação normal é pela trigger) |
| `update` | `authenticated` com `auth.uid() = id`, limitado pela trigger (I2, I4, I5) |
| `delete` | `authenticated` com `auth.uid() = id` (encerramento) |

## 8. Endpoints / rotas

| Método | Rota | Entrada | Saída | Erros |
|---|---|---|---|---|
| GET | `/login` | — | página de entrar | — |
| POST | `/auth/login` *(server action)* | e-mail, senha | sessão + redirect `/` | credencial inválida |
| GET | `/cadastro` | — | página de cadastro | — |
| POST | `/auth/register` *(server action)* | nome, e-mail, senha, aceite | sessão + redirect `/` (P1) | e-mail em uso, senha fraca |
| GET | `/auth/callback` | `code` (OAuth) | sessão + redirect `/` | código inválido |
| POST | `/auth/logout` *(server action)* | — | sessão encerrada + redirect `/` | — |
| GET | `/perfil/{username}` | username | perfil público (I7) | 404 |
| GET | `/perfil/editar` | sessão | formulário do próprio perfil | 401 |
| POST | `/perfil/editar` *(server action)* | campos do perfil | perfil atualizado | validação |
| POST | `/perfil/encerrar` *(server action)* | senha | conta encerrada + redirect `/` | senha incorreta |
| GET | `/solicitar-selo` | sessão | formulário/estado do pedido de selo (P13/B2) | 401 |
| POST | `/solicitar-selo` *(server action)* | órgão, evidência, e-mail/mensagem | pedido criado (pending) | já verificado, já pendente, dados inválidos |

> As ações de staff sobre a fila de pedidos (`ListBadgeRequests`,
> `ApproveBadgeRequest`, `RejectBadgeRequest`) ficam no contexto **Moderation** e
> aparecem no `/admin` — aprovar concede o selo pelo mesmo `GrantBadge`.

## 9. Testes derivados

**Unidade (domínio):**
- `Username.fromName` normaliza "Ana Maria Silva" → `ana-maria-silva`.
- `Username.fromName("ÇÃ")` → vazio → `fallback()` gera `usuario-<8>`.
- `Username` rejeita string com caractere inválido.
- `Profile` rejeita `verifiedOrg` com 2 caracteres.
- `Profile` rejeite `role` fora do enum.
- Atualização de perfil não altera `username`/`role`/`verifiedOrg` (regra da aplicação).

**Integração/RLS (quando houver banco de teste):**
- usuário A não atualiza perfil de B.
- usuário A não consegue alterar o próprio `role`/`verified_org` (trigger).
- trigger cria perfil com username único ao inserir em `auth.users`.
- dois nomes iguais geram usernames distintos (`ana`, `ana-1`).

**E2E (Fase 9, Playwright):** cadastro com e-mail → `/` (o feed é a home); login Google; editar perfil;
ver perfil público por URL; encerrar conta.

## 10. Dependências e o que fica para outras fases

- **Depende de:** Supabase Auth (D2); `geography.cities`/`neighborhoods` para cidade/bairro
  — as FKs foram criadas na migration de Geography (Fase 3): `city_id` simples e
  `(neighborhood_id, city_id)` composta, que também garante G4 (bairro pertence à cidade).
- **Fica para a Fase 3:** UI de seleção cidade → bairro em cascata.
- **Fica para a Fase 4:** anonimização das publicações no encerramento de conta
  (a parte de Identity — apagar perfil e dados próprios — está pronta na Fase 2; a
  anonimização é acrescentada quando `publication.publications` existir, conforme I8).
- **Fica para a Fase 7:** `/admin` (concessão de selo, promoção de moderador, trilha).
