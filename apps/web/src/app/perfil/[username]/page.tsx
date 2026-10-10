import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/storage";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";

interface PageParams {
  params: Promise<{ username: string }>;
}

// Perfil público lê o banco a cada requisição (sessão anônima): pode bloquear.
export const instant = false;

/** Perfil público: apenas a projeção pública (invariante I7). */
export default async function PublicProfilePage({ params }: PageParams) {
  const { username } = await params;
  const profile = await new SupabaseProfileRepository().findPublicViewByUsername(
    username,
  );

  if (!profile) {
    notFound();
  }

  const created = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    profile.createdAt,
  );

  return (
    <article className="overflow-hidden rounded-card border border-border-subtle bg-surface-raised shadow-sm">
      <div
        className="h-28 w-full bg-brand-100 sm:h-40"
        style={
          profile.coverPath
            ? {
                backgroundImage: `url(${publicStorageUrl("covers", profile.coverPath)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      <div className="px-5 pb-6 sm:px-6">
        <div className="-mt-10 flex items-end gap-4 sm:-mt-12">
          <Avatar
            className="ring-4 ring-surface-raised"
            imageUrl={
              profile.avatarPath
                ? publicStorageUrl("avatars", profile.avatarPath)
                : null
            }
            name={profile.fullName}
            size={88}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-text-strong sm:text-2xl">
            {profile.fullName}
          </h1>
          {profile.isVerified && profile.verifiedOrg ? (
            <Badge tone="institutional">{profile.verifiedOrg}</Badge>
          ) : null}
          {profile.role !== "user" ? (
            <Badge tone="moderation">
              {profile.role === "admin" ? "Administração" : "Moderação"}
            </Badge>
          ) : null}
        </div>

        <p className="text-sm text-text-muted">@{profile.username}</p>

        {profile.bio ? (
          <p className="mt-3 whitespace-pre-line text-text-body">{profile.bio}</p>
        ) : null}

        <p className="mt-3 text-sm text-text-muted">
          Membro desde {created}
        </p>

        <p className="mt-6 text-sm text-text-muted">
          Publicações, amigos e demais conteúdos do perfil aparecem aqui conforme as
          fases do projeto forem sendo entregues.
        </p>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username } = await params;
  const profile = await new SupabaseProfileRepository().findPublicViewByUsername(
    username,
  );

  if (!profile) {
    return { title: "Perfil não encontrado" };
  }

  return {
    title: `${profile.fullName} (@${profile.username})`,
    description: profile.bio ?? `Perfil de ${profile.fullName} no Minha Cidade.`,
  };
}
