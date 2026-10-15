import { randomUUID } from "node:crypto";

import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { createServiceRoleClient } from "@/shared/infrastructure/supabase";

/** Limite por arquivo: 10 MiB (P5 — mesmo teto da mídia de publicação). */
const MAX_BYTES = 10 * 1024 * 1024;

/** Buckets aceitos: `avatars` e `covers` (públicos — leitura por URL no perfil). */
const KINDS = ["avatars", "covers"] as const;

type ProfileMediaKind = (typeof KINDS)[number];

/** Assinatura de arquivo WebP: "RIFF" .... "WEBP" (magic bytes, não extensão). */
function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  );
}

/**
 * Upload de foto de perfil ou capa (T2).
 *
 * Espelha `api/publications/media`: Route Handler porque o corpo chega a 10 MiB
 * (limite de 1 MB das Server Actions). O cliente redimensiona para WebP ≤ 1600px;
 * o servidor revalida sessão, tipo (`kind`) e magic bytes, e grava no bucket
 * público em `<bucket>/{userId}/{uuid}.webp` (path previsível por dono).
 */
export async function POST(request: Request) {
  const session = await new SupabaseAuthGateway().currentSession();

  if (session === null) {
    return Response.json({ error: "sessão necessária" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!KINDS.includes(kind as ProfileMediaKind)) {
    return Response.json({ error: "tipo de imagem inválido" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "arquivo é obrigatório" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return Response.json({ error: "arquivo deve ter até 10 MiB" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!isWebp(bytes)) {
    return Response.json({ error: "arquivo não é WebP válido" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const bucket = kind as ProfileMediaKind;
  // O path gravado na coluna é relativo ao bucket (espelha as publicações).
  const path = `${session.userId}/${randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: "image/webp", upsert: false });

  if (error) {
    return Response.json({ error: "falha ao enviar imagem" }, { status: 500 });
  }

  return Response.json({ path });
}
