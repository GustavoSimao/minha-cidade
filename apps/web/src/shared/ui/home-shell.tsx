"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { FeedFilters } from "@/shared/ui/feed-filters";
import { RelativeTime } from "@/shared/ui/relative-time";
import { Header } from "@/shared/ui/header";
import { RightRail } from "@/shared/ui/right-rail";
import { InstallAppButton } from "@/shared/ui/pwa/install-app";
import { ReactionButtons } from "@/shared/ui/engagement/reaction-buttons";
import { publicStorageUrl } from "@/contexts/identity/infrastructure/supabase/public-url";

type Screen =
  | "feed"
  | "explorar"
  | "amizades"
  | "salvos"
  | "notificacoes"
  | "transparencia"
  | "perfil"
  | "seguranca"
  | "configuracoes";

interface HomeShellProps {
  items: Array<{
    id: string;
    type: "problem" | "idea";
    authorId: string | null;
    title: string;
    content: string;
    createdAt: string;
    editedAt: string | null;
    media: Array<{ path: string }>;
    cityId: number;
    neighborhoodId: string | null;
  }>;
  nextCursor: string | null;
  authors: Map<string, { fullName: string; username: string; avatarPath: string | null; isVerified: boolean; verifiedOrg: string | null }>;
  cityNames: Map<number, string>;
  neighborhoodNames: Map<string, string>;
  medias: Array<(string | null)[]>;
  counts: Record<string, { support: number; oppose: number; comments: number }>;
  filters: Record<string, string>;
  anyFilterActive: boolean;
  canInteract: boolean;
  myReactions: Record<string, "support" | "oppose">;
  signedIn: boolean;
}

const NAV_ITEMS: { id: Screen; label: string; href: string; iconName: "home" | "map" | "users" | "bookmark" | "bell" | "chart" }[] = [
  { id: "feed", label: "Feed", href: "/", iconName: "home" },
  { id: "explorar", label: "Explorar cidades", href: "/explorar", iconName: "map" },
  { id: "amizades", label: "Amizades", href: "/amigos", iconName: "users" },
  { id: "salvos", label: "Salvos", href: "/salvos", iconName: "bookmark" },
  { id: "notificacoes", label: "Notificações", href: "/notificacoes", iconName: "bell" },
  { id: "transparencia", label: "Transparência", href: "/transparencia", iconName: "chart" },
];

