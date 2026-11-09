# Produto: Minha Cidade

## O que é
Rede social local para moradores discutirem problemas e ideias do bairro. Escopo cívico/municipal (piloto: Cariacica/ES). Moderação comunitária, verificação institucional, privacidade por design.

---

## Atores

**Morador** — pessoa que vive no município. Cadastra-se (e-mail/senha ou Google), escolhe cidade/bairro. Pode:
- Publicar "Problema" (buraco, iluminação, lixo) ou "Ideia" (praça, ciclofaixa, comércio)
- Escolher publicar identificado ou anônimo
- Anexar até 3 fotos
- Apoiar ou opor-se a publicações alheias (um voto por pessoa, trocável)
- Comentar (identificado ou anônimo; edita até 15 min; apaga quando quiser)
- Salvar publicações para ler depois (lista privada)
- Adicionar outros moradores como amigos (amizade mútua, pedido → aceito)
- Denunciar conteúdo que viole regras
- Receber avisos quando interagem com seu conteúdo

**Moderador** — analisa fila de denúncias (entra com ≥3 denúncias). Pode ocultar (reversível) ou restaurar. Não remove definitivamente.

**Administrador** — remove conteúdo definitivamente, concede/revoga selo institucional (ex: "Prefeitura de Cariacica"), promove/rebaixa moderadores.

**Órgão verificado** — perfil institucional com selo visual e nome do órgão. Concedido manualmente por admin.

---

## Conceitos centrais

**Publicação** — título (5–120), texto (10–5000), tipo: Problema ou Ideia (imutável), localização (cidade + bairro opcional), anonimato opcional, até 3 fotos. Autor real fica no banco; se anônimo, leitura pública não expõe quem publicou.

**Reação** — Apoio ou Oposição. Uma por pessoa por publicação. Votar de novo no mesmo tipo remove; no oposto troca.

**Comentário** — 2 a 2000 caracteres. Pode ser anônimo. Autor edita só nos primeiros 15 minutos. Apaga quando quiser (soft-delete). Moderação pode ocultar.

**Salvamento** — "ler depois". Privado: só o dono vê sua lista.

**Amizade** — mútua. Estados: nenhum → pedido enviado → amigos. Pedido pendente só o destinatário aceita/recusa. Remetente pode cancelar. Qualquer lado desfaz amizade. Lista pública de amigos no perfil.

**Denúncia** — motivo de lista fechada (ex: discurso de ódio, spam, informação falsa). Uma por pessoa por alvo. Não derruba conteúdo automaticamente — só entra na fila (≥3). Denunciar próprio conteúdo não permitido.

**Notificação** — aviso in-app quando: comentam sua publicação, apoiam/opõem, mandam/aceitam pedido de amizade. Sininho no topo com contagem. Marcar como lida (uma ou todas). Não avisa o autor da própria ação.

**Perfil** — nome de usuário (único, gerado do nome, imutável), nome completo, bio, foto, capa, cidade/bairro (bairro só aparece se o dono permitir), telefone (privado, nunca público), link/site opcional, selo institucional se houver. Encerrar conta apaga dados pessoais e anonimiza publicações do usuário (ficam como "Morador anônimo").

**Geografia** — cidades vêm do IBGE (5.571 municípios). Bairros são catálogo curado por município (Cariacica tem 100 bairros de fonte oficial). Usuário nunca cria cidade/bairro — só seleciona.

---

## Regras de negócio (invariantes)

- Anonimato: publicação anônima nunca revela autor na leitura pública. Só o dono reconhece a própria.
- Exclusão é lógica: apagar = some do feed/perfil, fica no banco para moderação. Apagar publicação remove reações e comentários em cascata.
- Reação única: um voto por pessoa/publicação. Mesmo tipo remove; tipo oposto troca.
- Comentário: autor e anonimato imutáveis após criar. Edição só 15 min. Ocultação só moderação.
- Salvamento é privado — invisível a terceiros.
- Denúncia não altera visibilidade — conteúdo fica visível até moderação agir.
- Limites de uso: 5 publicações/hora, 20/dia; 20 comentários/hora; 10 denúncias/dia; 30 publicações/hora por IP.
- Username imutável depois de criado.
- Encerrar conta: anonimiza publicações → apaga perfil/dados → apaga usuário do Auth.
- Escrever (publicar, comentar, amizade, denunciar) exige e-mail confirmado (login Google isento).

---

## Fluxo principal

1. Morador entra → vê feed do bairro/cidade (filtros: cidade, bairro, tipo)
2. Publica problema ou ideia (com/sem nome, com/sem fotos)
3. Vizinhos apoiam/opõem, comentam, salvam
4. Se houver denúncias (≥3) → fila de moderação → ocultar/restaurar/remover
5. Moradores viram amigos (pedido → aceito) → lista pública no perfil
6. Interações geram notificações no sininho (tempo real)
7. `/transparencia` mostra números agregados por bairro/cidade (volume, denúncias, ações)

---

## Princípios de experiência

- Mobile-first — maioria acessa pelo celular
- Conteúdo antes de interface — feed ocupa a tela
- Toque confortável — alvos grandes, espaçamento
- Privacidade visível — anonimato e bairro são escolhas claras
- Sem surpresas — denúncia não derruba nada sozinha; exclusão é reversível (soft-delete); salvamento é só seu
- Tempo real onde importa — contadores, comentários, notificações, amizades atualizam sem recarregar