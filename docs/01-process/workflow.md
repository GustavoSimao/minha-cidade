# Workflow, Definition of Done e revisão de documentos

Regras de processo do repo. Este arquivo é a fonte da verdade do **como trabalhamos**.

## 1. Fluxo spec → código → teste

Nada de código de contexto sem spec correspondente. O ciclo é sempre:

```
1. Escrever/revisar docs/04-contexts/<ctx>/spec.md
2. Migration do schema do contexto (supabase/migrations)
3. Domínio (entidades, value objects, invariantes) + testes de unidade
4. Aplicação (casos de uso) + testes
5. Infraestrutura (Supabase, repositórios) + políticas RLS
6. Interface (rotas/telas) + teste e2e
7. Atualizar dicionário de dados e ERD se o schema mudou
```

## 2. Definition of Done (por tarefa de contexto)

- [ ] Spec do contexto atualizada no mesmo PR (linguagem ubíqua, invariantes, casos de uso, eventos, ERD, RLS, endpoints).
- [ ] Migration versionada, aditiva e revisada; `down` quando aplicável.
- [ ] Invariantes de domínio cobertas por testes de unidade.
- [ ] Caso de uso coberto por teste (unitário ou integração).
- [ ] Políticas RLS da tabela escritas **e** testadas negativamente (outro usuário não acessa).
- [ ] Lint, typecheck e testes passando; build ok.
- [ ] Tela verificada em viewport mobile (375px) e desktop (1280px).
- [ ] Sem `any`/`as` novo sem justificativa em comentário; sem `console.log` em código de produção.

## 3. Revisão de documentos

- Toda mudança de comportamento exige atualização da spec + ADR quando a decisão for arquitetural.
- ADRs são imutáveis: decisão nova cria ADR novo; revogação cria ADR de substituição.
- `docs/03-data/dicionario-dados.md` é atualizado sempre que uma coluna nascer, mudar de tipo ou morrer.
- Revisão mensal do glossário: termos sem uso ou ambíguos são corrigidos ou removidos.

## 4. Branches, commits e PR

- Branch: `feat/<contexto>-<descricao>`, `fix/...`, `docs/...`.
- Commit no formato Conventional Commits, escopo = bounded context:
  `feat(publication): criar publicação anônima`.
- PR descreve: spec alterada, invariantes adicionadas, testes, validação manual em mobile/desktop.
- Merge em `main` somente com CI verde.

## 5. Papéis

- **Produto/dono:** aprova PRD, escopo e priorização.
- **Implementador (agente ou dev):** executa o ciclo acima.
- **Revisor:** confere aderência à spec e aos critérios de aceite.
