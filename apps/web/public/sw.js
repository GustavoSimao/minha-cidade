/**
 * Service worker do Minha Cidade (ADR-0013 — PWA instalável com cache de leitura).
 *
 * Regras (decisão 5 do plano de design):
 * - Cacheia APENAS leitura pública: shell (a home/feed) e assets estáticos.
 * - NUNCA cacheia rota autenticada (`/salvos`, `/notificacoes`, `/admin`,
 *   `/perfil/editar`), nem `/api`, nem qualquer método que não seja GET.
 * - Versionamento de cache: subir `CACHE` invalida o anterior no `activate`.
 */

/* global self, caches, fetch */

const CACHE = "minha-cidade-v2";

const SHELL = [
  "/",
  "/transparencia",
  "/termos",
  "/privacidade",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

/** Rotas que nunca entram no cache (privadas, de escrita ou dinâmicas de API). */
function isExcluded(pathname) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next/data") ||
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/publicar" ||
    pathname === "/salvos" ||
    pathname === "/notificacoes" ||
    pathname === "/perfil/editar" ||
    pathname.startsWith("/admin")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || isExcluded(url.pathname)) {
    return;
  }

  // Assets estáticos: cache-first (imutáveis, versionados pelo Next).
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  // Navegação pública: network-first com fallback no cache (leitura offline).
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
  );
});
