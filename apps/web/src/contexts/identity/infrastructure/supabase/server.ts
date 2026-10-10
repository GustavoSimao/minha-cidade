import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * regra de negócio exige (ex.: admin concede selo, encerramento de conta apaga o usuário
 * do Auth). Nunca expor ao browser.
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
