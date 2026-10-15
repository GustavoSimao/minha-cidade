"use server";

import {
  AcceptFriendRequest,
  CancelFriendRequest,
  RejectFriendRequest,
  SendFriendRequest,
  Unfriend,
} from "@/contexts/social-graph/application/use-cases";
import {
  SupabaseFriendshipRepository,
  SupabaseProfileLookup,
} from "@/contexts/social-graph/infrastructure/supabase/friendship-repository";
import { currentSocialGraphSession } from "@/contexts/social-graph/infrastructure/session";

export interface FriendshipFormState {
  error?: string;
  message?: string;
}

function first(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Envia pedido de amizade (S2/S3). */
export async function sendFriendRequestAction(
  _prev: FriendshipFormState,
  formData: FormData,
): Promise<FriendshipFormState> {
  const useCase = new SendFriendRequest(
    currentSocialGraphSession,
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  );

  const result = await useCase.execute({ username: first(formData, "username") });

  return result.ok ? { message: "Pedido enviado." } : { error: result.error };
}

/** Cancela o próprio pedido (S5). */
export async function cancelFriendRequestAction(
  _prev: FriendshipFormState,
  formData: FormData,
): Promise<FriendshipFormState> {
  const useCase = new CancelFriendRequest(
    currentSocialGraphSession,
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  );

  const result = await useCase.execute({ username: first(formData, "username") });

  return result.ok ? { message: "Pedido cancelado." } : { error: result.error };
}

/** Aceita pedido recebido (S4). */
export async function acceptFriendRequestAction(
  _prev: FriendshipFormState,
  formData: FormData,
): Promise<FriendshipFormState> {
  const useCase = new AcceptFriendRequest(
    currentSocialGraphSession,
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  );

  const result = await useCase.execute({ username: first(formData, "username") });

  return result.ok ? { message: "Agora vocês são amigos." } : { error: result.error };
}

/** Recusa pedido recebido (S4). */
export async function rejectFriendRequestAction(
  _prev: FriendshipFormState,
  formData: FormData,
): Promise<FriendshipFormState> {
  const useCase = new RejectFriendRequest(
    currentSocialGraphSession,
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  );

  const result = await useCase.execute({ username: first(formData, "username") });

  return result.ok ? { message: "Pedido recusado." } : { error: result.error };
}

/** Desfaz amizade (S6). */
export async function unfriendAction(
  _prev: FriendshipFormState,
  formData: FormData,
): Promise<FriendshipFormState> {
  const useCase = new Unfriend(
    currentSocialGraphSession,
    new SupabaseProfileLookup(),
    new SupabaseFriendshipRepository(),
  );

  const result = await useCase.execute({ username: first(formData, "username") });

  return result.ok ? { message: "Amizade desfeita." } : { error: result.error };
}
