"use client";

/**
 * Meridian — Input
 *
 * Standard text input with leading/trailing slot support. Three sizes,
 * error + disabled states, accessible focus ring via the global
 * focus-visible token.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const inputVariants = cva(
  [
    "w-full bg-surface-sunken border rounded-lg font-body text-primary",
    "placeholder:text-text-disabled",
    "transition-colors duration-fast ease-standard",
    "focus:outline-none focus:bg-surface focus:border-stroke-focus focus:ring-2 focus:ring-state-focus-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-subtle",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-body-sm",
        md: "h-10 px-3 text-body-md",
        lg: "h-11 px-3.5 text-body-md",
      },
      status: {
        default: "border-stroke",
        error: "border-error",
      },
    },
    defaultVariants: { size: "md", status: "default" },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      status,
      leadingIcon,
      trailingIcon,
      invalid,
      ...props
    },
    ref,
  ) => {
    const finalStatus = invalid ? "error" : status;
    if (leadingIcon || trailingIcon) {
      return (
        <div className="relative">
          {leadingIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            aria-invalid={invalid || undefined}
            className={cn(
              inputVariants({ size, status: finalStatus }),
              leadingIcon && "pl-9",
              trailingIcon && "pr-9",
              className,
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {trailingIcon}
            </span>
          )}
        </div>
      );
    }
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(inputVariants({ size, status: finalStatus }), className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { inputVariants };
