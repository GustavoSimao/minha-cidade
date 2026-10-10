# ADR-0008 — Casos de uso executam no servidor; RLS como segunda barreira

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D8

## Contexto
Havia três modelos possíveis: (a) browser fala direto com o Postgres via `supabase-js` e
todas as regras vivem em RLS; (b) toda escrita passa pela camada de aplicação no servidor;
(c) híbrido com leitura no cliente e escrita no servidor.

## Decisão
**Toda escrita** passa por casos de uso no servidor (Route Handlers / Server Actions), que
validam invariantes de domínio e persistem via Supabase. O browser usa `supabase-js` apenas
para **assinaturas Realtime** e **leituras públicas**. RLS permanece ativa como segunda
barreira.

## Consequências
- Regra de negócio em um só lugar, testável, sem depender de SQL para invariantes.
- Dupla proteção: bug na aplicação não abre buraco, porque RLS ainda restringe.
- Leitura pública vai direto ao Postgres (baixa latência), desde que seja dado público.
- Nunca usar `service_role` em componente cliente.
