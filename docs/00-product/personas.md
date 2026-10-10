# Personas — Minha Cidade

Derivadas do PRD (§3). Usar como referência em todas as decisões de interface e escopo.

## 1. Morador — persona primária

- **Quem:** morador de bairro, 18–55 anos, usa celular como computador principal.
- **Contexto:** está no ônibus ou em casa, com rede instável, muitas vezes com uma mão só.
- **Objetivos:** reportar um problema (buraco, iluminação, lixo), ver se alguém já
  reportou, apoiar a causa do vizinho, comentar.
- **Dores:** grupos de mensagens são ruidosos; não sabe se a prefeitura viu; não quer se
  expor em temas sensíveis.
- **Comportamento esperado:** abre o feed, lê, curte, comenta, publica com foto. Publica
  anônimo quando o tema é sensível.
- **Requisitos que disso decoram:** mobile-first, foto rápida (câmera do celular),
  anonimato real, feed por bairro sem cadastro para ler, PWA instalável, offline.

## 2. Moderador

- **Quem:** membro de confiança da comunidade ou administrador.
- **Contexto:** revisa denúncias alguns minutos por dia, no celular ou PC.
- **Objetivos:** resolver denúncias rápido, ocultar spam, remover conteúdo impróprio.
- **Dores:** fila confusa, sem contexto da denúncia, sem ações em lote.
- **Comportamento esperado:** abre a fila, entende o motivo, age, marca como resolvida.
- **Requisitos que disso decoram:** `/admin` com fila ordenada, motivo visível, ações
  ocultar/restaurar/remover/resolver, acesso restrito por papel com RLS.

## 3. Analista / cidadão curioso

- **Quem:** estuda os dados da cidade, jornalista, morador engajado, recrutador
  avaliando o projeto.
- **Contexto:** acessa `/transparencia` e o dashboard público de analytics.
- **Objetivos:** comparar bairros ao longo do tempo, ver volume de publicações por tipo,
  apoiar discussão com números.
- **Dores:** dados incompletos, sem série histórica, gráficos sem contexto.
- **Requisitos que disso decoram:** métricas diárias materializadas, gráficos públicos
  com apenas dados agregados (nunca texto de posts nem dado pessoal), série histórica.

## Anti-personas (não otimizar para agora)

- **Empresa/prefeitura com necessidades de SLA:** foco é comunidade, não institucional.
- **Power user de rede social:** o produto não é feed infinito de amigos; é bairro.
