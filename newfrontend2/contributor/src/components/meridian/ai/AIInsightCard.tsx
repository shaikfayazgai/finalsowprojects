/**
 * Meridian — AIInsightCard
 *
 * AI-tinted card for the "summoned" insights pattern. Eyebrow uses
 * the AIGlyph + "AI · {label}" copy. Body is the insight title +
 * supporting detail. Always paired with an AIConfidenceBadge.
 */

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AIConfidenceBadge, type AIConfidence } from "./AIConfidenceBadge";

interface AIInsightCardProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body: React.ReactNode;
  confidence: AIConfidence;
  eyebrow?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  icon,
  title,
  body,
  confidence,
  eyebrow,
  trailing,
  className,
}) => {
  return (
    <article
      className={cn(
        "rounded-xl border border-stroke bg-surface px-3.5 py-3 flex items-start gap-3",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-2 ring-surface bg-ai-highlight text-ai-text shrink-0"
      >
        {icon ?? <Sparkles className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-ai-text mb-1">
                {eyebrow}
              </p>
            )}
            <p className="font-body text-body-sm font-semibold text-primary leading-tight">
              {title}
            </p>
          </div>
          <AIConfidenceBadge confidence={confidence} />
        </div>
        <p className="font-body text-[11.5px] text-text-tertiary mt-1 leading-relaxed">
          {body}
        </p>
      </div>
      {trailing}
    </article>
  );
};
