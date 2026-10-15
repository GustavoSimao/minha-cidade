import { connection } from "next/server";

import { createBrowserClient } from "@supabase/ssr";

import type { AuthGateway, AuthSession } from "@/contexts/identity/application/ports";
import { createClient, createServiceRoleClient, table } from "./server";

/** Implementação do gateway de autenticação usando Supabase Auth. */
export class SupabaseAuthGateway implements AuthGateway {
  async currentSession(): Promise<AuthSession | null> {
    // A validação do token compara a expiração com o relógio: com os Cache
    // Components ativos, o prerender (inclusive o prefetch parcial do Next)
    // rejeita ler o relógio no shell estático. `connection()` adia a leitura
    // para a request — mesmo padrão do `site-header`.
    await connection();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email ?? "",
      emailConfirmed: Boolean(user.email_confirmed_at),
    };
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error("e-mail ou senha incorretos");
    }
  }

  async signUp(params: {
    name: string;
    email: string;
    password: string;
    termsAcceptedAt: Date;
  }): Promise<{ userId: string; needsEmailConfirmation: boolean }> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: { name: params.name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("não foi possível criar a conta");
    }

    // O trigger `on_auth_user_created` criou o perfil; registramos o aceite dos termos
    // (invariante I6) na própria linha do perfil.
    const service = createServiceRoleClient();
    await table(service, "identity.profiles")
      .update({ termos_aceitos_em: params.termsAcceptedAt.toISOString() })
      .eq("id", data.user.id);

    return {
      userId: data.user.id,
      needsEmailConfirmation: !data.session,
    };
  }

  async signInWithGoogle(redirectTo: string): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error || !data.url) {
      throw new Error("não foi possível iniciar o login com Google");
    }

    return data.url;
  }

  async exchangeCodeForSession(code: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw new Error("código de autenticação inválido");
    }
  }

  /**
   * Confirma o e-mail pelo link do e-mail de cadastro (P3).
   * O template local aponta para `/auth/callback?token_hash=...&type=signup`
   * (fluxo `verifyOtp`, não o `token` implícito) — assim o clique já deixa o
   * usuário com sessão aberta.
   */
  async verifyEmailToken(tokenHash: string, type: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change",
    });

    if (error) {
      throw new Error("link de confirmação inválido ou expirado");
    }
  }

  async signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  }

  async deleteUser(userId: string): Promise<void> {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`falha ao encerrar conta: ${error.message}`);
    }
  }
}
