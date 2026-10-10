import { NextResponse } from "next/server";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";

/**
 * Callback do OAuth (Google). Troca o `code` por sessão e leva o usuário ao feed (P1).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (code) {
    const auth = new SupabaseAuthGateway();

    try {
      await auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
