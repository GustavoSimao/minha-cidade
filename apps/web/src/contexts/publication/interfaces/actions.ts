"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PublicationMedia } from "@/contexts/publication/domain/publication-media";
import {
  CreatePublication,
  DeleteMyPublication,
  UpdateMyPublication,
} from "@/contexts/publication/application/use-cases";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { GeographyLocationValidator } from "@/contexts/publication/infrastructure/supabase/location-validator";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { EnforceRateLimit } from "@/contexts/moderation/application/use-cases";
import {
  SupabaseModerationRepository,
  currentClientIp,
  currentModerationSession,
} from "@/contexts/moderation/infrastructure/supabase/moderation-repository";
import { first } from "@/shared/form";

export interface PublicationFormState {
  error?: string;
  message?: string;
}

/** Lê os paths de mídia já enviados pelos campos hidden `mediaPaths`. */
function mediaPaths(formData: FormData): PublicationMedia[] {
  const raw = first(formData, "mediaPaths");

  if (!raw) {
    return [];
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 3)
    .map((path, index) =>
      PublicationMedia.create({
        path,
        position: index + 1,
        byteSize: 1, // tamanho real conferido no upload (Route Handler)
      }),
    );
}

/** Cria publicação (invariantes P1–P6; limite P16/M9 — 5/hora e 20/dia). */
export async function createPublicationAction(
  _prev: PublicationFormState,
  formData: FormData,
): Promise<PublicationFormState> {
  // M9/P16: limites de publicação (5/hora e 20/dia por usuário; 30/hora por IP
  // quando atrás de proxy confiável — B4/ADR-0017).
  const limits = new SupabaseModerationRepository();
  const withinLimit = await new EnforceRateLimit(
    currentModerationSession,
    limits,
    currentClientIp,
  ).execute("publication");

  if (!withinLimit.ok) {
    return { error: withinLimit.error };
  }

  const useCase = new CreatePublication(
    () => new SupabaseAuthGateway().currentSession(),
    new GeographyLocationValidator(),
    new SupabasePublicationRepository(),
  );

  const result = await useCase.execute({
    type: first(formData, "type"),
    title: first(formData, "title"),
    content: first(formData, "content"),
    isAnonymous: first(formData, "isAnonymous") === "true",
    cityId: Number(first(formData, "cityId")),
    neighborhoodId: first(formData, "neighborhoodId") || null,
    media: mediaPaths(formData),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/");
  redirect(`/publicacao/${result.value.id}`);
}

/** Edita a própria publicação (P7). */
export async function updatePublicationAction(
  _prev: PublicationFormState,
  formData: FormData,
): Promise<PublicationFormState> {
  const useCase = new UpdateMyPublication(
    () => new SupabaseAuthGateway().currentSession(),
    new SupabasePublicationRepository(),
  );

  const result = await useCase.execute({
    id: first(formData, "publicationId"),
    title: first(formData, "title"),
    content: first(formData, "content"),
    media: mediaPaths(formData),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/");
  revalidatePath(`/publicacao/${first(formData, "publicationId")}`);

  return { message: "Publicação atualizada." };
}

/** Apaga a própria publicação com exclusão lógica (P8). */
export async function deletePublicationAction(
  _prev: PublicationFormState,
  formData: FormData,
): Promise<PublicationFormState> {
  const useCase = new DeleteMyPublication(
    () => new SupabaseAuthGateway().currentSession(),
    new SupabasePublicationRepository(),
  );

  const result = await useCase.execute(first(formData, "publicationId"));

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/");
  redirect("/");
}
