# Catálogo geográfico (IBGE + curadoria municipal)

Fonte dos dados de localização. Decisão: **ADR-0015** (P11, P12).

## 1. O que o IBGE tem (verificado em API)

| Fonte | Conteúdo |
|---|---|
| `servicodados.ibge.gov.br/api/v1/localidades/estados` | 27 UFs |
| `.../api/v1/localidades/municipios` | 5.570 municípios |
| `.../api/v1/localidades/municipios/{id}/distritos` | distritos — **vazio** para Cariacica e São Paulo |
| `.../api/v1/localidades/municipios/{id}/subdistritos` | subdistritos — em Vitória retorna 9 "Regiões Administrativas", que **não** são bairros |

**Conclusão: o IBGE não publica bairros urbanos.** Bairro é dado municipal (lei do plano
diretor / mapa oficial da prefeitura).

## 2. Estratégia

1. **Cidades e UFs:** 100% IBGE, seed idempotente e versionado.
2. **Bairros:**
   - usar os **subdistritos do IBGE** quando o município os tiver;
   - onde não tiver (Cariacica, Vitória, São Paulo…), usar a **lista oficial do município**,
     curada por nós, com **fonte e data registradas** no seed.
3. **O usuário nunca cria bairro** — apenas seleciona cidade → bairro.
4. **Lançamento (P12):** Cariacica/ES com bairros curados + todas as cidades IBGE.
   Fora dos municípios com lista curada, **bairro é opcional** e a publicação exibe
   "Bairro não informado".

## 3. Fontes oficiais de Cariacica (já localizadas)

- Mapa de bairros da prefeitura:
  `https://cariacica.es.gov.br/uploads/filemanager_files/mapas/BAIRROS_A1-compactado.pdf`
- Lei 4772/2010 — delimitação dos 100 bairros pelo Plano de Organização Territorial (POT):
  `https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/html/l47722010.html`
- Lei Complementar 171/2025 — plano diretor, com a listagem atualizada dos bairros
  (inclui bairros criados depois de 2010, ex.: Ibiapaba pela Lei 5822/2017).

**Fonte usada no seed (Fase 3):** o anexo cartográfico da LC 171/2025 ("LISTAGEM DOS
BAIRROS", elaboração GPU/SEMDEC, 02/09/2025,
`https://cariacica.camarasempapel.com.br/Arquivo/Documents/legislacao/anexoC1712025.pdf`)
é a listagem vigente e completa dos 100 bairros — os anexos gráficos da Lei 4772/2010
não têm extração em texto. A transcrição está em
`supabase/seed/sources/lc1712025-listagem-bairros.txt` (o PDF oficial de 54 MB não é
versionado; transcrição e URL com SHA-256 em `shared.app_metadata`).

**Regra de sobrevivência:** copiar o documento-fonte para `supabase/seed/sources/` no
commit do seed, com `fonte`, `data` e `hash` registrados em `shared.app_metadata`.

## 4. Tabelas

```sql
-- geography.cities
id bigint primary key,          -- código IBGE do município
uf char(2) not null,
name text not null,
slug text not null unique,      -- nome-uf (ex.: cariacica-es) — G2
ibge_synced_at timestamptz,     -- última sincronização com a API
created_at timestamptz not null default now()

-- geography.neighborhoods
id uuid primary key default gen_random_uuid(),
city_id bigint not null references geography.cities(id),
name text not null,
slug text not null,
source text not null,           -- ex.: 'lei_4772_2010' | 'ibge_subdistritos'
source_url text,
lat double precision, lng double precision,   -- opcional (evolução para raio)
created_at timestamptz not null default now(),
unique (city_id, slug)
```

## 5. Seed e verificações

- Script idempotente em `supabase/seed/ibge-localidades.sql`, com
  `on conflict do update`, gerado a partir da API (fetch + normalização) por
  `supabase/seed/gerar-ibge.ps1`.
- Contagem de municípios confere com a origem: **5.571 na API em 2026-10-10**
  (contagem histórica: 5.570 — revalidar ao regerar) e toda UF tem ao menos um município.
- Bairros de Cariacica: contagem confere com a lei (100 bairros na Lei 4772/2010, com as
  inclusões posteriores registradas em `source`).
- Teste: bairro duplicado na mesma cidade falha pelo `unique (city_id, slug)`.

## 6. Runbook — curar os bairros de um novo município (G3/G6)

Quando uma cidade ganha demanda (moradores publicando nela), a curadoria deixa o
bairro opcional ("Bairro não informado") e passa a ser obrigatório. O passo a passo
operacional completo (fonte → transcrição + hash → seed idempotente → contagem →
verificação no app) está em
[`runbook-curadoria-bairros.md`](./runbook-curadoria-bairros.md). Resumo:

1. **Achar a fonte oficial.** Bairro é lei municipal: plano diretor, lei de
   delimitação ou mapa official da prefeitura. IBGE **não** serve (ver §1).
   Registrar URL e data do documento.
2. **Preservar a fonte.** Copiar o documento para `supabase/seed/sources/`. PDF
   gigante (como os 54 MB da LC 171/2025 de Cariacica) fica só com URL + hash;
   a transcrição em `.txt` é versionada.
3. **Escrever o seed.** Novo arquivo `supabase/seed/NN-bairros-<cidade>.sql`
   somando à lista em `config.toml` (`db.seed.sql_paths`) **na ordem** (IBGE →
   bairros → dev). Padrão idêntico ao `02-bairros-cariacica.sql`:
   `insert ... on conflict (city_id, slug) do nothing`, com `source` e
   `source_url` preenchidos em **todas** as linhas.
4. **Registrar proveniência** em `shared.app_metadata`: chave
   `seed.<cidade>.bairros` com `fonte`, `data` e `hash` (SHA-256 do documento).
5. **Aplicar e verificar.** `npx supabase db reset` e conferir:
   `select count(*) from geography.neighborhoods where city_id = <IBGE>;`
   contra a contagem da lei. divergência = fonte incompleta — não inventar linha.
6. **Verificar no app.** `/publicar` na cidade mostra os bairros na ordem do
   seed; publicações antigas da cidade **sem** bairro continuam válidas
   ("Bairro não informado" — a checagem é só na criação/edição, G6).
7. **Remover bairro é migração, não seed.** O seed nunca apaga (`do nothing`).
   Bairro extinto pela lei nova exige migration `delete`/`update` explícita,
   com o mesmo registro de fonte.
8. **Comunicar no PR:** a cidade passa a ter bairro obrigatório — impacto em
   dados de teste (seed/dev) e no texto de ajuda do formulário.
