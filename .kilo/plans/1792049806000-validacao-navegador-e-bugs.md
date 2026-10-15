# Plano — Validação no navegador (localhost) e correção de bugs

Criado em 2026-10-12, após a conclusão das Fases 5–8 e da stack local
(`.kilo/plans/1791755597551-mvp-local-fases-5-a-8.md` — todas as etapas concluídas).
Objetivo: você valida o MVP ponta a ponta no navegador, os bugs encontrados são
corrigidos com teste de regressão, e só então o trabalho é commitado.

## Contexto e preparação

```bash
# 1. Docker Desktop no ar (obrigatório)
# 2. Stack + banco (se ainda não estiver rodando):
supabase start
supabase db reset        # recria tudo: 8 migrations + 3 seeds

# 3. App:
npm run dev --prefix apps/web    # http://localhost:3000
```

Usuários de teste (senha `Cidade@123` para todos, e-mails já confirmados):

| E-mail | Quem | Acesso |
|---|---|---|
| `ana@minhacidade.dev` | Ana Souza | user, Bairro Boa Sorte, tem 2 amigos, 3 denúncias recebidas |
| `bruno@minhacidade.dev` | Bruno Lima | user, Aparecida, 2 publicações, 1 salvamento |
| `carla@minhacidade.dev` | Carla Dias | **admin** (moderação), Alto Lage |
| `daniel@minhacidade.dev` | Daniel Rocha | user, Boa Sorte |

Dados já semeados: 6 publicações, reações, 4 comentários, 2 amizades aceitas +
2 pendentes, 3 denúncias na publicação da Ana (para a fila do /admin aparecer),
1 notificação materializada de teste.

**Como testar com dois usuários ao mesmo tempo:** duas abas anônimas/janelas
separadas (ou uma normal + uma privada) com logins diferentes — necessário para
Realtime (contadores, comentários, notificações) e amizades.

## 1. Checklist de validação manual

Marque cada item; anote o que falhar (print + passos + usuário + URL).

### A. Fundação (Fases 0–4)
- [ ] `/` carrega; links do cabeçalho funcionam.
- [ ] **Cadastro**: `/cadastro` com e-mail novo → mensagem de confirmação →
      e-mail chega no **Inbucket** (`http://127.0.0.1:54324`) → link de confirmação
      funciona → login possível.
- [ ] **Login/logout**: entrar com `ana@` / `Cidade@123`; sair; entrar errado dá erro claro.
- [ ] **Editar perfil** (`/perfil/editar`): mudar nome/bio/telefone; trocar bairro
      (seletor cidade → bairro); salvar e ver refletido em `/perfil/{username}`.
- [ ] **Publicar** (`/publicar`): problema com foto (upload WebP ≤ 10 MiB; testar
      > 10 MiB e arquivo não-imagem → deve recusar), ideia sem foto, publicação anônima.
- [ ] **Feed** (`/feed`): publicações aparecem; filtros cidade/bairro/tipo; paginação.
- [ ] **Editar/apagar publicação** (`/publicacao/{id}` como autor): editar título/
      conteúdo; apagar → some do feed (confirmação antes).
- [ ] Em publicação anônima: autor **não** aparece para terceiros (P4).

### B. Engagement (Fase 5)
- [ ] Reagir: apoio → contador sobe; clicar de novo remove (E1); trocar para
      oposição; **outra aba com outro usuário vê o contador mudar sem recarregar**.
- [ ] Comentar: comentário identificado; comentário **anônimo** (não expõe autor);
      editar o próprio (aparece "editado"); apagar; editar de outro autor **não** aparece.
- [ ] Comentário de 1 caractere recusado; contador de comentários confere.
- [ ] Salvar: botão vira "Salvo (remover)"; `/salvos` lista a publicação; remover dali.

