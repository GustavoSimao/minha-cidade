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
  subscribeRealtime?: boolean;
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
  subscribeRealtime = true,
}: ReactionButtonsProps) {
  const router = useRouter();

  useEffect(() => {
    if (!subscribeRealtime) return;
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
  }, [publicationId, router, subscribeRealtime]);

  function submit(formData: FormData) {
    if (!canInteract) {
      router.push(`/login?next=${encodeURIComponent(`/publicacao/${publicationId}`)}`);
      return;
    }

    void toggleReactionAction({}, formData).then(() => router.refresh());
  }

  const style = (active: boolean, down = false) =>
    `inline-flex min-h-11 min-w-[68px] items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand ${
      active
        ? down
          ? "border-danger bg-danger-pale text-danger"
          : "border-brand-600 bg-brand-50 text-brand-700"
        : "border-border-subtle bg-white text-text-body hover:bg-surface"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={submit}>
        <input name="publicationId" type="hidden" value={publicationId} />
        <input name="type" type="hidden" value="support" />
        <button
          aria-pressed={myReaction === "support"}
          aria-label={`Votar a favor; ${counts.support} votos`}
          className={style(myReaction === "support")}
          type="submit"
          title="Votar a favor"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 16V4m-5 5 5-5 5 5" />
          </svg>
          <span>{counts.support}</span>
        </button>
      </form>

      <form action={submit}>
        <input name="publicationId" type="hidden" value={publicationId} />
        <input name="type" type="hidden" value="oppose" />
        <button
          aria-pressed={myReaction === "oppose"}
          aria-label={`Votar contra; ${counts.oppose} votos`}
          className={style(myReaction === "oppose", true)}
          type="submit"
          title="Votar contra"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4v12m5-5-5 5-5-5" />
          </svg>
          <span>{counts.oppose}</span>
        </button>
      </form>
    </div>
  );
}
