/**
 * Meridian — ActivityFeed + ActivityFeedItem
 *
 * Chronological event stream. Each entry gets a tonal icon ring, a
 * title, a body, and an optional timestamp/actor row. Used by:
 *   - Dashboard cross-role activity
 *   - Project Detail timeline
 *   - Review Detail audit timeline
 *   - Reviewer recent validations
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const iconRingVariants = cva(
  "inline-flex h-8 w-8 items-center justify-center rounded-lg ring-2 ring-surface shrink-0",
  {
    variants: {
      tone: {
        brand: "bg-brand-subtle text-brand-subtle-text",
        success: "bg-success-subtle text-success-text",
        warning: "bg-warning-subtle text-warning-text",
        error: "bg-error-subtle text-error-text",
        info: "bg-info-subtle text-info-text",
        neutral: "bg-bg-subtle text-text-secondary",
        ai: "bg-ai-highlight text-ai-text",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

interface ActivityFeedItemProps extends VariantProps<typeof iconRingVariants> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  timestamp?: React.ReactNode;
  actor?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  tone,
  icon,
  title,
  body,
  timestamp,
  actor,
  trailing,
}) => {
  return (
    <li className="px-5 py-3 flex items-start gap-3">
      {icon && <span className={iconRingVariants({ tone })}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-body text-body-sm font-semibold text-primary leading-tight">
            {title}
          </p>
          {timestamp && (
            <span className="font-body text-[10.5px] text-text-tertiary tabular-nums shrink-0">
              {timestamp}
            </span>
          )}
        </div>
        {body && (
          <p className="font-body text-[11.5px] text-text-tertiary mt-0.5 leading-snug">
            {body}
          </p>
        )}
        {actor && (
          <p className="font-body text-[10px] text-text-disabled mt-0.5 italic">
            {actor}
          </p>
        )}
      </div>
      {trailing}
    </li>
  );
};

interface ActivityFeedProps extends React.HTMLAttributes<HTMLOListElement> {
  divided?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  className,
  divided = true,
  children,
  ...props
}) => {
  return (
    <ol
      className={cn(divided && "divide-y divide-stroke-subtle", className)}
      {...props}
    >
      {children}
    </ol>
  );
};
