import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeaderSlot } from "@/shared/ui/site-header-slot";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Minha Cidade",
    template: "%s · Minha Cidade",
  },
  description:
    "Publique problemas e ideias do seu bairro, apoie as causas dos vizinhos e acompanhe o que a comunidade está discutindo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-surface text-text-body">
        <SiteHeaderSlot />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border-subtle py-6 text-center text-xs text-text-muted">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
            <p>Minha Cidade · participação cidadã por bairro</p>
            <nav className="flex justify-center gap-4">
              <Link className="hover:text-text-body" href="/termos">
                Termos de uso
              </Link>
              <Link className="hover:text-text-body" href="/privacidade">
                Privacidade
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
