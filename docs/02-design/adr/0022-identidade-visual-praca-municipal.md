# ADR-0022 — Identidade visual "praça/municipal"

- **Status:** Substituído por ADR-0024
- **Data:** 2026-10-12
- **Decisão do plano:** Etapa C do plano de design (`docs/planos/1791837096489-design-correcao-completude-identidade.md`)

## Contexto

O produto nasceu com a aparência padrão do shadcn (índigo `#2563eb`, cartão branco arredondado
de 12px, tipografia única) — o "visual de template" que o próprio repo combate com a skill
`avoid-ai-design`. A Etapa C do plano de design define uma identidade própria para um produto
cívico de bairro, sem alterar os **nomes** dos tokens (para não gerar churn nos componentes).

A primeira proposta da direção era "concreto quente + ocre". O detector do repo marcou o par
fundo creme + acento ocre/terracota como **SD1 — "the Claude look"**: um tell de segunda ordem
exatamente do catálogo que a skill existe para combater. A direção foi mantida no conceito
(municipal, sinalização pública) e corrigida na execução: terreno frio e acento verde-garrafa.

## Decisão

**Direção "praça/municipal"** — concreto frio, papel branco, tinta escura e um único acento
verde-garrafa, com tipografia de display serifada do sistema nos títulos.

| Aspecto | Decisão |
|---|---|
| Acento | verde-garrafa `#1e5b45` (brand-600), `#174835` (hover), tints `#eaf3ee`/`#d3e6dc` |
| Superfícies | concreto `#ececea` (página) e papel `#ffffff` (cartão); borda `#d8d9d6` |
| Tinta | `#1c1917` (títulos), `#44403c` (corpo), `#6a6357` (metadados) |
| Tipografia | display `ui-serif, Georgia` nos `h1`/`h2`; corpo mantém `system-ui` |
| Forma | raio de cartão 12px → 8px; badge de pílula → quadrado de 4px; botão 8px |
| Sombra | `--shadow-stamp: 2px 2px 0 rgb(28 25 23 / 0.08)` (dura, de carimbo) em vez de sombra suave |
| Ícones | conjunto SVG inline (`shared/ui/icon.tsx`); PWA regenerado com a cor do token |

Status (erro/atenção/sucesso) mantêm a semântica e os tons derivados, apenas harmonizados:
danger `#b3261e`, warning `#8a5a00`, success `#4d7c0f`.

## Consequências

- **Positivas:** aparência própria (não é mais o shadcn default); contraste AA verificado par a
  par (19 pares, mínimo 4.56:1); detector `avoid-ai-design` em 0 achados; nomes de token
  preservados, então nenhum componente precisou mudar de classe.
- **Negativas / custos:** o terreno frio é menos "acolhedor" que o creme — a hierarquia passa a
  depender mais da borda e da sombra-stamp; ícones do PWA e cores do manifesto precisam ser
  regerados a cada troca de paleta (script `apps/web/scripts/generate-pwa-icons.mjs`).
- **Ressalva de acessibilidade:** o par mínino conferido é `success`/`success-bg` (4.56:1) —
  se o tom de sucesso escurecer mais, o badge "Ideia" cai do AA.

## Alternativas descartadas

1. **Manter o tokenset indigo/shadcn** — resolve o escopo, mas mantém a aparência de template.
2. **Concreto quente + ocre** (primeira proposta) — descartada pelo SD1 do `avoid-ai-design`.
3. **Acento vermelho municipal** — conflita com a semântica de `danger` (remover/negar).
4. **Modo escuro** — fora de escopo; não há token de superfície escura.
5. **Webfont de display** — violaria a regra de performance do design system (sem webfont na
   primeira pintura).
