# ADRs — Architecture Decision Records

Decisões arquiteturais do projeto. ADRs são **imutáveis**: decisão nova cria registro novo;
revogação cria ADR de substituição referenciando o anterior.

## Índice

| ADR | Título | Decisão do plano |
|---|---|---|
| [0001](0001-nextjs-typescript-vercel.md) | Next.js + TypeScript na Vercel como stack do app | D1 |
| [0002](0002-supabase-backend.md) | Supabase como backend (Postgres, Auth, Storage, Realtime, pg_cron) | D2 |
| [0003](0003-repos-novos.md) | Repositório novo para o app e separado para analytics | D3 |
| [0004](0004-docs-como-fonte-de-verdade.md) | Documentação como fonte da verdade | D4 |
| [0005](0005-bounded-contexts.md) | Bounded contexts e regras de dependência | D5, D15 |
| [0006](0006-schema-por-contexto.md) | Espelhamento de contexto no código e um schema Postgres por contexto | D6 |
| [0007](0007-integracao-por-eventos.md) | Integração entre contextos por IDs e eventos de domínio | D7 |
| [0008](0008-casos-de-uso-no-servidor.md) | Casos de uso no servidor; RLS como segunda barreira | D8 |
| [0009](0009-escopo-mvp.md) | Escopo do MVP v1 | D9 |
| [0010](0010-localizacao-ibge.md) | Localização por catálogo IBGE com lat/lng opcional | D10 |
| [0011](0011-auth-e-anonimato.md) | Google + e-mail/senha; publicações anônimas | D11 |
| [0012](0012-moderacao-minima.md) | Proteção mínima: denunciar, rate limit e admin | D12 |
| [0013](0013-pwa-instalavel.md) | PWA instalável com cache de leitura | D13 |
| [0014](0014-metricas-e-analytics.md) | Métricas no Postgres, Transparência no app, repo Python separado | D14 |
| [0015](0015-geografia-ibge-curadoria.md) | IBGE como base; bairros de fonte oficial curada | P11, P12 |
| [0016](0016-selo-institucional.md) | Selo institucional visual concedido por admin | P13 |
| [0017](0017-rate-limit-moderacao.md) | Rate limit, denúncia e poderes de moderação | P16, P17, P18, P21 |
| [0018](0018-ciclo-de-vida-do-conteudo.md) | Edição livre e exclusão lógica do conteúdo | P14 |
| [0019](0019-confirmacao-de-email.md) | Confirmação de e-mail condicional à escrita | P3 |
| [0020](0020-encerramento-de-conta.md) | Encerramento de conta com anonimização | P4 |
| [0021](0021-minimo-legal.md) | Termos, privacidade e aceite registrado | P22 |

> P1–P22 são as decisões de produto registradas em `docs/plano-reescrita-ddd.md` §2.

## Como escrever um ADR novo

1. Copiar o formato: `Status`, `Data`, `Contexto`, `Decisão`, `Consequências`.
2. Numerar sequencialmente (`0015-...`).
3. Referenciar a decisão do plano e as alternativas descartadas.
4. Abrir PR com o ADR; ele é revisado como documentação de arquitetura.
