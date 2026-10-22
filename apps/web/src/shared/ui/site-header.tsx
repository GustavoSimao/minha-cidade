import { connection } from "next/server";
import Link from "next/link";

import { CountMyUnreadNotifications } from "@/contexts/notification/application/use-cases";
import {
  SupabaseNotificationRepository,
  currentNotificationSession,
} from "@/contexts/notification/infrastructure/supabase/notification-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { signOutAction } from "@/contexts/identity/interfaces/actions";
import { NotificationBell } from "@/shared/ui/notification/notification-bell";

/**
 * Cabeçalho do site. Resolve a sessão no servidor:
 * - visitante vê Entrar / Criar conta (P2);
 * - usuário logado vê Meu perfil e Sair.
 */
export async function SiteHeader() {
  // A validação da sessão compara a expiração do token com o relógio: com os
  // Cache Components ativos, o prerender rejeita ler o relógio no shell
  // estático. `connection()` força a renderização a acontecer na request —
  // o conteúdo já está dentro do <Suspense> do layout.
  await connection();

  const auth = new SupabaseAuthGateway();
  const session = await auth.currentSession();

  let username: string | null = null;
  if (session) {
    // Projeção (read model), não a entidade `Profile`: o cabeçalho só precisa do
    // username, e assim evitamos ler o relógio durante o render (PPR/`Date.now()`).
    const profile = (await new SupabaseProfileRepository().findPublicViewsByIds([session.userId]))[0];
    username = profile?.username ?? null;
  }

  const unreadCount = session
    ? await new CountMyUnreadNotifications(
        currentNotificationSession,
        new SupabaseNotificationRepository(),
      ).execute()
    : 0;

  return (
    <>
      <header className="border-b border-border-subtle bg-surface-raised">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-text-strong">
            Minha<span className="text-brand-600">Cidade</span>
          </Link>

        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <Link
            className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
            href="/"
          >
            Feed
          </Link>
          <Link
            className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
            href="/transparencia"
          >
            Transparência
          </Link>

          {session ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
                href="/publicar"
              >
                Publicar
              </Link>
              {/* No celular os avistos ficam na barra inferior (B7). */}
              <span className="hidden sm:inline-flex">
                <NotificationBell unreadCount={unreadCount} userId={session.userId} />
              </span>
              <Link
                className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
                href="/salvos"
              >
                Salvos
              </Link>
              <Link
                className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
                href={username ? `/perfil/${username}` : "/perfil/editar"}
              >
                Meu perfil
              </Link>
              <Link
                className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
                href="/amigos"
              >
                Amizades
              </Link>
              <Link
                className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 xl:inline-flex"
                href="/amigos/descobrir"
              >
                Descobrir pessoas
              </Link>
              <Link
                className="hidden min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
                href="/amigos/buscar"
              >
                Pessoas
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
                className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-700"
                href="/cadastro"
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
      </header>

    </>
  );
}
