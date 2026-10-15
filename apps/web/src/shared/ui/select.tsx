"use client";

import { useId, type SelectHTMLAttributes, type ReactNode } from "react";

import { cn } from "./cn";

/**
 * Select acessível (design system §3): `label` associado por id, mensagem de erro com
 * `aria-describedby`. Envolve o `<select>` nativo para manter o comportamento mobile.
 */
export function Select({
  label,
  error,
  className,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  // `useId` (não `name`): ver o comentário em `form.tsx` — `name` repetido em
  // formulários diferentes da mesma página duplicaria o id HTML.
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-strong" htmlFor={fieldId}>
        {label}
      </label>
      <select
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong",
          error && "border-danger",
          className,
        )}
        id={fieldId}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-sm text-danger" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
