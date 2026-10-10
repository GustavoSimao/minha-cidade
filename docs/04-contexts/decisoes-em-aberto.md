# Decisões em aberto (resultado da revisão dos documentos)

Levantado na revisão de consistência de 2026-10-10. **Atualizado em 2026-10-10 após a
rodada de decisões de produto:** os itens abaixo foram **resolvidos** e constam como
P1–P22 em `docs/plano-reescrita-ddd.md` §2 e nas ADRs 0015–0021. O que resta depende das
fases seguintes.

> Este arquivo fica como histórico do que foi decidido e do raciocínio. Novas dúvidas de
> produto devem ser resolvidas **antes** da fase que as implementa.

## Itens resolvidos na rodada P1–P22

| Item original | Resolução |
|---|---|
| Destino após login/cadastro | **P1** — cadastro mínimo → `/feed`, com convite para escolher bairro e fallback na cidade inteira |
| Matriz de permissões | **P2** — leitura pública total; escrita só com conta; moderação por papel |
| Confirmação de e-mail | **P3** — exigida apenas para escrever; login social do Google isento |
| Encerrar conta | **P4** — cascata dos dados próprios + anonimização das publicações |
| Regras do username | **P5** — gerado do nome, fallback `usuario-<8>`, imutável |
| Perfil público | **P6** — nome, bio, local, contadores, amigos; e-mail/telefone privados |
| Campos da publicação | **P7** — tipo, título, texto, 3 imagens, bairro, anonimato; sem endereço exato e sem vídeo |
| Regras do feed | **P8** — recente + filtros bairro/cidade/tipo; sem ranking |
| Regras da amizade | **P9** — aceite mútuo, lista pública, sem bloqueio |
| Reações e comentários | **P10** — apoio/oposição com toggle; comentários simples com anonimato opcional |
| Base de bairros | **P11/P12** — IBGE para cidades/UF; subdistritos IBGE onde existirem; fonte oficial municipal curada onde não existirem; Cariacica/ES no lançamento; bairro opcional fora dela |
| Badge institucional | **P13** — visual, com nome do órgão, concedido manualmente por admin |
| Editar e apagar | **P14** — edição livre do autor + exclusão lógica; comentário editável por 15 min |
| Upload de imagens | **P15** — redimensionar no cliente para WebP (máx. 1600px), até 3 imagens, 10 MiB, validação de magic bytes no servidor |
| Limites de uso | **P16** — 5 publicações/hora, 20/dia, 20 comentários/hora, 10 denúncias/dia por usuário; 30 publicações/hora por IP |
| Denunciar | **P17** — só autenticado com e-mail confirmado; motivo em lista fechada; sem duplicata |
| Poderes da moderação | **P18** — moderador oculta/restaura e resolve; admin remove, concede selo e promove |
| Notificações | **P19** — 4 eventos in-app em tempo real |
| Transparência | **P20** — contagens por bairro, tipo e tempo (12 meses), sem PII |
| Conteúdo denunciado | **P21** — permanece visível até o moderador agir; fila ordenada por volume |
| Termos e privacidade | **P22** — páginas públicas + aceite registrado no cadastro |

## Ajustes já aplicados na revisão anterior

- `docs/03-data/politica-rls.md`: políticas que faltavam (`cities`/`neighborhoods`,
  `publication_media`, `bookmarks`, `moderation_actions`) e regra de manutenção.
- `docs/plano-reescrita-ddd.md`: estrutura de pastas corrigida (testes de unidade junto do
  código; e2e Playwright em `tests/e2e/`, criados na Fase 9).
- `docs/00-product/prd.md`: escopo do admin passou a incluir o registro das ações de
  moderação.

## Nomenclatura

- O projeto vive em **`C:\projetos\minha-cidade`** (pasta "minha-cidade normal"), como
  determinado pelo produto; a pasta temporária `minha-cidade-rewrite` foi removida.
- ADR-0003 e o plano mencionam o nome de repo **`minha-cidade-web`**; o repo Python é
  **`minha-cidade-analytics`**. Definir o nome definitivo do repositório no GitHub antes do
  primeiro push.

## O que ainda depende das próximas fases

| Fase | Decisão a tomar |
|---|---|
| 4 (Publication) | Formatos exatos de upload implementados, ordem das imagens, o que acontece com reações ao apagar publicação |
| 6 (Social Graph) | Abordagem técnica do constraint anti-duplicata A↔B (sentinela vs. índice em expressão) |
| 7 (Moderation) | Limiares de "volume alto" na fila de denúncias (3+ é o inicial) |
| 8 (Notification) | Agregação de notificações similares ("3 pessoas apoiaram") |
| 10 (Analytics) | Lista final de métricas exibidas em `/transparencia` |
