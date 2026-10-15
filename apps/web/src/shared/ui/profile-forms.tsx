"use client";

import { useActionState, useId, useRef, useState } from "react";
import Link from "next/link";

import {
  closeAccountAction,
  updateProfileAction,
  type AuthFormState,
} from "@/contexts/identity/interfaces/actions";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/public-url";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Alert, Button, Card, TextField } from "@/shared/ui/form";
import { LocationPicker } from "@/shared/ui/location-picker";
import { Textarea } from "@/shared/ui/text-area";
import { resizeToWebp, uploadImage } from "@/shared/ui/upload-image";

/** Dados do perfil próprio necessários ao formulário. */
export interface OwnProfileFormData {
  username: string;
  fullName: string;
  bio: string | null;
  phone: string | null;
  avatarPath: string | null;
  coverPath: string | null;
  showNeighborhood: boolean;
  cityId: number | null;
  cityName: string | null;
  cityUf: string | null;
  neighborhoodId: string | null;
  /** Cidade de lançamento (atalho no seletor, P12). */
  launchCity: { id: number; name: string; uf: string; slug: string } | null;
  isVerified: boolean;
  verifiedOrg: string | null;
  role: string;
  emailConfirmed: boolean;
}

/** Imagem em envio: preview local + progresso + caminho no Storage ao concluir. */
interface ImageUploadState {
  progress: number;
  path: string | null;
  error: string | null;
  /** Nome do arquivo selecionado (para a prévia antes do path existir). */
  name: string;
}

/**
 * Campo de imagem (avatar ou capa) com upload para o Storage, prévia e remoção.
 *
 * Envia o `path` retornado pela rota em um input oculto; campo vazio remove a
 * imagem (normalizado para `null` no domínio — T2).
 */
