"use client";

/**
 * Meridian — ActionItemsCard
 *
 * Featured action card with violet gradient backdrop. Matches the
 * reference design — large pending count + breakdown stats + primary
 * CTA. The brand-secondary (violet) gradient signals "premium
 * orchestration attention."
 *
 *   ┌──────────────────────────────┐
 *   │ 📋 ACTION ITEMS              │
 *   │                              │
 *   │ 12  pending                  │
 *   │ Awaiting your review & sign  │
 *   │ ──────────────────────────── │
 *   │  8       3        1          │
 *   │ APPROVED REJECTED ON HOLD    │
 *   │                              │
 *   │ [    Review pending    ]     │
 *   └──────────────────────────────┘
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ActionItemsCardProps {
  pendingCount: number;
  approved: number;
  rejected: number;
  onHold: number;
  ctaHref?: string;
  ctaLabel?: string;
  subtitle?: string;
}

export const ActionItemsCard: React.FC<ActionItemsCardProps> = ({
  pendingCount,
  approved,
  rejected,
  onHold,
  ctaHref = "/enterprise/review",
  ctaLabel = "Review pending",
  subtitle = "Awaiting your review & sign-off",
}) => (
  <section
    aria-label="Action items"
    className={cn(
      "relative overflow-hidden rounded-2xl",
      "shadow-[var(--shadow-lg)]",
      "text-white",
    )}
    style={{ background: "var(--gradient-secondary)" }}
  >
    {/* subtle decorative orb */}
    <span
      aria-hidden
      className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
      style={{ background: "var(--c-violet-300)" }}
    />

    <div className="relative p-5">
      {/* Eyebrow */}
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.16em]">
          Action items
        </span>
      </div>

      {/* Pending hero */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="font-body text-[44px] font-bold leading-none tracking-[-0.02em] tabular-nums">
            {pendingCount}
          </span>
          <span className="font-body text-[15px] opacity-90">pending</span>
        </div>
        <p className="mt-2 font-body text-[12.5px] opacity-80 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-1 pb-4 mb-4 border-b border-white/20">
        <BreakdownStat value={approved} label="Approved" />
        <BreakdownStat value={rejected} label="Rejected" />
        <BreakdownStat value={onHold} label="On hold" />
      </div>

      {/* CTA */}
      <Link
        href={ctaHref}
        className={cn(
          "group flex items-center justify-center gap-1.5 w-full h-10 rounded-lg",
          "bg-white text-[var(--c-violet-700)]",
          "font-body text-[13px] font-semibold",
          "transition-all duration-fast ease-standard",
          "hover:bg-white/95 hover:gap-2.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        )}
      >
        {ctaLabel}
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-fast group-hover:translate-x-0.5"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </div>
  </section>
);

const BreakdownStat: React.FC<{ value: number; label: string }> = ({
  value,
  label,
}) => (
  <div>
    <p className="font-body text-[20px] font-bold leading-none tabular-nums">
      {value}
    </p>
    <p className="mt-1 font-body text-[10px] font-semibold uppercase tracking-[0.10em] opacity-75">
      {label}
    </p>
  </div>
);
