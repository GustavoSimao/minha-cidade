"use client";

import { Icon } from "./icon";
import { Button } from "./button";
import { Avatar } from "./avatar";

type Screen =
  | "feed"
  | "amizades"
  | "salvos"
  | "notificacoes"
  | "transparencia"
  | "perfil"
  | "seguranca"
  | "configuracoes";

export function Header({
  title,
  screen,
  go,
  onMenu,
  menuOpen = false,
  menuControlsId = "mobile-navigation",
}: {
  title: string;
  screen: Screen;
  go: (s: Screen) => void;
  onMenu?: () => void;
  menuOpen?: boolean;
  menuControlsId?: string;
}) {
  return (
    <header className="topbar">
      <div className="mobile-logo flex items-center gap-1">
        <div className="logo">
          <div className="logo-mark">
            <span></span><span></span><span></span>
          </div>
          <div className="text-sm font-extrabold text-ink"><strong>minha</strong><b>cidade</b></div>
        </div>
      </div>

      {onMenu && (
        <Button
          variant="ghost"
          className="icon-button mr-3 block !min-h-11 !w-11 !shrink-0 !p-0"
          onClick={onMenu}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-controls={menuControlsId}
          aria-expanded={menuOpen}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {menuOpen ? (
              <path d="m6 6 12 12M18 6 6 18" />
            ) : (
              <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
            )}
          </svg>
        </Button>
      )}

      <div className="page-title hidden md:block">{title}</div>

      <div className="top-actions">
        <Button
          variant={screen === "notificacoes" ? "secondary" : "ghost"}
          size="sm"
          className="icon-button"
          onClick={() => go("notificacoes")}
          title="Notificações"
          aria-label="Notificações"
        >
          <Icon name="bell" size={20} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="header-profile-button !min-h-11 !w-11 !shrink-0 !p-0 rounded-full grid place-items-center"
          onClick={() => go("perfil")}
          aria-label="Abrir meu perfil"
        >
          <Avatar name="Minha conta" size={40} />
        </Button>
      </div>
    </header>
  );
}
