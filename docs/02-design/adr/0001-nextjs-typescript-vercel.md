# ADR-0001 — Next.js + TypeScript na Vercel como stack do app

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D1

## Contexto
O produto precisa rodar para qualquer pessoa em celular e PC, com um único deploy,
boa performance e custo baixo. Havia três opções: JavaScript/TypeScript, Python (FastAPI/Django)
e Java (Spring Boot), sempre com Supabase no back e Vercel no front.

## Decisão
App web em **Next.js (App Router) + TypeScript**, hospedado na **Vercel**, com UI
mobile-first responsiva.

## Consequências
- Integração nativa com Supabase (`@supabase/ssr`, cookies, middleware) e com a Vercel
  (SSR, ISR, Edge, preview por PR).
- Uma linguagem só no caminho de requisição; Python fica restrito à camada de analytics.
- Ecossistema instável (App Router/RSC) exige disciplina de upgrade.
- Python como API de produto ficaria em runtime de segunda classe na Vercel; Java exigiria
  hospedagem extra — ambos descartados.
