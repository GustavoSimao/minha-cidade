"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/shared/ui/icon";

export function PublicationModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        router.back();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [router]);

  return (
    <div className="publication-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-[4px] sm:p-6">
      <button
        aria-label="Fechar publicação"
        className="absolute inset-0 cursor-default bg-ink/55"
        onClick={() => router.back()}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-labelledby="publication-modal-title"
        aria-modal="true"
        className="publication-modal-panel relative z-10 flex max-h-[min(92dvh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-modal outline-none"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3 sm:px-7">
          <h1 className="text-lg font-bold text-ink" id="publication-modal-title">Nova publicação</h1>
          <button
            aria-label="Fechar publicação"
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white text-ink transition hover:bg-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => router.back()}
            type="button"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-3 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
