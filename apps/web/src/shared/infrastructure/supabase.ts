import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type AnySupabaseClient = SupabaseClient;

/**
 * Acesso a tabela de schema não-`public` (D6: um schema por bounded context).
 *
 * O PostgREST **não** aceita `.from("publication.publications")` — a relação é
 * interpretada como nome de tabela no schema `public` e o cache de schema não a
 * encontra. A forma suportada é `.schema("publication").from("publications")`
 * (cabeçalho `Accept-Profile`/`Content-Profile`, disponível porque cada schema
 * criado em migration está listado em `schemas`/`extra_search_path` do
 * `supabase/config.toml`).
 *
 * Uso: `table(supabase, "publication.publications").select("*")`.
 * Sem ponto, cai no `.from()` comum (ex.: storage em `schema.table` não se aplica).
 */
export function table(client: AnySupabaseClient, relation: string) {
  const dot = relation.indexOf(".");

  if (dot === -1) {
    return client.from(relation);
  }

  return client.schema(relation.slice(0, dot)).from(relation.slice(dot + 1));
}

/**
 * Cliente Supabase para código de servidor (Route Handlers, Server Actions, RSC),
 * já com a sessão do usuário nos cookies.
 *
 * Toda escrita da aplicação passa por este cliente (ADR-0008/D8). A RLS está ativa,
 * portanto o cliente carrega as permissões do usuário autenticado.
 *
 * Tipagem: os resultados são mapeados explicitamente pelos repositórios. Quando a
 * geração de tipos for ligada (`supabase gen types typescript`), o genérico
 * `createServerClient<Database>` substitui o cliente sem genérico.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component: a gravação de cookie é feita pelo middleware.
          }
        },
      },
    },
  );
}

/**
 * Cliente com `service_role`: **exclusivo de código de servidor**, usado apenas onde a
 * regra de negócio exige (ex.: seed, admin concede selo, encerramento de conta apaga o
 * usuário do Auth, upload/assinatura de mídia de publicação). Nunca expor ao browser —
 * a chave NÃO tem prefixo NEXT_PUBLIC_ (ver `.env.example`).
 */
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // cliente de serviço não usa sessão por cookie
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
