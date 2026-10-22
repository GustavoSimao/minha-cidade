# Plano: Front Completo "Rede Social Local" — Análise e Comparativo

## Contexto

Este plano documenta o estado atual de todas as telas do app "Minha Cidade", compara com o frontend completo desejado ("Rede Social Local" na pasta Downloads), lista problemas, melhorias, gaps e o que precisa mudar. O arquivo de contexto de produto já está em `.kilo/plans/contexto-app.md` e foi copiado para `C:\Users\gusta\OneDrive\Área de Trabalho\contexto-app.md`.

---

## 1. Mapeamento Completo de Todas as Telas Atuais

### 1.1 Páginas existentes (27 rotas)

| Rota | Página | Status | Observação |
|------|--------|--------|------------|
| `/` | `apps/web/src/app/page.tsx` | Implementado | Home = Feed público paginado, sem landing separada |
| `/login` | `apps/web/src/app/login/page.tsx` | Implementado | Login e-mail/senha + Google |
| `/cadastro` | `apps/web/src/app/cadastro/page.tsx` | Implementado | Cadastro com aceite de termos |
| `/perfil/[username]` | `apps/web/src/app/perfil/[username]/page.tsx` | Implementado | Perfil público com contadores, amigos, publicações |
| `/perfil/editar` | `apps/web/src/app/perfil/editar/page.tsx` | Implementado | Edição do próprio perfil |
| `/publicar` | `apps/web/src/app/publicar/page.tsx` | Implementado | Formulário de publicação |
| `/publicacao/[id]` | `apps/web/src/app/publicacao/[id]/page.tsx` | Implementado | Detalhe da publicação com engajamento |
| `/salvos` | `apps/web/src/app/salvos/page.tsx` | Implementado | Lista privada de salvamentos |
| `/amigos` | `apps/web/src/app/amigos/page.tsx` | Implementado | Hub privado com abas (amigos/solicitações/sugestões) |
| `/amigos/[username]` | `apps/web/src/app/amigos/[username]/page.tsx` | Implementado | Lista pública de amigos de outro usuário |
| `/amigos/descobrir` | `apps/web/src/app/amigos/descobrir/page.tsx` | Implementado | Descoberta de pessoas por bairro |
| `/amigos/buscar` | `apps/web/src/app/amigos/buscar/page.tsx` | Implementado | Busca de pessoas por nome/@username |
| `/amigos/solicitacoes` | `apps/web/src/app/amigos/solicitacoes/page.tsx` | Implementado | Redireciona para /amigos?tab=solicitacoes |
| `/notificacoes` | `apps/web/src/app/notificacoes/page.tsx` | Implementado | Lista de notificações, marcar como lida |
| `/admin` | `apps/web/src/app/admin/page.tsx` | Implementado | Fila de moderação + trilha |
| `/transparencia` | `apps/web/src/app/transparencia/page.tsx` | Implementado | Métricas públicas agregadas |
| `/termos` | `apps/web/src/app/termos/page.tsx` | Implementado | Termos de uso |
| `/privacidade` | `apps/web/src/app/privacidade/page.tsx` | Implementado | Política de privacidade |
| `/solicitar-selo` | `apps/web/src/app/solicitar-selo/page.tsx` | Implementado | Pedido de selo institucional |
| `/not-found` | `apps/web/src/app/not-found.tsx` | Implementado | 404 genérico |

### 1.2 Componentes UI existentes (30+)

