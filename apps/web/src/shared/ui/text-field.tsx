"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="block text-[9px] font-extrabold text-brand mb-5">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={`${errorId || ""} ${hintId || ""}`.trim() || undefined}
          aria-invalid={error ? "true" : "false"}
          className={`
            w-full border rounded-[9px]
            bg-white text-ink placeholder:text-[#9aa9a9]
            border-line
            px-4 py-3 text-[10px]
            focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/22
            disabled:bg-soft disabled:cursor-not-allowed
            ${error ? "border-danger focus:border-danger focus:ring-danger/22" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-3 text-[8px] text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-3 text-[8px] text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";