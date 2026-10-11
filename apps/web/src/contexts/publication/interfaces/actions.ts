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

/** Cria publicação (invariantes P1–P6). */
export async function createPublicationAction(
  _prev: PublicationFormState,
  formData: FormData,
): Promise<PublicationFormState> {
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

  revalidatePath("/feed");
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

  revalidatePath("/feed");
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

  revalidatePath("/feed");
  redirect("/feed");
}
