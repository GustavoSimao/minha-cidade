# Minha Cidade — Decisões de produto travadas e plano de execução atualizado

> **Situação:** 22 decisões de produto resolvidas em 2026-10-10 (lista P1–P22 abaixo).
> O plano completo (fases 0–12, arquitetura, Apêndice A com o schema de referência do
> sistema antigo) está em `docs/plano-reescrita-ddd.md`. Este arquivo registra **o que
> foi decidido agora**, o que precisa ser propagado para os documentos e os próximos
> passos de implementação.

---

## 1. Achado factual que não pode ser perdido (verificado em API)

**A API de Localidades do IBGE não publica bairros.** Testado diretamente em
`https://servicodados.ibge.gov.br/api/v1/localidades`:

| Município | `distritos` | `subdistritos` |
|---|---|---|
| Cariacica/ES (3201309) | `[]` | `[]` |
| Vitória/ES (3205309) | 1 distrito ("Vitória") | 9 "Regiões Administrativas" — **não** são bairros |
| São Paulo/SP (3550308) | `[]` | `[]` |

O IBGE tem UFs, municípios, distritos e subdistritos. **Bairro é dado municipal**
(lei do plano diretor / mapa oficial). Fonte oficial de Cariacica já localizada:
- Lei Complementar 171/2025 e mapa de bairros da prefeitura:
  `https://cariacica.es.gov.br/uploads/filemanager_files/mapas/BAIRROS_A1-compactado.pdf`
- Lei 4772/2010 (delimitação dos 100 bairros pelo POT):
  `https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/html/l47722010.html`

Decisão: **IBGE é a base para cidades/UF; bairros vêm de subdistritos IBGE onde existirem
e de fonte oficial municipal (curada, versionada com fonte e data) onde não existirem.**
Usuário nunca cria bairro — apenas seleciona.

---

## 2. Decisões de produto travadas (P1–P22)

