# ADR-0024 — Referência visual Rede Social Local como padrão do frontend

- **Status:** Aceito
- **Data:** 2026-10-21
- **Substitui:** ADR-0022 para decisões de identidade visual do frontend

## Contexto

O projeto contém uma implementação visual completa em
`docs/02-design/referencia-rede-social-local/`, mas o design system e o app estavam usando
paletas diferentes. A instrução do produto é usar essa referência existente como padrão para as
telas reais. Algumas telas de demonstração também apresentavam contagens, pessoas e ações que
não vinham do backend.

## Decisão

A implementação em `referencia-rede-social-local/` é o contrato visual do frontend. O app adota
o fundo verde claro, superfícies brancas, tinta escura, teal, coral e âmbar de categoria da
referência. O coral de ação passa a `#b54230` para manter o contraste com texto branco; os demais
elementos preservam a direção visual. Manrope usa fallback de sistema e títulos semânticos usam
a serifada do sistema.

O layout de referência é aplicado sem substituir rotas, dados ou regras de negócio existentes.
Links e ações usam destinos reais; conteúdo de exemplo não é apresentado como dado do produto.
Tokens legados (`surface`, `text-*` e `border-*`) apontam para os mesmos valores da referência.
O tema do manifesto e os ícones PWA acompanham o token brand-600.

## Consequências

- As páginas compartilham uma paleta, tipografia e navegação compatíveis com a referência.
- O coral fica mais escuro em ações e rótulos para atender WCAG AA em texto normal.
- `design-system.md`, o manifesto e `generate-pwa-icons.mjs` acompanham a decisão.
- A navegação inclui somente destinos implementados; novos destinos precisam de rota e dados
  reais antes de aparecer como ação disponível.

## Alternativa descartada

Manter o verde-garrafa e o concreto definidos no ADR-0022 deixaria o app divergente da referência
visual completa já presente no repositório.
