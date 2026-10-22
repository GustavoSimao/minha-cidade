"use client";

import { useActionState } from "react";
import Link from "next/link";

import type { EngagementFormState } from "@/contexts/engagement/interfaces/actions";
import { addCommentAction } from "@/contexts/engagement/interfaces/actions";
import { Alert, Button, Card } from "@/shared/ui/form";
import { Textarea } from "@/shared/ui/text-area";

export interface CommentFormProps {
  publicationId: string;
  canInteract: boolean;
}

/** Formulário de comentário (E3/E4). */
export function CommentForm({ publicationId, canInteract }: CommentFormProps) {
  const [state, formAction, pending] = useActionState<EngagementFormState, FormData>(
    addCommentAction,
    {},
  );

  if (!canInteract) {
    return (
      <p className="text-sm text-text-muted">
        <Link className="underline" href="/login">
          Entre na sua conta
        </Link>{" "}
        para comentar.
      </p>
    );
  }

  return (
    <Card title="Comentar">
      <form action={formAction} className="flex min-w-0 flex-col gap-3">
        <input name="publicationId" type="hidden" value={publicationId} />
        <Textarea
          maxLength={2000}
          name="content"
          placeholder="Escreva um comentário (2 a 2.000 caracteres)…"
          required
          rows={4}
          label="Comentário"
        />
        <label className="flex items-start gap-2 text-sm leading-6 text-text-body">
          <input className="h-4 w-4" name="isAnonymous" type="checkbox" />
          Comentar anonimamente (E4)
        </label>
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}
        <div>
          <Button disabled={pending} type="submit">
            {pending ? "Publicando…" : "Publicar comentário"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
