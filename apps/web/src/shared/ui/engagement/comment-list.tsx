"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createBrowserSupabase } from "@/shared/infrastructure/supabase-browser";
import type { PublicCommentAuthor } from "@/contexts/engagement/application/ports";
import { ChatIcon } from "@/shared/ui/icon";
import { EmptyState } from "@/shared/ui/empty-state";
import { CommentItem } from "./comment-item";

export interface CommentFeedItem {
  id: string;
  authorId: string | null;
  content: string;
  isAnonymous: boolean;
  editedAt: Date | null;
  createdAt: Date;
  author: PublicCommentAuthor | null;
  /** E5: true quando o comentário é do usuário logado e está na janela de 15 min. */
  canEdit: boolean;
  /** E5: true quando o comentário é do usuário logado (pode apagar). */
  isMine: boolean;
}

export interface CommentListProps {
  publicationId: string;
  items: CommentFeedItem[];
  total: number;
}

/**
 * Lista de comentários com Realtime (D8): novos comentários e edições aparecem
 * sem recarregar a página. A lista inicial vem do servidor (RLS como anônimo
 * ou como o usuário).
 */
export function CommentList({ publicationId, items, total }: CommentListProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabase();

    const channel = supabase
      .channel(`comments-${publicationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "engagement",
          table: "comments",
          filter: `publication_id=eq.${publicationId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [publicationId, router]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text-strong">Comentários ({total})</h2>
      {items.length === 0 ? (
        <EmptyState
          description="Pergunte, complemente ou conte como a situação evoluiu. Você também pode comentar sem se identificar."
          icon={<ChatIcon className="h-8 w-8" />}
          title="Nenhum comentário ainda"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((comment) => (
            <CommentItem
              canEdit={comment.canEdit}
              comment={comment}
              isMine={comment.isMine}
              key={comment.id}
              publicationId={publicationId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
