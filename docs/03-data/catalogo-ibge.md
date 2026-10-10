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

**Regra de sobrevivência:** copiar o documento-fonte para `supabase/seed/sources/` no
commit do seed, com `fonte`, `data` e `hash` registrados em `shared.app_metadata`.

## 4. Tabelas

```sql
-- geography.cities
id bigint primary key,          -- código IBGE do município
uf char(2) not null,
name text not null,
slug text not null unique,
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
  `on conflict do nothing`, gerado a partir da API (fetch + normalização).
- Contagem de municípios confere com a origem (5.570) e toda UF tem ao menos um município.
- Bairros de Cariacica: contagem confere com a lei (100 bairros na Lei 4772/2010, com as
  inclusões posteriores registradas em `source`).
- Teste: bairro duplicado na mesma cidade falha pelo `unique (city_id, slug)`.
