import type { MetadataRoute } from "next";

/**
 * Manifest do PWA (ADR-0013). Convenção de arquivo do App Router: `app/manifest.ts`.
 * Ícones em `public/icons/` (gerados por `apps/web/scripts/generate-pwa-icons.mjs`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minha Cidade — participação cidadã por bairro",
    short_name: "Minha Cidade",
    description:
      "Publique problemas e ideias do seu bairro, apoie as causas dos vizinhos e acompanhe o que a comunidade está discutindo.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f7f5",
    theme_color: "#0b6c70",
    categories: ["news", "social", "government"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Publicar", short_name: "Publicar", url: "/publicar" },
      { name: "Meus avisos", short_name: "Avisos", url: "/notificacoes" },
    ],
  };
}
