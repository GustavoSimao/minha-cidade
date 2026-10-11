"use client";

import { useId, useRef, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";

import {
  createPublicationAction,
  type PublicationFormState,
} from "@/contexts/publication/interfaces/actions";
import { Alert, Button, Card, TextField } from "@/shared/ui/form";
import { LocationPicker } from "@/shared/ui/location-picker";

/** Limite de imagens por publicação (P5). */
const MAX_IMAGES = 3;

/** Dimensão máxima do maior lado após redimensionamento (P5). */
const MAX_SIDE = 1600;

export interface PublicationFormProps {
  launchCity: { id: number; name: string; uf: string; slug: string } | null;
}

/** Redimensiona a imagem no cliente para WebP ≤ 1600px (P15). */
async function resizeToWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
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

/** Formulário de publicação (problema/ideia), com upload de até 3 imagens (P5). */
export function PublicationForm({ launchCity }: PublicationFormProps) {
  const [state, formAction, pending] = useActionState<PublicationFormState, FormData>(
    createPublicationAction,
    {},
  );

  const fieldId = useId();
  const [type, setType] = useState<"problem" | "idea">("problem");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mediaPaths, setMediaPaths] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploadError(null);
    setUploading(true);

    const added: string[] = [];

    try {
      for (const file of Array.from(files).slice(0, MAX_IMAGES - mediaPaths.length)) {
        const resized = await resizeToWebp(file);

        const body = new FormData();
        body.set("file", resized);

        const response = await fetch("/api/publications/media", { method: "POST", body });
        const data: { path?: string; error?: string } = await response.json();

        if (!response.ok || !data.path) {
          setUploadError(data.error ?? "falha ao enviar imagem");
          break;
        }

        added.push(data.path);
      }

      setMediaPaths((previous) => [...previous, ...added]);
    } catch {
      setUploadError("falha ao preparar imagem");
    } finally {
      setUploading(false);

      if (fileInput.current) {
        fileInput.current.value = "";
      }
    }
  }

  return (
    <Card
      description="Conte o que está acontecendo no seu bairro. Você pode publicar sem se identificar."
      title="Nova publicação"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input name="type" type="hidden" value={type} />
        <input name="isAnonymous" type="hidden" value={isAnonymous ? "true" : "false"} />
        <input name="mediaPaths" type="hidden" value={mediaPaths.join("\n")} />

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-text-strong">Tipo</legend>
          <div className="flex gap-2">
            <Button
              onClick={() => setType("problem")}
              type="button"
              variant={type === "problem" ? "primary" : "secondary"}
            >
              Problema
            </Button>
            <Button
              onClick={() => setType("idea")}
              type="button"
              variant={type === "idea" ? "primary" : "secondary"}
            >
              Ideia
            </Button>
          </div>
        </fieldset>

        <TextField
          label="Título"
          maxLength={120}
          name="title"
          placeholder="Ex.: Buraco na rua principal"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-strong" htmlFor={`${fieldId}-content`}>
            Texto
          </label>
          <textarea
            className="min-h-32 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong placeholder:text-text-muted"
            id={`${fieldId}-content`}
            maxLength={5000}
            name="content"
            placeholder="Descreva a situação, o local e o que você espera que aconteça."
            required
            rows={6}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-strong" htmlFor={`${fieldId}-photos`}>
            Fotos (até {MAX_IMAGES})
          </label>
          <input
            accept="image/*"
            className="min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-base text-text-strong"
            id={`${fieldId}-photos`}
            multiple
            onChange={(event) => void onFilesSelected(event.target.files)}
            ref={fileInput}
            type="file"
          />
          {uploading ? <p className="text-sm text-text-muted">Enviando imagens…</p> : null}
          {uploadError ? (
            <p className="text-sm text-danger" role="alert">
              {uploadError}
            </p>
          ) : null}
          {mediaPaths.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {mediaPaths.map((path, index) => (
                <li
                  className="rounded-lg border border-border-subtle px-2 py-1 text-xs text-text-muted"
                  key={path}
                >
                  imagem {index + 1} pronta
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-text-strong">
            Localização (bairro aparece no feed)
          </legend>
          <LocationPicker
            initialCityId={null}
            initialCityName={null}
            initialCityUf={null}
            initialNeighborhoodId={null}
            launchCity={launchCity}
          />
        </fieldset>

        <label className="flex items-start gap-2.5 text-sm text-text-body">
          <input
            checked={isAnonymous}
            className="mt-1 h-4 w-4 rounded border-border-subtle text-brand-600"
            onChange={(event) => setIsAnonymous(event.target.checked)}
            type="checkbox"
          />
          Publicar como anônimo (seu nome não aparece; a moderação continua vendo o autor)
        </label>

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={pending || uploading} type="submit">
            {pending ? "Publicando…" : "Publicar"}
          </Button>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
            href="/feed"
          >
            Ver feed
          </Link>
        </div>
      </form>
    </Card>
  );
}
