import type { ReactNode } from "react";

import { cn } from "./cn";

export interface EmptyStateProps {
  /** Ícone opcional (SVG inline, decorativo — o texto carrega o significado). */
  icon?: ReactNode;
  title: string;
  description: string;
  /** Ação opcional (link ou botão) — o design system pede ícone + título + descrição + ação. */
  action?: ReactNode;
  className?: string;
}

/**
 * Estado vazio (design system §3): ícone + título + descrição + ação.
 * Usado em feed, comentários, amigos, notificações, fila de moderação etc.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border border-dashed border-border-subtle bg-surface-raised px-6 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden="true" className="text-text-muted">
          {icon}
        </span>
      ) : null}
      <h2 className="text-base font-semibold text-text-strong">{title}</h2>
      <p className="max-w-md text-sm text-text-body">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
