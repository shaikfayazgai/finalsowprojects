"use client";

/**
 * Meridian — SearchInput
 *
 * Input pre-configured with a leading search icon + optional clear
 * button. Use for table toolbars, command bars, list filters.
 */

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input, type InputProps } from "./Input";
import { cn } from "@/lib/utils/cn";

export interface SearchInputProps extends Omit<InputProps, "leadingIcon" | "trailingIcon"> {
  /** When set, shows a clear button when the value is non-empty. */
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    const showClear = onClear && typeof value === "string" && value.length > 0;
    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        leadingIcon={<Search className="h-4 w-4" />}
        trailingIcon={
          showClear ? (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className={cn(
                "p-0.5 rounded text-text-tertiary hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
        className={className}
        {...props}
      />
    );
  },
);
SearchInput.displayName = "SearchInput";
