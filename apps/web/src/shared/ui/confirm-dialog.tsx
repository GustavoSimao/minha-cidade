"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "./form";
import { cn } from "./cn";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Rótulo do botão que confirma (padrão: "Confirmar"). */
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para ações destrutivas (apagar, remover, encerrar). */
  tone?: "default" | "danger";
  /** Desabilita os botões enquanto a ação roda (quem controla é `useActionState`). */
  pending?: boolean;
  onClose: () => void;
  /** Ação do formulário (server action ou `formAction` do `useActionState`). */
  action: (formData: FormData) => void | Promise<void>;
  /** Campos ocultos do formulário (ids do alvo etc.). */
  children?: ReactNode;
}

/**
 * Confirmação de ação destrutiva (design system §3 — `Modal`).
 *
 * Nativo, sem dependência: `role="dialog"` + `aria-modal`, Escape fecha, foco vai para o
 * diálogo ao abrir e volta ao documento ao fechar. O formulário usa a mesma action da tela,
 * então a ação só executa depois da confirmação.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  pending = false,
  onClose,
  action,
  children,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        aria-label="Fechar confirmação"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-md rounded-card border border-border-subtle bg-surface-raised p-5 shadow-lg",
        )}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <h2 className="text-lg font-semibold text-text-strong" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="mt-2 text-sm text-text-body">{description}</p>

        <form action={action} className="mt-5 flex flex-col gap-4">
          {children ? <div className="flex flex-col gap-3">{children}</div> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={pending} onClick={onClose} type="button" variant="secondary">
              {cancelLabel}
            </Button>
            <Button
              disabled={pending}
              type="submit"
              variant={tone === "danger" ? "danger" : "primary"}
            >
              {pending ? "…" : confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
