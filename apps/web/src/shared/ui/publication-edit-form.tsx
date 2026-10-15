"use client";

import { useActionState, useState } from "react";

import {
  deletePublicationAction,
  updatePublicationAction,
  type PublicationFormState,
} from "@/contexts/publication/interfaces/actions";
import { Alert, Button, Card, TextField } from "@/shared/ui/form";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Textarea } from "@/shared/ui/text-area";

export interface PublicationEditFormProps {
  publication: {
    id: string;
    title: string;
    content: string;
    mediaPaths: string[];
  };
}

/** Edição da própria publicação (P7: só título, texto e fotos). */
export function PublicationEditForm({
  publication,
}: PublicationEditFormProps) {
  const [state, formAction, pending] = useActionState<PublicationFormState, FormData>(
    updatePublicationAction,
    {},
  );

  return (
    <Card title="Editar publicação">
      <form action={formAction} className="flex flex-col gap-4">
        <input name="publicationId" type="hidden" value={publication.id} />
        <input name="mediaPaths" type="hidden" value={publication.mediaPaths.join("\n")} />

        <TextField
          defaultValue={publication.title}
          id="edit-title"
          label="Título"
          maxLength={120}
          name="title"
        />

        <Textarea
          defaultValue={publication.content}
          id="edit-content"
          label="Texto"
          maxLength={5000}
          name="content"
          rows={6}
        />

        {publication.mediaPaths.length > 0 ? (
          <p className="text-sm text-text-muted">
            {publication.mediaPaths.length} imagem(ns) mantida(s). Para trocar as fotos,
            apague esta publicação e publique novamente.
          </p>
        ) : null}

        <p className="text-sm text-text-muted">
          Tipo, local e anonimato não podem ser alterados depois de publicar.
        </p>

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <div className="flex gap-2">
          <Button disabled={pending} type="submit">
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** Apaga a própria publicação (P8: exclusão lógica). */
export function DeletePublicationButton({ publicationId }: { publicationId: string }) {
  const [state, formAction, pending] = useActionState<PublicationFormState, FormData>(
    deletePublicationAction,
    {},
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => setConfirming(true)} type="button" variant="danger">
        Apagar publicação
      </Button>

      <ConfirmDialog
        action={formAction}
        confirmLabel="Apagar publicação"
        description="A publicação sai do feed e só a moderação pode restaurá-la. Não é possível desfazer por conta própria."
        onClose={() => setConfirming(false)}
        open={confirming}
        pending={pending}
        title="Apagar esta publicação?"
      >
        <input name="publicationId" type="hidden" value={publicationId} />
      </ConfirmDialog>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