### C. Social Graph (Fase 6)
- [ ] `/perfil/bruno-lima` (logado como Ana): botão "Amigos ✓ (desfazer)".
- [ ] `/perfil/daniel-rocha`: "Aceitar pedido"/"Recusar" (ele tem pendente para a Ana? não — o pendente seedado é Daniel→Bruno; testar pelo Bruno).
- [ ] Como Bruno, em `/perfil/daniel-rocha`: aceitar → vira "Amigos ✓"; contador
      "Amigos (N)" sobe nos dois perfis; aparece em `/amigos/{username}` dos dois.
- [ ] Enviar pedido novo (ex.: Ana → Carla) → "Pedido enviado" → cancelar.
- [ ] Recusar pedido → desaparece; amizade aceita → desfazer por qualquer lado.
- [ ] `/amigos/solicitacoes` (privado) lista só recebidos.

### D. Moderação (Fase 7)
- [ ] Logado como Bruno (ou Daniel) em `/publicacao/{id}` da Ana: "Denunciar"
      aparece; motivo fechado; envio duplicado é recusado (M2); denunciar o próprio
      conteúdo **não** mostra o formulário (M8).
- [ ] Como **Carla** (admin): `/admin` mostra a fila (pub da Ana com 3 denúncias),
      ocultar → some do feed e aparece "oculto"; restaurar volta; remover → some
      (só admin vê o botão remover — moderador comum não).
- [ ] Como Ana (user, não-staff): `/admin` → **404**.
- [ ] Limites: publicar 6 vezes seguidas → 6ª é bloqueada com mensagem P16.

### E. Notificação (Fase 8)
- [ ] Sino no cabeçalho: contagem de não lidas; `/notificacoes` lista; "marcar
      todas como lidas" zera a contagem.
- [ ] Com Daniel (aba 2) comentar na pub da Ana (aba 1, logada Ana): o sino da Ana
      atualiza **sem recarregar** (Realtime) e o item linka para a publicação.
- [ ] Notificação não é criada quando o autor comenta na própria publicação (N2).

### F. Responsivo e consistência (P15/P16)
- [ ] Repetir o essencial em **375px** (DevTools): alvos de toque ≥ 44px, sem
      overflow horizontal em /feed, /publicacao/{id}, /admin, /salvos.
- [ ] **1280px**: layout consistente, cabeçalho não quebra.

## 2. Como reportar bugs

Para cada falha, registre:
`URL | usuário logado | passos | esperado | obtido | print`.
Bugs de RLS/dados podem incluir o erro do console/terminal do `npm run dev`.

Prioridade: **P0** impede um fluxo do MVP (login, publicar, comentar, editar perfil),
**P1** atrapalha mas tem contorno, **P2** cosmético.

## 3. Processo de correção (por bug)

1. **Reproduzir**: identificar se é UI (componente/ação), aplicação (caso de uso) ou
   banco (RLS/trigger/migration).
2. **Teste de regressão primeiro**: caso o bug seja de domínio/aplicação, escrever o
   teste que falha (padrão dos contextos em `src/contexts/<ctx>/**/*.test.ts`).
3. **Corrigir** na camada certa (não remendar na UI o que é invariante de domínio).
4. **Se for migration**: corrigir **na própria migration** (ambiente local, `db reset`
   reaplica tudo) e registrar a correção em `docs/plano-reescrita-ddd.md`.
5. **Revalidar**: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
   em `apps/web` + `supabase db reset` quando o banco mudar + repetir o passo do
   checklist que falhou.
6. **Marcar** o item do checklist.

## 4. Critério de "pronto para commitar"

Todos os itens P0/P1 do checklist passando, 4 comandos verdes, `supabase db reset`
limpo. Commits por fase (mensagens no estilo do repo — prefixo do contexto):

- `chore(dev): ligar stack Supabase local com schemas, seeds e .env.local`
- `feat(publication): corrigir policy de SELECT para soft-delete do autor (RLS)`
- `feat(engagement): reações, comentários e salvamentos com Realtime`
- `feat(social-graph): amizades mútuas com par ordenado`
- `feat(moderation): denúncias, fila, trilha e limites de uso`
- `feat(notification): notificações in-app a partir do outbox`
- `docs: status das fases e roteiro de validação local`

