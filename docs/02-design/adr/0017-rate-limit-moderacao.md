# ADR-0017 — Rate limit, denúncia e poderes de moderação

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P16, P17, P18, P21

## Contexto
Feed público com publicação anônima atrai spam e abuso. A moderação precisa ser possível
com uma equipe pequena, sem virar censura automática.

## Decisão
**Rate limit** (camada de aplicação, tabela própria):
- por usuário: 5 publicações/hora, 20 publicações/dia, 20 comentários/hora, 10 denúncias/dia;
- por IP: 30 publicações/hora;
- ao estourar, mensagem clara informando quando poderá tentar de novo.

**Denúncia** (`moderation.reports`):
- apenas usuário autenticado com e-mail confirmado;
- motivo em lista fechada (`spam`, `conteudo_inapropriado`, `informacao_falsa`, `assedio`,
  `outro`) + descrição opcional;
- sem duplicata do mesmo usuário no mesmo conteúdo; sem auto-denúncia.

**Poderes:**
- `moderator`: ocultar/restaurar conteúdo e resolver denúncias;
- `admin`: tudo do moderador + remover definitivamente, conceder/revogar selo institucional
  e promover/despromover moderador;
- toda ação em `moderation.moderation_actions` (ator, ação, alvo, data);
- ninguém modera a própria conta.

**Conteúdo denunciado permanece visível** até o moderador agir. A fila é ordenada por
volume de denúncias; 3+ denúncias sinaliza e prioriza. **Nada é ocultado automaticamente**,
para não dar arma de censura em massa.

## Consequências
- Rate limit em tabela própria (não em Postgres) para não poluir o schema de negócio.
- Denúncia duplicada garantida por constraint único.
- A moderação precisa de painel mínimo (`/admin`) desde a v1.
- Sem shadowban/palavras bloqueadas — ficam para ADR futuro de moderação avançada.
