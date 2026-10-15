import Link from "next/link";
import { redirect } from "next/navigation";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { LoginForm } from "@/shared/ui/auth-forms";

// A página depende da sessão (redireciona quem já está logado): pode bloquear.
export const instant = false;

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  const session = await new SupabaseAuthGateway().currentSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-md">
      <LoginForm next={next} />
      <p className="mt-4 text-center text-sm text-text-muted">
        Não tem conta?{" "}
        <Link className="font-medium text-brand-600 underline" href="/cadastro">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
