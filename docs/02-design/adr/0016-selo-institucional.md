# ADR-0016 — Selo institucional visual concedido por admin

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P13

## Contexto
Órgãos públicos e pessoas da prefeitura precisam de destaque visível para dar credibilidade
ao que publicam. O risco é a falsificação do selo e a confusão entre "destaque" e "poder".

## Decisão
- Selo **apenas visual**, exibido em perfil, publicações e comentários, com o **nome do
  órgão** (ex.: "Prefeitura de Cariacica"), gravado em `identity.profiles.verified_org`.
- **Concessão manual pelo admin**, após evidência (link oficial ou e-mail de domínio
  oficial). Nenhuma verificação automática na v1.
- **Nenhuma permissão extra** é concedida pelo selo: moderar exige os papéis
  `moderator`/`admin` (ADR-0017).
- Toda concessão e revogação é registrada em `moderation.moderation_actions`.

## Consequências
- Schema: `identity.profiles.verified_org text` (preenchido somente quando há selo).
- RLS: `verified_org` é público; a escrita é bloqueada por trigger (só `service_role`).
- Sem automação na v1, o volume de solicitações é pequeno; se crescer, entra ADR de
  verificação por domínio de e-mail.
