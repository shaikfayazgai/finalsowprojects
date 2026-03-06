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
            "flex min-h-[100px] w-full rounded-xl border bg-white px-4 py-3 font-body text-sm text-brown-950 shadow-sm transition-all duration-200 resize-none",
            "placeholder:text-beige-500",
            "focus:outline-none focus:ring-2 focus:ring-brown-500/20 focus:border-brown-500",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-beige-50",
            error
              ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
              : "border-beige-200 hover:border-beige-300",
            className
          )}
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