export function HomeShell({
  items,
  nextCursor,
  authors,
  cityNames,
  neighborhoodNames,
  medias,
  counts,
  filters,
  anyFilterActive,
  canInteract,
  myReactions,
  signedIn,
}: HomeShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const screen: Screen = "feed";

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const syncBreakpoint = () => {
      setIsWideScreen(media.matches);
      setSidebarOpen(false);
    };
    syncBreakpoint();
    media.addEventListener("change", syncBreakpoint);
    return () => media.removeEventListener("change", syncBreakpoint);
  }, []);

  useEffect(() => {
    const menuOpen = isWideScreen ? desktopSidebarOpen : sidebarOpen;
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isWideScreen) setDesktopSidebarOpen(false);
        else setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [desktopSidebarOpen, isWideScreen, sidebarOpen]);

  const go = (s: string) => {
    setSidebarOpen(false);
    const destinations: Record<string, string> = {
      feed: "/",
      explorar: "/explorar",
      amizades: "/amigos",
      salvos: "/salvos",
      notificacoes: "/notificacoes",
      transparencia: "/transparencia",
      perfil: "/perfil",
      seguranca: "/termos",
      configuracoes: "/perfil/editar",
    };
    const destination = destinations[s];
    if (destination) router.push(destination);
  };
  const openComposer = () => router.push("/publicar");

  const menuOpen = isWideScreen ? desktopSidebarOpen : sidebarOpen;

  return (
    <div className={`app-shell min-h-screen bg-soft text-ink relative ${isWideScreen && !desktopSidebarOpen ? "sidebar-collapsed" : ""}`} data-reference-shell="true">
      {/* Desktop sidebar — grid item, sempre visível */}
      <aside className={`sidebar-desktop z-20 bg-paper border-r border-line flex flex-col p-[30px_18px_18px] md:block hidden ${desktopSidebarOpen ? "" : "sidebar-desktop-collapsed"}`} id="desktop-navigation">
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
        <nav aria-label="Navegação principal" className="flex flex-col gap-4">
          {NAV_ITEMS.map((item) => {
            const active = screen === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`w-full justify-start gap-3 px-3 min-h-[46px] border-l-2 text-left font-semibold flex items-center whitespace-nowrap ${active ? "border-brand text-brand" : "border-transparent text-ink hover:border-line"}`}
              >
                <Icon name={item.iconName} size={20} className={`mr-3 ${active ? "text-brand" : "text-ink"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <InstallAppButton className="mt-4 border-t border-line pt-4" />
      </aside>

      {/* Mobile/tablet drawer; never render alongside the desktop sidebar. */}
      {!isWideScreen ? <>
      <aside
        aria-hidden={!sidebarOpen}
        aria-label="Menu principal"
        aria-modal={sidebarOpen || undefined}
        className="sidebar fixed bottom-[68px] left-0 top-[62px] z-20 flex w-[min(320px,88vw)] flex-col border-r border-line bg-paper p-[22px_18px_18px] transition-transform duration-300 ease-in-out md:hidden"
        style={{
          position: "fixed",
          left: 0,
          right: "auto",
          top: "62px",
          bottom: "68px",
          width: "min(320px, 88vw)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-105%)",
        }}
        id="mobile-navigation"
        inert={!sidebarOpen}
        role="dialog"
      >
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
        <nav aria-label="Navegação principal" className="flex flex-col gap-4">
          {NAV_ITEMS.map((item) => {
            const active = screen === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`w-full justify-start gap-3 px-3 min-h-[46px] border-l-2 text-left font-semibold flex items-center whitespace-nowrap ${active ? "border-brand text-brand" : "border-transparent text-ink hover:border-line"}`}
              >
                <Icon name={item.iconName} size={20} className={`mr-3 ${active ? "text-brand" : "text-ink"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <InstallAppButton className="mt-4 border-t border-line pt-4" />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Fechar menu"
          className="sidebar-overlay fixed inset-x-0 top-[62px] bottom-[68px] z-[40] cursor-default bg-[#0a2024]/[.6] md:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}
      </> : null}

      <div className="relative z-10 min-w-0 col-start-2 min-h-full">
        <Header
          title="Início"
          screen={screen}
          go={(s) => go(s)}
          onMenu={() => {
            if (isWideScreen) setDesktopSidebarOpen((open) => !open);
            else setSidebarOpen((open) => !open);
          }}
          menuOpen={menuOpen}
          menuControlsId={isWideScreen ? "desktop-navigation" : "mobile-navigation"}
          signedIn={signedIn}
        />
        <div className={`content max-w-[1390px] mx-auto p-[30px_34px_70px] ${screen === "feed" ? "with-rail" : ""}`}>
          <div className="primary-content min-w-0">
            <div className="mx-auto max-w-2xl md:max-none">
              {/* Feed intro — referência */}
              <section className="feed-intro mt-4 mb-4 flex items-end justify-between gap-20">
                <div>
                  <div className="hero-title">O que está acontecendo perto de você?</div>
                </div>
              </section>

              {/* Quick compose */}
              <div className="quick-compose mt-4 mb-4">
                  <Button className="compose-prompt" onClick={openComposer}>
                    <Icon name="plus" size={18} className="mr-2 shrink-0 text-brand" />
                    <span>Compartilhe um problema ou uma ideia…</span>
                  </Button>
              </div>

              {/* Feed controls */}
              <div className="feed-controls mt-4 mb-4">
                <h2 className="screen-title small">Publicações recentes</h2>
              </div>

              <FeedFilters />

              <section className="mt-4 flex flex-col gap-3">
                {items.length === 0 ? (
                  <EmptyState
                    action={
                      anyFilterActive ? (
                        <Link
                          className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 py-2 text-sm font-semibold text-ink hover:bg-soft"
                          href="/"
                        >
                          Limpar filtros
                        </Link>
                      ) : (
                        <Link
                          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-stamp hover:bg-brand-dark"
                          href="/publicar"
                        >
                          Publicar agora
                        </Link>
                      )
                    }
                    description={
                      anyFilterActive
                        ? "Nenhuma publicação corresponde a esses filtros. Tente ampliar a busca ou limpar os filtros."
                        : "Assim que alguém do bairro contar o que está acontecendo, a publicação aparece aqui. Você pode ser o primeiro."
                    }
                    icon={<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/></svg>}
                    title={anyFilterActive ? "Nenhum resultado para os filtros" : "Nenhuma publicação por aqui ainda"}
                  />
                ) : (
                  items.map((item, index) => {
                    const author = item.authorId ? authors.get(item.authorId) : null;
                    return (
                      <article
                        className="feed-publication-card rounded-card border border-line bg-white p-5 shadow-stamp"
                        key={item.id}
                      >
                        <div className="flex items-center gap-3">
                          {author ? (
                            <Link aria-label={`Perfil de ${author.fullName}`} href={`/perfil/${author.username}`}>
                              <Avatar
                                imageUrl={
                                  author.avatarPath ? publicStorageUrl("avatars", author.avatarPath) : null
                                }
                                name={author.fullName}
                                size={36}
                              />
                            </Link>
                          ) : (
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-soft text-xs font-semibold text-muted">
                              Anônimo
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-ink">
                              {author ? (
                                <Link className="hover:underline" href={`/perfil/${author.username}`}>
                                  {author.fullName}
                                </Link>
                              ) : (
                                "Morador anônimo"
                              )}
                            </span>
                            {author?.isVerified && author.verifiedOrg ? (
                              <Badge className="mt-1 self-start" tone="institutional">
                                {author.verifiedOrg}
                              </Badge>
                            ) : null}
                            <span className="text-xs text-muted">
                              <RelativeTime date={item.createdAt} />
                              {item.editedAt ? " · editado" : ""}
                            </span>
                          </div>
                          <Badge tone={item.type === "problem" ? "problem" : "idea"}>
                            {item.type === "problem" ? "Problema" : "Ideia"}
                          </Badge>
                        </div>
                        <h2 className="mt-3 text-base font-semibold text-ink">
                          <Link href={`/publicacao/${item.id}`}>{item.title}</Link>
                        </h2>
                        <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-ink">
                          {item.content}
                        </p>
                        {medias[index]?.length ? (
                          <ul className="mt-3 hidden gap-2 sm:grid sm:grid-cols-3">
                            {medias[index].map((path, position) => {
                              const url = medias[index][position];
                              return url ? (
                                <li key={position}>
                                  <Image
                                    alt={`Imagem ${position + 1} da publicação`}
                                    className="aspect-square w-full rounded-lg border border-line object-cover"
                                    height={160}
                                    loading="lazy"
                                    unoptimized
                                    src={url}
                                    width={160}
                                  />
                                </li>
                              ) : null;
                            })}
                          </ul>
                        ) : null}
                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span>{counts[item.id]?.comments ?? 0} comentários</span>
                        </p>
                        <div className="mt-3">
                          <ReactionButtons
                            canInteract={canInteract}
                            counts={{ support: counts[item.id]?.support ?? 0, oppose: counts[item.id]?.oppose ?? 0 }}
                            myReaction={myReactions[item.id] ?? null}
                            publicationId={item.id}
                            subscribeRealtime={false}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {[cityNames.get(item.cityId), neighborhoodNames.get(item.neighborhoodId ?? "") ?? "Bairro não informado"]
                            .filter((part): part is string => Boolean(part))
                            .join(", ")}
                        </p>
                      </article>
                    );
                  })
                )}
              </section>
              {nextCursor ? (
                <Link
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-soft"
                  href={`/?${new URLSearchParams({ ...filters, cursor: nextCursor })}`}
                >
                  Carregar mais
                </Link>
              ) : null}
            </div>
          </div>
          {/* RightRail — desktop only */}
          {screen === "feed" && (
            <div className="md:block hidden">
              <RightRail />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
