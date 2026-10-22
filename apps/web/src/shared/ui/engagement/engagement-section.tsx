import {
  GetEngagementSummary,
  ListPublicationComments,
} from "@/contexts/engagement/application/use-cases";
import { SupabaseEngagementRepository } from "@/contexts/engagement/infrastructure/supabase/engagement-repository";
import {
  SupabaseAuthorDirectory,
  currentEngagementSession,
} from "@/contexts/engagement/infrastructure/publication-state";
import type { EngagementSession } from "@/contexts/engagement/application/ports";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { ReactionButtons } from "./reaction-buttons";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";

export interface EngagementSectionProps {
  publicationId: string;
  publicationTitle: string;
  session: EngagementSession | null;
}

/**
 * Seção de engajamento da página pública da publicação (Fase 5).
 *
 * Servidor carrega o estado inicial (RLS como anônimo ou como o usuário); os
 * componentes cliente assinam Realtime para refletir reações e comentários de
 * outras pessoas sem recarregar (D8).
 */
export async function EngagementSection({
  publicationId,
  publicationTitle,
  session,
}: EngagementSectionProps) {
  const engagements = new SupabaseEngagementRepository();

  const [summary, comments] = await Promise.all([
    new GetEngagementSummary(currentEngagementSession, engagements).execute(publicationId),
    new ListPublicationComments(engagements, new SupabaseAuthorDirectory()).execute(
      publicationId,
      { viewerId: session?.userId ?? null },
    ),
  ]);

  // E8/P3: só contas com e-mail confirmado interagem.
  const canInteract = session !== null && session.emailConfirmed;

  return (
    <section className="mt-6 flex flex-col gap-6 border-t border-border-subtle pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <ReactionButtons
          canInteract={canInteract}
          counts={summary.counts}
          myReaction={summary.myReaction}
          publicationId={publicationId}
        />
        <SaveButton
          canInteract={canInteract}
          publicationId={publicationId}
          saved={summary.saved}
        />
        <ShareButton publicationId={publicationId} title={publicationTitle} />
      </div>

      <CommentForm canInteract={canInteract} publicationId={publicationId} />

      <CommentList
        items={comments.items}
        publicationId={publicationId}
        total={summary.commentsCount}
      />
    </section>
  );
}
