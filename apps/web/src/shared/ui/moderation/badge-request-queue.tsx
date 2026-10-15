"use client";

import { useActionState } from "react";

import type { ModerationFormState } from "@/contexts/moderation/interfaces/actions";
import {
  approveBadgeRequestAction,
  rejectBadgeRequestAction,
} from "@/contexts/moderation/interfaces/actions";
import { Button, TextField } from "@/shared/ui/form";
import { EmptyState } from "@/shared/ui/empty-state";
import { CheckIcon } from "@/shared/ui/icon";

export interface BadgeRequestQueueItemView {
  id: string;
  username: string;
  fullName: string;
  orgName: string;
  evidenceUrl: string;
  evidenceEmail: string | null;
  message: string | null;
  createdAt: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function ApproveForm({ item }: { item: BadgeRequestQueueItemView }) {
  const [state, action, pending] = useActionState<ModerationFormState, FormData>(
    approveBadgeRequestAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="requestId" type="hidden" value={item.id} />
      <input name="username" type="hidden" value={item.username} />

      <TextField
        defaultValue={item.orgName}
        label="Nome que aparece no selo"
        name="orgName"
        required
      />

      <TextField label="Motivo da aprovação (opcional)" name="reason" />

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-success" role="status">
          {state.message}
        </p>
      ) : null}

      <Button className="self-start" disabled={pending} type="submit">
        {pending ? "Aprovando…" : "Aprovar e conceder selo"}
      </Button>
    </form>
  );
}

function RejectForm({ item }: { item: BadgeRequestQueueItemView }) {
  const [state, action, pending] = useActionState<ModerationFormState, FormData>(
    rejectBadgeRequestAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="requestId" type="hidden" value={item.id} />

      <TextField label="Motivo da rejeição" name="reason" required />

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button className="self-start" disabled={pending} type="submit" variant="secondary">
        {pending ? "Rejeitando…" : "Rejeitar"}
      </Button>
    </form>
  );
}

/**
 * Fila de solicitações de selo institucional (P13/B2) do /admin.
 * Aprovar concede o selo pelo mesmo caminho do atalho (GrantBadge).
 */
export function BadgeRequestQueue({ items }: { items: BadgeRequestQueueItemView[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          className="border-dashed bg-surface p-4"
          description="Quando um órgão enviar uma solicitação em /solicitar-selo, ela aparece aqui para análise."
          icon={<CheckIcon className="h-6 w-6" />}
          title="Nenhuma solicitação de selo"
        />
      </div>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-4">
      {items.map((item) => (
        <li
          className="rounded-card border border-border-subtle bg-surface-raised p-4"
          key={item.id}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-text-strong">{item.orgName}</p>
            <span className="text-xs text-text-muted">
              {DATE_FORMAT.format(new Date(item.createdAt))}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Solicitante: {item.fullName} (@{item.username})
          </p>
          <p className="mt-1 text-sm text-text-body">
            Evidência:{" "}
            <a
              className="break-all text-brand-600 hover:underline"
              href={item.evidenceUrl}
              rel="noreferrer noopener"
              target="_blank"
            >
              {item.evidenceUrl}
            </a>
          </p>
          {item.evidenceEmail ? (
            <p className="mt-1 text-sm text-text-body">Contato: {item.evidenceEmail}</p>
          ) : null}
          {item.message ? (
            <p className="mt-2 whitespace-pre-line rounded-lg bg-surface p-3 text-sm text-text-body">
              {item.message}
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ApproveForm item={item} />
            <RejectForm item={item} />
          </div>
        </li>
      ))}
    </ul>
  );
}
