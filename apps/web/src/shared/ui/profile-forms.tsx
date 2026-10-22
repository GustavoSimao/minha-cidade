"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";

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
import { Avatar } from "@/shared/ui/avatar";
import { Icon } from "@/shared/ui/icon";

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
  website: string | null;
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
  ownerName,
}: {
  kind: "avatars" | "covers";
  label: string;
  hint: string;
  currentUrl: string | null;
  currentPath: string | null;
  onPathChange: (path: string) => void;
  fieldId: string;
  testId: string;
  ownerName: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<ImageUploadState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [storedPath, setStoredPath] = useState<string | null>(currentPath);
  const [dialogOpen, setDialogOpen] = useState(false);

  const uploading = upload !== null && upload.path === null && upload.error === null;
  const effectivePath = storedPath ?? "";
  const displayUrl = previewUrl ?? (effectivePath ? currentUrl : null);

  useEffect(() => {
    if (!dialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dialogOpen]);

  useEffect(() => () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function onFilesSelected(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
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
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setStoredPath(null);
    setPreviewUrl(null);
    setUpload(null);
    onPathChange("");
    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  return (
    <>
      {kind === "covers" ? (
        <div
          aria-label="Capa do perfil"
          className="relative h-32 w-full bg-brand-700 sm:h-44"
          data-testid={testId}
          role="img"
          style={displayUrl ? { backgroundImage: `url(${displayUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          <button
            aria-label="Editar foto de capa"
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-lg border border-line bg-white text-brand shadow-sm hover:bg-surface"
            onClick={() => setDialogOpen(true)}
            type="button"
          ><Icon name="image" size={19} /></button>
        </div>
      ) : (
        <div className="relative h-[88px] w-[88px] shrink-0">
          <Avatar className="border-4 border-white shadow-sm" imageUrl={displayUrl} name={ownerName} size={88} />
          <button
            aria-label="Editar foto de perfil"
            className="absolute bottom-0 right-0 grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-brand shadow-sm hover:bg-surface"
            onClick={() => setDialogOpen(true)}
            type="button"
          ><Icon name="image" size={18} /></button>
        </div>
      )}
      <input
        accept="image/*"
        className="sr-only"
        id={fieldId}
        onChange={(event) => void onFilesSelected(event.target.files)}
        ref={fileInput}
        type="file"
      />
      {upload?.error ? <p className="mt-2 text-sm text-danger" role="alert">{upload.error}</p> : null}
      {uploading ? (
        <div className="mt-2 flex items-center gap-2" aria-live="polite">
          <div aria-hidden="true" className="h-1.5 w-full max-w-64 overflow-hidden bg-surface">
            <div className="h-full bg-brand-600 transition-[width]" style={{ width: `${upload.progress}%` }} />
          </div>
          <span className="shrink-0 text-xs text-text-muted">Enviando {upload.progress}%</span>
        </div>
      ) : null}
      {dialogOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 p-4">
          <button aria-label="Fechar opções da foto" className="absolute inset-0" onClick={() => setDialogOpen(false)} tabIndex={-1} type="button" />
          <section aria-labelledby={`${fieldId}-dialog-title`} aria-modal="true" className="relative z-10 w-full max-w-lg border border-line bg-white p-5 shadow-modal sm:p-6" role="dialog">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink" id={`${fieldId}-dialog-title`}>{label}</h2>
                <p className="mt-1 text-sm text-muted">{displayUrl ? "Veja a foto atual ou escolha outra." : "Adicione uma foto ao seu perfil."}</p>
              </div>
              <button aria-label="Fechar" className="grid h-11 w-11 shrink-0 place-items-center border border-line hover:bg-soft" onClick={() => setDialogOpen(false)} type="button"><Icon name="close" size={19} /></button>
            </header>
            {displayUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob) ou imagem pública do Storage */
              <img alt={label} className={kind === "avatars" ? "mx-auto mb-5 h-56 w-56 rounded-full border border-line object-cover" : "mb-5 max-h-[52vh] w-full object-contain"} src={displayUrl} />
            ) : (
              <p className="mb-5 border-y border-line py-5 text-sm text-muted">Nenhuma foto foi adicionada ainda.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button className="min-h-11" disabled={uploading} onClick={() => fileInput.current?.click()} type="button">
                {displayUrl ? "Escolher outra foto" : "Enviar foto"}
              </Button>
              {effectivePath ? <Button className="min-h-11" onClick={remove} type="button" variant="danger">Remover foto</Button> : null}
            </div>
            {upload?.error ? <p className="mt-3 text-sm text-danger" role="alert">{upload.error}</p> : null}
            <p className="mt-3 text-xs text-muted">{hint}</p>
          </section>
        </div>
      ) : null}
    </>
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
    <>
    <section className="overflow-hidden rounded-[24px] border border-line bg-white shadow-stamp">
      <ProfileImageField
        currentPath={coverPath}
        currentUrl={coverPath ? publicStorageUrl("covers", coverPath) : null}
        fieldId={`${fieldId}-cover`}
        hint="Capa do perfil (WebP, até 10 MiB)."
        kind="covers"
        label="Foto de capa"
        onPathChange={setCoverPath}
        ownerName={profile.fullName}
        testId="cover-preview"
      />
      <div className="flex items-center gap-4 px-5 py-5 sm:px-8">
        <ProfileImageField
          currentPath={avatarPath}
          currentUrl={avatarPath ? publicStorageUrl("avatars", avatarPath) : null}
          fieldId={`${fieldId}-avatar`}
          hint="Foto de perfil (WebP, até 10 MiB)."
          kind="avatars"
          label="Foto de perfil"
          onPathChange={setAvatarPath}
          ownerName={profile.fullName}
          testId="avatar-preview"
        />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-text-strong">{profile.fullName}</h2>
          <p className="mt-1 text-sm text-muted">@{profile.username}</p>
          {profile.bio ? <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-text-body">{profile.bio}</p> : null}
          {profile.cityName ? <p className="mt-2 text-sm text-muted">{profile.cityName}{profile.cityUf ? ` — ${profile.cityUf}` : ""}</p> : null}
        </div>
      </div>
    </section>

    <Card
      description="Seu nome de usuário (@) e seu papel não podem ser alterados aqui."
      title="Editar perfil"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input name="avatarPath" type="hidden" value={avatarPath} />
        <input name="coverPath" type="hidden" value={coverPath} />
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

        <TextField
          defaultValue={profile.website ?? ""}
          label="Site / Link público"
          name="website"
          placeholder="https://exemplo.com"
          type="url"
        />

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.message ? <Alert tone="success">{state.message}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} type="submit">
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Card>
    </>
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
