"use client";

import * as React from "react";
import { CircuitBoard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { VOCAB } from "./severity-tokens";

/**
 * Canonical "Auditable" badge used in every AI section. Centralizes the
 * promise: every AI claim is sourced, bounded, and instrumented.
 *
 * `tone="default"` is forest (operational positive); `tone="muted"` is gray
 * (use in dense rows where the forest accent competes with severity rails).
 */
export function AuditableBadge({
  label = VOCAB.auditable,
  tone = "default",
  className,
}: {
  label?: string;
  tone?: "default" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone === "muted"
          ? "border-gray-200 bg-gray-50 text-gray-700"
          : "border-forest-200 bg-forest-50 text-forest-700",
        className
      )}
    >
      <CircuitBoard className="h-3 w-3" />
      {label}
    </span>
  );
}
