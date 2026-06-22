"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border bg-white/80 px-3.5 py-3 font-body text-sm transition-all duration-200 resize-none",
            "focus:outline-none focus:ring-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-400 focus:ring-red-500/20 focus:border-red-500" : "",
            className
          )}
          style={{
            color: 'var(--ink)',
            borderColor: error ? undefined : 'var(--border-soft)',
          }}
          onFocus={(e) => { if (!error) { e.currentTarget.style.borderColor = 'rgba(166,119,99,0.35)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(166,119,99,0.08)'; } props.onFocus?.(e); }}
          onBlur={(e) => { if (!error) { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.boxShadow = 'none'; } props.onBlur?.(e); }}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
