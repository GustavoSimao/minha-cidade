"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { EngagementFormState } from "@/contexts/engagement/interfaces/actions";
import {
  savePublicationAction,
  unsavePublicationAction,
} from "@/contexts/engagement/interfaces/actions";
import { Button } from "@/shared/ui/form";

export interface SaveButtonProps {
  publicationId: string;
  saved: boolean;
  canInteract: boolean;
}

/**
 * Salva/remove a publicação da lista privada (E6).
 *
 * `key` no wrapper reinicia o componente quando o estado muda — padrão do
 * React para "ajustar estado quando uma prop muda" (sem efeito).
 */
export function SaveButton({ publicationId, saved, canInteract }: SaveButtonProps) {
  return (
    <SaveButtonInner
      canInteract={canInteract}
      key={saved ? "saved" : "unsaved"}
      publicationId={publicationId}
      saved={saved}
    />
  );
}

function SaveButtonInner({
  publicationId,
  saved,
  canInteract,
}: SaveButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<EngagementFormState, FormData>(
    saved ? unsavePublicationAction : savePublicationAction,
    {},
  );

  return (
    <form action={formAction}>
      <input name="publicationId" type="hidden" value={publicationId} />
      <Button
        disabled={pending}
        onClick={(event) => {
          if (!canInteract) {
            event.preventDefault();
            router.push(`/login?next=${encodeURIComponent(`/publicacao/${publicationId}`)}`);
          }
        }}
        type="submit"
        variant="secondary"
      >
        {saved ? "Salvo (remover)" : "Salvar para depois"}
      </Button>
      {state.error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="mt-2 text-sm text-success">{state.message}</p>
      ) : null}
    </form>
  );
}
