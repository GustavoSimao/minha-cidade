"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createBrowserSupabase } from "@/shared/infrastructure/supabase-browser";
import { BellIcon } from "@/shared/ui/icon";

export interface NotificationBellProps {
  unreadCount: number;
  /** Dono do sininho: o canal Realtime só escuta as linhas deste usuário. */
  userId: string;
}

/**
 * Sininho de notificações (Fase 8).
 *
 * Realtime (D8): notificação nova chega sem recarregar — o `router.refresh()`
 * re-renderiza o servidor com a lista e a contagem atualizadas. O `key` no
 * wrapper reinicia o componente quando a contagem do servidor muda (padrão
 * React para estado derivado de prop, sem efeito).
 */
export function NotificationBell({ unreadCount, userId }: NotificationBellProps) {
  return (
    <NotificationBellInner key={unreadCount} unreadCount={unreadCount} userId={userId} />
  );
}

function NotificationBellInner({ unreadCount, userId }: NotificationBellProps) {
  const router = useRouter();
  const [count, setCount] = useState(unreadCount);

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `user_id=eq.${userId}`,
          schema: "notification",
          table: "notifications",
        },
        () => {
          setCount((current) => current + 1);
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return (
    <a
      aria-label={`Notificações: ${count} não lidas`}
      className="relative inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-text-body hover:bg-brand-50 hover:text-brand-700"
      href="/notificacoes"
    >
      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center">
        <BellIcon className="h-5 w-5" />
      </span>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </a>
  );
}
