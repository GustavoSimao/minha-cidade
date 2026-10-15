"use client";

import { useId, type TextareaHTMLAttributes } from "react";

import { cn } from "./cn";

/** Textarea acessível (design system §3): `label` associado e erro com `aria-describedby`. */
export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
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
      <textarea
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-24 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong placeholder:text-text-muted",
          error && "border-danger",
          className,
        )}
        id={fieldId}
        {...props}
      />
      {error ? (
        <p className="text-sm text-danger" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
