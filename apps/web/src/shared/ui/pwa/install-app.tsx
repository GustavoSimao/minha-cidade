"use client";

import { useState, useSyncExternalStore } from "react";

import { Icon } from "../icon";
import { installMode, type InstallMode } from "./install-support";
import { consumeInstallPrompt, installPromptState, subscribeInstallPrompt } from "./install-prompt-store";

function currentMode(): InstallMode {
  if (installPromptState().installed) {
    return "installed";
  }

  const nav = navigator as Navigator & { standalone?: boolean };

  return installMode({
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    displayStandalone: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
    iosStandalone: nav.standalone === true,
  });
}

const hasPendingPrompt = () => installPromptState().pending !== null;

/**
 * Item de navegação "Instalar app" (ADR-0013). Some quando o app já está
 * instalado ou quando o navegador não permite instalar. No servidor não renderiza nada.
 */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const mode = useSyncExternalStore<InstallMode | null>(subscribeInstallPrompt, currentMode, () => null);
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, hasPendingPrompt, () => false);
  const [showIosHint, setShowIosHint] = useState(false);

  const visible = mode === "ios" || (mode === "prompt" && canPrompt);

  if (!visible) {
    return null;
  }

  const install = async () => {
    if (mode === "ios") {
      setShowIosHint((open) => !open);
      return;
    }

    const event = consumeInstallPrompt();
    if (event) {
      await event.prompt();
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={install}
        aria-expanded={mode === "ios" ? showIosHint : undefined}
        className="flex min-h-[46px] w-full cursor-pointer items-center gap-3 whitespace-nowrap border-l-2 border-transparent px-3 text-left font-semibold text-ink hover:border-line"
      >
        <Icon name="download" size={20} className="mr-3 text-ink" />
        <span>Instalar app</span>
      </button>
      {mode === "ios" && showIosHint ? (
        <p className="mt-1 px-3 text-sm text-muted" role="note">
          No Safari, toque em <strong>Compartilhar</strong> e depois em{" "}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : null}
    </div>
  );
}
