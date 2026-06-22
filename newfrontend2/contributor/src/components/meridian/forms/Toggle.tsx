"use client";

/**
 * Meridian — Toggle (switch)
 *
 * Boolean switch. Uses `role="switch"` + `aria-checked` for assistive
 * tech. Two sizes; brand-saffron when active.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (next: boolean) => void;
  size?: "sm" | "md";
  label?: string;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, checked, onChange, size = "md", label, ...props }, ref) => {
    const dims =
      size === "sm"
        ? { track: "h-4 w-7", thumb: "h-3 w-3", translate: "translate-x-3" }
        : { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors duration-fast ease-standard",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          checked ? "bg-brand" : "bg-stroke-strong",
          dims.track,
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block bg-surface rounded-full shadow transition-transform duration-fast ease-standard",
            dims.thumb,
            checked ? dims.translate : "translate-x-0.5",
          )}
        />
      </button>
    );
  },
);
Toggle.displayName = "Toggle";
