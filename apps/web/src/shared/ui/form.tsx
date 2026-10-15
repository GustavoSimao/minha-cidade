"use client";

import {
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
      primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-stamp",
  secondary:
    "border border-border-subtle bg-surface-raised text-text-body hover:bg-surface",
  danger: "bg-danger text-white hover:bg-danger-hover",
};

/** Botão com alvo de toque mínimo de 44px (design system). */
export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Campo de texto com label acessível e mensagem de erro. */
export function TextField({
  label,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  // `useId` (não `name`): dois formulários na mesma página com campos de mesmo
  // `name` gerariam ids HTML duplicados e os labels apontariam para o input
  // errado (bug real na fila de solicitações do /admin).
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-sm font-medium text-text-strong"
        htmlFor={fieldId}
      >
        {label}
      </label>
      <input
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong placeholder:text-text-muted",
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

/** Caixa de seleção com label acessível. */
export function CheckboxField({
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className="flex items-start gap-2.5">
      <input
        className="mt-1 h-4 w-4 rounded border-border-subtle text-brand-600"
        id={fieldId}
        type="checkbox"
        {...props}
      />
      <label className="text-sm text-text-body" htmlFor={fieldId}>
        {label}
      </label>
    </div>
  );
}

/** Aviso em linha (erro ou sucesso). */
export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        tone === "error" ? "bg-red-50 text-danger" : "bg-green-50 text-success",
      )}
      role="status"
    >
      {children}
    </p>
  );
}

/** Cartão de página. */
export function Card({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface-raised p-5 shadow-stamp sm:p-6">
      {title ? (
        <h1 className="text-xl font-bold text-text-strong">{title}</h1>
      ) : null}
      {description ? (
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      ) : null}
      <div className={cn(title && "mt-5")}>{children}</div>
    </section>
  );
}
