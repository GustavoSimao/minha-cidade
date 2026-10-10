import Link from "next/link";
import { Suspense } from "react";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";

/** Ação principal conforme a sessão: em streaming, para não bloquear a página. */
async function SessionCallToAction() {
  const session = await new SupabaseAuthGateway().currentSession();

  return session ? (
    <Link
      className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle bg-surface-raised px-5 py-2 text-sm font-semibold text-text-body hover:bg-surface"
      href="/perfil/editar"
    >
      Meu perfil
    </Link>
  ) : (
    <Link
      className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle bg-surface-raised px-5 py-2 text-sm font-semibold text-text-body hover:bg-surface"
      href="/cadastro"
    >
      Criar minha conta
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 py-6 sm:py-12">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-text-strong sm:text-4xl">
          O que o seu bairro precisa, dito por quem mora nele.
        </h1>
        <p className="max-w-2xl text-lg text-text-body">
          O Minha Cidade é o espaço para publicar problemas e ideias do seu bairro,
          apoiar as causas dos vizinhos e acompanhar o que a comunidade está
          discutindo — direto do celular ou do computador.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            href="/feed"
          >
            Ver o feed do bairro
          </Link>
          <Suspense
            fallback={
              <span className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle bg-surface px-5 py-2 text-sm font-semibold text-text-muted">
                Carregando…
              </span>
            }
          >
            <SessionCallToAction />
          </Suspense>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Publique",
            text: "Conte um problema ou proponha uma ideia com foto, do jeito que você quiser — inclusive anonimamente.",
          },
          {
            title: "Mobilize",
            text: "Apoie ou questione publicações do seu bairro e veja o sentimento da vizinhança em tempo real.",
          },
          {
            title: "Acompanhe",
            text: "Números públicos do bairro na página de transparência, sem dado pessoal de ninguém.",
          },
        ].map((item) => (
          <div
            className="rounded-card border border-border-subtle bg-surface-raised p-5 shadow-sm"
            key={item.title}
          >
            <h2 className="text-base font-semibold text-text-strong">{item.title}</h2>
            <p className="mt-1 text-sm text-text-body">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
