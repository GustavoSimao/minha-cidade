"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  signInAction,
  signInWithGoogleAction,
  signUpAction,
  type AuthFormState,
} from "@/contexts/identity/interfaces/actions";
import { Alert, Button, Card, CheckboxField, TextField } from "@/shared/ui/form";

/** Formulário de entrada com e-mail e senha. */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signInAction,
    {},
  );

  return (
    <Card
      description="Entre para publicar, comentar e apoiar as causas do seu bairro."
      title="Entrar"
    >
      <form action={formAction} className="flex flex-col gap-4">
        {next ? <input name="next" type="hidden" value={next} /> : null}

        <TextField
          autoComplete="email"
          label="E-mail"
          name="email"
          placeholder="voce@email.com"
          required
          type="email"
        />
        <TextField
          autoComplete="current-password"
          label="Senha"
          name="password"
          required
          type="password"
        />

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <Button disabled={pending} type="submit">
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border-subtle" />
        ou
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <GoogleButton />
    </Card>
  );
}

/** Login social com Google (OAuth via Supabase Auth). */
export function GoogleButton({ label = "Entrar com Google" }: { label?: string }) {
  return (
    <form
      action={async () => {
        const url = await signInWithGoogleAction();
        window.location.assign(url);
      }}
    >
      <Button className="w-full" type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}

/** Formulário de cadastro (P22: aceite dos termos obrigatório). */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    {},
  );

  return (
    <Card
      description="Leva menos de um minuto. Você só precisa de um e-mail."
      title="Criar conta"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          autoComplete="name"
          label="Nome"
          name="name"
          placeholder="Como você quer ser chamado"
          required
        />
        <TextField
          autoComplete="email"
          label="E-mail"
          name="email"
          placeholder="voce@email.com"
          required
          type="email"
        />
        <TextField
          autoComplete="new-password"
          label="Senha"
          name="password"
          required
          type="password"
        />

        <CheckboxField
          label={
            <>
              Li e aceito os{" "}
              <Link className="text-brand-600 underline" href="/termos">
                termos de uso
              </Link>{" "}
              e a{" "}
              <Link className="text-brand-600 underline" href="/privacidade">
                política de privacidade
              </Link>
              .
            </>
          }
          name="terms"
          required
        />

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <Button disabled={pending} type="submit">
          {pending ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border-subtle" />
        ou
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <GoogleButton label="Cadastrar com Google" />
    </Card>
  );
}
