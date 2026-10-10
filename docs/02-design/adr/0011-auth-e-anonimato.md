# ADR-0011 — Google + e-mail/senha no login; publicações anônimas

- **Status:** Aceito
- **Data:** 2026-10-10
- **Decisão do plano:** D11

## Contexto
Cadastro com atrito mata adoção; e o produto precisa permitir denunciar problemas sem
expor o autor (tema sensível: segurança, infraestrutura, vizinhos).

## Decisão
Login via **Supabase Auth** com Google OAuth e e-mail/senha (confirmação de e-mail ativa).
Publicações e comentários podem ser marcados como **anônimos**: a identidade real permanece
no banco (para moderação) mas nunca é exibida em leitura pública.

## Consequências
- Baixo atrito de entrada para qualquer pessoa no Brasil.
- `identity.profiles` é criado por trigger em `auth.users` (fonte única de identidade).
- Anonimato exige testes específicos de RLS: leitura pública não pode vazar autor.
- E-mail transacional depende de domínioverificado (SPF/DKIM) para não cair em spam.
