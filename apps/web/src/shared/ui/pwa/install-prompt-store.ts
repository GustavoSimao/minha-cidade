/**
 * Guarda o `beforeinstallprompt` (Chrome/Edge/Android) entre o momento em que o
 * navegador o dispara e o momento em que o botão "Instalar app" monta.
 */

/** Evento não padronizado do Chrome/Edge/Android (ainda fora do lib.dom). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let pending: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/** Registra os listeners globais; devolve a função de limpeza. */
export function captureInstallPrompt(): () => void {
  const onPrompt = (event: Event) => {
    event.preventDefault();
    pending = event as BeforeInstallPromptEvent;
    notify();
  };
  const onInstalled = () => {
    pending = null;
    installed = true;
    notify();
  };

  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

export function installPromptState(): { pending: BeforeInstallPromptEvent | null; installed: boolean } {
  return { pending, installed };
}

/** O prompt só pode ser usado uma vez. */
export function consumeInstallPrompt(): BeforeInstallPromptEvent | null {
  const event = pending;
  pending = null;
  notify();
  return event;
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
