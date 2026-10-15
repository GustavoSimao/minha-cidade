# PRD — Minha Cidade (MVP v1)

> Fonte da verdade do produto. Alteração de escopo exige PR neste arquivo + ADR.
> Status: **rascunho para aprovação** · Versão: 1.0 · Data: 2026-10-10

## 1. Problema

Moradores não têm um canal simples e confiável para reportar problemas do bairro, propor
melhorias e mobilizar vizinhos. Reclamações se dispersam em grupos de mensagens e redes
sociais, sem histórico, sem visibilidade do que já foi resolvido e sem engajamento
organizado.

## 2. Visão

Uma plataforma de participação cidadã onde qualquer morador publica um problema ou uma
ideia do seu bairro, recebe apoio dos vizinhos, conversa nos comentários e acompanha o
que a comunidade está discutindo — usável no celular e no PC, sem instalar aplicativo de
loja.

## 3. Público e personas

| Persona | Necessidade principal | Critério de sucesso |
|---|---|---|
| **Morador** (primária) | Publicar e ver problemas do meu bairro | Consegue publicar com foto em < 2 min no celular |
| **Moderador** | Manter o feed utilizável | Resolve uma denúncia em < 1 min no painel |
| **Analista / cidadão curioso** | Entender os números da cidade | Vê métricas públicas em `/transparencia` |

## 4. Escopo do MVP (v1)

**Incluído**

- Cadastro e login com Google ou e-mail/senha (Supabase Auth). Cadastro mínimo leva à
  home (`/`, que é o feed); quem ainda não escolheu bairro vê convite para escolher e recebe publicações
  recentes da cidade inteira como fallback (P1).
- Perfil público por `username` com foto, capa, bio, cidade e bairro; contadores de
  amigos, publicações e causas apoiadas; lista de amigos. E-mail, telefone, notificações
  e salvamentos são privados (P6).
- Publicação do tipo **problema** ou **ideia**, com título, texto e até 3 imagens;
  opção de publicar **anonimamente**. Sem endereço exato e sem vídeo na v1 (P7).
- Feed público paginado filtrado por bairro e cidade, ordenado por mais recente (P8).
- Reação de **apoio** ou **oposição** com toggle, e comentários com anonimato opcional (P10).
- Amizade: solicitar, aceitar, recusar e desfazer (mão dupla, sem seguidores, sem bloqueio
  na v1) (P9).
- Denunciar publicação, comentário ou perfil; rate limit por usuário/IP; painel `/admin`
  mínimo para ocultar/remover conteúdo e resolver denúncias, com registro das ações de
  moderação (P17, P18).
- Notificação in-app de amizade, comentário e reação (P19).
- PWA instalável com leitura offline do que já foi visitado.
- Página pública `/transparencia` com métricas diárias agregadas (P20).
- Selo institucional visual para órgãos públicos e prefeitura, com nome do órgão (P13).
- Termos de uso e política de privacidade com aceite registrado no cadastro (P22).

**Regras de acesso (P2):** visitante sem conta lê tudo (feed, publicações, comentários,
perfis públicos e contadores). Com conta: publicar, reagir, comentar, salvar, amizade e
denunciar. Confirmação de e-mail é exigida apenas para escrever (P3) — login social do
Google não precisa confirmar.

**Ciclo de vida do conteúdo (P14):** o autor edita publicações quando quiser (com
`edited_at`) e apaga por exclusão lógica, reversível pela moderação; comentários têm
edição liberada por 15 minutos e exclusão a qualquer momento. Encerrar conta apaga os dados
próprios e **anonimiza** as publicações, cujo conteúdo permanece (P4).

**Moderação:** conteúdo denunciado continua visível até o moderador agir; a fila é ordenada
por volume de denúncias, com 3+ denúncias sinalizadas (P21). Moderador oculta/restaura e
resolve denúncias; admin remove definitivamente, concede o selo institucional e promove
moderadores (P18).

**Fora de escopo na v1** (registrado, não esquecido)

- Eventos com data, local e participação (schema documentado para v2).
- Notificações por e-mail/push; verificação de e-mail/telefone.
- Busca textual; moderação avançada (palavras bloqueadas, shadowban, trilha de auditoria).
- Aplicativo nativo em loja (avaliar Capacitor após a PWA validar).
- Migração de dados do sistema anterior (não havia dados de produção).

## 5. Jornadas principais

1. **Descoberta:** visitante sem login abre o feed do bairro e lê publicações.
2. **Publicar:** login → "Nova publicação" → escolhe problema/ideia → escreve → anexa foto
   (opcional) → marca anônimo (opcional) → publica → aparece no feed do bairro.
3. **Engajar:** leitor curte/opõe, comenta, o contador atualiza em tempo real.
4. **Conectar:** visitante de um perfil público envia solicitação de amizade; o outro aceita.
5. **Moderar:** usuário denuncia um conteúdo; moderador oculta ou remove e resolve.
6. **Instituição:** órgão público solicita o selo com evidência; admin concede e o badge
   aparece com o nome do órgão em perfis, publicações e comentários (P13).

## 6. Requisitos não funcionais

| Requisito | Meta |
|---|---|
| Uso em celular | Mobile-first; alvos de toque ≥ 44px; contraste WCAG AA |
| Performance | Lighthouse mobile ≥ 90 em Performance, Acessibilidade e Best Practices |
| Instalação | PWA instalável em Android (prompt) e iOS (Adicionar à Tela) |
| Offline | Leitura do feed já visitado sem rede |
| Privacidade | Autor anônimo nunca exposto em leitura pública; dashboards públicos só com dados agregados |
| Acessibilidade | Navegação por teclado, labels em todos os controles, foco visível |
| Uso abusivo | Rate limit por usuário e por IP (P16) |

## 7. Métricas de sucesso do MVP

- Um visitante não autenticado consegue ler o feed do bairro.
- Um novo usuário publica a primeira publicação em menos de 2 minutos.
- 80% das publicações têm bairro/cidade válidos (dados oficiais, ver catálogo).
- Nenhum dado pessoal exposto nos dashboards públicos.
- Nenhuma publicação de e-mail não confirmado (P3).

## 8. Riscos de produto

| Risco | Mitigação |
|---|---|
| Feed pública com post anônimo atrai spam/abuso | Rate limit (P16) + denúncia (P17) + admin mínimo (P18); nada é ocultado automaticamente (P21) |
| Bairro escrito errado bagunça o feed | Seleção a partir de catálogo curado com fonte oficial (P11, P12) |
| Fonte oficial de bairros sai do ar | Seed versionado no repo com fonte, data e cópia do documento |
| App "web" não é percebido como app no celular | PWA instalável com ícone, splash e cache offline |
| Ninguém usa sem conteúdo inicial | Seed de desenvolvimento com publicações de exemplo por bairro |
| Selo institucional falsificado | Concessão manual com evidência e registro em `moderation_actions` (P13, P18) |

## 9. Registro de decisões

As 22 decisões de produto (P1–P22) estão em
[`docs/plano-reescrita-ddd.md`](plano-reescrita-ddd.md) seção 2 e nas ADRs 0015–0021.
`docs/04-contexts/decisoes-em-aberto.md` lista o que já foi resolvido e o que depende de
cada fase.
