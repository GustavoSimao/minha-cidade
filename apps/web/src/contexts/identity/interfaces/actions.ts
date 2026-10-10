"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ResolveLocationSelection,
} from "@/contexts/geography/application/use-cases";
import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { CloseMyAccount, UpdateMyProfile } from "@/contexts/identity/application/use-cases";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";

export interface AuthFormState {
  error?: string;
  message?: string;
}

const NEXT_FALLBACK = "/feed";

function first(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function check(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function resolveNext(raw: string): string {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : NEXT_FALLBACK;
}

/** Entrar com e-mail e senha. */
export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = first(formData, "email").trim().toLowerCase();
  const password = first(formData, "password");
  const next = resolveNext(first(formData, "next"));

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const auth = new SupabaseAuthGateway();

  try {
    await auth.signInWithPassword(email, password);
  } catch {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(next);
}

/** Cadastro com e-mail e senha (P22: aceite dos termos obrigatório). */
export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = first(formData, "name").trim();
  const email = first(formData, "email").trim().toLowerCase();
  const password = first(formData, "password");
  const acceptedTerms = check(formData, "terms");

  if (!name || name.length < 2) {
    return { error: "Informe seu nome." };
  }
  if (!email) {
    return { error: "Informe um e-mail válido." };
  }
  if (password.length < 8) {
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  }
  if (!acceptedTerms) {
    return { error: "É necessário aceitar os termos de uso e a política de privacidade." };
  }

  const auth = new SupabaseAuthGateway();

  try {
    const { needsEmailConfirmation } = await auth.signUp({
      name,
      email,
      password,
      termsAcceptedAt: new Date(),
    });

    if (needsEmailConfirmation) {
      return {
        message:
          "Conta criada. Confirme seu e-mail para poder publicar, comentar e interagir.",
      };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível cadastrar." };
  }

  redirect(NEXT_FALLBACK);
}

/** Encerrar sessão. */
export async function signOutAction(): Promise<void> {
  const auth = new SupabaseAuthGateway();
  await auth.signOut();
  redirect("/");
}

/** Iniciar login com Google (retorna a URL do provedor). */
export async function signInWithGoogleAction(): Promise<string> {
  const auth = new SupabaseAuthGateway();
  return auth.signInWithGoogle(
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  );
}

/** Atualizar o próprio perfil (invariantes I2/I4/I5 protegidas). */
export async function updateProfileAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const cityId = first(formData, "cityId") ? Number(first(formData, "cityId")) : null;
  const neighborhoodId = first(formData, "neighborhoodId") || null;

  // Geography: o bairro precisa pertencer à cidade (G4) e bairro é opcional (G6).
  const location = await new ResolveLocationSelection(
    new SupabaseCityRepository(),
    new SupabaseNeighborhoodRepository(),
  ).execute({ cityId, neighborhoodId });

  if (!location.ok) {
    return { error: location.error };
  }

  const useCase = new UpdateMyProfile(new SupabaseProfileRepository(), new SupabaseAuthGateway());

  const result = await useCase.execute({
    fullName: first(formData, "fullName"),
    bio: first(formData, "bio") || null,
    phone: first(formData, "phone") || null,
    cityId,
    neighborhoodId,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/perfil/editar");
  revalidatePath(`/perfil/${result.value.username}`);

  return { message: "Perfil atualizado." };
}

/** Encerrar a conta (invariante I8). */
export async function closeAccountAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const useCase = new CloseMyAccount(
    new SupabaseProfileRepository(),
    new SupabaseAuthGateway(),
    async () => {
      // Fase 4 implementa a anonimização das publicações.
    },
  );

  const result = await useCase.execute(first(formData, "password"));

  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/");
}
