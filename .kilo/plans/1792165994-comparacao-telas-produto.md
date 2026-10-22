# Plano de Pesquisa de Produto — Comparação de Telas com Mercado

## Objetivo
Percorrer todas as telas do app "Minha Cidade", comparar cada uma com padrões de mercado (Instagram, Facebook, X/Twitter, LinkedIn, TikTok, Nextdoor, etc.) e listar, com base nos specs existentes (`docs/04-contexts`), o que já está especificado e pode ser implementado versus o que falta.

## Telas mapeadas no app (código + specs)

| Tela / Rota | Status implementação | Fonte docs |
|---|---|---|
| `/login` | Implementado (Fase 2) | `docs/04-contexts/identity-access.md` |
| `/cadastro` | Implementado (Fase 2) | `docs/04-contexts/identity-access.md` |
| `/perfil/{username}` (público) | Implementado (Fase 2/6) | `identity-access.md`, `social-graph.md` |
| `/perfil/editar` | Implementado (Fase 2) | `identity-access.md` |
| `/feed` (páginado, filtros cidade/bairro/tipo) | Implementado (Fase 4) | `publication.md` |
| `/publicar` | Implementado (Fase 4) | `publication.md` |
| `/publicacao/{id}` (detalhe + engajamento) | Implementado (Fase 4/5/7) | `publication.md`, `engagement.md`, `moderation.md` |
| `/salvos` (bookmarks privados) | Implementado (Fase 5) | `engagement.md` |
| `/amigos/{username}` (lista pública de amigos) | Implementado (Fase 6) | `social-graph.md` |
| `/amigos/solicitacoes` (pedidos de amizade) | Implementado (Fase 6) | `social-graph.md` |
| `/notificacoes` (sino + marcar lida) | Implementado (Fase 8) | `notification.md` |
| `/admin` (fila de moderação) | Implementado (Fase 7) | `moderation.md` |
| `/transparencia` | Link no cabeçalho sem rota (bug D2) | `plano-reescrita-ddd.md` |
| Cabeçalho global com sininho de notificações | Implementado (Fase 8) | `notification.md` |

## Comparação por tela vs mercado

### 1. Perfil público `/perfil/{username}`
**Mercado (2026):**
- Foto de perfil circular + capa/banner (Facebook, LinkedIn, YouTube).
- Bio curta, localização, link externo, categoria/etiqueta de perfil.
- Contadores: seguidores, seguindo, postagens, curtidas/recebidas.
- Grade de postagens em 3:4 (Instagram) ou lista mista (Facebook).
- Botões: seguir/amigos, mensagem, denúncar, compartilhar.
- Stories/highlights (Instagram) — fora do escopo v1.
- Verificação (selo) — já no domínio (`isVerified`, `verifiedOrg`).
- Privacidade: mostrar bairro ou só município (já no app via `showNeighborhood`).

**O que já está no app:**
- Avatar + capa (upload WebP, 10 MiB).
- Nome, username (somente leitura), bio (até 2000), telefone (privado).
- Cidade + bairro com seletor cascata.
- Checkbox "Mostrar onde eu moro no perfil público".
- Role, verificação, email confirmado.
- Link "Ver perfil público".
- Botão de amizade (`FriendshipButton`) e solicitações (Fase 6).
- `ReportButton` para denúncia (Fase 7).

**O que falta / pode ser implementado com base nos specs:**
- Contadores derivados: número de postagens, apoios/oposições recebidos, comentários, salvamentos (não há coluna de contador; deve vir de agregação `engagement.reactions`/`comments` — P8/E9).
- "Postagens do usuário" na grade do perfil (feed filtrado por autor).
- Link externo/website no perfil (campo `bio` existe, mas não campo dedicado).
- Destaque de causas apoiadas (`supported_causes` está no dicionário como string, mas sugere-se tabela própria/JSON tipado — fora de escopo v1).

### 2. Edição de perfil `/perfil/editar`
**Mercado:**
- Edição de foto/capa, nome, bio, localização, privacidade, senha.
- Confirmação de exclusão de conta.

**O que já está no app:**
- Formulário completo com avatar, capa, bio, telefone, localização, `showNeighborhood`.
- Encerramento de conta com confirmação de senha (I8).

**Falta:**
- Alteração de senha (não especificada nos specs lidos).
- Edição de username (explicitamente bloqueado — pode permanecer).

### 3. Feed `/feed`
**Mercado:**
- Timeline misto: posts de amigos + recomendados (algorítmico).
- Filtros: "Para você" vs "Seguindo" (X), "Mais recentes" vs "Mais relevantes" (Facebook).
- Formatos: imagem (4:5/3:4), vídeo vertical (9:16), carrossel, texto apenas.
- Botões de reação, comentário, salvar, compartilhar inline.
- Infinite scroll / paginação por cursor.

**O que já está no app:**
- Filtros: cidade, bairro (cascata), tipo (problema/ideia), busca por cidade.
- Ordenação recente, paginada (cursor).
- Publicações tipo `problem` ou `idea` (P5).
- Anonimato opcional na publicação (P4).
- Reações apoio/oposição, comentários, salvamentos inline via `EngagementSection`.
- Realtime para contadores e novos comentários (D8).

**Falta / pode ser implementado:**
- Feed "Para você" algorítmico (não está em spec; requer Phase 9+ analytics).
- Compartilhamento externo (não especificado).
- Suporte a carrossel de múltiplas imagens (migração permite `image_1..3`, mas UI ainda não mostra múltiplas).
- Vídeo no feed (migração permite `video`, mas UI ainda não exibe).

### 4. Publicar `/publicar`
**Mercado:**
- Composer com texto, foto, vídeo, localização, anonimato, público/privado.

