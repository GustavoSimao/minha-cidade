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
import { Textarea } from "@/shared/ui/text-area";
import { resizeToWebp, uploadImage } from "@/shared/ui/upload-image";

/** Limite de imagens por publicação (P15). */
const MAX_IMAGES = 3;

export interface PublicationFormProps {
  launchCity: { id: number; name: string; uf: string; slug: string } | null;
}

/** Imagem em envio: preview local + progresso + caminho no Storage ao concluir. */
interface UploadItem {
  key: string;
  name: string;
  previewUrl: string;
  progress: number;
  path: string | null;
  error: string | null;
}

/** Formulário de publicação (problema/ideia), com upload de até 3 imagens (P15). */
export function PublicationForm({ launchCity }: PublicationFormProps) {
  const [state, formAction, pending] = useActionState<PublicationFormState, FormData>(
    createPublicationAction,
    {},
  );

  const fieldId = useId();
  const [type, setType] = useState<"problem" | "idea">("problem");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const mediaPaths = uploads
    .map((item) => item.path)
    .filter((path): path is string => path !== null);
  const uploading = uploads.some((item) => item.path === null && item.error === null);

  function removeUpload(key: string) {
    setUploads((current) => {
      const target = current.find((item) => item.key === key);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.key !== key);
    });
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const slots = MAX_IMAGES - uploads.length;

    for (const file of Array.from(files).slice(0, Math.max(0, slots))) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);

      setUploads((current) => [
        ...current,
        { key, name: file.name, previewUrl, progress: 0, path: null, error: null },
      ]);

      try {
        const resized = await resizeToWebp(file);
        const path = await uploadImage(resized, "/api/publications/media", (ratio) => {
          setUploads((current) =>
            current.map((item) =>
              item.key === key ? { ...item, progress: Math.round(ratio * 100) } : item,
            ),
          );
        });

        setUploads((current) =>
          current.map((item) => (item.key === key ? { ...item, path, progress: 100 } : item)),
        );
      } catch (error) {
        setUploads((current) =>
          current.map((item) =>
            item.key === key
              ? {
                  ...item,
                  error: error instanceof Error ? error.message : "falha ao enviar imagem",
                }
              : item,
          ),
        );
      }
    }

    if (fileInput.current) {
      fileInput.current.value = "";
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

        <Textarea
          id={`${fieldId}-content`}
          label="Texto"
          maxLength={5000}
          name="content"
          placeholder="Descreva a situação, o local e o que você espera que aconteça."
          required
          rows={6}
        />

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

          {uploads.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {uploads.map((item) => (
                <li
                  className="flex items-center gap-3 rounded-lg border border-border-subtle p-2"
                  key={item.key}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob) antes do upload */}
                  <img
                    alt={`Prévia de ${item.name}`}
                    className="h-14 w-14 shrink-0 rounded-lg border border-border-subtle object-cover"
                    src={item.previewUrl}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-body">{item.name}</p>

                    {item.error ? (
                      <p className="text-sm text-danger" role="alert">
                        {item.error}
                      </p>
                    ) : item.path ? (
                      <p className="text-sm text-success">imagem pronta</p>
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <div
                          aria-hidden="true"
                          className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
                        >
                          <div
                            className="h-full rounded-full bg-brand-600 transition-[width]"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-text-muted">
                          {item.progress}%
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="min-h-11 shrink-0"
                    onClick={() => removeUpload(item.key)}
                    type="button"
                    variant="secondary"
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          {uploads.length >= MAX_IMAGES ? (
            <p className="text-sm text-text-muted">
              Limite de {MAX_IMAGES} imagens atingido.
            </p>
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
            href="/"
          >
            Ver feed
          </Link>
        </div>
      </form>
    </Card>
  );
}
