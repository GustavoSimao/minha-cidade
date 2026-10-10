import { type NextRequest, NextResponse } from "next/server";

import { createMiddlewareClient } from "@/contexts/identity/infrastructure/supabase/middleware-client";

/** Rotas que exigem sessão ativa. */
const PRIVATE_PREFIXES = ["/perfil/editar", "/admin", "/notificacoes"];

/**
 * Proxy (substitui o antigo `middleware.ts`, renomeado no Next.js 16):
 * renova a sessão do Supabase em toda requisição e protege as rotas privadas.
 *
 * Páginas públicas (feed, perfil público, login, cadastro) continuam acessíveis sem
 * sessão — decisão P2. A verificação de autorização também acontece dentro de cada
 * Server Function (ver `interfaces/actions.ts`), porque o matcher do proxy não cobre
 * Server Functions de rotas excluídas.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|woff2?)$).*)",
  ],
};
