import Link from "next/link";
import { redirect } from "next/navigation";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { RegisterForm } from "@/shared/ui/auth-forms";

// A página depende da sessão (redireciona quem já está logado): pode bloquear.
export const instant = false;

export default async function RegisterPage() {
  const session = await new SupabaseAuthGateway().currentSession();
  if (session) {
    redirect("/feed");
  }

  return (
    <div className="mx-auto max-w-md">
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-text-muted">
        Já tem conta?{" "}
        <Link className="font-medium text-brand-600 underline" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}