function ProfileImageField({
  kind,
  label,
  hint,
  currentUrl,
  currentPath,
  onPathChange,
  fieldId,
  testId,
}: {
  kind: "avatars" | "covers";
  label: string;
  hint: string;
  currentUrl: string | null;
  currentPath: string | null;
  onPathChange: (path: string) => void;
  fieldId: string;
  testId: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<ImageUploadState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storedPath, setStoredPath] = useState<string | null>(currentPath);

  const uploading = upload !== null && upload.path === null && upload.error === null;
  const effectivePath = storedPath ?? "";
  const displayUrl = previewUrl ?? (effectivePath ? currentUrl : null);

  async function onFilesSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUpload({ progress: 0, path: null, error: null, name: file.name });

    try {
      const resized = await resizeToWebp(file);
      const path = await uploadImage(resized, "/api/profile/media", (ratio) => {
        setUpload((current) =>
          current ? { ...current, progress: Math.round(ratio * 100) } : current,
        );
      }, { kind });

      setStoredPath(path);
      onPathChange(path);
      setUpload({ progress: 100, path, error: null, name: file.name });
    } catch (error) {
      setPreviewUrl(null);
      setUpload({
        progress: 0,
        path: null,
        error: error instanceof Error ? error.message : "falha ao enviar imagem",
        name: file.name,
      });
    }

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  function remove() {
    setStoredPath(null);
    setPreviewUrl(null);
    setUpload(null);
    onPathChange("");
    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-strong" htmlFor={fieldId}>
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        {displayUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob) ou URL pública do Storage */
          <img
            alt={`Prévia de ${label.toLowerCase()}`}
            className={
              kind === "avatars"
                ? "h-20 w-20 rounded-full border border-border-subtle object-cover"
                : "h-14 w-28 rounded-lg border border-border-subtle object-cover"
            }
            data-testid={testId}
            src={displayUrl}
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <input
            accept="image/*"
            className="min-h-11 max-w-64 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-body"
            id={fieldId}
            onChange={(event) => void onFilesSelected(event.target.files)}
            ref={fileInput}
            type="file"
          />
          {effectivePath ? (
            <Button onClick={remove} type="button" variant="secondary">
              Remover
            </Button>
          ) : null}
        </div>
      </div>

      <input name={kind === "avatars" ? "avatarPath" : "coverPath"} type="hidden" value={effectivePath} />

      {upload?.error ? (
        <p className="text-sm text-danger" role="alert">
          {upload.error}
        </p>
      ) : uploading ? (
        <div className="flex items-center gap-2">
          <div
            aria-hidden="true"
            className="h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-surface"
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-[width]"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-text-muted">{upload.progress}%</span>
        </div>
      ) : (
        <p className="text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
}

/** Formulário de edição do próprio perfil (invariantes I2/I4/I5 protegidas). */
export function ProfileForm({ profile }: { profile: OwnProfileFormData }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateProfileAction,
    {},
  );

  const fieldId = useId();
  const [avatarPath, setAvatarPath] = useState(profile.avatarPath ?? "");
  const [coverPath, setCoverPath] = useState(profile.coverPath ?? "");

  return (
    <Card
      description="Seu nome de usuário (@) e seu papel não podem ser alterados aqui."
      title="Editar perfil"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          autoComplete="name"
          defaultValue={profile.fullName}
          label="Nome"
          name="fullName"
          required
        />
        <TextField
          defaultValue={profile.phone ?? ""}
          label="Telefone (privado)"
          name="phone"
          placeholder="(27) 99999-9999"
          type="tel"
        />

        <Textarea
          defaultValue={profile.bio ?? ""}
          id={`${fieldId}-bio`}
          label="Bio"
          maxLength={2000}
          name="bio"
          rows={4}
        />

        <ProfileImageField
          currentPath={avatarPath}
          currentUrl={
            avatarPath ? publicStorageUrl("avatars", avatarPath) : null
          }
          fieldId={`${fieldId}-avatar`}
          hint="Foto de perfil (WebP, até 10 MiB)."
          kind="avatars"
          label="Foto de perfil"
          onPathChange={setAvatarPath}
          testId="avatar-preview"
        />

        <ProfileImageField
          currentPath={coverPath}
          currentUrl={coverPath ? publicStorageUrl("covers", coverPath) : null}
          fieldId={`${fieldId}-cover`}
          hint="Imagem de capa do perfil (WebP, até 10 MiB)."
          kind="covers"
          label="Capa do perfil"
          onPathChange={setCoverPath}
          testId="cover-preview"
        />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-text-strong">
            Onde você mora (usado no feed do bairro)
          </legend>
          <LocationPicker
            initialCityId={profile.cityId}
            initialCityName={profile.cityName}
            initialCityUf={profile.cityUf}
            initialNeighborhoodId={profile.neighborhoodId}
            launchCity={profile.launchCity}
          />
          <label className="flex items-start gap-2.5 text-sm text-text-body">
            <input
              defaultChecked={profile.showNeighborhood}
              className="mt-1 h-4 w-4 rounded border-border-subtle text-brand-600"
              name="showNeighborhood"
              type="checkbox"
            />
            Mostrar onde eu moro no perfil público
          </label>
          <p className="text-xs text-text-muted">
            Quando desligado, apenas o município aparece no perfil.
          </p>
        </fieldset>

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} type="submit">
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
            href={`/perfil/${profile.username}`}
          >
            Ver perfil público
          </Link>
        </div>
      </form>
    </Card>
  );
}

/** Encerramento de conta com confirmação por senha (invariante I8). */
export function CloseAccountForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    closeAccountAction,
    {},
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <Card
      description="Seus dados serão apagados e suas publicações permanecerão sem autor identificado."
      title="Encerrar conta"
    >
      <p className="text-sm text-text-body">
        Encerrar a conta é permanente: seus dados pessoais são apagados e as suas publicações
        passam a aparecer sem autor identificado, como registro da comunidade. Para continuar,
        confirme sua senha.
      </p>

      <div className="mt-4">
        <Button onClick={() => setConfirming(true)} type="button" variant="danger">
          Encerrar minha conta
        </Button>
      </div>

      <ConfirmDialog
        action={formAction}
        confirmLabel="Encerrar minha conta"
        description="Confirme sua senha para apagar os seus dados. Não há como desfazer depois."
        onClose={() => setConfirming(false)}
        open={confirming}
        pending={pending}
        title="Encerrar sua conta?"
      >
        <TextField
          autoComplete="current-password"
          label="Confirme sua senha"
          name="password"
          required
          type="password"
        />
        {state.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
      </ConfirmDialog>
    </Card>
  );
}
