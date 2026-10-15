import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  ListMyNotifications,
} from "@/contexts/notification/application/use-cases";
import {
  SupabaseNotificationRepository,
  currentNotificationSession,
} from "@/contexts/notification/infrastructure/supabase/notification-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { BellIcon } from "@/shared/ui/icon";
import { EmptyState } from "@/shared/ui/empty-state";
import { MarkAllButton } from "@/shared/ui/notification/mark-all-button";

export const metadata: Metadata = { title: "Notificações" };

// Página privada: depende da sessão.
export const instant = false;

/** Lista de notificações do usuário (N5). */
export default async function NotificationsPage() {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    redirect("/login?next=/notificacoes");
  }

  const result = await new ListMyNotifications(
    currentNotificationSession,
    new SupabaseNotificationRepository(),
  ).execute({ limit: 50 });

  const items = result.ok ? result.value.items : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-strong">Notificações</h1>
        <MarkAllButton />
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            description="Quando alguém comentar, apoiar ou enviar um pedido de amizade, o aviso chega aqui e no sininho do cabeçalho."
            icon={<BellIcon className="h-8 w-8" />}
            title="Nenhuma notificação ainda"
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                className={`flex flex-wrap items-center justify-between gap-2 rounded-card border p-3 hover:bg-surface ${
                  item.isUnread
                    ? "border-brand-600/40 bg-brand-50/40"
                    : "border-border-subtle bg-surface-raised"
                }`}
                href={item.targetUrl}
              >
                <span className="text-text-strong">{item.label}</span>
                <span className="text-sm text-text-muted">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(item.createdAt)}
                  {item.isUnread ? " · nova" : ""}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
