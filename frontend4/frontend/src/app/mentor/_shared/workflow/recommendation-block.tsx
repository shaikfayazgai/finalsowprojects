"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { VOCAB } from "./severity-tokens";

/**
 * Canonical AI recommendation block — forest-tinted callout used at the
 * end of every AI panel/card. One label, one tint, one structure.
 *
 * `variant="inline"` is a single-line, lighter treatment used in stacked
 * lists; `variant="card"` is the full card used in expanded contexts.
 */
export function RecommendationBlock({
  children,
  label = VOCAB.aiRecommendation,
  variant = "card",
  className,
}: {
  children: React.ReactNode;
  label?: string;
  variant?: "card" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <p
        className={cn(
          "rounded-md border border-forest-200 bg-forest-50/60 px-2.5 py-1.5 text-[11.5px] text-forest-900 font-semibold leading-snug",
          className
        )}
      >
        → {children}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-forest-200 bg-forest-50/40 px-2.5 py-1.5",
        className
      )}
    >
      <p className="text-[9.5px] font-bold uppercase tracking-wider text-forest-700">
        {label}
      </p>
      <p className="mt-0.5 text-[11.5px] text-gray-800 leading-snug">{children}</p>
    </div>
  );
}
