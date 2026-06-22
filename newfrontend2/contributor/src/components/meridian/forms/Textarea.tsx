"use client";

/**
 * Meridian — Textarea
 *
 * Multi-line input. Same focus + status patterns as Input. Resizes
 * vertically by default; opt-out via `resize="none"`.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const textareaVariants = cva(
  [
    "w-full bg-surface-sunken border rounded-lg font-body text-primary",
    "placeholder:text-text-disabled",
    "transition-colors duration-fast ease-standard",
    "focus:outline-none focus:bg-surface focus:border-stroke-focus focus:ring-2 focus:ring-state-focus-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-subtle",
    "py-2.5 px-3 text-body-md leading-relaxed",
  ].join(" "),
  {
    variants: {
      status: {
        default: "border-stroke",
        error: "border-error",
      },
      resize: {
        vertical: "resize-y",
        none: "resize-none",
        both: "resize",
      },
    },
    defaultVariants: { status: "default", resize: "vertical" },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, status, resize, invalid, rows = 3, ...props }, ref) => {
    const finalStatus = invalid ? "error" : status;
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(textareaVariants({ status: finalStatus, resize }), className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
