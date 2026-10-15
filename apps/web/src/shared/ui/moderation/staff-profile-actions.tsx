"use client";

import { useActionState, useState } from "react";

import type { ModerationFormState } from "@/contexts/moderation/interfaces/actions";
import {
  demoteModeratorAction,
  grantBadgeAction,
  promoteModeratorAction,
  revokeBadgeAction,
} from "@/contexts/moderation/interfaces/actions";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Button, TextField } from "@/shared/ui/form";

export interface StaffProfileActionsProps {
  username: string;
  role: "user" | "moderator" | "admin";
  verifiedOrg: string | null;
  /** Bloqueia o auto-rebaixamento (regra do caso de uso). */
  isSelf: boolean;
  /** Só o admin vê (e usa) as quatro ações — M5. */
  canManage: boolean;
}

type Dialog = "grant" | "revoke" | "promote" | "demote";

const ROLE_LABELS: Record<StaffProfileActionsProps["role"], string> = {
  user: "Usuário comum",
  moderator: "Moderador",
  admin: "Administrador",
};

/**
 * Ações de staff sobre um perfil (B2): selo de canal institucional (I5/P13) e
 * promoção/rebaixamento de moderador (M5). As quatro são exclusivas do admin
 * (validado no caso de uso) e ficam registradas na trilha de moderação (M7).
 */
export function StaffProfileActions({
  username,
  role,
  verifiedOrg,
  isSelf,
  canManage,
}: StaffProfileActionsProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);

  const [grantState, grantAction, grantPending] = useActionState<
    ModerationFormState,
    FormData
  >(grantBadgeAction, {});
  const [revokeState, revokeAction, revokePending] = useActionState<
    ModerationFormState,
    FormData
  >(revokeBadgeAction, {});
  const [promoteState, promoteAction, promotePending] = useActionState<
    ModerationFormState,
    FormData
  >(promoteModeratorAction, {});
  const [demoteState, demoteAction, demotePending] = useActionState<
    ModerationFormState,
    FormData
  >(demoteModeratorAction, {});

  const error =
    grantState.error ?? revokeState.error ?? promoteState.error ?? demoteState.error ?? null;
  const success =
    grantState.message ??
    revokeState.message ??
    promoteState.message ??
    demoteState.message ??
    null;
  const pending = grantPending || revokePending || promotePending || demotePending;

  return (
    <div className="mt-3 flex flex-col gap-3">
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2">
          {verifiedOrg === null ? (
            <Button disabled={pending} onClick={() => setDialog("grant")} type="button">
              Conceder selo institucional
            </Button>
          ) : (
            <Button
              disabled={pending}
              onClick={() => setDialog("revoke")}
              type="button"
              variant="secondary"
            >
              Revogar selo
            </Button>
          )}

          {role === "user" ? (
            <Button
              disabled={pending}
              onClick={() => setDialog("promote")}
              type="button"
              variant="secondary"
            >
              Promover a moderador
            </Button>
          ) : null}

          {role !== "user" && !isSelf ? (
            <Button
              disabled={pending}
              onClick={() => setDialog("demote")}
              type="button"
              variant="danger"
            >
              Rebaixar a usuário
            </Button>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-text-muted">
        Papel atual: {ROLE_LABELS[role]}
        {verifiedOrg ? ` · selo: ${verifiedOrg}` : " · sem selo institucional"}
      </p>

      {!canManage ? (
        <p className="text-sm text-text-muted">
          Conceder selo e alterar papel são ações exclusivas da administração (M5).
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}

      <ConfirmDialog
        action={grantAction}
        confirmLabel="Conceder selo"
        description="O selo passa a aparecer no perfil público e nas publicações do canal institucional. A concessão fica registrada na trilha de moderação."
        onClose={() => setDialog(null)}
        open={dialog === "grant"}
        pending={pending}
        title="Conceder selo institucional?"
      >
        <input name="username" type="hidden" value={username} />
        <TextField
          label="Nome do órgão"
          maxLength={120}
          name="orgName"
          placeholder="Ex.: Secretaria de Meio Ambiente"
        />
      </ConfirmDialog>

      <ConfirmDialog
        action={revokeAction}
        confirmLabel="Revogar selo"
        description="O selo e o nome do órgão são removidos do perfil. A revogação fica registrada na trilha de moderação."
        onClose={() => setDialog(null)}
        open={dialog === "revoke"}
        pending={pending}
        title="Revogar selo institucional?"
      >
        <input name="username" type="hidden" value={username} />
      </ConfirmDialog>

      <ConfirmDialog
        action={promoteAction}
        confirmLabel="Promover"
        description="O usuário passa a poder ocultar e restaurar conteúdo na fila de moderação (não pode remover — ação exclusiva do admin)."
        onClose={() => setDialog(null)}
        open={dialog === "promote"}
        pending={pending}
        title="Promover a moderador?"
      >
        <input name="username" type="hidden" value={username} />
      </ConfirmDialog>

      <ConfirmDialog
        action={demoteAction}
        confirmLabel="Rebaixar"
        description="O usuário perde os poderes de moderação e volta a ser um usuário comum. A mudança fica registrada na trilha de moderação."
        onClose={() => setDialog(null)}
        open={dialog === "demote"}
        pending={pending}
        title="Rebaixar a usuário comum?"
      >
        <input name="username" type="hidden" value={username} />
      </ConfirmDialog>
    </div>
  );
}
