"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (ADR-0013). Só em produção: no desenvolvimento o SW
 * atrapalharia o HMR e serviria bundle velho durante a iteração.
 */
export function RegisterServiceWorker() {
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
