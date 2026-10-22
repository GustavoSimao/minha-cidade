# Plano: Correção Completa de Responsividade Mobile — Código vs Modelo de Referência

## Objetivo
Deixar o mobile (≤760px) IDÊNTICO ao modelo de referência em `docs/02-design/referencia-rede-social-local/src/App.tsx` + `src/index.css`. O desktop está aceitável e não deve ser alterado.

## Descoberta crítica: o modelo de referência NÃO tem drawer/hamburguer no mobile

No modelo de referência:

| Elemento | Comportamento mobile (referência) | Código atual | Status |
|----------|----------------------------------|--------------|--------|
| Sidebar | `display: none` — some completamente | Drawer com `translate-x-full` → `translate-x-0` | ❌ Errado |
| Hambúrguer menu | Não existe | Botão no header `block md:hidden` | ❌ Errado |
| Overlay escuro | Não existe | Div `z-[40]` que fecha drawer | ❌ Errado |
| Navegação mobile | BottomNav fixa: Início, Mapa, Avisos (Notificações), Perfil + mobile-create | BottomNav com Salvos extra | ⚠️ Item extra |
| Header mobile | Só mobile-logo visível; page-title, location, avatar ocultos | Mesmo, mas com hamburguer extra | ❌ Errado |

**Decisão:** O drawer sidebar do mobile deve ser REMOVIDO completamente. Navegação mobile é via BottomNav.

---

## Comparação detalhada — Mobile

### 1. Sidebar mobile — REMOVER COMPLETAMENTE

| Item | Código atual | Referência | Ação |
|------|-------------|------------|------|
| Sidebar drawer | `<aside className="sidebar fixed ... -translate-x-full ... block md:hidden">` | `display: none` | Remover o bloco inteiro (linhas 150-203) |
| Overlay | `{sidebarOpen && (<div ... z-[40] ...>)}` | Não existe | Remover (linhas 206-208) |
| Estado `sidebarOpen` | `useState(false)` | Não existe | Remover (linha 86) |
| `setSidebarOpen(false)` | Usado em `go()` | Não existe | Remover (linha 90) |
| `onMenu={() => setSidebarOpen(true)}` | Passado para `<Header>` | Não existe | Remover (linha 215) |
| Desktop sidebar | `sidebar-desktop` com `md:block hidden` | Sidebar sempre visível no desktop | Manter inalterado |

### 2. Header — remover hamburguer

| Item | Código atual | Referência | Ação |
|------|-------------|------------|------|
| Hambúrguer | `<Button className="block md:hidden ..." onClick={onMenu}>` | Não existe | Remover (linhas 39-50) |
| Prop `onMenu` | Recebido e usado | Não existe | Remover da assinatura e uso |

### 3. BottomNav — ajustar itens

| Item | Código atual | Referência | Ação |
|------|-------------|------------|------|
| Item "Salvos" | Existe como botão separado | Não existe no BottomNav mobile | Remover |
| Item "Avisos" | Existe (Notificações) | Existe | Manter |
| Badge notificações | `w-[15px] h-[15px] text-[7px]` top:-3px right:[8px] | Mesmo | OK |
| mobile-create | Existe | Existe | OK |

### 4. Content padding — verificar CSS

O código usa `p-[30px_34px_70px]` (Tailwind class) no JSX, mas o CSS mobile já sobrescreve com `padding: 20px 14px 95px !important` na linha 310 do globals.css. Como `!important` tem prioridade, o valor correto será aplicado no mobile. No entanto, é melhor limpar a classe Tailwind para evitar confusão.

---

## Tarefas de implementação

### T1 — Remover drawer sidebar do mobile (`home-shell.tsx`)
- Remover estado `sidebarOpen` (linha 86)
- Remover `setSidebarOpen(false)` do `go()` (linha 90)
- Remover todo o `<aside className="sidebar fixed ...">` (linhas 150-203)
- Remover o overlay `{sidebarOpen && (...)}` (linhas 206-208)
- Remover `onMenu={() => setSidebarOpen(true)}` do `<Header>` (linha 215)

### T2 — Remover hamburguer do header (`header.tsx`)
- Remover o bloco `{onMenu && (<Button ...>)}` (linhas 39-50)
- Remover `onMenu` da assinatura do componente
- Manter `page-title`, `location`, `avatar` já ocultos no mobile via CSS

### T3 — Ajustar BottomNav (`bottom-nav.tsx`)
- Remover o item "Salvos" do BottomNav (manter apenas Início, Mapa, Avisos/Notificações, Perfil + mobile-create)

### T5 — Validação
- `tsc --noEmit`: 0 erros
- `npm run lint`: 0 erros
- `npm run build`: sucesso
- Testar mobile: BottomNav visível com 4 destinos + plus central, SEM sidebar drawer, SEM hamburguer

---

## Critérios de aceitação (mobile)

- [ ] Mobile ≤760px: BottomNav fixa inferior com 4 destinos (Início, Mapa, Avisos, Perfil) + mobile-create central
- [ ] Mobile ≤760px: Nenhum sidebar drawer visível
- [ ] Mobile ≤760px: Nenhum hamburguer no header
- [ ] Mobile ≤760px: Header mostra apenas logo + ícone notificações
- [ ] Desktop >760px: Sidebar fixo à esquerda (grid), BottomNav oculto, hamburguer oculto
- [ ] `tsc`, `lint`, `build` com 0 erros

---

## Arquivos afetados

- `apps/web/src/shared/ui/home-shell.tsx` — remover drawer, overlay, estado sidebarOpen, onMenu
- `apps/web/src/shared/ui/header.tsx` — remover botão hamburguer e prop onMenu
- `apps/web/src/shared/ui/bottom-nav.tsx` — remover item "Salvos"

---

## Próximo passo

Mudar para modo code e executar T1–T5.