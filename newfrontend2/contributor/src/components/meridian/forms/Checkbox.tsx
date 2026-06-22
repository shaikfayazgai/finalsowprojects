"use client";

/**
 * Meridian — Checkbox
 *
 * Native checkbox styled to match Meridian. Indeterminate state
 * supported via the `indeterminate` prop.
 */

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  size?: "sm" | "md";
  indeterminate?: boolean;
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, size = "md", indeterminate, checked, label, id, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);
    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
    const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

    const labelEl = (
      <label
        htmlFor={inputId}
        className={cn(
          "relative inline-flex items-center justify-center rounded-sm border cursor-pointer transition-colors duration-fast ease-standard",
          checked || indeterminate
            ? "bg-brand border-brand text-on-brand"
            : "bg-surface border-stroke-strong hover:border-stroke-focus",
          dim,
        )}
      >
        {indeterminate ? (
          <Minus className={cn(iconSize, "stroke-[3]")} aria-hidden />
        ) : checked ? (
          <Check className={cn(iconSize, "stroke-[3]")} aria-hidden />
        ) : null}
      </label>
    );

    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <input
          ref={innerRef}
          id={inputId}
          type="checkbox"
          checked={checked}
          className="sr-only"
          {...props}
        />
        {labelEl}
        {label && (
          <label htmlFor={inputId} className="font-body text-body-sm text-primary cursor-pointer">
            {label}
          </label>
        )}
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";
