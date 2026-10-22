"use client";

import { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  light?: boolean;
}

export function Eyebrow({ children, className = "", light = false }: EyebrowProps) {
  const cls = "eyebrow " + (light ? "text-[#a9dcda]" : "") + (className ? " " + className : "");
  return (
    <span className={cls}>
      {children}
    </span>
  );
}