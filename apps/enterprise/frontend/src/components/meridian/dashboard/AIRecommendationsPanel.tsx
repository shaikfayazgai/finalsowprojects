"use client";

/**
 * Meridian — AIRecommendationsPanel
 *
 * Unified sidebar card for AI-suggested next steps.
 * Matches Attention queue · one surface, compact linked rows.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  href: string;
}

interface AIRecommendationsPanelProps {
  items: AIRecommendation[];
  className?: string;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({
  items,
  className,
}) => {
  if (items.length === 0) return null;

  return (
    <section
      aria-label="AI recommendations"
      className={cn(
        "rounded-xl border border-stroke-subtle bg-surface overflow-hidden",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-stroke-subtle">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            aria-hidden
            className="grid place-items-center h-8 w-8 rounded-lg shrink-0 bg-brand-secondary-subtle text-brand-secondary-subtle-text"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em] leading-tight">
              AI recommendations
            </h2>
            <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-snug">
              Next best actions from your queue data
            </p>
          </div>
        </div>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-text-tertiary shrink-0 pt-1">
          {items.length}
        </span>
      </header>

      <ul role="list" className="divide-y divide-stroke-subtle">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "block px-5 py-3.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-body text-[13px] font-medium text-foreground leading-snug">
                  {item.title}
                </p>
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </div>
              <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
