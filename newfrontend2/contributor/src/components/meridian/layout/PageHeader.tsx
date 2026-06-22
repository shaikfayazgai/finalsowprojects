/**
 * Meridian — PageHeader (Azure · semantic-token only)
 *
 * The visual entry point of every operational page. All colors come
 * from semantic tokens that resolve to Azure values in the active
 * theme. No primitive (--c-*) references, no raw Tailwind colors.
 *
 * Anatomy:
 *
 *   ┌─[40 icon] EYEBROW                              [⋯] [Action]┐
 *   │           Page Title  [status pill]                        │
 *   │           Optional subtitle line                            │
 *   │                                                             │
 *   │ [chip] [chip] [chip]                                       │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ [Tab] [Tab] [Tab]                                          │  ← optional sub-nav
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ KPI / filter strip (meta slot)                             │  ← optional
 *   └─────────────────────────────────────────────────────────────┘
 *                            ↓ 24px ↓
 *                        body sections
 *
 * Visual signatures:
 *   - 40px brand-filled ICON TILE on the left — resolves to the
 *     active theme's primary color (cobalt blue under Azure Day).
 *   - Brand-tone eyebrow accent — `text-text-link` reads as the
 *     primary action color.
 *   - Tab underline rail uses `bg-brand` so it tracks the brand
 *     pivot automatically.
 */

import * as React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderTab {
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  /** Optional Lucide icon — rendered in a 40px brand tile to the left. */
  icon?: LucideIcon;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Inline node rendered next to the title (e.g., status pill). */
  status?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Sub-navigation tabs with active underline rail. */
  tabs?: PageHeaderTab[];
  /** Context badges below the title block. */
  chips?: React.ReactNode;
  /** KPI / filter strip at the bottom of the header. */
  meta?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  eyebrow,
  title,
  status,
  subtitle,
  actions,
  tabs,
  chips,
  meta,
  className,
}) => {
  const hasTabs = tabs && tabs.length > 0;
  const hasMeta = Boolean(meta);
  return (
    <header
      className={cn(
        "border-b border-stroke-subtle",
        className,
      )}
    >
      {/* ── Identity row ─────────────────────────────────────── */}
      <div className="flex items-start gap-4 pb-6">
        {Icon && (
          <span
            aria-hidden
            className={cn(
              "shrink-0 grid place-items-center h-11 w-11 rounded-xl mt-1",
              "bg-surface-inverse text-text-inverse",
            )}
          >
            <Icon className="h-[20px] w-[20px]" strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p
              className={cn(
                "font-body text-[11px] font-bold uppercase tracking-[0.14em]",
                "text-text-tertiary mb-2",
              )}
            >
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1
              className={cn(
                "font-body text-[28px] sm:text-[32px] font-semibold leading-[1.1] tracking-[-0.02em]",
                "text-foreground",
              )}
            >
              {title}
            </h1>
            {status && (
              <span className="inline-flex items-center shrink-0">
                {status}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={cn(
                "font-body text-[14px] leading-relaxed mt-2.5 max-w-2xl",
                "text-text-secondary",
              )}
            >
              {subtitle}
            </p>
          )}
          {chips && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {chips}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 mt-2">{actions}</div>
        )}
      </div>

      {/* ── Sub-navigation tabs ─────────────────────────────── */}
      {hasTabs && (
        <nav
          aria-label="Page sections"
          className="-mx-1 overflow-x-auto"
        >
          <ul className="flex items-center gap-0.5 px-1 min-w-max">
            {tabs!.map((tab) => (
              <li key={tab.href}>
                <PageHeaderTabLink tab={tab} />
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* ── KPI / filter meta strip ─────────────────────────── */}
      {hasMeta && (
        <div
          className={cn(
            "py-4",
            hasTabs && "border-t border-stroke-subtle",
          )}
        >
          {meta}
        </div>
      )}
    </header>
  );
};

/* ─────────────────────── Tab link ─────────────────────── */

const PageHeaderTabLink: React.FC<{ tab: PageHeaderTab }> = ({ tab }) => {
  const TabIcon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={tab.active ? "page" : undefined}
      className={cn(
        "group relative inline-flex items-center gap-1.5 h-10 px-3",
        "font-body text-[12.5px]",
        "transition-colors duration-fast ease-standard",
        "focus-visible:outline-none focus-visible:bg-surface-hover rounded-md",
        tab.active
          ? "text-foreground font-semibold"
          : "text-text-secondary hover:text-foreground",
      )}
    >
      {TabIcon && (
        <TabIcon
          className={cn(
            "h-3.5 w-3.5",
            tab.active
              ? "text-foreground"
              : "text-text-tertiary group-hover:text-text-secondary",
          )}
          strokeWidth={2}
          aria-hidden
        />
      )}
      <span>{tab.label}</span>
      {tab.badge !== undefined && (
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-sm",
            "font-body text-[9.5px] font-bold tabular-nums",
            tab.active
              ? "bg-surface-inverse text-text-inverse"
              : "bg-surface-sunken text-text-tertiary group-hover:text-text-secondary",
          )}
        >
          {tab.badge}
        </span>
      )}
      {/* Active underline rail — sits on the header's bottom border */}
      {tab.active && (
        <span
          aria-hidden
          className="absolute left-2 right-2 -bottom-px h-[2px] rounded-t-sm bg-surface-inverse"
        />
      )}
    </Link>
  );
};
