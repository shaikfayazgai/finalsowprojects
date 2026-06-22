/**
 * Meridian — SectionHeader
 *
 * Mid-density heading for sections inside a Card or panel. Pairs with
 * a caption + optional trailing action slot.
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  title: React.ReactNode;
  caption?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  /** Render numbered eyebrow ("01") in the Meridian editorial style. */
  number?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  caption,
  trailing,
  number,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 pb-3 border-b border-stroke-strong",
        className,
      )}
    >
      <div className="flex items-baseline gap-3 min-w-0">
        {number && (
          <span className="font-mono text-mono-sm font-semibold text-foreground border border-stroke-strong rounded-md px-2 py-[2px] shrink-0">
            {number}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-heading-lg font-semibold text-foreground leading-tight">
            {title}
          </h2>
          {caption && (
            <p className="font-body text-body-sm text-text-tertiary mt-1 leading-snug">
              {caption}
            </p>
          )}
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
};
