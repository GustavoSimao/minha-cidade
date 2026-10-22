"use client";

import { Button } from "./button";

export function FilterChip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={`chip min-h-[34px] px-3 rounded-[20px] border border-line bg-white text-[10px] font-extrabold text-muted gap-2 cursor-pointer ${active ? "text-brand border-brand/60 bg-brand-pale" : ""}`}
    >
      {children}
    </Button>
  );
}