| # | Decisão |
|---|---|
| P1 | **Entrada:** cadastro mínimo (Google ou e-mail/senha) → `/feed`. Sem bairro definido, convite no topo para escolher e fallback de publicações recentes da **cidade inteira**. Publicar exige bairro. |
| P2 | **Permissões:** visitante sem conta lê tudo (feed, publicações, comentários, perfis públicos, contadores). Com conta: publicar, reagir, comentar, salvar, amizade, denunciar. Moderador/admin moderam. |
| P3 | **E-mail:** confirmação obrigatória só para **escrever** (publicar, comentar, amizade, denunciar). Login social do Google não precisa confirmar. |
| P4 | **Encerrar conta:** exclusão em cascata dos dados próprios (perfil, reações, comentários, amizades, notificações, salvamentos) e **anonimização das publicações** (autor removido, conteúdo preservado). Confirmação por senha. |
| P5 | **Username:** gerado do nome (trim, espaços→hífen, minúsculas, `[a-z0-9-]`); resultado vazio ⇒ `usuario-` + 8 aleatórios; colisão ⇒ `-1`, `-2`; **imutável** após criado. |
| P6 | **Perfil público:** nome, foto, capa, bio, cidade/bairro, papel, selo verificado, contadores (amigos, publicações, causas apoiadas) e lista de amigos. Privado: e-mail, telefone, notificações, salvamentos. |
| P7 | **Publicação:** tipo (problema/ideia), título, texto, até 3 imagens, cidade/bairro, anonimato. **Sem** endereço exato e **sem** vídeo na v1. |
| P8 | **Feed:** mais recente primeiro, paginado, filtros por bairro (padrão), cidade e tipo. Sem ranking algorítmico. |
| P9 | **Amizade:** aceite mútuo (mão dupla, sem seguidores); lista pública; recusar/cancelar apagam a solicitação; desfazer marca `removed`; **sem bloqueio** na v1. |
| P10 | **Reações e comentários:** apoio/oposição com toggle (mesmo tipo remove, outro troca), única por publicação; comentários simples com anonimato opcional, **sem respostas** na v1; ambos exigem conta e e-mail confirmado. |
| P11 | **Geografia:** IBGE para cidades/UF; bairros = subdistritos IBGE onde existirem + fonte oficial municipal curada; usuário só seleciona. |
| P12 | **Lançamento:** Cariacica/ES com bairros curados (fonte oficial já localizada) + todas as cidades IBGE. Fora de Cariacica o bairro é **opcional** e aparece como "Bairro não informado". |
| P13 | **Badge institucional:** apenas visual, com **nome do órgão** (ex.: "Prefeitura de Cariacica"), concedido manualmente por admin após evidência (link oficial ou e-mail de domínio oficial). **Nenhuma permissão extra.** |
| P14 | **Editar/apagar:** publicação editável livremente pelo autor (`edited_at` registrado) e exclusão **lógica** (`hidden_at`, reversível pela moderação). Comentário: edição em até 15 min, exclusão a qualquer momento, também lógica. Reações e contadores preservados. |
| P15 | **Upload:** JPEG/PNG/WebP, no máximo 3 por publicação, até 10 MiB cada; **redimensionar no cliente** para WebP (máx. 1600px); validação de magic bytes no servidor; upload direto ao Storage com URL assinada. |
| P16 | **Rate limit:** por usuário 5 publicações/hora, 20 publicações/dia, 20 comentários/hora, 10 denúncias/dia; por IP 30 publicações/hora. Mensagem clara ao estourar. |
| P17 | **Denúncia:** só autenticado com e-mail confirmado; motivo em lista fechada (spam, conteúdo impróprio, informação falsa, assédio, outro) + descrição opcional; sem duplicata no mesmo conteúdo; sem auto-denúncia. |
| P18 | **Poderes:** **moderador** oculta/restaura conteúdo e resolve denúncias; **admin** remove definitivamente, concede badge institucional e promove/despromove moderador. Toda ação registrada em `moderation.moderation_actions`. Ninguém modera a própria conta. |
| P19 | **Notificações in-app:** 4 eventos — solicitação de amizade recebida, amizade aceita, apoio/oposição na sua publicação, comentário na sua publicação. Sino com contador, lista em `/notificacoes`, atualização em tempo real. Sem e-mail/push. |
| P20 | **Transparência:** contagens agregadas por bairro, por tipo e no tempo (12 meses), com comparação entre bairros. Nunca dado pessoal, nunca texto de publicação. |
| P21 | **Denunciado permanece visível** até o moderador agir; fila ordenada por volume, com 3+ denúncias sinalizadas e priorizadas. Sem auto-ocultar. |
| P22 | **Mínimo legal:** páginas `/termos` e `/privacidade` em português claro, aceite por checkbox no cadastro, registro em `identity.profiles.termos_aceitos_em`. |

---

## 3. Impacto no schema e nos documentos (a propagar)

**Novas colunas/tabelas que as decisões criaram** (precisam entrar no dicionário de dados e
nas migrations):

- `identity.profiles`: `verified_org text` (nome do órgão, só com badge), `termos_aceitos_em timestamptz`.
- `publication.publications`: `edited_at timestamptz` (P14); `author_id` anulável (P4).
- `moderation.reports`: `reason` como enum fechado (P17), `unique (reporter_id, reportable_type, reportable_id)`.
- `moderation.moderation_actions`: `action` (hide/restore/remove/grant_badge/promote), `actor_id`, `target`, `created_at` (P18).
- `shared.domain_events`: eventos `FriendRequested`, `FriendAccepted`, `PublicationSupported`, `CommentAdded` (P19).

**Documentos a atualizar pelo agente de implementação** (não posso editar em modo plano):

1. `docs/00-product/prd.md` — refletir P1–P22 (permissões, rate limit, badge, transparência, termos).
2. `docs/04-contexts/decisoes-em-aberto.md` — marcar os 21 itens como resolvidos e apontar para P1–P22.
3. `docs/02-design/adr/` — novos ADRs:
   - ADR-0015 **Geografia com IBGE + curadoria municipal** (com a evidência da seção 1).
   - ADR-0016 **Badge institucional visual concedido por admin**.
   - ADR-0017 **Rate limit, denúncia e moderação mínima** (números de P16–P18, P21).
   - ADR-0018 **Ciclo de vida do conteúdo: edição livre e exclusão lógica**.
   - ADR-0019 **Confirmação de e-mail condicional à escrita**.
   - ADR-0020 **Encerramento de conta com anonimização de publicações**.
   - ADR-0021 **Mínimo legal: termos, privacidade e aceite registrado**.
