"use client";

/**
 * Activation card — "Where do you want to start?" choice screen.
 *
 * USE-CASE: After onboarding steps are complete, the enterprise user picks how
 * to enter the workspace for the first time: dashboard overview or SOW intake.
 *
 * HEURISTIC EVAL:
 * H1 (Visibility): bg-[var(--color-brand)] primary option was glass-free but
 *   ring-1 on the secondary used ring-stroke-subtle which looks correct. Keep
 *   the solid card surface, just consolidate to DASH_CARD outer + solid inner
 *   choice tiles.
 * H6 (Recognition): Choice cards already had icon + title + description pattern
 *   which is good — retain that clarity.
 * H7 (Flexibility): No change needed — 2-up grid works well.
 * H8 (Minimalist): The card itself used rounded-xl bg-surface ring-1 which is
 *   correct solid approach. Update to DASH_CARD for consistency.
 *
 * LAYOUT: DASH_CARD outer shell + two solid choice tiles (primary gradient,
 * secondary neutral). Aligns with Aurora solid system.
 */

import * as React from "react";
import { ArrowRight, FileUp, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";

interface ActivationCardProps {
  onDashboard: () => void;
  onIntake: () => void;
  isLoading?: boolean;
}

export function ActivationCard({
  onDashboard,
  onIntake,
  isLoading,
}: ActivationCardProps) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-5 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[15px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
          Where do you want to start?
        </h2>
        <p className="font-body text-[12.5px] text-text-secondary mt-1 leading-snug">
          Pick how you want to enter the workspace. You can switch between
          surfaces at any time from the sidebar.
        </p>
      </header>

      <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Primary action — gradient background */}
        <button
          type="button"
          onClick={onDashboard}
          disabled={isLoading}
          className="group text-left rounded-lg p-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 hover:shadow-[0_8px_20px_-8px_rgba(108,76,230,0.45)]"
          style={GLASS_GRADIENT}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" strokeWidth={2} aria-hidden />
            </div>
            <ArrowRight
              className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <p className="mt-3 font-body text-[14px] font-semibold text-white leading-tight">
            Take me to my dashboard
          </p>
          <p className="mt-1 font-body text-[12px] text-white/80 leading-snug">
            See attention queue, KPI band, and recent activity at a glance. Best for an overview.
          </p>
          <p className="mt-3 inline-flex items-center gap-1 font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/90">
            Recommended
          </p>
        </button>

        {/* Secondary action — neutral solid */}
        <button
          type="button"
          onClick={onIntake}
          disabled={isLoading}
          className="group text-left rounded-lg p-4 transition-all border border-stroke-subtle bg-surface hover:border-stroke hover:bg-bg-subtle hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-bg-subtle border border-stroke-subtle flex items-center justify-center">
              <FileUp className="w-4 h-4 text-foreground" strokeWidth={2} aria-hidden />
            </div>
            <ArrowRight
              className="w-4 h-4 text-text-tertiary group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <p className="mt-3 font-body text-[14px] font-semibold text-foreground leading-tight">
            Upload my first SOW
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-snug">
            Jump straight into SOW intake. Drop a signed file, compose from scratch, or generate with AI.
          </p>
          <p className="mt-3 inline-flex items-center gap-1 font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
            For doers
          </p>
        </button>
      </div>
    </section>
  );
}
