"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "./icon";

const items = [
  { href: "/", label: "Feed", icon: "home" },
  { href: "/explorar", label: "Explorar", icon: "map" },
  { href: "/publicar", label: "Publicar", icon: "plus" },
  { href: "/amigos", label: "Amigos", icon: "users" },
  { href: "/perfil", label: "Perfil", icon: "user" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/cadastro") return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="bottom-nav fixed inset-x-0 bottom-0 z-30 flex h-[68px] items-center justify-around border-t border-line bg-white/97 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px] md:hidden"
    >
      {items.map((item) => {
        const active = item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const create = item.href === "/publicar";

        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={create
              ? "mobile-create -mt-6 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-stamp"
              : `flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${active ? "text-brand" : "text-muted"}`}
            href={item.href}
            key={item.href}
          >
            <Icon name={item.icon} size={create ? 25 : 20} />
            {!create ? <span>{item.label}</span> : <span className="sr-only">Publicar</span>}
          </Link>
        );
      })}
    </nav>
  );
}
