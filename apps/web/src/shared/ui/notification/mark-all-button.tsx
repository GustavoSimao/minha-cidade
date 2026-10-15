"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { markAllNotificationsReadAction } from "@/contexts/notification/interfaces/actions";
import { Button } from "@/shared/ui/form";

/** Marca todas as notificações como lidas (N5). */
export function MarkAllButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await markAllNotificationsReadAction();
        router.refresh();
      }}
      type="button"
      variant="secondary"
    >
      {pending ? "…" : "Marcar todas como lidas"}
    </Button>
  );
}
