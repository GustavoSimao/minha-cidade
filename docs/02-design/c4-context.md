# C4 — Nível 1: Contexto

Diagrama de contexto do sistema. Atores e sistemas externos.

```text
                        ┌──────────────────────────────┐
                        │        Minha Cidade          │
                        │  (plataforma de participação │
                        │   cidadã por bairro/cidade)  │
                        └──────────────────────────────┘
                          ▲        ▲         ▲       ▲
                          │        │         │       │
   ┌──────────────┐  lê/  │        │ publica │       │ ┌──────────────────┐
   │   Morador    │  comenta      │ (foto)  │       │ │    Moderador     │
   │ (celular/PC) │───────────────┼─────────┼───────┘ │  (celular/PC)    │
   └──────────────┘               │         │         └──────────────────┘
                                  │         │  modera denúncias
   ┌──────────────┐  consulta     │         │
   │  Analista /  │  métricas     │         │
   │  cidadão     │───────────────┘         │
   └──────────────┘                         │
                                            ▼
                    ┌─────────────────────────────────────────┐
                    │            Supabase (backend)           │
                    │  Postgres · Auth · Storage · Realtime   │
                    └─────────────────────────────────────────┘
                          ▲                    ▲
                          │ OAuth/email        │ seed + leitura
              ┌───────────┴────────┐   ┌───────┴────────────┐
              │  Google Accounts   │   │  API IBGE Localid. │
              └────────────────────┘   └────────────────────┘

   Sistemas externos adicionais:
   - Vercel (hospedagem do front e CDN)
   - Streamlit Community Cloud (dashboards públicos de analytics)
   - GitHub Actions (CI do app, ETL agendado do analytics)
```

## Atores

| Ator | Meio | O que faz |
|---|---|---|
| Morador | celular ou PC, PWA | lê feed, publica, reage, comenta, faz amizade |
| Moderador | celular ou PC | resolve denúncias, oculta/remove conteúdo em `/admin` |
| Analista/cidadão | PC (principalmente) | consulta `/transparencia` e dashboards agregados |
| Sistema de analytics (Python) | GitHub Actions | ETL, snapshots, dashboards (sem interação humana) |

## Sistemas externos

| Sistema | Papel | Contrato |
|---|---|---|
| Supabase Auth | identidade (Google + e-mail/senha) | JWT; trigger cria perfil em `identity.profiles` |
| Supabase Postgres | fonte única da verdade | RLS ativa; um schema por bounded context |
| Supabase Storage | imagens de perfil, capa e publicações | buckets `avatars`, `covers`, `publication-media` |
| Supabase Realtime | contadores, comentários, notificações | canais por publication_id e por user_id |
| API IBGE de Localidades | catálogo de cidades/bairros | seed idempotente em `geography.cities/neighborhoods` |
| Vercel | hospedagem, CDN, preview por PR | deploy a partir da branch |
| Streamlit Community Cloud | dashboards públicos | lê apenas schema `analytics` (agregado) |
