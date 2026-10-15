"use client";

import { useActionState, useState } from "react";

import type { EngagementFormState } from "@/contexts/engagement/interfaces/actions";
import { deleteCommentAction, editCommentAction } from "@/contexts/engagement/interfaces/actions";
import type { PublicCommentAuthor } from "@/contexts/engagement/application/ports";
import { Button } from "@/shared/ui/form";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Textarea } from "@/shared/ui/text-area";

export interface CommentItemProps {
  comment: {
    id: string;
    authorId: string | null;
    content: string;
    isAnonymous: boolean;
    editedAt: Date | null;
    createdAt: Date;
    author: PublicCommentAuthor | null;
  };
  publicationId: string;
  isMine: boolean;
  canEdit: boolean;
}

/** Um comentário público (E4: anonimato preservado; E5: editar/apagar é do dono). */
export function CommentItem({
  comment,
  publicationId,
  isMine,
  canEdit,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState<
    EngagementFormState,
    FormData
  >(deleteCommentAction, {});
  const created = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(comment.createdAt);

  return (
    <li className="rounded-lg border border-border-subtle p-3">
      <div className="flex items-center gap-2 text-sm">
        {comment.author !== null ? (
          <>
            <Avatar
              imageUrl={comment.author.avatarPath}
              name={comment.author.fullName}
              size={28}
            />
            <span className="font-semibold text-text-strong">
              {comment.author.fullName}
            </span>
            {comment.author.isVerified && comment.author.verifiedOrg ? (
              <Badge testId="institutional-badge" tone="institutional">
                {comment.author.verifiedOrg}
              </Badge>
            ) : null}
          </>
        ) : (
          <>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted">
              Anônimo
            </span>
            <span className="font-semibold text-text-muted">Morador anônimo</span>
          </>
        )}
        <span className="text-text-muted">{created}</span>
        {comment.editedAt ? <span className="text-text-muted">· editado</span> : null}
      </div>

      {editing ? (
        <form
          action={async (formData: FormData) => {
            await editCommentAction({}, formData);
            setEditing(false);
          }}
          className="mt-2 flex flex-col gap-2"
        >
          <input name="commentId" type="hidden" value={comment.id} />
          <input name="publicationId" type="hidden" value={publicationId} />
          <Textarea
            defaultValue={comment.content}
            label="Editar comentário"
            maxLength={2000}
            name="content"
            required
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="submit">Salvar</Button>
            <Button
              onClick={() => setEditing(false)}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-line text-base text-text-body">
          {comment.content}
        </p>
      )}

      {isMine && !editing ? (
        <div className="mt-2 flex items-center gap-3 text-sm">
          {canEdit ? (
            <button
              className="text-brand-600 hover:underline"
              onClick={() => setEditing(true)}
              type="button"
            >
              Editar
            </button>
          ) : null}
          <form action={deleteAction}>
            <input name="commentId" type="hidden" value={comment.id} />
            <input name="publicationId" type="hidden" value={publicationId} />
            <button
              className="text-danger hover:underline"
              disabled={deletePending}
              type="submit"
            >
              {deletePending ? "Apagando…" : "Apagar"}
            </button>
          </form>
        </div>
      ) : null}

      {deleteState.error ? (
        <p className="mt-1 text-sm text-danger" role="alert">
          {deleteState.error}
        </p>
      ) : null}
    </li>
  );
}