- `site-header.tsx` — Cabeçalho com navegação, sino de notificações, perfil
- `site-header-slot.tsx` — Slot do cabeçalho
- `feed-filters.tsx` — Filtros do feed (cidade, bairro, tipo, busca)
- `publication-form.tsx` — Formulário de publicação com upload de até 3 imagens
- `publication-edit-form.tsx` — Edição de publicação existente
- `profile-forms.tsx` — Formulário de edição de perfil (inclui website, capa, avatar)
- `auth-forms.tsx` — Formulários de login/cadastro
- `badge-request-form.tsx` — Formulário de pedido de selo
- `location-picker.tsx` — Seletor cascata cidade → bairro
- `engagement/reaction-buttons.tsx` — Botões apoio/oposição com contadores
- `engagement/save-button.tsx` — Botão salvar/remover (privado)
- `engagement/share-button.tsx` — Botão de compartilhamento (Web Share API)
- `engagement/comment-form.tsx` — Formulário de comentário com anonimato
- `engagement/comment-list.tsx` — Lista paginada de comentários
- `engagement/comment-item.tsx` — Item individual de comentário
- `engagement/engagement-section.tsx` — Seção completa de engajamento
- `moderation/report-button.tsx` — Botão de denúncia
- `moderation/moderation-actions.tsx` — Ações de moderação (ocultar/restaurar/remover)
- `moderation/badge-request-queue.tsx` — Fila de pedidos de selo
- `moderation/staff-profile-actions.tsx` — Ações de staff em perfil
- `avatar.tsx` — Avatar com fallback do nome
- `badge.tsx` — Badge institucional, problema, ideia, moderação
- `empty-state.tsx` — Estado vazio com ícone, título, descrição, ação
- `confirm-dialog.tsx` — Confirmação de ações destrutivas
- `skeleton.tsx` — Carregamento
- `icon.tsx` — Ícones SVG inline (sem emoji)
- `form.tsx` — TextField, Textarea, Select, Button, Alert
- `text-area.tsx` — Textarea com contador de caracteres
- `select.tsx` — Select com validação
- `relative-time.tsx` — Tempo relativo (ex: "2 horas atrás")
- `location-picker.tsx` — Seletor de localização
- `analytics/transparency-charts.tsx` — Gráficos de transparência
- `notification/notification-bell.tsx` — Sino com contagem de não lidas
- `notification/mark-all-button.tsx` — Marcar todas como lidas
- `social-graph/friend-button.tsx` — Botão de amizade
- `social-graph/person-row.tsx` — Linha de pessoa para lista
- `pwa/register-sw.tsx` — Registro do service worker

---

## 2. Comparativo: Estado Atual vs. "Rede Social Local" Completo

### 2.1 O que já existe (funcional)

| Item | Estado | Notas |
|------|--------|-------|
| Feed público paginado | ✅ | Filtros cidade/bairro/tipo, ordenação recente |
| Perfil público e edição | ✅ | Contadores, amigos, publicações, foto, capa, bio |
| Publicar com fotos (até 3) | ✅ | Upload WebP, anonimato opcional, localização |
| Detalhe da publicação | ✅ | Imagens, autor, engajamento, edição/apagar |
| Reações apoio/oposição | ✅ | Toggle único, contadores, Realtime |
| Comentários | ✅ | Anonimato, edição 15 min, soft-delete, ocultação moderação |
| Salvamentos privados | ✅ | Lista privada `/salvos` |
| Amizades mútuas | ✅ | Pedido/aceito/recusar/desfazer, listas públicas |
| Denúncias | ✅ | Motivo fechado, fila ≥3, ocultar/restaurar/remover |
| Notificações in-app | ✅ | Sino com contagem, Realtime, marcar como lida |
| Moderação /admin | ✅ | Fila ordenada, trilha de auditoria, selo institucional |
| Transparência | ✅ | Métricas agregadas, gráficos públicos |
| PWA instalável | ✅ | Service worker, ícones, offline para leitura pública |
| Cabeçalho global | ✅ | Navegação, sino, perfil, publicar |
| Barra inferior mobile | ✅ | 4 destinos (Feed, Publicar, Avisos, Perfil) |

### 2.2 Problemas identificados (incongruências do código vs. produto)

| # | Problema | Onde | Impacto |
|---|----------|------|---------|
| D1 | Classes `text-primary`/`border-primary` não existem (token é `brand-*`) | `reaction-buttons.tsx`, `comment-item.tsx`, `perfil/[username]/page.tsx`, `admin/page.tsx`, `amigos/[username]/page.tsx` | Erros de renderização, cores inconsistentes |
| D2 | Link `/transparencia` no cabeçalho sem rota | `site-header.tsx:51` | Link quebrado (agora corrigido com nova rota) |
| D3 | Links de navegação com alvo de toque < 44px | `site-header.tsx:44-81` | Viola acessibilidade mobile |
| D4 | `text-[10px]` (abaixo do mínimo de 12px) | `comment-item.tsx:58`, `notification-bell.tsx:60` | Texto ilegível, viola acessibilidade |
| D5 | `variant="danger"` em ações não destrutivas | `save-button.tsx:59`, `friend-button.tsx:127` | Semântica errada, cor vermelha em ação normal |
| D6 | Não há landing page separada | `/` é o feed direto | Visitante não tem contexto do app antes de ver o feed |
| D7 | Busca textual não implementada | PRD marca como fora de escopo v1 | Usuário não pode buscar por palavra-chave |
| D8 | Não há feed de amigos (só feed geral/bairro) | PRD fora de escopo v1 | Amizade existe mas não gera feed dedicado |
| D9 | Não há notificações por e-mail/push | PRD fora de escopo v1 | Apenas in-app |
| D10 | Não há busca de publicações | Fora de escopo v1 | Só filtro por cidade/bairro/tipo |

