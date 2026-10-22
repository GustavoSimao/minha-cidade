"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  "aria-label"?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const variantStyles: Record<string, string> = {
  primary: "bg-accent text-white hover:bg-accent/90 shadow-[0_7px_18px_rgba(240,107,84,.2)]",
  secondary: "bg-brand text-white hover:bg-brand-dark shadow-[0_7px_18px_rgba(11,108,112,.2)]",
  outline: "border border-brand text-brand bg-white hover:bg-brand-pale",
  ghost: "bg-transparent hover:bg-soft",
  danger: "border border-danger/30 bg-danger-pale text-danger hover:bg-danger-pale/80",
  accent: "bg-accent text-white hover:bg-accent/90",
};

const sizeStyles: Record<string, string> = {
  sm: "min-h-[38px] px-10 text-xs font-semibold",
  md: "min-h-[46px] px-16 text-sm font-bold",
  lg: "min-h-[52px] px-20 text-base font-bold",
};

export function Button({
  children,
  className = "",
  onClick,
  title,
  "aria-label": ariaLabel,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center gap-8
        rounded-[12px]
        font-manrope font-extrabold
        cursor-pointer
        transition-[filter,transform]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
