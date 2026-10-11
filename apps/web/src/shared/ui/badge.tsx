import { cn } from "./cn";

type BadgeTone = "institutional" | "moderation" | "neutral" | "problem" | "idea";

const TONES: Record<BadgeTone, string> = {
  institutional: "bg-brand-50 text-brand-700 border-brand-100",
  moderation: "bg-amber-50 text-warning border-amber-100",
  neutral: "bg-surface text-text-muted border-border-subtle",
  problem: "bg-red-50 text-danger border-red-100",
  idea: "bg-green-50 text-success border-green-100",
};

/** Etiqueta compacta usada em selo institucional, tipo de publicação etc. */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
