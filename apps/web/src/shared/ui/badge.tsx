import { cn } from "./cn";

type BadgeTone = "institutional" | "moderation" | "neutral" | "problem" | "idea";

const TONES: Record<BadgeTone, string> = {
  institutional: "bg-brand-50 text-brand-700 border-brand-100",
  moderation: "bg-warning-bg text-warning border-warning-border",
  neutral: "bg-surface text-text-muted border-border-subtle",
  problem: "bg-danger-bg text-danger border-danger-border",
  idea: "bg-success-bg text-success border-success-border",
};

/** Etiqueta compacta usada em selo institucional, tipo de publicação etc. */
export function Badge({
  tone = "neutral",
  className,
  testId,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
      data-testid={testId}
    >
      {children}
    </span>
  );
}
