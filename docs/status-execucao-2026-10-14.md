# Status de execução — 2026-10-14 ~04:00 (handover para retomar)

> Retomar **sem investigar**: o trabalho está no working tree (nada commitado desde
> `1e373a3`, 12/10). Este arquivo + o plano
> `.kilo/plans/1791938523555-retomada-pos-b1-b4.md` (seção "ESTADO DE EXECUÇÃO")
> contêm tudo que a próxima sessão precisa.

## Feito e validado

| # | Item | Evidência |
|---|---|---|
| 0 | Fase 0 — validação da base | `db reset` limpo; 208 testes unit; lint/typecheck/build verdes; e2e completo 62/62 antes das mudanças |
| 1 | T2 — foto e capa do perfil | migration `20261010000001` ganhou `show_neighborhood boolean not null default true`; `Profile.updateEditableFields` normaliza caminho vazio → null; `toPublicView` omite bairro quando false (I7); repositório projeta condicionado; `POST /api/profile/media` (kind avatars/covers, ≤10 MiB, magic bytes WebP, path `{userId}/{uuid}.webp`, service role); `ProfileForm` com `ProfileImageField` (upload XHR + progresso + remover); helper compartilhado `shared/ui/upload-image.ts` (publication-form refatorado para usá-lo); 4 testes unit (`profile.test.ts`); e2e `07-perfil` 10/10 |
| 2 | T3 — busca de pessoas | porta `ProfileLookup.searchPublicProfiles` + adapter `SupabaseProfileLookup` (ILIKE, limite 20); caso de uso `SearchProfiles` (≥2 caracteres, Result); rota `/amigos/buscar?q=` com lista + `FriendButton` por resultado; `SearchIcon` em `shared/ui/icon.tsx`; link "Pessoas" no cabeçalho (lg+); 5 testes unit; e2e `12-descoberta-pessoas.spec.ts` 12/12 |
| 3 | Decisões de produto | D-1…D-9 (hub `/amigos` com abas, `/amigos/descobrir`, sugestões pelo bairro de quem vê, `show_neighborhood` default true opt-out, aleatórios da plataforma, ver exige sessão/agir exige e-mail confirmado) — todas no plano |

## Em andamento — T4 (filtros do feed)

Código escrito e **compilando** (typecheck/lint limpos). Faltam duas correções de teste:

1. `apps/web/src/shared/ui/feed-filters.tsx` — o botão "Buscar" zera os resultados em
   vez de re-disparar a busca. Handler atual:
   `setSearchRequest({ term: "", loading: false, items: cityOptions })`.
   Trocar por `setSearchRequest({ term, loading: true })` (o efeito com debounce refaz
   o fetch).
2. `apps/web/tests/e2e/03-feed.spec.ts` — o teste "filtro sem resultado" usa
   `?cidade=3205309&tipo=nada`, mas Vitória tem a publicação da ciclovia, então o feed
   não fica vazio. Usar
   `/feed?cidade=3201308&bairro=00000000-0000-0000-0000-000000000000`.

Depois: `npx playwright test 03-feed --reporter=line` (14 testes).

## Próximas tasks (ordem do plano)

1. **T5** — selo institucional no card do feed e em `publicacao/[id]` (ajustar a
   projeção do repositório de publication se preciso; e2e com `prefeitura-cariacica`).
2. **T6** — `docs/03-data/runbook-curadoria-bairros.md` + README (cidades = 5.571
   municípios; bairros curados por município).
3. **S1–S6 — Hub Amigos** (decisões D-1…D-9 no plano):
   - S1 coluna `show_neighborhood` **já existe e já está aplicada** (feita junto com T2);
   - S2 projeção I7 **já condicionada** (feita em T2) — revisar se falta algum ponto
     de leitura;
   - S3 `SuggestFriends` (mesmo bairro do viewer; exclui própria pessoa, amigos e
     pendentes nos dois sentidos; 10 aleatórios) + `DiscoverRandomPeople` (plataforma
     inteira; 5 por lote; `exclude[]` teto 20) + portas de leitura em Identity;
   - S4 `/amigos` 3 abas (Amigos | Solicitações | Sugestões) + `/amigos/descobrir`
     (cartões + "pular" acumulando `exclude`), estado vazio honesto (D-8);
   - S5 `showNeighborhood` já aceito em `updateProfileAction`/`ProfileForm`;
   - S6 e2e `12-amigos-hub` + docs (`identity-access.md`, `social-graph.md`,
     `dicionario-dados.md`, README).
4. **Incongruências** (seção própria do plano): A1 feed com sessão/convite de bairro,
   A3 dropdown no sininho, A3b link `/admin` no cabeçalho, A4 Realtime de amizades ou
   ajuste do README, B1–B4 derivas de doc (README 12 usuários, dicionário 5º tipo,
   `status-lancamento`, ADR do desvio B2), A6–A8 casos de uso de Identity/Publication.
5. **Fase 3** — `db reset` 2×, build, start, e2e mobile+desktop, Lighthouse `/` e
   `/feed`; **commits só depois do "ok, roda" do usuário**, um por contexto.

## Ambiente e como subir

```
docker desktop start            # stack completa (API :54321, PG :54322, Inbucket :54324)
cd apps/web
npm run dev                     # porta 3000 (playwright.config.ts reutiliza)
# em outro terminal, na raiz quando precisar do banco:
npx --yes supabase db reset
npm test -- --run               # unitários (208 antes de T4)
npx playwright test --reporter=line
```

## Armadilhas (não reaprender)

1. Importar módulo server-only (ex.: `identity/infrastructure/supabase/storage.ts`, que
   puxa `next/headers`) dentro de componente cliente **passa em lint/typecheck** e causa
   500 em todas as rotas. Helpers de URL pública ficam em
   `identity/infrastructure/supabase/public-url.ts`. Rodar `npm run build` antes do e2e
   ao mexer em `shared/`.
2. Checkbox desmarcado é omitido do FormData: `formData.has()` fica falso — usar
   `check(formData, campo)`.
3. `npm test --silent -- run` trata "run" como filtro do vitest. Usar `npm test -- --run`.
4. HMR velho: export novo em módulo de aplicação aparece como "X is not a constructor"
   no browser mesmo com typecheck limpo — reiniciar o `npm run dev`.
5. PowerShell não tem heredoc e quebra `node -e` com aspas; usar a ferramenta de edição.
6. Scripts do task-observer exigem caminho POSIX (`/c/Users/gusta/...`).

## Observações do task-observer registradas nesta sessão

- `0001-next-client-server-boundary-invisible-to-typecheck.md` — violação de fronteira
  cliente/servidor invisível ao typecheck (logado em
  `~/.config/kilo/task-observer/skill-observations/observation-log/`).
