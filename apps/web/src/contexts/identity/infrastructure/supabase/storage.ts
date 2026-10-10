import { createClient } from "./server";

const BUCKETS = {
  avatars: "avatars",
  covers: "covers",
  "publication-media": "publication-media",
} as const;

export type StorageBucket = keyof typeof BUCKETS;

/**
 * URL pública de um objeto do Storage. O upload direto do browser (com URL assinada)
 * chega na Fase 4, junto com as publicações.
 */
export function publicStorageUrl(bucket: StorageBucket, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${BUCKETS[bucket]}/${path}`;
}

/** Caminho canônico de um objeto por usuário: `<userId>/<arquivo>`. */
export function objectPath(userId: string, fileName: string): string {
  return `${userId}/${fileName}`;
}

/** Cliente usado para uploads (servidor). */
export async function storageClient() {
  return createClient();
}
