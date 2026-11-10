"use client";

import { useEffect } from "react";

import { captureInstallPrompt } from "./install-prompt-store";

/**
 * Registra o service worker (ADR-0013). Só em produção: no desenvolvimento o SW
 * atrapalharia o HMR e serviria bundle velho durante a iteração.
 *
 * Também captura o `beforeinstallprompt` logo no layout raiz: o evento pode
 * disparar antes de o menu (onde fica o botão "Instalar app") montar.
 */
export function RegisterServiceWorker() {
  useEffect(() => captureInstallPrompt(), []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Falha silenciosa: o app continua funcionando sem cache offline.
    });
  }, []);

  return null;
}
