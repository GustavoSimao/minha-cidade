"use client";

import { useActionState, useEffect, useState } from "react";

import type { ModerationFormState } from "@/contexts/moderation/interfaces/actions";
import { reportContentAction } from "@/contexts/moderation/interfaces/actions";
import { Alert, Button } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/text-area";
import { Icon } from "@/shared/ui/icon";

export interface ReportButtonProps {
  targetType: "publication" | "comment";
  targetId: string;
  /** false quando o conteúdo é do próprio usuário (M8) — botão escondido. */
  allowed: boolean;
}

const REASONS = [
  { value: "spam", label: "Spam ou propaganda" },
  { value: "discurso_odio", label: "Discurso de ódio" },
  { value: "informacao_falsa", label: "Informação falsa" },
  { value: "conteudo_ilegal", label: "Conteúdo ilegal" },
  { value: "assedio", label: "Assédio ou ameaça" },
  { value: "outro", label: "Outro" },
];

/** Denúncia com motivo fechado (M3) e detalhe opcional. */
export function ReportButton({ targetType, targetId, allowed }: ReportButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ModerationFormState, FormData>(
    reportContentAction,
    {},
  );

  useEffect(() => {
    if (!dialogOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen]);

  if (!allowed) return null;

  return (
    <div className="relative">
      <button
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Mais opções da publicação"
        className="grid h-11 w-11 place-items-center rounded-full text-text-muted transition hover:bg-surface hover:text-text-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <Icon name="more" size={21} />
      </button>
      {menuOpen ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border-subtle bg-white p-1.5 shadow-elevated" role="menu">
          <button
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-danger hover:bg-danger-bg"
            onClick={() => { setMenuOpen(false); setDialogOpen(true); }}
            role="menuitem"
            type="button"
          >
            <Icon name="alert" size={18} />
            Denunciar publicação
          </button>
        </div>
      ) : null}
      {dialogOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 p-4 sm:p-6">
          <button aria-label="Fechar denúncia" className="absolute inset-0 cursor-default" onClick={() => setDialogOpen(false)} tabIndex={-1} type="button" />
          <section aria-labelledby="report-dialog-title" aria-modal="true" className="relative z-10 max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-paper p-5 shadow-modal sm:p-7" role="dialog">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ink" id="report-dialog-title">Denunciar publicação</h2>
                <p className="mt-1 text-sm text-muted">Escolha o motivo que melhor descreve o problema.</p>
              </div>
              <button aria-label="Fechar denúncia" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-white hover:bg-soft" onClick={() => setDialogOpen(false)} type="button">
                <Icon name="close" size={19} />
              </button>
            </header>
            <form action={formAction} className="flex flex-col gap-3">
        <input name="targetType" type="hidden" value={targetType} />
        <input name="targetId" type="hidden" value={targetId} />

        <div className="flex flex-col gap-1.5">
          <Select
            defaultValue="spam"
            id={`reason-${targetId}`}
            label="Motivo"
            name="reason"
            required
          >
            {REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          id={`details-${targetId}`}
          label="Detalhe (opcional)"
          maxLength={1000}
          name="details"
          rows={3}
        />

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <div className="pt-1">
          <Button className="w-full sm:w-auto" disabled={pending} type="submit" variant="secondary">
            {pending ? "Enviando…" : "Enviar denúncia"}
          </Button>
        </div>
      </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
