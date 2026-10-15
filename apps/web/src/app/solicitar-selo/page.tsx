import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ListMyBadgeRequest } from "@/contexts/identity/application/use-cases";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseBadgeRequestRepository } from "@/contexts/identity/infrastructure/supabase/badge-request-repository";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { BadgeRequestForm } from "@/shared/ui/identity/badge-request-form";
import { Alert } from "@/shared/ui/form";

export const metadata: Metadata = {
  title: "Solicitar selo institucional",
  description: "Peça o selo de canal institucional com o link oficial da evidência.",
};

// Página protegida: depende da sessão e do próprio perfil.
export const instant = false;

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/** /solicitar-selo — jornada 6 do PRD: órgão pede o selo com evidência (P13). */
export default async function RequestBadgePage() {
  const session = await new SupabaseAuthGateway().currentSession();

  if (!session) {
    redirect("/login?next=/solicitar-selo");
  }

  const [profile, request] = await Promise.all([
    new SupabaseProfileRepository().findById(session.userId),
    new ListMyBadgeRequest(
      new SupabaseAuthGateway(),
      new SupabaseBadgeRequestRepository(),
    ).execute(),
  ]);

  const myRequest = request.ok ? request.value : null;
  const verifiedOrg = profile && profile.isVerified ? profile.verifiedOrg?.name ?? null : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-strong">Solicitar selo institucional</h1>
        <p className="mt-2 text-sm text-text-body">
          O selo identifica canais oficiais de órgãos públicos (P13). A análise é manual:
          envie o <strong>link oficial</strong> que comprova o vínculo com o órgão (página da
          prefeitura, decreto de nomeação ou e-mail do domínio). A concessão fica registrada
          na trilha de moderação.
        </p>
      </div>

      {!session.emailConfirmed ? (
        <Alert tone="error">
          Confirme seu e-mail para solicitar o selo. A leitura do feed já está liberada.
        </Alert>
      ) : null}

      {verifiedOrg ? (
        <Alert tone="success">
          Seu perfil já tem o selo institucional ativo: <strong>{verifiedOrg}</strong>.
        </Alert>
      ) : myRequest?.status === "pending" ? (
        <div className="rounded-card border border-border-subtle bg-surface-raised p-5">
          <h2 className="text-base font-semibold text-text-strong">Solicitação em análise</h2>
          <p className="mt-2 text-sm text-text-body">
            Órgão informado: <strong>{myRequest.orgName}</strong>. Enviada em{" "}
            {DATE_FORMAT.format(myRequest.createdAt)}. A decisão aparece nesta página.
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Precisa corrigir algo? Aguarde a decisão — uma nova solicitação só é possível
            depois que esta for rejeitada.
          </p>
        </div>
      ) : myRequest?.status === "rejected" ? (
        <div className="flex flex-col gap-4">
          <Alert tone="error">
            Sua solicitação de <strong>{myRequest.orgName}</strong> foi rejeitada
            {myRequest.decidedAt ? ` em ${DATE_FORMAT.format(myRequest.decidedAt)}` : ""}
            {myRequest.decisionReason ? `: ${myRequest.decisionReason}` : "."} Você pode
            enviar uma nova solicitação com a evidência corrigida.
          </Alert>
          <BadgeRequestForm defaultOrgName={myRequest.orgName} />
        </div>
      ) : session.emailConfirmed ? (
        <div className="rounded-card border border-border-subtle bg-surface-raised p-5">
          <BadgeRequestForm defaultOrgName={profile?.fullName.value ?? ""} />
        </div>
      ) : null}

      <p className="text-sm text-text-muted">
        Dúvidas? Veja como o selo aparece no{" "}
        <Link className="text-brand-600 hover:underline" href="/perfil/prefeitura-cariacica">
          perfil da Prefeitura de Cariacica
        </Link>
        .
      </p>
    </div>
  );
}
