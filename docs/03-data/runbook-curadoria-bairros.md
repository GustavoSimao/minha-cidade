# Runbook — curadoria de bairros de um novo município

Este runbook é o passo a passo operacional para adicionar bairros de um município
que ainda não tem lista curada. Ele concretiza a seção 6 de
[`catalogo-ibge.md`](./catalogo-ibge.md) e as invariantes **G3/G5/G6/G8** da spec
[`../04-contexts/geography.md`](../04-contexts/geography.md).

## 1. Contexto (por que este runbook existe)

- **Cidades já estão completas:** `geography.cities` tem os 5.571 municípios IBGE
  (seed `01-ibge-localidades.sql`, gerado por `gerar-ibge.ps1`). Nada a fazer aqui.
- **Bairros são dado municipal:** o IBGE **não** publica bairros urbanos. Bairro
  vem de lei municipal (plano diretor, lei de delimitação) ou mapa oficial da
  prefeitura.
- **O usuário nunca cria bairro** (G5): ele só seleciona cidade → bairro. Sem
  lista curada, o bairro é opcional e a publicação exibe "Bairro não informado"
  (G6) — a checagem de bairro obrigatório acontece só na criação/edição.
- **Situação do lançamento:** apenas Cariacica/ES tem bairros curados
  (`02-bairros-cariacica.sql`, 100 bairros, fonte LC 171/2025). Os outros 5.570
  municípios funcionam sem bairro.

**Quando executar:** uma cidade ganha demanda real (moradores publicando nela) ou
é a cidade de uma venda B2G.

## 2. Regras que não se violam

| Regra | Consequência de violar |
|---|---|
| Fonte oficial registrada (G8) | bairro sem procedência não sobrevive a auditoria |
| Seed idempotente (`on conflict do nothing`) (G3) | `db reset` duplica linhas |
| Seed nunca apaga | bairro extinto pela lei vira migration explícita |
| Contagem confere com a lei | divergência = fonte incompleta; **nunca** inventar linha |
| Nunca fixar UUID de bairro em teste | `db reset` recria os UUIDs |

## 3. Passo a passo

### 3.1 Conferir que a cidade existe no catálogo

```sql
select id, uf, name from geography.cities where id = <código IBGE>;
```

Se não existir, regerar o catálogo: `pwsh supabase/seed/gerar-ibge.ps1` (exige
Internet) e revalidar a contagem de municípios contra a API.

### 3.2 Achar a fonte oficial

Bairro é lei municipal. Procurar, em ordem:

1. Plano diretor / lei orgânica com listagem de bairros;
2. Lei de delimitação/criação de bairros;
3. Mapa oficial da prefeitura (PDF/anexo cartográfico).

Registrar **URL e data do documento**. Se o município tiver subdistritos no IBGE
(`/api/v1/localidades/municipios/{id}/subdistritos`), usar `source =
'ibge_subdistritos'` — mas conferir se são bairros de fato (em Vitória, os
"subdistritos" são Regiões Administrativas e **não** servem).

### 3.3 Preservar a fonte

Copiar o documento para `supabase/seed/sources/`:

- transcrição em `.txt` é **versionada** (é a fonte da verdade do seed);
- PDF gigante (ex.: os 54 MB da LC 171/2025 de Cariacica) fica só com URL + hash.

Calcular o SHA-256 da transcrição (PowerShell):

```powershell
Get-FileHash -Algorithm SHA256 supabase/seed/sources/<arquivo>.txt
```

### 3.4 Escrever o seed

Criar `supabase/seed/NN-bairros-<cidade>.sql` (NN = próximo número livre, depois
dos existentes) no **padrão exato** de `02-bairros-cariacica.sql`:

- cabeçalho comentado com a fonte: lei/mapa, URL, data,path da transcrição e do hash;
- `insert into geography.neighborhoods (city_id, name, slug, source, source_url) values ...`
  com `source` e `source_url` preenchidos em **todas** as linhas;
- `on conflict (city_id, slug) do nothing` — idempotente (G3);
- `slug` minúsculo, sem acento, com hífen (ex.: `boa-sorte`);
- bloco final de metadados em `shared.app_metadata`.

