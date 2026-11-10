/**
 * Decide como oferecer a instalação do PWA (ADR-0013) a partir do ambiente do
 * navegador. Função pura para ser testada sem DOM.
 *
 * - "installed": já roda como app (janela própria) — não oferecer nada.
 * - "ios": Safari no iPhone/iPad não dispara `beforeinstallprompt`; só dá para
 *   ensinar o caminho "Compartilhar → Adicionar à Tela de Início".
 * - "prompt": Chrome/Edge/Android — aguardar o evento `beforeinstallprompt`.
 */
export type InstallMode = "installed" | "ios" | "prompt";

export interface InstallEnvironment {
  userAgent: string;
  /** `navigator.maxTouchPoints` — iPadOS se apresenta como Mac com toque. */
  maxTouchPoints: number;
  /** `matchMedia('(display-mode: standalone)').matches`. */
  displayStandalone: boolean;
  /** `navigator.standalone` (só existe no Safari iOS). */
  iosStandalone: boolean;
}

export function installMode(env: InstallEnvironment): InstallMode {
  if (env.displayStandalone || env.iosStandalone) {
    return "installed";
  }

  const ua = env.userAgent;
  const iPhoneOrIPod = /iPhone|iPod/i.test(ua);
  const iPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && env.maxTouchPoints > 1);

  return iPhoneOrIPod || iPad ? "ios" : "prompt";
}
