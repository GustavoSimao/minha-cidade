# ADR-0021 — Mínimo legal: termos, privacidade e aceite registrado

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P22

## Contexto
Produto público com dado pessoal (e-mail, publicações, bairro) precisa de base legal mínima
e de canal claro para o cidadão, sem travar o desenvolvimento por um pacote jurídico
completo.

## Decisão
- Páginas públicas **`/termos`** e **`/privacidade`** em português claro: o que é proibido
  publicar, quais dados coletamos (e-mail, publicações, cidade/bairro), por que, por quanto
  tempo e como pedir exclusão.
- **Aceite por checkbox** no cadastro, registrado em
  `identity.profiles.termos_aceitos_em` (timestamp).
- Versionamento por data da página; alteração relevante exige novo aceite no próximo login.

## Consequências
- Sem DPO/encarregado formal nem base legal detalhada na v1 — pendência registrada para
  quando houver volume real de usuários.
- `termos_aceitos_em` é coluna de `identity.profiles`, visível só para o dono.
