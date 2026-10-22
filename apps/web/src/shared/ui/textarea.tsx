"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label: string;
  error?: string;
  hint?: string;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, maxLength, className = "", id, ...props }, ref) => {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const counterId = maxLength ? `${textareaId}-counter` : undefined;

    return (
      <div className="w-full">
        <label htmlFor={textareaId} className="block text-[9px] font-extrabold text-brand mb-5">
          {label}
        </label>
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            aria-describedby={`${errorId || ""} ${hintId || ""} ${counterId || ""}`.trim() || undefined}
            aria-invalid={error ? "true" : "false"}
            className={`
              w-full border border-line rounded-[9px]
              bg-white text-ink placeholder:text-[#9aa9a9]
              px-4 py-3 text-[10px] resize-none
              focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/22
              disabled:bg-soft disabled:cursor-not-allowed
              ${error ? "border-danger focus:border-danger focus:ring-danger/22" : ""}
              ${className}
            `}
            maxLength={maxLength}
            {...props}
          />
          {maxLength && (
            <span id={counterId} className="absolute bottom-3 right-3 text-[7px] text-muted">
              {(props.value as string)?.length || 0}/{maxLength}
            </span>
          )}
        </div>
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

Textarea.displayName = "Textarea";