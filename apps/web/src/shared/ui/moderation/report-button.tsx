"use client";

import { useActionState } from "react";

import type { ModerationFormState } from "@/contexts/moderation/interfaces/actions";
import { reportContentAction } from "@/contexts/moderation/interfaces/actions";
import { Alert, Button, Card } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/text-area";

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
  const [state, formAction, pending] = useActionState<ModerationFormState, FormData>(
    reportContentAction,
    {},
  );

  if (!allowed) {
    return null;
  }

  return (
    <Card title="Denunciar conteúdo">
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

        <div>
          <Button disabled={pending} type="submit" variant="secondary">
            {pending ? "Enviando…" : "Enviar denúncia"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
