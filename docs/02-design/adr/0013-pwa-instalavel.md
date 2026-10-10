# ADR-0013 — PWA instalável com cache de leitura

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D13

## Contexto
O produto precisa ser efetivamente usável no celular. App nativo em loja exige contas de
desenvolvedor, revisão e manutenção de duas plataformas — custo alto para validar a ideia.

## Decisão
Entregar **PWA instalável** (manifest, ícones, service worker) com cache do shell e das
publicações já lidas, permitindo **leitura offline**. Sem loja de apps na v1; Capacitor
só após a PWA validar (ADR futuro).

## Consequências
- Um deploy na Vercel atende Android, iOS e desktop.
- Instalação sem fricção; ícone na tela inicial.
- Service worker exige versionamento de cache e atualização em background para não
  servir conteúdo velho.
- Push notification fica limitado ao que a web suporta (fora de escopo na v1).