### 3.5 Registrar a ordem no `config.toml`

Em `supabase/config.toml`, `[db.seed] sql_paths`, manter a ordem **IBGE →
bairros → dev** (o seed de dev referencia bairros):

```toml
sql_paths = [
  "./seed/01-ibge-localidades.sql",
  "./seed/02-bairros-cariacica.sql",
  "./seed/NN-bairros-<cidade>.sql",   # novo
  "./seed/03-dev-seed.sql",
]
```

### 3.6 Registrar a procedência em `shared.app_metadata`

No fim do seed, seguindo as chaves já usadas por Cariacica:

```sql
insert into shared.app_metadata (key, value) values
  ('seed.geography.<cidade>.fonte',            '<lei/mapa, elaboração>'),
  ('seed.geography.<cidade>.fonte_url',        '<URL oficial>'),
  ('seed.geography.<cidade>.fonte_data',       '<AAAA-MM-DD do documento>'),
  ('seed.geography.<cidade>.transcricao_sha256','<SHA-256 da transcrição>'),
  ('seed.geography.executado_em',              to_char(now(), 'YYYY-MM-DD'))
on conflict (key) do update set value = excluded.value, updated_at = now();
```

### 3.7 Aplicar e validar a contagem

```powershell
npx --yes supabase db reset
```

```sql
-- contagem por cidade confere com a lei?
select city_id, count(*) from geography.neighborhoods group by city_id order by city_id;

-- procedência registrada?
select key, value from shared.app_metadata where key like 'seed.geography.%' order by key;
```

Divergência entre a contagem do seed e a da lei = fonte incompleta. **Não**
completar "no olho" — voltar a 3.2.

### 3.8 Verificar no app

1. `/publicar` com a cidade escolhida: o seletor de bairro lista os bairros na
   ordem do seed e o cascata cidade → bairro funciona (G6).
2. Publicações antigas da cidade **sem** bairro continuam válidas
   ("Bairro não informado").
3. Se o seed de dev (`03-dev-seed.sql`) citar bairros da cidade, usar lookups por
   **slug** (nunca UUID fixo) e revisar os dados de exemplo.
4. Rodar a suíte e2e (`npx playwright test` em `apps/web`) — `02-publicar` cobre o
   cascata e o estado "Bairro não informado".

## 4. Manutenção (lei nova, bairro extinto, cidade já curada)

- **Bairro criado depois:** somar linhas ao seed da cidade (idempotente) e
  atualizar o hash em `app_metadata` se a transcrição mudou.
- **Bairro extinto/renomeado pela lei:** **migration explícita**
  (`supabase/migrations/<timestamp>_...sql` com `delete`/`update`), com o mesmo
  registro de fonte — seed nunca apaga.
- **Regenerar o catálogo IBGE:** `pwsh supabase/seed/gerar-ibge.ps1` e revalidar a
  contagem (5.571 municípios na API em 2026-10-10; contagem histórica 5.570).

## 5. Checklist do PR

- [ ] fonte oficial com URL e data; transcrição em `supabase/seed/sources/`;
- [ ] SHA-256 da transcrição registrado em `shared.app_metadata`;
- [ ] seed `NN-bairros-<cidade>.sql` idempotente, `source`/`source_url` em todas as linhas;
- [ ] `config.toml` com o seed na ordem correta;
- [ ] `db reset` aplicado e contagem conferida com a lei;
- [ ] `/publicar` verificado na cidade; e2e verde;
- [ ] `docs/03-data/catalogo-ibge.md` §3/§5 atualizado (fonte e contagem da cidade).

## 6. Referências

- [`catalogo-ibge.md`](./catalogo-ibge.md) — estratégia completa e o resumo deste runbook (§6);
- [`supabase/seed/README.md`](../../supabase/seed/README.md) — ordem e idempotência dos seeds;
- [`supabase/seed/02-bairros-cariacica.sql`](../../supabase/seed/02-bairros-cariacica.sql) — exemplo vivo (Cariacica/ES, 100 bairros);
- spec Geography (`docs/04-contexts/geography.md`) — invariantes G3, G5, G6, G8;
- ADR-0015 — decisão de catálogo (P11/P12).
