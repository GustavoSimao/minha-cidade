import { NextResponse } from "next/server";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";

/** Aceita só caminhos internos; evita open redirect (`//host`, `/\host`). */
function safeNext(raw: string | null): string {
  return raw && /^\/(?![/\\])/.test(raw) ? raw : "/";
}

/**
 * Callback de autenticação. Dois fluxos chegam aqui:
 *
 *  1. **OAuth/PKCE (Google)**: `?code=...` troca por sessão;
 *  2. **Confirmação de e-mail**: `?token_hash=...&type=signup` com `verifyOtp`
 *     (template `supabase/templates/confirmation.html`) — o clique no e-mail já
 *     deixa o usuário com sessão aberta.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const auth = new SupabaseAuthGateway();

    try {
      await auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }
  }

  if (tokenHash && type) {
    const auth = new SupabaseAuthGateway();

    try {
      await auth.verifyEmailToken(tokenHash, type);
    } catch {
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
