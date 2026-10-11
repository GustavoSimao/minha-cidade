"use client";

import { useActionState } from "react";

import {
  deletePublicationAction,
  updatePublicationAction,
  type PublicationFormState,
} from "@/contexts/publication/interfaces/actions";
import { Alert, Button, Card } from "@/shared/ui/form";

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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-strong" htmlFor="edit-title">
            Título
          </label>
          <input
            className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong"
            defaultValue={publication.title}
            id="edit-title"
            maxLength={120}
            name="title"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-strong" htmlFor="edit-content">
            Texto
          </label>
          <textarea
            className="min-h-32 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong"
            defaultValue={publication.content}
            id="edit-content"
            maxLength={5000}
            name="content"
            rows={6}
          />
        </div>

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

  return (
    <form action={formAction}>
      <input name="publicationId" type="hidden" value={publicationId} />
      {state.error ? (
        <p className="mb-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit" variant="danger">
        {pending ? "Apagando…" : "Apagar publicação"}
      </Button>
    </form>
  );
}
