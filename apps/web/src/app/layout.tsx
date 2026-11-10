import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { RegisterServiceWorker } from "@/shared/ui/pwa/register-sw";
import { SiteHeaderSlot } from "@/shared/ui/site-header-slot";
import { BottomNav } from "@/shared/ui/bottom-nav";
import { BackButton } from "@/shared/ui/back-button";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Minha Cidade",
    template: "%s | Minha Cidade",
  },
  description:
    "Publique problemas e ideias do seu bairro, apoie as causas dos vizinhos e acompanhe o que a comunidade está discutindo.",
  // Ícones e manifest vêm das convenções de arquivo (`app/icon.png`, `app/apple-icon.png`,
  // `app/manifest.ts`).
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Minha Cidade",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6c70",
  colorScheme: "light",
};

export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-soft text-ink">
        <RegisterServiceWorker />
        <a className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-button focus:bg-white focus:px-4 focus:py-3 focus:text-ink" href="#main-content">
          Ir para o conteúdo
        </a>
        <div className="site-navigation">
          <SiteHeaderSlot />
        </div>
        <main className="app-page min-w-0 flex-1 pb-24 md:pb-0" id="main-content">
          <BackButton />
          {children}
        </main>
        <BottomNav />
        {modal}
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
            <p>Minha Cidade — participação cidadã por bairro</p>
            <nav aria-label="Links institucionais" className="flex justify-center gap-4">
              <Link className="hover:text-ink" href="/termos">
                Termos de uso
              </Link>
              <Link className="hover:text-ink" href="/privacidade">
                Privacidade
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
