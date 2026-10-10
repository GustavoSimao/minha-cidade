# ADR-0018 — Ciclo de vida do conteúdo: edição livre e exclusão lógica

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P14

## Contexto
Errar uma palavra ou anexar a imagem errada é comum no celular. Apagar tudo por engano
destrói discussão alheia. Mas deixar conteúdo editável para sempre dificulta a moderação e
a leitura do que foi dito.

## Decisão
- **Publicação:** o autor edita quando quiser (título, texto, imagens). `edited_at`
  registra a última edição; a tela exibe "editado". Exclusão é **lógica**
  (`hidden_at`/`hidden_by`) e **reversível** pela moderação.
- **Comentário:** edição liberada por **15 minutos** após publicar; exclusão a qualquer
  momento, também lógica.
- **Reações e contadores são preservados** em qualquer um dos casos.
- Estado visível = `hidden_at is null`. Conteúdo ocultado sai do feed e das listas públicas.

## Consequências
- `publication.publications.edited_at timestamptz` e colunas `hidden_at`/`hidden_by`
  (padrão já previsto em `docs/03-data/convencoes-schema.md` §5).
- Nenhum `delete` físico em conteúdo publicado — preserva histórico de moderação e
  integridade das discussões.
- Janela de 15 minutos do comentário é regra de aplicação, não de banco.
