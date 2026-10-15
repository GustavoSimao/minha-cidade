/**
 * Ícones inline do produto — SVG com traço, decorativos (`aria-hidden`).
 * Um conjunto pequeno e consistente evita emoji (renderização varia por plataforma)
 * e dependência de biblioteca de ícones.
 */

type IconProps = { className?: string };

const base = "h-5 w-5";

export function InboxIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M3 12h4l2 3h6l2-3h4" />
      <path d="M5 5h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 1 1 21 12z" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M22 20v-1a4 4 0 0 0-3-3.85" />
      <path d="M16.5 3.6a3.5 3.5 0 0 1 0 6.8" />
    </svg>
  );
}

/** Lupa — busca de pessoas. */
export function SearchIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.5 4L16 12H5z" />
    </svg>
  );
}

/** Gráfico de barras — usado nos estados vazios de analytics/transparência. */
export function ChartIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
    >
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {  return (
    <svg
      aria-hidden="true"
      className={className ?? base}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  );
}
