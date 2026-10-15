import Image from "next/image";

import { cn } from "./cn";

/** Iniciais do nome, usadas como fallback do avatar (design system). */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

/** Avatar com imagem do Storage ou iniciais coloridas. */
export function Avatar({
  name,
  imageUrl,
  size = 48,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        alt={`Foto de ${name}`}
        className={cn("rounded-full object-cover", className)}
        height={size}
        src={imageUrl}
        style={{ width: size, height: size }}
        width={size}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700",
        className,
      )}
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {initials(name)}
    </span>
  );
}
