"use client";

import { useActionState } from "react";

import type { AuthFormState } from "@/contexts/identity/interfaces/actions";
import { requestBadgeAction } from "@/contexts/identity/interfaces/actions";
import { Alert, Button, TextField } from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/text-area";

export interface BadgeRequestFormProps {
  /** Nome do órgão sugerido (o dono escolhe o que pedir). */
  defaultOrgName?: string;
}

/**
 * Formulário de solicitação do selo institucional (P13/B2).
 * A evidência é um link oficial (ADR-0016); a análise é manual pelo admin.
 */
export function BadgeRequestForm({ defaultOrgName = "" }: BadgeRequestFormProps) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestBadgeAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <TextField
        defaultValue={defaultOrgName}
        label="Nome do órgão"
        name="orgName"
        placeholder="Ex.: Secretaria de Meio Ambiente de Cariacica"
        required
      />

      <TextField
        label="Link oficial da evidência"
        name="evidenceUrl"
        placeholder="https://..."
        required
        type="url"
      />

      <TextField
        label="E-mail de contato do órgão (opcional)"
        name="evidenceEmail"
        placeholder="contato@orgao.gov.br"
        type="email"
      />

      <Textarea
        label="Mensagem para o administrador (opcional)"
        maxLength={500}
        name="message"
        placeholder="Conte rapidamente quem é o órgão e por que precisa do selo."
      />

      <Button className="self-start" disabled={pending} type="submit">
        {pending ? "Enviando…" : "Enviar solicitação"}
      </Button>
    </form>
  );
}
