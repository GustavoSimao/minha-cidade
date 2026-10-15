/**
 * Helpers de upload de imagem compartilhados (cliente).
 *
 * Extraídos do formulário de publicação para serem reutilizados pelo perfil
 * (avatar e capa — T2): redimensionamento para WebP e envio com progresso.
 * Só importados por componentes cliente.
 */

/** Dimensão máxima do maior lado após redimensionamento (P15). */
export const MAX_IMAGE_SIDE = 1600;

/** Redimensiona a imagem no cliente para WebP ≤ 1600px (P15). */
export async function resizeToWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (context === null) {
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/webp", 0.85),
  );

  if (blob === null) {
    return file;
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
}

/**
 * Upload com progresso (XHR — o `fetch` não expõe o evento de progresso).
 * `fields` carrega metadados do endpoint (ex.: `kind` em `/api/profile/media`).
 * Devolve o `path` do objeto no Storage.
 */
export function uploadImage(
  file: File,
  endpoint: string,
  onProgress: (ratio: number) => void,
  fields: Record<string, string> = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.set("file", file);
    for (const [key, value] of Object.entries(fields)) {
      body.set(key, value);
    }

    const request = new XMLHttpRequest();
    request.open("POST", endpoint);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    });
    request.addEventListener("load", () => {
      let data: { path?: string; error?: string } = {};
      try {
        data = JSON.parse(request.responseText) as { path?: string; error?: string };
      } catch {
        reject(new Error("resposta inválida do servidor"));
        return;
      }

      if (request.status >= 200 && request.status < 300 && data.path) {
        resolve(data.path);
        return;
      }

      reject(new Error(data.error ?? "falha ao enviar imagem"));
    });
    request.addEventListener("error", () => reject(new Error("falha de rede ao enviar imagem")));
    request.send(body);
  });
}
