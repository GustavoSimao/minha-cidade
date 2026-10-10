import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser.
 *
 * Uso permitido (ADR-0008/D8): apenas **assinaturas Realtime** e **leituras públicas**.
 * Toda escrita passa pela camada de aplicação no servidor. A RLS continua ativa como
 * segunda barreira, e a chave pública (`anon`) é a única disponível aqui.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
