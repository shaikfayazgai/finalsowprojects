"use client";

import { cn } from "@/lib/utils/cn";

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
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
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full",
      s.bg, s.text, className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* Helpers */
export function confidenceVariant(c: number) { return c >= 90 ? "forest" : c >= 85 ? "teal" : "gold"; }
export function riskVariant(r: number) { return r <= 25 ? "forest" : r <= 50 ? "gold" : "danger"; }
