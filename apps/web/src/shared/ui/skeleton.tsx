import { cn } from "./cn";

/** Bloco de carregamento (design system §3). Decorativo: não precisa de rótulo. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-lg bg-surface", className)} />;
}

/** Cartão de publicação em carregamento — mesma silhueta do cartão do feed. */
export function PublicationCardSkeleton() {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-raised p-5 shadow-stamp">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-2/3" />
    </div>
  );
}