### 2.3 O que falta para ser "Rede Social Local" completo

| Item | Status | Descrição |
|------|--------|-----------|
| Landing page | ❌ | Página de apresentação do app antes do feed (valor, como funciona, cadastro) |
| Busca textual de publicações | ❌ | Buscar por palavra-chave no conteúdo |
| Feed de amigos dedicado | ❌ | Ver só publicações dos amigos (não todo o bairro) |
| Compartilhamento externo | ⚠️ Parcial | `ShareButton` existe mas não está integrado em todas as telas |
| Coleções de salvos | ❌ | Apenas lista simples, sem pastas/categorias |
| Sugestões de amigos avançadas | ⚠️ Parcial | `/amigos/descobrir` existe mas é básico |
| Histórico de edições públicas | ❌ | Não mostra o que mudou ao longo do tempo |
| Marcar publicação como favorita vs. salvar | ⚠️ Parcial | Salvamento existe mas distinção clara de "favorito" não existe |
| Perfil público com destaques | ❌ | Não há seção de publicações destacadas/pinadas |
| Compartilhamento para redes externas | ❌ | Só Web Share API nativa, não gera link para WhatsApp/Telegram/etc. |
| Modo escuro | ❌ | Apenas tema claro (concreto/papel) |
| Edição de perfil com upload de documentos | ❌ | Só foto/capa, não há upload de documentos para verificação de órgão |
| Feed algorítmico "Para você" | ❌ | Só ordenação cronológica |

---

## 3. Melhorias Necessárias (Prioridade)

### P0 — Críticas (bloqueiam lançamento)

1. **Corrigir D1-D5**: Classes de cor inconsistentes, link quebrado, alvos de toque pequenos, texto muito pequeno, variant danger errado
2. **Landing page**: Visitante precisa entender o que é o app antes de ver o feed ou se cadastrar
3. **Busca textual**: Funcionalidade esperada em qualquer rede social
4. **Feed de amigos**: A amizade existe mas não gera conteúdo diferenciado

### P1 — Importantes (melhoram experiência)

5. **Coleções de salvos**: Organizar publicações salvas por tema
6. **Compartilhamento externo**: Links para WhatsApp, Telegram, SMS
7. **Perfil com destaques**: Publicações pinadas no topo do perfil
8. **Modo escuro**: Alternativa de tema para uso noturno
9. **Edição de perfil com documentos**: Upload para verificação de órgão institucional
10. **Notificações por e-mail**: Complementar o in-app

### P2 — Desejáveis (v2)

11. **Feed algorítmico "Para você"**: Recomendação baseada em interesses
12. **Compartilhamento para redes externas nativas**: Instagram, Facebook, Twitter
13. **Histórico de edições**: Ver versões anteriores de uma publicação
14. **Favoritos vs. Salvos**: Duas categorias distintas
15. **Sugestões de amigos avançadas**: "Pessoas que você pode conhecer" com mais critérios

---

## 4. O que NÃO precisa mudar

| Item | Motivo |
|------|--------|
| Arquitetura de bounded contexts | Funciona bem, separação clara |
| Design system (tokens, cores, tipografia) | Bem definido, consistente |
| Regras de negócio (invariantes P1-P22, E1-E10, S1-S7, M1-M9) | Cobertas por testes, não quebrar |
| RLS por contexto | Segurança correta, não alterar |
| Server Actions para escrita | Padrão estabelecido, não mudar |
| Realtime onde especificado | Funcionando para contadores, comentários, notificações, amizades |
| PWA instalável | Já implementado, funcional |

---

## 5. Plano de Implementação do Front "Rede Social Local"

### 5.1 Local de destino

