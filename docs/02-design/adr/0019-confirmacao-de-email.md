# ADR-0019 — Confirmação de e-mail condicional à escrita

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisões do plano:** P3

## Contexto
Cadastro com atrito mata adoção, mas feed público com publicação anônima atrai contas de
e-mail falso. As opções eram: confirmar antes de entrar, confirmar só para escrever, ou não
confirmar nada na v1.

## Decisão
- **Entrar e navegar liberados** imediatamente após o cadastro (ler feed, ver perfil).
- **Escrever exige e-mail confirmado**: publicar, comentar, enviar amizade e denunciar.
- **Login social do Google não precisa de confirmação** — o Google já verificou o e-mail.
- O estado vem de `auth.users.email_confirmed_at` (Supabase), espelhado para a aplicação
  pela claim do JWT; não duplicamos o flag em `identity.profiles`.

## Consequências
- A camada de aplicação valida "e-mail confirmado" antes de qualquer caso de uso de escrita.
- Requer domínio com SPF/DKIM para o e-mail de confirmação não cair em spam.
- Reduz spam sem travar o primeiro acesso; combina com o rate limit (ADR-0017).
