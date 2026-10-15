"use server";

import { revalidatePath } from "next/cache";

import {
  AddComment,
  DeleteMyComment,
  EditMyComment,
  SavePublication,
  ToggleReaction,
  UnsavePublication,
} from "@/contexts/engagement/application/use-cases";
import { SupabaseEngagementRepository } from "@/contexts/engagement/infrastructure/supabase/engagement-repository";
import {
  SupabasePublicationStatePort,
} from "@/contexts/engagement/infrastructure/publication-state";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { EnforceRateLimit } from "@/contexts/moderation/application/use-cases";
import {
  SupabaseModerationRepository,
  currentModerationSession,
} from "@/contexts/moderation/infrastructure/supabase/moderation-repository";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";

export interface EngagementFormState {
  error?: string;
  message?: string;
}

function first(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function publicationPath(publicationId: string): string {
  return `/publicacao/${publicationId}`;
}

/** Alterna apoio/oposição na publicação (E1: mesmo tipo remove, outro troca). */
export async function toggleReactionAction(
  _prev: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const useCase = new ToggleReaction(
    () => currentEngagementSession(),
    new SupabasePublicationStatePort(new SupabasePublicationRepository()),
    new SupabaseEngagementRepository(),
  );

  const result = await useCase.execute({
    publicationId: first(formData, "publicationId"),
    type: first(formData, "type"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {};
}

/** Cria um comentário (E2/E3/E4; limite P16/M9 — 20/hora). */
export async function addCommentAction(
  _prev: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const publicationId = first(formData, "publicationId");

  // M9/P16: 20 comentários por hora.
  const withinLimit = await new EnforceRateLimit(
    currentModerationSession,
    new SupabaseModerationRepository(),
  ).execute("comment");

  if (!withinLimit.ok) {
    return { error: withinLimit.error };
  }

  const useCase = new AddComment(
    () => currentEngagementSession(),
    new SupabasePublicationStatePort(new SupabasePublicationRepository()),
    new SupabaseEngagementRepository(),
  );

  const result = await useCase.execute({
    publicationId,
    content: first(formData, "content"),
    isAnonymous: first(formData, "isAnonymous") === "on",
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath(publicationPath(publicationId));
  return { message: "Comentário publicado." };
}

/** Edita o próprio comentário em até 15 minutos (E5). */
export async function editCommentAction(
  _prev: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const commentId = first(formData, "commentId");
  const publicationId = first(formData, "publicationId");

  const useCase = new EditMyComment(
    () => currentEngagementSession(),
    new SupabaseEngagementRepository(),
  );

  const result = await useCase.execute({
    commentId,
    content: first(formData, "content"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath(publicationPath(publicationId));
  return { message: "Comentário atualizado." };
}

/** Apaga (lógico) o próprio comentário (E5). */
export async function deleteCommentAction(
  _prev: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const commentId = first(formData, "commentId");
  const publicationId = first(formData, "publicationId");

  const useCase = new DeleteMyComment(
    () => currentEngagementSession(),
    new SupabaseEngagementRepository(),
  );

  const result = await useCase.execute({ commentId });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath(publicationPath(publicationId));
  return { message: "Comentário apagado." };
}

/** Salva a publicação na lista privada (E6). */
export async function savePublicationAction(
  _prev: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const useCase = new SavePublication(
    () => currentEngagementSession(),
    new SupabasePublicationStatePort(new SupabasePublicationRepository()),
    new SupabaseEngagementRepository(),
  );

  const result = await useCase.execute({
    publicationId: first(formData, "publicationId"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  // Sem revalidação o botão continua "Salvar para depois" até um refresh
  // manual: o rótulo vem da prop `saved`, renderizada no servidor.
  revalidatePath(publicationPath(first(formData, "publicationId")));
  return { message: "Publicação salva." };
}

/** Remove a publicação da lista privada. */
export async function unsavePublicationAction(
  _prev: EngagementFormState,
  formData: FormData,
): Promise<EngagementFormState> {
  const useCase = new UnsavePublication(
    () => currentEngagementSession(),
    new SupabaseEngagementRepository(),
  );

  const result = await useCase.execute({
    publicationId: first(formData, "publicationId"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath(publicationPath(first(formData, "publicationId")));
  return { message: "Publicação removida dos salvos." };
}

/**
 * Sessão do usuário para o Engagement (E8/P3): só contas com e-mail confirmado
 * interagem. O gateway de Identity é a única fonte da sessão (D8).
 */
async function currentEngagementSession() {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    return null;
  }

  return { userId: session.userId, emailConfirmed: session.emailConfirmed };
}
