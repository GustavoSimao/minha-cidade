import type { NextConfig } from "next";

/**
 * Hosts de onde saem as imagens (Supabase Storage). Derivados de
 * `NEXT_PUBLIC_SUPABASE_URL` (stack local e projeto hospedado), com os fallbacks
 * conhecidos abaixo — `next/image` só otimiza URLs que casam com `remotePatterns`.
 */
function storageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      patterns.push({
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
      });
    } catch {
      // URL inválida: seguimos com os fallbacks.
    }
  }

  patterns.push({ protocol: "http", hostname: "127.0.0.1", port: "54321" });
  patterns.push({ protocol: "https", hostname: "**.supabase.co" });

  return patterns;
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Uploads já são WebP (P15); o otimizador entrega AVIF/WebP sob demanda.
    formats: ["image/webp"],
    remotePatterns: storageRemotePatterns(),
  },
};

export default nextConfig;