- Pasta: `C:\Users\gusta\Downloads\Rede Social Local\`
- Estrutura: Projeto Next.js standalone ou cópia do app web existente com melhorias

### 5.2 Arquivos a criar/alterar no frontend

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `app/landing/page.tsx` | Criar | Landing page de apresentação do app |
| `app/page.tsx` | Alterar | Feed continua sendo home, mas landing pode ser rota separada `/landing` |
| `components/landing-hero.tsx` | Criar | Seção principal da landing |
| `components/landing-features.tsx` | Criar | Funcionalidades do app |
| `components/landing-testimonials.tsx` | Criar | Depoimentos/exemplos de uso |
| `app/search/page.tsx` | Criar | Página de busca textual de publicações |
| `app/amigos/feed/page.tsx` | Criar | Feed dedicado aos amigos |
| `components/share-external.tsx` | Criar | Compartilhamento para redes externas |
| `components/saved-collections.tsx` | Criar | Coleções de salvamentos |
| `components/profile-highlights.tsx` | Criar | Publicações destacadas no perfil |
| `components/theme-toggle.tsx` | Criar | Alternador modo claro/escuro |
| `app/perfil/editar/page.tsx` | Alterar | Adicionar upload de documentos para verificação |

### 5.3 Correções de bugs (D1-D5)

| Bug | Arquivo | Correção |
|-----|---------|----------|
| D1 | `reaction-buttons.tsx:62`, `comment-item.tsx:107`, `perfil/[username]/page.tsx:149`, `admin/page.tsx:96`, `amigos/[username]/page.tsx:45` | Substituir `text-primary`/`border-primary`/`bg-primary/10` por `text-brand-*`/`border-brand-*`/`bg-brand-*` |
| D2 | `site-header.tsx:51` | Link `/transparencia` já tem rota (verificar se funciona) |
| D3 | `site-header.tsx:44-81` | Aumentar padding dos links de navegação para ≥ 44px |
| D4 | `comment-item.tsx:58`, `notification-bell.tsx:60` | Alterar `text-[10px]`/`text-[11px]` para `text-xs` (12px) |
| D5 | `save-button.tsx:59`, `friend-button.tsx:127` | Alterar `variant="danger"` para `variant="secondary"` em ações não destrutivas |

---

## 6. Comparativo Resumido

| Dimensão | Estado Atual | "Rede Social Local" Completo | Gap |
|----------|-------------|------------------------------|-----|
| Telas | 27 rotas implementadas | ~35 rotas (incluindo landing, busca, feed de amigos, coleções) | +8 telas |
| Componentes UI | 30+ | ~40 (inclui landing, share-external, collections, highlights, theme-toggle) | +10 componentes |
| Funcionalidades core | Feed, publicar, engajar, conectar, moderar, notificar | Todas as acima + busca textual, feed de amigos, coleções, compartilhamento externo, destaques, modo escuro | +7 funcionalidades |
| Problemas conhecidos | 5 bugs (D1-D5) | 0 bugs | -5 |
| Acessibilidade | Parcial (alguns problemas) | Total (WCAG AA, alvos 44px, contraste AA) | Melhoria |
| PWA | Implementado | Implementado + modo escuro offline | Melhoria |

---

## 7. Próximos Passos

1. **Validar este plano** com o usuário
2. **Switch para modo code** para implementação efetiva:
   - Criar a pasta `C:\Users\gusta\Downloads\Rede Social Local\`
   - Copiar o app web existente como base
   - Aplicar correções D1-D5
   - Implementar landing page, busca, feed de amigos, coleções, compartilhamento externo, destaques, modo escuro
   - Validar com testes e lint/typecheck
3. **Incluir este plano como contexto** no frontend gerado (cópia em `Rede Social Local/docs/plano-implementacao.md` ou similar)

---

## 8. Arquivos de referência já criados

- `.kilo/plans/contexto-app.md` — Contexto de produto (negócio apenas, sem código)
- Copiado para: `C:\Users\gusta\OneDrive\Área de Trabalho\contexto-app.md`

---

## 9. Nota sobre modo plan vs. code

Este documento é um **plano** (modo plan). A implementação efetiva do frontend em `C:\Users\gusta\Downloads\Rede Social Local\` requer mudança para **modo code** (agente capaz de editar arquivos e rodar comandos mutantes). O usuário deve solicitar essa transição para iniciar a codificação.