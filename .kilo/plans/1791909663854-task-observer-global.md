# Plano: instalar o task-observer (meta-skill) no Kilo, escopo GLOBAL

## Contexto e decisões já tomadas

- **Objetivo:** a skill `task-observer` ("One Skill to Rule Them All") deve rodar em
  **todos** os projetos, não só no `minha-cidade`. No Kilo isso significa instalar na
  config global `~/.config/kilo/`, que é sempre carregada (precedência mais baixa;
  skills de projeto com mesmo nome venceriam, mas não há conflito).
- **Fonte oficial:** `https://github.com/rebelytics/one-skill-to-rule-them-all`
  (branch `main`; CC BY 4.0, autor Eoghan Henn / rebelytics.com). Forks com mesmo nome
  (versões de 466/~1200/~1500 linhas) **não** serão usados.
- **Bundle completo, não só SKILL.md:** instalar apenas o `SKILL.md` deixa a skill
  degradada (o próprio repo avisa). Copiar `SKILL.md`, `references/`, `scripts/`,
  `LICENSE.txt` (atribuição exigida pela licença).
- **Ativação obrigatória:** o README do autor é explícito — instalar os arquivos não
  basta; *description matching under-trigga*. Precisa de uma linha de ativação nas
  instruções globais (equivalente Kilo do `CLAUDE.md`).
- **Custo aceito:** a descrição entra no system prompt de toda sessão e o `SKILL.md`
  completo será carregado no início de sessões de trabalho. O usuário quer o
  comportamento "sempre rodando", então o custo é intencional.

## Formato de instalação (adaptação ao Kilo)

| Item | Caminho |
|---|---|
| Skill | `C:\Users\gusta\.config\kilo\skills\task-observer\` (SKILL.md, references/, scripts/, LICENSE.txt) |
| Log de observações | `C:\Users\gusta\.config\kilo\task-observer\observation-log\` |
| Updates propostos (staged) | `C:\Users\gusta\.config\kilo\task-observer\skill-updates\` |
| Instrução de ativação | `C:\Users\gusta\.config\kilo\AGENTS.md` (criar) |

Justificativa dos caminhos dos logs: o global `kilo.jsonc` já tem
`external_directory` com `C:\Users\gusta\.config\*": "allow"`, então escrever nos logs
funciona **em qualquer projeto futuro** sem prompt de diretório externo. Logs ficam
fora da pasta `skills/` para não serem interpretados como skill.

## Tarefas (execução: @task-executor ou agente code — NÃO no modo plan)

1. **Obter a fonte pinnada**
   - `git clone --depth 1 https://github.com/rebelytics/one-skill-to-rule-them-all` em
     `C:\Users\gusta\AppData\Local\Temp\kilo\` (ou baixar o ZIP do branch `main`).
   - Registrar o **commit hash** usado (anotar em `NOTAS-kilo.md`, passo 5) para
     permitir reverter/diff em updates futuros.
2. **Copiar o bundle** para `C:\Users\gusta\.config\kilo\skills\task-observer\`:
   `SKILL.md`, `references/` (completa), `scripts/` (completa), `LICENSE.txt`.
3. **Criar as pastas de dados**
   `C:\Users\gusta\.config\kilo\task-observer\observation-log\` e
   `C:\Users\gusta\.config\kilo\task-observer\skill-updates\`.
4. **Adaptar paths no SKILL.md copiado**
   - Onde o original diz `[shared folder]/skill-observations/observation-log/` →
     `C:\Users\gusta\.config\kilo\task-observer\observation-log\`; idem `skill-updates/`.
   - **Não reescrever o resto do SKILL.md.** Divergências Kilo vs Claude ficam
     documentadas em `NOTAS-kilo.md` dentro da pasta da skill (ver passo 5).
5. **Criar `NOTAS-kilo.md`** em `skills\task-observer\` com: hash do commit de origem,
   data da instalação, atribuição CC BY 4.0 (link do repo + autor) e as divergências:
   - `CLAUDE.md` → `AGENTS.md`; ativação via instrução global (passo 6).
   - **skill-creator não existe no Kilo:** a etapa de "construir/restaurar skills"
     vira manual (o usuário aprova e aplica a mudança).
   - **Scheduled tasks (Cowork) não existem:** a revisão periódica das observações
     (o autor faz seg/qua/sex) vira combinado manual — ex.: pedir "revisar observation
     log" em sessão dedicada.
   - **Modo plan:** a skill apenas observa, **não escreve logs** (plan mode proíbe
     mudança de estado).
6. **Criar a instrução global de ativação** `C:\Users\gusta\.config\kilo\AGENTS.md`:
   - Cabeçalho comentando que é instrução global (vale para todos os projetos).
   - A linha de ativação em inglês, adaptada de `references/environments.md`, ex.:
     "At the start of any task-oriented session — any interaction where you will use
     tools and produce deliverables — invoke the task-observer skill before beginning work."
   - **Fallback se o AGENTS.md global não for carregado:** adicionar no global
     `kilo.jsonc` o campo `"instructions": ["C:/Users/gusta/.config/kilo/AGENTS.md"]`.
7. **Validação obrigatória em sessão NOVA** (o autor exige: a sessão que instala não
   prova nada):
   - Abrir sessão nova em **outro projeto** (não o minha-cidade).
   - Confirmar que `task-observer` aparece na lista de skills disponíveis.
   - Rodar uma tarefa real com uso de tools.
   - **Tell de falha:** se `~/.config/kilo/task-observer/observation-log/` continuar
     vazio após algumas sessões de trabalho real, a ativação não funcionou → revisar
     passo 6 (e o fallback `instructions`).
8. **Checagem de permissões:** confirmar que a skill escrevendo em `.config\*` não
   dispara ask em um projeto sem config própria. Se acontecer, o allow do global já
   cobre — investigar apenas se o prompt aparecer.

## Riscos e trade-offs (aceitos)

- Toda sessão de trabalho carrega o meta-skill; o observador passa a olhar também as
  skills deste repo (`avoid-ai-design`, `better-design`) e o `AGENTS.md` do projeto.
  Isso convive com a regra de "economia de tokens" do repo tratando task-observer como
  exceção explícita e global, decidida pelo usuário.
- A skill **propõe** mudanças; nada é aplicado sem aprovação (consistente com o
  default de permissão de `edit`, que pede confirmação). Manter esse desenho.
- Parts do original são Claude-centradas (skill-creator, Cowork scheduled tasks):
  ficam no-op/manual no Kilo — metodologia e formato de log traduzem direto.
- Update futuro: re-clone pinnado + re-copiar, ou `npx skills add
  rebelytics/one-skill-to-rule-them-all --skill task-observer -g` **somente se** o CLI
  permitir destino `~/.config/kilo/skills/` (verificar antes; o default dele aponta
  para diretórios do Claude Code).

## Fora de escopo

- Instalar forks ou a versão ".skill bundle" do Claude Cowork.
- Integrar com memória de projeto do Kilo (são mecanismos complementares, não
- dependentes).
- Criar agendamento automático da revisão de observações.
