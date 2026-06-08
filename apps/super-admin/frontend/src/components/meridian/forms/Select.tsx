"use client";

/**
 * Meridian — Select
 *
 * Native `<select>` styled to match Meridian inputs. For complex
 * pickers (typeahead, async, multi-select), use a headless library in
 * Phase 3 and wrap it with these styles.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const selectVariants = cva(
  [
    "w-full appearance-none border font-body transition-colors duration-fast ease-standard pr-9",
    "focus:outline-none focus:ring-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Sunken field — default Meridian form surfaces */
        filled: [
          "bg-surface-sunken rounded-lg text-primary",
          "focus:bg-surface focus:border-stroke-focus focus:ring-state-focus-ring",
          "disabled:bg-bg-subtle",
        ].join(" "),
        /** Outlined field — admin modals & wizards (matches text inputs) */
        outline: [
          "bg-surface rounded-md text-foreground",
          "focus:border-brand focus:ring-brand/25",
          "disabled:bg-bg-subtle",
        ].join(" "),
      },
      size: {
        sm: "h-9 pl-3 text-[13px]",
        md: "h-10 pl-3 text-body-md",
        lg: "h-11 pl-3.5 text-body-md",
      },
      status: {
        default: "border-stroke",
        error: "border-error",
      },
    },
    defaultVariants: { variant: "filled", size: "md", status: "default" },
  },
);

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">,
    VariantProps<typeof selectVariants> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, status, invalid, children, ...props }, ref) => {
    const finalStatus = invalid ? "error" : status;
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(selectVariants({ variant, size, status: finalStatus }), className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
        />
      </div>
    );
  },
);
Select.displayName = "Select";
