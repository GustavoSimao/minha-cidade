"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", title, description, padding = "md" }: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-5",
    md: "p-6 sm:p-8",
    lg: "p-8 sm:p-10",
  };

  return (
    <article className={`rounded-[16px] border border-line bg-white shadow-stamp ${paddingStyles[padding]} ${className}`}>
      {(title || description) && (
        <header className="mb-6">
          {title && <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">{title}</h2>}
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </header>
      )}
      {children}
    </article>
  );
}
