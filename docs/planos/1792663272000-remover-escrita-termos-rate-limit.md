# Plano — Remover escrita nos termos + documentar rate limit

## Objetivo
1. Remover a frase "publicações anônimas mantêm a autoria registrada internamente, acessível apenas para moderação" da página de Termos de Uso.
2. Deixar as quantidades do rate limit explícitas para futura atualização dos Termos (informativo, não implementado ainda).

## Escrita a remover
Arquivo: `apps/web/src/app/termos/page.tsx`, linhas 27–29:
```tsx
<li>
  publicações anônimas mantêm a autoria registrada internamente, acessível apenas
  para moderação;
</li>
```
Remover todo o `<li>` mantendo a lista válida (itens anteriores e seguintes permanecem).

## Rate limit — quantidades (informativo, para os Termos)
Fonte: `docs/04-contexts/moderation.md` (invariante M9) + `docs/03-data/dicionario-dados.md`.

| Ação | Escopo | Janela | Limite |
|------|--------|--------|--------|
| Publicar | usuário | hora | 5 |
| Publicar | usuário | dia | 20 |
| Publicar | IP | hora | 30 (só com `TRUSTED_PROXY=1`) |
| Comentar | usuário | hora | 20 |
| Denunciar | usuário | dia | 10 |

Regras: janela deslizante por `(subject_type, subject_id, scope, window_start)`; IP só de `x-forwarded-for`/`x-real-ip` com `TRUSTED_PROXY=1`; ao atingir, `EnforceRateLimit` bloqueia e informa quando tentar novamente.

## Tarefas (ordem)
1. Remover o `<li>` da escrita em `apps/web/src/app/termos/page.tsx` (linhas 27–29).
2. Verificar que não há outra ocorrência da mesma frase no códigobase (busca completa).
3. Rodar `npm run typecheck --prefix apps/web` e `npm run lint --prefix apps/web` (não quebrar build).
4. (Opcional) Atualizar o parágrafo "Limites de uso" dos Termos com as quantidades acima — decidir com o usuário se deve ser feito agora.

## Critérios de aceite
- A frase removida dos Termos de Uso.
- Nenhuma outra ocorrência da frase no repo.
- Typecheck e lint verdes.
- Nenhum commit/push sem permissão.

## Fora de escopo
- Mudar o README.
- Implementar lógica de rate limit (já existe).
- Alterar outras páginas além de termos/page.tsx.
