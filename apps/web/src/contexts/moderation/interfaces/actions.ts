"use server";

import { revalidatePath } from "next/cache";

import {
  ApplyModerationAction,
  ApproveBadgeRequest,
  DemoteModerator,
  GrantBadge,
  PromoteModerator,
  RejectBadgeRequest,
  ReportContent,
  RevokeBadge,
} from "@/contexts/moderation/application/use-cases";
import {
  SupabaseBadgeRequestAdmin,
  SupabaseBadgeRequestDirectory,
} from "@/contexts/moderation/infrastructure/supabase/badge-request-adapters";
import {
  SupabaseModerationRepository,
  SupabaseProfileAdmin,
  SupabaseProfileLookup,
  SupabaseRoleDirectory,
  SupabaseTargetDirectory,
  SupabaseTargetVisibility,
  currentModerationSession,
} from "@/contexts/moderation/infrastructure/supabase/moderation-repository";

export interface ModerationFormState {
  error?: string;
  message?: string;
}

function first(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Denuncia publicação ou comentário (M1–M4, M8, M9). */
export async function reportContentAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new ReportContent(
    currentModerationSession,
    new SupabaseModerationRepository(),
    new SupabaseTargetDirectory(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    reportableType: first(formData, "targetType"),
    targetId: first(formData, "targetId"),
    reason: first(formData, "reason"),
    details: first(formData, "details") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {
    message: `Denúncia registrada. Este conteúdo tem ${result.value.reportsCount} denúncia(s).`,
  };
}

/** Ocultar (M5/M7). */
export async function hideContentAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  return applyAction(formData, "hide");
}

/** Restaurar (M5/M7). */
export async function restoreContentAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  return applyAction(formData, "restore");
}

/** Remover (M5 — só admin/M7). */
export async function removeContentAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  return applyAction(formData, "remove");
}

async function applyAction(
  formData: FormData,
  action: "hide" | "restore" | "remove",
): Promise<ModerationFormState> {
  const targetType = first(formData, "targetType");
  const targetId = first(formData, "targetId");

  const useCase = new ApplyModerationAction(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseModerationRepository(),
    new SupabaseTargetDirectory(),
    new SupabaseTargetVisibility(),
  );

  const result = await useCase.execute({
    action,
    targetType,
    targetId,
    reason: first(formData, "reason") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath(`/publicacao/${targetId}`);

  const labels = { hide: "oculto", restore: "restaurado", remove: "removido" };

  return { message: `Conteúdo ${labels[action]}.` };
}

// ---------------------------------------------------------------- Fase 8 (B2)

/** Concede o selo de canal institucional (I5/P13) — só admin. */
export async function grantBadgeAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new GrantBadge(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseProfileLookup(),
    new SupabaseProfileAdmin(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    username: first(formData, "username"),
    orgName: first(formData, "orgName"),
    reason: first(formData, "reason") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const username = normalize(formData, "username");
  revalidatePath("/admin");
  revalidatePath(`/perfil/${username}`);

  return { message: "Selo institucional concedido." };
}

/** Revoga o selo de canal institucional (I5) — só admin. */
export async function revokeBadgeAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new RevokeBadge(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseProfileLookup(),
    new SupabaseProfileAdmin(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    username: first(formData, "username"),
    reason: first(formData, "reason") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const username = normalize(formData, "username");
  revalidatePath("/admin");
  revalidatePath(`/perfil/${username}`);

  return { message: "Selo institucional revogado." };
}

/** Promove usuário comum a moderador (M5) — só admin. */
export async function promoteModeratorAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new PromoteModerator(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseProfileLookup(),
    new SupabaseProfileAdmin(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    username: first(formData, "username"),
    reason: first(formData, "reason") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const username = normalize(formData, "username");
  revalidatePath("/admin");
  revalidatePath(`/perfil/${username}`);

  return { message: "Perfil promovido a moderador." };
}

/** Rebaixa moderador/admin a usuário comum (M5) — só admin. */
export async function demoteModeratorAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new DemoteModerator(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseProfileLookup(),
    new SupabaseProfileAdmin(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    username: first(formData, "username"),
    reason: first(formData, "reason") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const username = normalize(formData, "username");
  revalidatePath("/admin");
  revalidatePath(`/perfil/${username}`);

  return { message: "Perfil rebaixado a usuário comum." };
}

/** Mesma normalização de username dos casos de uso. */
function normalize(formData: FormData, key: string): string {
  return first(formData, key).trim().replace(/^@/, "").toLowerCase();
}

/** Aprova uma solicitação de selo (P13/B2) — só admin. */
export async function approveBadgeRequestAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new ApproveBadgeRequest(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseBadgeRequestDirectory(),
    new SupabaseBadgeRequestAdmin(),
    new SupabaseProfileLookup(),
    new SupabaseProfileAdmin(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    requestId: first(formData, "requestId"),
    orgName: first(formData, "orgName") || null,
    reason: first(formData, "reason") || null,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath(`/perfil/${normalize(formData, "username")}`);

  return { message: "Solicitação aprovada e selo concedido." };
}

/** Rejeita uma solicitação de selo com motivo (P13/B2) — só admin. */
export async function rejectBadgeRequestAction(
  _prev: ModerationFormState,
  formData: FormData,
): Promise<ModerationFormState> {
  const useCase = new RejectBadgeRequest(
    currentModerationSession,
    new SupabaseRoleDirectory(),
    new SupabaseBadgeRequestDirectory(),
    new SupabaseBadgeRequestAdmin(),
    new SupabaseModerationRepository(),
  );

  const result = await useCase.execute({
    requestId: first(formData, "requestId"),
    reason: first(formData, "reason"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin");

  return { message: "Solicitação rejeitada." };
}
