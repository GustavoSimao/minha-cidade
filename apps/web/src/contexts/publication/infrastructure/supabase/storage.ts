import { createServiceRoleClient } from "@/shared/infrastructure/supabase";

/**
 * URL temporária de leitura de mídia de publicação (bucket privado — spec §7).
 * Gerada no servidor com service_role (o bucket privado não tem política de leitura
 * pública; a URL vale por 1 hora e é embutida na página renderizada).
 */
export async function signedMediaUrl(path: string): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from("publication-media")
    .createSignedUrl(path, 3600);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

/** Lote de URLs temporárias, preservando a ordem dos paths. */
export async function signedMediaUrls(paths: readonly string[]): Promise<(string | null)[]> {
  return Promise.all(paths.map((path) => signedMediaUrl(path)));
}
