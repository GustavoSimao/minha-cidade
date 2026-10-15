import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ListBadgeRequests,
  ListModerationActions,
  ListModerationQueue,
} from "@/contexts/moderation/application/use-cases";
import { SupabaseBadgeRequestDirectory } from "@/contexts/moderation/infrastructure/supabase/badge-request-adapters";
import {
  SupabaseModerationRepository,
  SupabaseProfileLookup,
  SupabaseRoleDirectory,
  SupabaseTargetDirectory,
  currentModerationSession,
} from "@/contexts/moderation/infrastructure/supabase/moderation-repository";
import { BadgeRequestQueue } from "@/shared/ui/moderation/badge-request-queue";
import { ModerationActions } from "@/shared/ui/moderation/moderation-actions";
import { StaffProfileActions } from "@/shared/ui/moderation/staff-profile-actions";
import { EmptyState } from "@/shared/ui/empty-state";
import { FlagIcon } from "@/shared/ui/icon";
import { Button, TextField } from "@/shared/ui/form";

export const metadata: Metadata = { title: "Moderação" };

// Página de staff: depende da sessão e do papel (M5).
export const instant = false;

interface AdminPageProps {
  searchParams: Promise<{ busca?: string }>;
}

/** Fila de moderação: alvos com 3+ denúncias (P10) e trilha (M7). */
export default async function AdminPage({ searchParams }: AdminPageProps) {
  const staff = await new ListModerationQueue(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseModerationRepository(),
    new SupabaseTargetDirectory(),
  ).requireStaff(currentModerationSession, new SupabaseRoleDirectory());

  // 404 para não-staff: a rota "não existe" para o usuário comum.
  if (!staff.ok) {
    notFound();
  }

  const [queue, trail, badgeRequests] = await Promise.all([
    new ListModerationQueue(
      currentModerationSession,
      new SupabaseRoleDirectory(),
      new SupabaseModerationRepository(),
      new SupabaseTargetDirectory(),
    ).execute({ minReports: 3, limit: 20 }),
    new ListModerationActions(
      currentModerationSession,
      new SupabaseRoleDirectory(),
      new SupabaseModerationRepository(),
      new SupabaseTargetDirectory(),
    ).execute(20),
    new ListBadgeRequests(
      currentModerationSession,
      new SupabaseRoleDirectory(),
      new SupabaseBadgeRequestDirectory(),
    ).execute({ limit: 20 }),
  ]);

  const items = queue.ok ? queue.value : [];
  const actions = trail.ok ? trail.value : [];
  const requests = badgeRequests.ok
    ? badgeRequests.value.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))
    : [];

  // Contas (B2): busca por username para ações de staff sobre o perfil.
  const { busca } = await searchParams;
  const account =
    busca && busca.trim()
      ? await new SupabaseProfileLookup().findByUsername(busca.trim().replace(/^@/, ""))
      : null;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-text-strong">Fila de moderação</h1>
      <p className="mt-1 text-sm text-text-muted">
        Alvos com 3 ou mais denúncias de usuários distintos. O conteúdo continua
        visível até uma ação (P10). Papel: {staff.value.role}.
      </p>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Itens com 3 ou mais denúncias de usuários distintos aparecem aqui. O conteúdo continua visível até uma ação (P21)."
            icon={<FlagIcon className="h-8 w-8" />}
            title="Nenhum conteúdo na fila"
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {items.map((item) => (
            <li
              className="rounded-card border border-border-subtle bg-surface-raised p-4"
              key={`${item.reportableType}:${item.reportableId}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-surface px-2 py-0.5 font-medium text-text-body">
                  {item.reportableType === "publication" ? "Publicação" : "Comentário"}
                </span>
                <span className="font-semibold text-text-strong">
                  {item.reportsCount} denúncia(s)
                </span>
                <span className="text-text-muted">
                  motivos: {item.reasons.join(", ")}
                </span>
                {item.target?.hiddenAt ? (
                  <span className="font-medium text-warning">oculto</span>
                ) : null}
                {item.target?.deletedAt ? (
                  <span className="font-medium text-danger">removido</span>
                ) : null}
              </div>

              <p className="mt-2 text-text-body">
                {item.target?.title ?? item.target?.excerpt ?? "(alvo não encontrado)"}
              </p>

              {item.target ? (
                <a
                  className="mt-1 inline-block text-sm text-brand-600 hover:underline"
                  href={item.target.url}
                >
                  Abrir conteúdo
                </a>
              ) : null}

              <ModerationActions
                canRemove={staff.value.role === "admin"}
                targetId={item.reportableId}
                targetType={item.reportableType}
              />
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-xl font-bold text-text-strong">
        Solicitações de selo institucional
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Pedidos enviados em <code>/solicitar-selo</code> com evidência (P13/B2). Aprovar
        concede o selo pelo mesmo caminho do atalho abaixo e registra na trilha (M5/M7).
      </p>

      <BadgeRequestQueue items={requests} />

      <h2 className="mt-10 text-xl font-bold text-text-strong">
        Contas — selo institucional e papel
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Busque pelo username (com ou sem @) para conceder o selo de canal
        institucional (P13) ou promover/rebaixar moderadores. Todas as ações são
        exclusivas do admin e ficam na trilha (M5/M7).
      </p>

      <form action="/admin" className="mt-4 flex flex-wrap items-end gap-3" method="get">
        <div className="min-w-64 flex-1">
          <TextField
            defaultValue={busca ?? ""}
            label="Username"
            name="busca"
            placeholder="username ou @username"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {busca && busca.trim() ? (
        account === null ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            Nenhum perfil encontrado para &ldquo;{busca.trim()}&rdquo;.
          </p>
        ) : (
          <div className="mt-4 rounded-card border border-border-subtle bg-surface-raised p-4">
            <p className="font-semibold text-text-strong">{account.fullName}</p>
            <p className="text-sm text-text-muted">@{account.username}</p>
            <StaffProfileActions
              canManage={staff.value.role === "admin"}
              isSelf={account.id === staff.value.userId}
              role={account.role}
              username={account.username}
              verifiedOrg={account.verifiedOrg}
            />
          </div>
        )
      ) : null}

      <h2 className="mt-10 text-xl font-bold text-text-strong">
        Trilha de ações
      </h2>      {actions.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            className="border-dashed bg-surface p-4"
            description="Toda ação de moderação (ocultar, restaurar, remover, resolver denúncia) fica registrada aqui."
            icon={<FlagIcon className="h-6 w-6" />}
            title="Nenhuma ação registrada."
          />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {actions.map((action) => (
            <li
              className="rounded-lg border border-border-subtle p-3 text-sm text-text-body"
              key={action.id}
            >
              <span className="font-semibold">{action.action}</span> em{" "}
              {action.targetType} ·{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(action.createdAt)}
              {action.reason ? ` · motivo: ${action.reason}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
