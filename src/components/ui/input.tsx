"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-beige-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-white px-4 py-2 font-body text-sm text-brown-950 shadow-sm transition-all duration-200",
            "placeholder:text-beige-500",
            "focus:outline-none focus:ring-2 focus:ring-brown-500/20 focus:border-brown-500",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-beige-50",
            error
              ? "border-red-400 focus:ring-red-500/20 focus:border-red-500"
              : "border-beige-200 hover:border-beige-300",
            icon && "pl-11",
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
Input.displayName = "Input";

export { Input };
