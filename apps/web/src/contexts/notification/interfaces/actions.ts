"use server";

import {
  MarkAllNotificationsAsRead,
  MarkNotificationAsRead,
} from "@/contexts/notification/application/use-cases";
import {
  SupabaseNotificationRepository,
  currentNotificationSession,
} from "@/contexts/notification/infrastructure/supabase/notification-repository";

export interface NotificationFormState {
  error?: string;
}

/** Marca uma notificação como lida (N5). */
export async function markNotificationReadAction(
  _prev: NotificationFormState,
  formData: FormData,
): Promise<NotificationFormState> {
  const id = formData.get("id");

  const result = await new MarkNotificationAsRead(
    currentNotificationSession,
    new SupabaseNotificationRepository(),
  ).execute({ id: typeof id === "string" ? id : "" });

  return result.ok ? {} : { error: result.error };
}

/** Marca todas como lidas (N5). */
export async function markAllNotificationsReadAction(): Promise<NotificationFormState> {
  const result = await new MarkAllNotificationsAsRead(
    currentNotificationSession,
    new SupabaseNotificationRepository(),
  ).execute();

  return result.ok ? {} : { error: result.error };
}
