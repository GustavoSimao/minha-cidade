"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface AvatarProps {
  children?: ReactNode;
  imageUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
  variant?: "default" | "photo" | "anonymous";
}

export function Avatar({ children, imageUrl, name, size = 42, className = "", variant = "default" }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : children;

  if (imageUrl) {
    return (
      <div
        className={`
          flex-0 flex-none rounded-full overflow-hidden
          ${variant === "photo" ? "cursor-pointer" : ""}
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        <Image
          src={imageUrl}
          alt={name || "Avatar"}
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const bgColor = variant === "anonymous"
    ? "bg-[#edf1f0] text-muted"
    : "bg-brand-pale text-brand";

  return (
    <div
      className={`
        flex-0 flex-none rounded-full
        flex items-center justify-center
        font-manrope font-extrabold
        ${bgColor}
        ${className}
      `}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  );
}
