import { createClient } from "./server";

/** Reexport client-safe (usado por componentes cliente — não puxa `next/headers`). */
export { publicStorageUrl, type StorageBucket } from "./public-url";

/** Caminho canônico de um objeto por usuário: `<userId>/<arquivo>`. */
export function objectPath(userId: string, fileName: string): string {
  return `${userId}/${fileName}`;
}

/** Cliente usado para uploads (servidor). */
export async function storageClient() {
  return createClient();
}
