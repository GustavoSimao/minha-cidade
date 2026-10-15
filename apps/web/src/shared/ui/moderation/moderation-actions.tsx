"use client";

import { useActionState, useState } from "react";

import type { ModerationFormState } from "@/contexts/moderation/interfaces/actions";
import {
  hideContentAction,
  removeContentAction,
  restoreContentAction,
} from "@/contexts/moderation/interfaces/actions";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Button } from "@/shared/ui/form";

export interface ModerationActionsProps {
  targetType: "publication" | "comment";
  targetId: string;
  /** M5: remover é exclusivo do admin. */
  canRemove: boolean;
}

/** Ações da moderação sobre um alvo da fila (M5/M7). */
export function ModerationActions({
  targetType,
  targetId,
  canRemove,
}: ModerationActionsProps) {
  const [hideState, hideAction, hidePending] = useActionState<
    ModerationFormState,
    FormData
  >(hideContentAction, {});
  const [restoreState, restoreAction, restorePending] = useActionState<
    ModerationFormState,
    FormData
  >(restoreContentAction, {});
  const [removeState, removeAction, removePending] = useActionState<
    ModerationFormState,
    FormData
  >(removeContentAction, {});
  const [confirming, setConfirming] = useState(false);
  const pending = hidePending || restorePending || removePending;

  const error =
    hideState.error ?? restoreState.error ?? removeState.error ?? null;
  const success =
    hideState.message ?? restoreState.message ?? removeState.message ?? null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <form action={hideAction}>
        <input name="targetType" type="hidden" value={targetType} />
        <input name="targetId" type="hidden" value={targetId} />
        <Button disabled={pending} type="submit" variant="secondary">
          {hidePending ? "…" : "Ocultar"}
        </Button>
      </form>

      <form action={restoreAction}>
        <input name="targetType" type="hidden" value={targetType} />
        <input name="targetId" type="hidden" value={targetId} />
        <Button disabled={pending} type="submit" variant="secondary">
          {restorePending ? "…" : "Restaurar"}
        </Button>
      </form>

      {canRemove ? (
        <>
          <Button onClick={() => setConfirming(true)} type="button" variant="danger">
            Remover
          </Button>
          <ConfirmDialog
            action={removeAction}
            confirmLabel="Remover definitivamente"
            description="A remoção é definitiva e só o admin pode fazê-la. A ação fica registrada na trilha de moderação."
            onClose={() => setConfirming(false)}
            open={confirming}
            pending={removePending}
            title="Remover este conteúdo?"
          >
            <input name="targetType" type="hidden" value={targetType} />
            <input name="targetId" type="hidden" value={targetId} />
          </ConfirmDialog>
        </>
      ) : null}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}
    </div>
  );
}
