/**
 * Meridian — AIConfidenceBadge
 *
 * "High confidence" / "Medium confidence" / "Light confidence" chip
 * the platform pairs with every AI signal. Never paired with raw
 * percentages — confidence is bucketed, deliberately.
 */

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export type AIConfidence = "high" | "medium" | "low";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-body font-semibold tracking-wide whitespace-nowrap",
  {
    variants: {
      confidence: {
        high: "border-ai-border bg-ai-highlight text-ai-text",
        medium: "border-stroke bg-bg-subtle text-text-secondary",
        low: "border-stroke-subtle bg-bg-subtle text-text-tertiary",
      },
    },
  },
);

const labels: Record<AIConfidence, string> = {
  high: "High confidence",
  medium: "Medium",
  low: "Light",
};

interface AIConfidenceBadgeProps {
  confidence: AIConfidence;
  className?: string;
}

export const AIConfidenceBadge: React.FC<AIConfidenceBadgeProps> = ({
  confidence,
  className,
}) => {
  return (
    <span
      className={cn(badgeVariants({ confidence }), className)}
      aria-label={`AI ${labels[confidence]}`}
    >
      {labels[confidence]}
    </span>
  );
};