**O que já está no app:**
- Formulário com tipo (problema/ideia), título, conteúdo, mídia (WebP ≤ 10 MiB via Storage).
- Anonimato opcional.
- Limite de taxa: 5/h e 20/dia (M9).

**Falta:**
- Marcação de localização/bairro na publicação (não especificada nos specs lidos).
- Agendamento de publicação (fora de escopo v1).

### 5. Detalhe da publicação `/publicacao/{id}`
**Mercado:**
- Post completo, reações, comentários aninhados, salvar, denúncar, compartilhar, editar/apagar (autor).

**O que já está no app:**
- `ReactionButtons` (apoio/oposição com contadores, toggle otimista, Realtime).
- `CommentList` + `CommentForm` (anonimato, edição até 15 min, soft-delete, ocultação moderação).
- `SaveButton` (salvar/desmarcar privado).
- `ReportButton` (moderação, motivo fechado).
- Edição/apagamento do próprio post.

**Falta:**
- Comentários aninhados/respostas (flat apenas).
- Compartilhamento direto (não especificado).

### 6. Salvos `/salvos`
**Mercado:**
- Guarda/coleções privadas, visualização em grade ou lista.

**O que já está no app:**
- Lista privada de publicações salvas pelo usuário (E6).

**Falta:**
- Coleções/pastas de salvos (fora de escopo v1).

### 7. Amigos `/amigos/{username}` e `/amigos/solicitacoes`
**Mercado:**
- Lista de amigos seguidos/seguidores, solicitações pendentes, aceitar/recusar, remover amizade.

**O que já está no app:**
- Lista pública de amigos de um usuário.
- Página de solicitações pendentes.
- Botão de amizade no perfil (pendente/aceito/removido).
- Realtime na tabela de amizades.

**Falta:**
- Sugestões de amigos "pessoas que você pode conhecer" (não especificado).
- Histórico de interações (fora de escopo v1).

### 8. Notificações `/notificacoes`
**Mercado:**
- Central de notificações: curtidas, comentários, menções, novos amigos, atividades.

**O que já está no app:**
- Sino no cabeçalho com contagem.
- Página `/notificacoes` com marcar como lida.
- Tipos fechados (N3), não notifica autor da ação (N2), Realtime.

**Falta:**
- Agrupamento de notificações similares (não especificado).
- Notificações por push (mobile/PWA — Fase 9+).

### 9. Admin `/admin`
**Mercado:**
- Painel de moderação: fila de denúncias, ocultar/restaurar/remover conteúdo, banir usuários.

**O que já está no app:**
- Fila (≥ 3 denúncias), ocultar/restaurar/remover via `service_role`.
- Trilha append-only de ações de moderação.

**Falta:**
- Dashboard de métricas de moderação (analytics Fase 9+).
- Gestão de usuários (banir/desbanir).

### 10. Cabeçalho global
**Mercado:**
- Logo, busca, notificações, perfil, criar postagem.

**O que já está no app:**
- Busca? (não confirmada nos specs lidos).
- Sino de notificações.
- Link `/transparencia` quebrado (bug D2 — sem rota).

## O que já está especificado e pode ser implementado (baseado em docs existentes)

Todos os itens abaixo já têm spec (`docs/04-contexts/*`) e/ou migration pronta. Cabe apenas à implementação de UI/UX:

1. **Contadores derivados no perfil e feed** — agregar `engagement.reactions` e `engagement.comments` sem coluna de contador (P8/E9).
2. **Grade de postagens do autor no perfil** — filtrar feed por `author_id`.
3. **Múltiplas imagens por publicação** — usar `publication_media` / `image_1..3` já na migration Fase 4.
4. **Vídeo no feed** — coluna `video` já existe na migration Fase 4.
5. **Compartilhamento de publicação** — não há spec; pode ser criado com base em `publication.publications` (não requer nova migration).
6. **Link externo/website no perfil** — pode adicionar campo opcional (não quebra specs).
7. **Página `/transparencia`** — criar rota (bug D2 já identificado).
8. **Busca global no cabeçalho** — não especificada; pode ser adicionada como melhoria de produto.

## Lacunas de produto (fora dos specs atuais — sugerir para v2/v3)

- Feed algorítmico "Para você" (requer analytics Fase 9+).
- Stories/highlights efêmeros.
- Mensagens diretas (DM).
- Carrossel de imagens e suporte nativo a vídeo no UI.
- Coleções de salvos.
- Sugestões de amizade.
- Push notifications (PWA Fase 9).
- Compartilhamento para redes externas.
- Agendamento de publicações.

## Plano de ação sugerido (ordem de execução)

1. Implementar contadores derivados (apoios/oposições/comentários) no perfil público e feed — usar agregações existentes.
2. Criar grade de postagens do autor na tela `/perfil/{username}`.
3. Adicionar suporte a múltiplas imagens e vídeo no UI de `/publicar` e `/feed`.
4. Criar rota `/transparencia` e corrigir link no cabeçalho (bug D2).
5. Adicionar botão de compartilhamento em `/publicacao/{id}`.
6. Adicionar campo de link/website no formulário de perfil (opcional).
7. Documentar decisões de produto em `docs/04-contexts/` para itens acima (se houver novo spec).

## Validação
- Rodar `npm run test` (ou equivalente do projeto) após cada alteração.
- Rodar `npm run lint` e `npm run typecheck` se disponíveis.
- Validar no stack local Supabase (`supabase db reset` + seed) para garantir RLS e triggers.
- Testes e2e para feed, perfil, reações, comentários e salvamentos.

## Observações
- Não implementar código neste plano (plan mode). Este documento serve como especificação de produto para execução por agente de implementação.
- Todas as recomendações acima respeitam os invariantes existentes (sem JOIN entre schemas — D7, sem coluna de contador — P8/E9, RLS negativa por padrão).
