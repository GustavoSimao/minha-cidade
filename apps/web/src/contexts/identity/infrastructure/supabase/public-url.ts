/**
 * URL pública de objeto do Storage — módulo **client-safe** (só usa
 * `NEXT_PUBLIC_SUPABASE_URL`). Componentes cliente (formulários de perfil)
 * importam daqui; o restante do módulo de storage depende de `next/headers`
 * e continua server-only em `./storage`.
 */

const BUCKETS = {
  avatars: "avatars",
  covers: "covers",
  "publication-media": "publication-media",
} as const;

export type StorageBucket = keyof typeof BUCKETS;

/** URL pública de um objeto do Storage. */
export function publicStorageUrl(bucket: StorageBucket, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${BUCKETS[bucket]}/${path}`;
}