4. `docs/03-data/dicionario-dados.md` — novas colunas/tabelas listadas acima.
5. `docs/03-data/catalogo-ibge.md` — reescrever com a conclusão real (sem bairros no IBGE; fonte municipal) e o seed de Cariacica com fonte e data.
6. `docs/03-data/politica-rls.md` — acrescentar: `verified_org` visível publicamente, `termos_aceitos_em` só do dono, `moderation_actions` só admin/moderador.

---

## 4. Tarefas de implementação (ordenadas)

1. **Propagar as decisões** nos documentos listados na seção 3 (PRD, decisões em aberto, ADRs 0015–0021, dicionário, catálogo, RLS).
2. **Fase 2 — Identity & Access:** escrever `docs/04-contexts/identity-access.md` (template de `docs/04-contexts/README.md`) cobrindo P1, P2, P3, P4, P5, P6, P13, P22; migration do schema `identity` (`profiles`, trigger em `auth.users`, RLS, papéis, `verified_org`, `termos_aceitos_em`); domínio em `apps/web/src/contexts/identity` com testes das invariantes (username, fallback, papéis); rota `/auth/callback`; middleware `@supabase/ssr`; telas de login/cadastro/perfil.
3. **Fase 3 — Geography:** seed IBGE (UF + municípios) e seed curado de Cariacica com fonte/data registradas; seleção cidade→bairro em cascata; bairro opcional fora de Cariacica exibindo "Bairro não informado".
4. **Fase 4 — Publication + feed:** migration, domínio (tipo, anonimato, `edited_at`), Storage com URL assinada e validação de magic bytes, redimensionamento WebP no cliente, feed com filtros (P8), tela de criar com aviso de anonimato.
5. **Fase 5 — Engagement:** reação com toggle, comentários com edição de 15 min, bookmarks privados, Realtime.
6. **Fase 6 — Social Graph:** amizade com constraint anti-duplicata A↔B e P9.
7. **Fase 7 — Moderação:** reports (P17), rate limit (P16), `/admin` (P18, P21), `moderation_actions`.
8. **Fase 8 — Notification:** 4 eventos (P19).
9. **Fase 9 — PWA/performance/acessibilidade.**
10. **Fase 10 — Analytics + `/transparencia`** (P20).
11. **Fase 11 — repo Python de analytics.**
12. **Fase 12 — rollout.**

---

## 5. Validação (por fase, além do Definition of Done)

- Invariantes de domínio com teste de unidade; RLS com teste negativo por tabela.
- Fluxos em viewport mobile (375px) e desktop (1280px) via Playwright a partir da Fase 9.
- Específico das decisões: autor anônimo não resolvível em leitura pública (P4/P7); rate
  limit bloqueia a 6ª publicação na hora (P16); denúncia duplicada rejeitada (P17); badge só
  concedido por admin e sem permissão extra (P13/P18); `/transparencia` sem PIA (P20).

## 6. Riscos novos

| Risco | Mitigação |
|---|---|
| Bairro curado de Cariacica sai do ar (mudança de URL da prefeitura) | Seed versionado no repo com fonte, data e cópia do PDF no repositório de dados |
| Denúncia em massa derruba conteúdo | P21: sem auto-ocultar; fila por volume + moderador |
| Contas múltiplas para burlar rate limit | Limite paralelo por IP (P16) |
| Badge institucional falsificado | Concessão manual com evidência e registro em `moderation_actions` (P13/P18) |
| Exclusão de conta apaga discussão alheia | P4: publicações são anonimizadas, não apagadas |

## 7. Próximo passo

Propagar P1–P22 nos documentos (tarefa 1) e escrever a spec de **Identity & Access**
(tarefa 2) — que é a primeira fase com código.
