import { Suspense } from "react";

import { SiteHeader } from "./site-header";

/** Placeholder do cabeçalho enquanto a sessão é resolvida (streaming). */
function SiteHeaderSkeleton() {
  return (
    <header className="border-b border-border-subtle bg-surface-raised">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="text-lg font-bold tracking-tight text-text-strong">
          Minha<span className="text-brand-600">Cidade</span>
        </span>
        <span className="h-11 w-40 animate-pulse rounded-lg bg-surface" />
      </div>
    </header>
  );
}

/**
 * Cabeçalho com sessão resolvida no servidor, em streaming: a página é entregue
 * imediatamente e o cabeçalho entra quando a sessão é conhecida (Next 16 Cache
 * Components — dados dinâmicos exigem `<Suspense>`).
 */
export function SiteHeaderSlot() {
  return (
    <Suspense fallback={<SiteHeaderSkeleton />}>
      <SiteHeader />
    </Suspense>
  );
}
