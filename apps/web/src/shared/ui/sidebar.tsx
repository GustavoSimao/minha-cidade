"use client";

import { Icon } from "./icon";
import { Button } from "./button";
import { Avatar } from "./avatar";

type Screen =
  | "feed"
  | "mapa"
  | "salvos"
  | "notificacoes"
  | "transparencia"
  | "perfil"
  | "seguranca"
  | "configuracoes";

const navItems: { id: Screen; label: string; icon: "home" | "map" | "bookmark" | "bell" | "chart" }[] = [
  { id: "feed", label: "Início", icon: "home" },
  { id: "mapa", label: "Mapa da cidade", icon: "map" },
  { id: "salvos", label: "Salvos", icon: "bookmark" },
  { id: "notificacoes", label: "Notificações", icon: "bell" },
  { id: "transparencia", label: "Transparência", icon: "chart" },
];

export function Sidebar({
  screen,
  go,
}: {
  screen: Screen;
  go: (s: Screen) => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-[248px] bg-paper border-r border-line hidden md:flex flex-col p-[30px_18px_18px]">
      <div className="flex items-center gap-10 px-10 mb-8">
        <div className="logo">
          <div className="logo-mark">
            <span></span><span></span><span></span>
          </div>
          <div>
            <strong>minha</strong>
            <b>cidade</b>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-4 flex-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={screen === item.id ? "secondary" : "ghost"}
            size="md"
            className="w-full justify-start gap-13 px-12 min-h-[46px] rounded-[10px] text-left font-semibold"
            onClick={() => go(item.id)}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
            {item.id === "notificacoes" && <small className="ml-auto bg-accent text-white w-[21px] h-[21px] rounded-full grid place-items-center text-[11px]">4</small>}
          </Button>
        ))}
      </nav>

      <div className="h-px bg-line my-6 mx-[10px]" />

      <Button
        variant={screen === "seguranca" ? "secondary" : "ghost"}
        size="md"
        className="w-full justify-start gap-13 px-12 min-h-[46px] rounded-[10px] text-left font-semibold"
        onClick={() => go("seguranca")}
      >
        <Icon name="shield" size={20} />
        <span>Segurança e regras</span>
      </Button>

      <Button
        variant={screen === "configuracoes" ? "secondary" : "ghost"}
        size="md"
        className="w-full justify-start gap-13 px-12 min-h-[46px] rounded-[10px] text-left font-semibold"
        onClick={() => go("configuracoes")}
      >
        <Icon name="settings" size={20} />
        <span>Configurações</span>
      </Button>

      <div className="mt-auto border-t border-line pt-5 px-4 flex items-center gap-10">
        <Avatar variant="photo" name="Ana Santos" size={42} className="flex-0 flex-none" />
        <div className="flex-1 min-w-0">
          <b className="block text-sm text-ink">Ana Santos</b>
          <span className="block text-[12px] text-muted mt-1">@anasan</span>
        </div>
        <Icon name="more" size={20} className="text-muted" />
      </div>
    </aside>
  );
}
