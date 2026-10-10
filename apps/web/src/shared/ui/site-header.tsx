import Link from "next/link";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { signOutAction } from "@/contexts/identity/interfaces/actions";

/**
 * Cabeçalho do site. Resolve a sessão no servidor:
 * - visitante vê Entrar / Criar conta (P2);
 * - usuário logado vê Meu perfil e Sair.
 */
export async function SiteHeader() {
  const auth = new SupabaseAuthGateway();
  const session = await auth.currentSession();

  let username: string | null = null;
  if (session) {
    const profile = await new SupabaseProfileRepository().findById(session.userId);
    username = profile?.username.value ?? null;
  }

  return (
    <header className="border-b border-border-subtle bg-surface-raised">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-text-strong">
          Minha<span className="text-brand-600">Cidade</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link
            className="rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700"
            href="/feed"
          >
            Feed
          </Link>
          <Link
            className="hidden rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
            href="/transparencia"
          >
            Transparência
          </Link>

          {session ? (
            <>
              <Link
                className="rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700"
                href={username ? `/perfil/${username}` : "/perfil/editar"}
              >
                Meu perfil
              </Link>
              <form action={signOutAction} className="inline-flex">
                <button
                  className="min-h-11 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-text-body hover:bg-surface"
                  type="submit"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                className="rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700"
                href="/login"
              >
                Entrar
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                href="/cadastro"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
