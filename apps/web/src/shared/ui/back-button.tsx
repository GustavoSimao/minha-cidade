"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Icon } from "./icon";

/**
 * Quantas telas do app já foram visitadas nesta aba. Se a pessoa chegou direto
 * (link externo, favorito), não há para onde voltar dentro do app: vai para o feed.
 */
let visitedScreens = 0;

/** Botão "Voltar" exibido em todas as telas, exceto no feed (home). */
export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    visitedScreens += 1;
  }, [pathname]);

  if (pathname === "/") {
    return null;
  }

  const goBack = () => {
    if (visitedScreens > 1 && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-3 sm:px-6">
      <button
        type="button"
        onClick={goBack}
        className="-ml-2 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-[12px] px-2 text-sm font-semibold text-ink hover:bg-white"
      >
        <Icon name="chevron" size={20} className="rotate-180" />
        <span>Voltar</span>
      </button>
    </div>
  );
}
