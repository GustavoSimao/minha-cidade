"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { toggleReactionAction } from "@/contexts/engagement/interfaces/actions";
import { createBrowserSupabase } from "@/shared/infrastructure/supabase-browser";

export interface ReactionButtonsProps {
  publicationId: string;
  counts: { support: number; oppose: number };
  myReaction: "support" | "oppose" | null;
  canInteract: boolean;
}

/**
 * Botões apoio/oposição com estado do usuário (E1). O estado vem do servidor
 * (props) e é atualizado pelo `router.refresh()` após a action; Realtime (D8)
 * reflete reações de outras pessoas sem recarregar.
 */
export function ReactionButtons({
  publicationId,
  counts,
  myReaction,
  canInteract,
}: ReactionButtonsProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const channel = supabase
      .channel(`reactions-${publicationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "engagement",
          table: "reactions",
          filter: `publication_id=eq.${publicationId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [publicationId, router]);

  function submit(formData: FormData) {
    if (!canInteract) {
      router.push(`/login?next=${encodeURIComponent(`/publicacao/${publicationId}`)}`);
      return;
    }

    void toggleReactionAction({}, formData).then(() => router.refresh());
  }

  const style = (active: boolean) =>
    active
      ? "min-h-11 rounded-lg border border-brand-600 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
      : "min-h-11 rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-body hover:bg-surface";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={submit}>
        <input name="publicationId" type="hidden" value={publicationId} />
        <input name="type" type="hidden" value="support" />
        <button
          aria-pressed={myReaction === "support"}
          className={style(myReaction === "support")}
          type="submit"
        >
          Apoio · {counts.support}
        </button>
      </form>

      <form action={submit}>
        <input name="publicationId" type="hidden" value={publicationId} />
        <input name="type" type="hidden" value="oppose" />
        <button
          aria-pressed={myReaction === "oppose"}
          className={style(myReaction === "oppose")}
          type="submit"
        >
          Oposição · {counts.oppose}
        </button>
      </form>
    </div>
  );
}