(Commits **somente** após o seu "ok, roda" — regra combinada.)

## 5. Riscos e pontos de atenção sabidos

| Risco | Onde aparece | Tratamento |
|---|---|---|
| Fluxos **só validados por API** (não no browser): login com cookie, server actions, upload de mídia, login Google (desabilitado local sem segredos) | Cadastro/login, publicar com foto | Primeiros itens do checklist; correção na camada de interface |
| Realtime depende da publicação `supabase_realtime` e `replica identity full` (já aplicados nas migrations) | Contadores, comentários, sino | Se não atualizar: conferir `docker logs supabase_realtime_minha-cidade` e as migrations 05–08 |
| PostgREST exige schema na lista do `config.toml` (novo schema = stop/start + reset) | Qualquer nova fase | Procedimento documentado no README e no plano |
| Inbucket é o "servidor de e-mail" local | Cadastro/recuperação | `http://127.0.0.1:54324` |
| Seed é recriado a cada `db reset` (bairros com UUIDs novos) | Dados de teste | Lookups por slug no seed; nunca fixar UUID de bairro |

## 6. Depois da validação (próximos ciclos, fora deste plano)

Pendências de produto (foto/capa do perfil, contadores no feed, limite por IP) e
Fases 9–12 (PWA, `/transparencia`, analytics Python, deploy).

---

## Registro da execução (2026-10-12)

Validado **automaticamente** nesta rodada (com o app rodando em localhost:3000):

- [x] Ambiente: 12 containers de pé, `db reset` limpo (8 migrations + 3 seeds).
- [x] Smoke HTTP: todas as rotas públicas 200 (`/`, `/feed`, `/login`, `/cadastro`,
      `/perfil/{user}`, `/amigos/{user}`, `/publicacao/{id}`, `/termos`,
      `/privacidade`); privadas 307 → login; 404 para rota inexistente.
- [x] **Cadastro via API**: usuário criado, perfil gerado pelo trigger
      (`teste-validacao-tres`), `email_confirmed_at` NULL antes de confirmar.
- [x] **BUG P0 corrigido — link de confirmação**: o e-mail padrão do GoTrue
      apontava para a home (redirect implícito, sem sessão). Correções:
      `supabase/templates/confirmation.html` (novo, link com `token_hash` para
      `/auth/callback`), seção `[auth.email.template]` no `config.toml`
      (formato inline `{ subject, content_path }` — a CLI 1.4.2 **não** aceita a
      subtabela simples `[auth.email.template]`, e o `content_path` é relativo à
      raiz do repo), método `verifyEmailToken` no gateway e tratamento de
      `token_hash`/`type` em `src/app/auth/callback/route.ts`. Template só é
      aplicado com `supabase stop && start`.
- [x] **Confirmação ponta a ponta**: e-mail chega no Inbucket com o link
      customizado → GET no callback → 307 para `/feed` →
      `email_confirmed_at`/`confirmed_at` preenchidos → login funciona.
- [x] **P3 no gate**: login de e-mail não confirmado bloqueado
      (`email_not_confirmed`).
- [x] Endpoint `/api/publications/media`: **401 sem sessão** (protegido).
- [x] 4 comandos verdes: lint, typecheck, **181 testes**, build.
- [x] `supabase db reset` final limpo (remove os usuários de teste criados).

**Fica para você validar no navegador** (não automatizável por aqui):
fluxos visuais e de cookie — login pelo formulário, upload de foto no `/publicar`
(WebP, > 10 MiB, não-imagem), editar perfil com seletor cidade → bairro, Realtime
entre duas abas (contadores, comentários, sino), editar/apagar publicação,
amizades, denunciar, `/admin` (ocultar/restaurar/remover como Carla), `/salvos`,
`/notificacoes`, e o responsivo em 375px. Use os 4 usuários do seed
(senha `Cidade@123`).
