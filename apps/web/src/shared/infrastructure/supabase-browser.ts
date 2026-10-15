import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser — **somente** para Realtime (D8): assinatura
 * de `engagement.reactions`/`engagement.comments` para atualizar a página sem
 * recarregar. Leitura e escrita passam pelos controllers de servidor (RLS).
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
