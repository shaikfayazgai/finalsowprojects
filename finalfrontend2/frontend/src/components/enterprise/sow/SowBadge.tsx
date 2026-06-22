"use client";

import { cn } from "@/lib/utils/cn";
import { TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

/** Maps the legacy SOW colour variants onto the Aurora semantic tones. */
const variantTone: Record<string, Tone> = {
  forest: "success",
  teal: "info",
  gold: "warning",
  brown: "ai",
  beige: "neutral",
  danger: "error",
};

export const statusVariantMap: Record<string, { label: string; variant: string }> = {
  draft: { label: "Draft", variant: "beige" },
  parsing: { label: "Parsing", variant: "teal" },
  review: { label: "In Review", variant: "teal" },
  approval: { label: "In Approval", variant: "gold" },
  approved: { label: "Approved", variant: "forest" },
  archived: { label: "Archived", variant: "beige" },
  rejected: { label: "Rejected", variant: "danger" },
  changes_requested: { label: "Changes Req.", variant: "gold" },
  pending_commercial: { label: "Commercial Review", variant: "gold" },
};

interface SowBadgeProps {
  variant: string;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SowBadge({ variant, dot, children, className }: SowBadgeProps) {
  const tone = TONE[variantTone[variant] ?? "neutral"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full border border-white/70 bg-white/65 backdrop-blur",
        className
      )}
      style={{ color: tone.text }}
    >
      {dot && <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: tone.dot }} />}
      {children}
    </span>
  );
}

/* Helpers */
export function confidenceVariant(c: number) { return c >= 90 ? "forest" : c >= 85 ? "teal" : "gold"; }
export function riskVariant(r: number) { return r <= 25 ? "forest" : r <= 50 ? "gold" : "danger"; }
