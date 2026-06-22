/**
 * Meridian — Breadcrumbs
 *
 * Compact navigation lineage. Renders semantic `<nav>` + `<ol>` so
 * screen readers announce trail position correctly. Items can be
 * Link-wrapped externally; this primitive is purely visual.
 */

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Render-prop for routing-aware links. */
  renderLink?: (item: BreadcrumbItem, content: React.ReactNode) => React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  renderLink,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("font-body", className)}>
      <ol className="flex items-center gap-1.5 text-body-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const inner = (
            <span
              className={cn(
                "inline-flex items-center gap-1 truncate",
                isLast ? "text-primary font-semibold" : "text-text-secondary hover:text-primary",
              )}
              aria-current={isLast ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </span>
          );
          return (
            <li key={idx} className="inline-flex items-center gap-1.5 min-w-0">
              {item.href && !isLast && renderLink ? (
                renderLink(item, inner)
              ) : item.href && !isLast ? (
                <a href={item.href}>{inner}</a>
              ) : (
                inner
              )}
              {!isLast && (
                <ChevronRight
                  aria-hidden
                  className="h-3.5 w-3.5 text-text-tertiary shrink-0"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
