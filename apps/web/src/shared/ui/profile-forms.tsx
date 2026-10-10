"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  closeAccountAction,
  updateProfileAction,
  type AuthFormState,
} from "@/contexts/identity/interfaces/actions";
import { Alert, Button, Card, TextField } from "@/shared/ui/form";

/** Dados do perfil próprio necessários ao formulário. */
export interface OwnProfileFormData {
  username: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  cityId: number | null;
  neighborhoodId: string | null;
  isVerified: boolean;
  verifiedOrg: string | null;
  role: string;
  emailConfirmed: boolean;
}

/** Formulário de edição do próprio perfil (invariantes I2/I4/I5 protegidas). */
export function ProfileForm({ profile }: { profile: OwnProfileFormData }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <Card
      description="Seu nome de usuário (@) e seu papel não podem ser alterados aqui."
      title="Editar perfil"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          autoComplete="name"
          defaultValue={profile.fullName}
          label="Nome"
          name="fullName"
          required
        />
        <TextField
          defaultValue={profile.phone ?? ""}
          label="Telefone (privado)"
          name="phone"
          placeholder="(27) 99999-9999"
          type="tel"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-strong" htmlFor="bio">
            Bio
          </label>
          <textarea
            className="min-h-24 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong placeholder:text-text-muted"
            defaultValue={profile.bio ?? ""}
            id="bio"
            maxLength={2000}
            name="bio"
            rows={4}
          />
        </div>

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} type="submit">
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
            href={`/perfil/${profile.username}`}
          >
            Ver perfil público
          </Link>
        </div>
      </form>
    </Card>
  );
}

/** Encerramento de conta com confirmação por senha (invariante I8). */
export function CloseAccountForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    closeAccountAction,
    {},
  );

  return (
    <Card
      description="Seus dados serão apagados e suas publicações permanecerão sem autor identificado."
      title="Encerrar conta"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          autoComplete="current-password"
          label="Confirme sua senha"
          name="password"
          required
          type="password"
        />
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        <Button disabled={pending} type="submit" variant="danger">
          {pending ? "Encerrando…" : "Encerrar minha conta"}
        </Button>
      </form>
    </Card>
  );
}
