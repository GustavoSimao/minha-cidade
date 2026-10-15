"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";

import type { FriendshipFormState } from "@/contexts/social-graph/interfaces/actions";
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  rejectFriendRequestAction,
  sendFriendRequestAction,
  unfriendAction,
} from "@/contexts/social-graph/interfaces/actions";
import { Button } from "@/shared/ui/form";

export type Relationship = "none" | "pending_sent" | "pending_received" | "friends";

export interface FriendButtonProps {
  username: string;
  relationship: Relationship;
  canInteract: boolean;
}

/**
 * Botão de amizade no perfil público (Fase 6).
 *
 * Um único componente derivado da relação; `key` reinicia o `useActionState`
 * quando a relação muda (padrão React para estado derivado de prop).
 */
export function FriendButton({ username, relationship, canInteract }: FriendButtonProps) {
  return (
    <FriendButtonInner
      canInteract={canInteract}
      key={`${relationship}:${username}`}
      relationship={relationship}
      username={username}
    />
  );
}

function FriendButtonInner({
  username,
  relationship,
  canInteract,
}: FriendButtonProps) {
  const router = useRouter();
  const actions = {
    none: sendFriendRequestAction,
    pending_sent: cancelFriendRequestAction,
    pending_received: acceptFriendRequestAction,
    friends: unfriendAction,
  } as const;

  const [state, formAction, pending] = useActionState<FriendshipFormState, FormData>(
    actions[relationship],
    {},
  );

  if (relationship === "pending_received") {
    // Dois botões: aceitar e recusar.
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <form
            action={async (formData: FormData) => {
              if (!canInteract) {
                router.push(`/login?next=/perfil/${username}`);
                return;
              }
              await acceptFriendRequestAction({}, formData);
              router.refresh();
            }}
          >
            <input name="username" type="hidden" value={username} />
            <Button disabled={pending} type="submit">
              Aceitar pedido de amizade
            </Button>
          </form>
          <form
            action={async (formData: FormData) => {
              if (!canInteract) {
                router.push(`/login?next=/perfil/${username}`);
                return;
              }
              await rejectFriendRequestAction({}, formData);
              router.refresh();
            }}
          >
            <input name="username" type="hidden" value={username} />
            <Button disabled={pending} type="submit" variant="secondary">
              Recusar
            </Button>
          </form>
        </div>
        {state.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    );
  }

  const label =
    relationship === "none"
      ? "Adicionar amigo"
      : relationship === "pending_sent"
        ? "Cancelar pedido enviado"
        : "Amigos (desfazer)";

  return (
    <div className="flex flex-col gap-1">
      <form
        action={async (formData: FormData) => {
          if (!canInteract) {
            router.push(`/login?next=/perfil/${username}`);
            return;
          }
          await formAction(formData);
          router.refresh();
        }}
      >
        <input name="username" type="hidden" value={username} />
        <Button
          disabled={pending}
          type="submit"
          variant="secondary"
        >
          {pending ? "…" : label}
        </Button>
      </form>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </div>
  );
}
