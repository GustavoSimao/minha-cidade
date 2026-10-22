"use client";

import { useState } from "react";
import { Share2Icon } from "@/shared/ui/icon";

interface ShareButtonProps {
  publicationId: string;
  title: string;
}

export function ShareButton({ publicationId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/publicacao/${publicationId}` : "";

  async function handleShare() {
    const shareData = {
      title,
      text: title,
      url,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Usuário cancelou ou erro — cai para fallback
      }
    }

    // Fallback: copiar para área de transferência
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencioso — botão continua funcional
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="min-h-11 flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-4 py-2 text-sm font-medium text-text-body hover:bg-surface"
      aria-label="Compartilhar publicação"
    >
      <Share2Icon className="h-4 w-4" aria-hidden="true" />
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}