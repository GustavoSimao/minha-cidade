import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { SupabaseCityRepository } from "@/contexts/geography/infrastructure/supabase/city-repository";
import { SupabaseNeighborhoodRepository } from "@/contexts/geography/infrastructure/supabase/neighborhood-repository";
import { SupabaseAuthGateway } from "@/contexts/identity/infrastructure/supabase/auth-gateway";
import { SupabaseProfileRepository } from "@/contexts/identity/infrastructure/supabase/profile-repository";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/storage";
import { GetPublication } from "@/contexts/publication/application/use-cases";
import { SupabasePublicationRepository } from "@/contexts/publication/infrastructure/supabase/publication-repository";
import { signedMediaUrls } from "@/contexts/publication/infrastructure/supabase/storage";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EngagementSection } from "@/shared/ui/engagement/engagement-section";
import { ReportButton } from "@/shared/ui/moderation/report-button";
import {
  DeletePublicationButton,
  PublicationEditForm,
} from "@/shared/ui/publication-edit-form";

interface PublicationPageProps {
  params: Promise<{ id: string }>;
}

// Leitura pública do banco a cada requisição (sessão anônima).
export const instant = false;

export async function generateMetadata({ params }: PublicationPageProps): Promise<Metadata> {
  const { id } = await params;
  const publication = await new GetPublication(new SupabasePublicationRepository()).execute(id);

  if (!publication) {
    return { title: "Publicação não encontrada" };
  }

  return { title: publication.title, description: publication.content.slice(0, 140) };
}

/** Leitura pública de uma publicação (P4: anonimato preservado; P21: oculta/apagada = 404). */
export default async function PublicationPage({ params }: PublicationPageProps) {
  const { id } = await params;

  const [row, session] = await Promise.all([
    new SupabasePublicationRepository().findById(id),
    new SupabaseAuthGateway().currentSession(),
  ]);

  // RLS já esconde de terceiros a publicação oculta/apagada: quem vê a linha é o autor.
  if (row === null) {
    notFound();
  }

  const isVisible = row.deleted_at === null && row.hidden_at === null;

  if (!isVisible) {
    // Para qualquer outra pessoa a linha é invisível (404 silencioso — P21).
    if (session === null || row.author_id !== session.userId) {
      notFound();
    }

    const removedByModeration = row.deleted_at === null;
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-text-strong">
          {removedByModeration ? "Publicação oculta pela moderação" : "Publicação apagada"}
        </h1>
        <p className="mt-2 text-text-body">
          {removedByModeration
            ? "Esta publicação está temporariamente fora do ar enquanto a moderação analisa as denúncias. Ela continua visível apenas para você. Se a análise concluir que não houve violação, ela volta ao feed — e você é notificado."
            : "Você apagou esta publicação. Ela não aparece mais no feed nem para os seus vizinhos; apenas a moderação mantém o registro."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
            href="/"
          >
            Voltar ao feed
          </Link>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            href="/perfil/editar"
          >
            Meu perfil
          </Link>
        </div>
      </div>
    );
  }

  const publication = await new GetPublication(new SupabasePublicationRepository()).execute(id);

  if (!publication) {
    notFound();
  }

  const mediaUrls = await signedMediaUrls(publication.media.map((media) => media.path));

  const city = await new SupabaseCityRepository().findById(publication.cityId);
  const neighborhood = publication.neighborhoodId
    ? await new SupabaseNeighborhoodRepository().findById(publication.neighborhoodId)
    : null;

  // P4: autor identificado é lido pela projeção pública (I7); anônimo não é lido.
  const author =
    publication.authorId !== null
      ? (await new SupabaseProfileRepository().findPublicViewsByIds([publication.authorId]))[0] ?? null
      : null;

  const isAuthor = session !== null && publication.authorId === session.userId;
  const created = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(
    publication.createdAt ?? new Date(),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <article className="rounded-card border border-border-subtle bg-surface-raised p-5 shadow-stamp sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={publication.type === "problem" ? "problem" : "idea"}>
            {publication.type === "problem" ? "Problema" : "Ideia"}
          </Badge>
          <span className="text-sm text-text-muted">
            {[city ? `${city.name} — ${city.uf.sigla}` : null, neighborhood?.name ?? "Bairro não informado"]
              .filter((part): part is string => part !== null)
              .join(", ")}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold text-text-strong sm:text-2xl">
          {publication.title}
        </h1>

        <p className="whitespace-pre-line text-base text-text-body">{publication.content}</p>

        {mediaUrls.filter((url): url is string => url !== null).length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {mediaUrls.map((url, index) =>
              url ? (
                <li key={index}>
                  <Image
                    alt={`Imagem ${index + 1} da publicação`}
                    className="h-auto w-full rounded-card border border-border-subtle"
                    height={800}
                    sizes="(min-width: 640px) 672px, 100vw"
                    src={url}
                    width={1200}
                  />
                </li>
              ) : null,
            )}
          </ul>
        ) : null}

        <footer className="mt-5 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4 text-sm text-text-muted">
          {author ? (
            <span className="flex items-center gap-2">
              <Avatar
                imageUrl={author.avatarPath ? publicStorageUrl("avatars", author.avatarPath) : null}
                name={author.fullName}
                size={32}
              />
              <Link className="hover:underline" href={`/perfil/${author.username}`}>
                {author.fullName}
              </Link>
              {author.isVerified && author.verifiedOrg ? (
                <Badge testId="institutional-badge" tone="institutional">
                  {author.verifiedOrg}
                </Badge>
              ) : null}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-text-muted">
                Anônimo
              </span>
              Morador anônimo
            </span>
          )}
          <span>
            {created}
            {publication.editedAt ? ", editado" : ""}
          </span>
        </footer>
      </article>

      {isAuthor ? (
        <section className="mt-4 flex flex-col gap-4">
          <PublicationEditForm
            publication={{
              id: publication.id,
              title: publication.title,
              content: publication.content,
              mediaPaths: publication.media.map((media) => media.path),
            }}
          />
          <DeletePublicationButton publicationId={publication.id} />
        </section>
      ) : null}

      <EngagementSection
        publicationId={publication.id}
        session={
          session === null
            ? null
            : { userId: session.userId, emailConfirmed: session.emailConfirmed }
        }
      />

      {session !== null && session.emailConfirmed && !isAuthor ? (
        <div className="mt-4">
          <ReportButton targetId={publication.id} targetType="publication" allowed />
        </div>
      ) : null}

      <Link
        className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
        href="/"
      >
        Voltar ao feed
      </Link>
    </div>
  );
}
