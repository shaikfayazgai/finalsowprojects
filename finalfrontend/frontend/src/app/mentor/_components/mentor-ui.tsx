"use client";

/**
 * Mentor portal — shared Meridian V2 layout primitives.
 * Matches enterprise / platform admin patterns (Azure Day theme).
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const MENTOR_PAGE = "space-y-5 pb-12 animate-fade-in";

export function MentorPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(MENTOR_PAGE, className)}>{children}</div>;
}

/** Lightweight back control — topbar owns the breadcrumb trail. */
export function MentorBackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      {children}
    </Link>
  );
}

export function MentorPageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
  actions,
}: {
  /** Contextual record label (e.g. "Review · Round 2") — omit on list pages. */
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 font-body text-[12.5px] text-text-secondary leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
        {meta && <div className="mt-1 font-body text-[12.5px] text-text-secondary">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

type BannerTone = "error" | "warning" | "brand";

const BANNER_TONE: Record<BannerTone, string> = {
  error: "border-error-border bg-error-subtle text-error-text",
  warning: "border-warning-border bg-warning-subtle text-warning-text",
  brand: "border-brand/30 bg-brand-subtle/20 text-foreground",
};

export function MentorBanner({
  tone,
  icon,
  children,
}: {
  tone: BannerTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 flex items-start gap-2.5 font-body text-[12.5px]",
        BANNER_TONE[tone],
      )}
    >
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function MentorFilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center h-7 px-3 rounded-full font-body text-[11.5px] font-semibold transition-colors duration-fast",
        selected
          ? "bg-brand text-on-brand border border-brand shadow-xs"
          : "bg-surface border border-stroke-subtle text-foreground hover:border-stroke hover:bg-brand-subtle/25",
      )}
    >
      {children}
    </button>
  );
}

/** Underline scope tabs — brand accent (enterprise reviewer / compliance pattern). */
export function MentorScopeTabs<T extends string>({
  tabs,
  active,
  onChange,
  counts,
  warnWhenCountKeys,
  "aria-label": ariaLabel = "Filter list",
}: {
  tabs: Array<{ key: T; label: string }>;
  active: T;
  onChange: (key: T) => void;
  counts?: Partial<Record<T, number>>;
  /** Inactive tab count uses warning color when count &gt; 0 (e.g. SLA risk). */
  warnWhenCountKeys?: T[];
  "aria-label"?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-x-1 -mb-px">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-2.5",
              "font-body text-[13px] font-medium whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
              isActive ? "text-foreground" : "text-text-secondary",
            )}
          >
            {tab.label}
            {count !== undefined && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                  !isActive &&
                    warnWhenCountKeys?.includes(tab.key) &&
                    count > 0 &&
                    "text-warning-text",
                )}
              >
                {count}
              </span>
            )}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function MentorListPanel({
  title,
  description,
  headerExtra,
  footer,
  empty,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  empty?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      {(title || headerExtra) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-stroke-subtle">
          <div className="min-w-0">
            {title && (
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{description}</p>
            )}
          </div>
          {headerExtra}
        </header>
      )}
      {empty ?? (
        <ul className="divide-y divide-stroke-subtle">{children}</ul>
      )}
      {footer && (
        <footer className="px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40">{footer}</footer>
      )}
    </section>
  );
}

export function MentorListRow({
  href,
  onClick,
  title,
  meta,
  trailing,
  unread,
  leading,
}: {
  href?: string;
  onClick?: () => void;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  unread?: boolean;
  leading?: React.ReactNode;
}) {
  const cls = cn(
    "flex items-center gap-3 px-5 py-3 min-h-[52px] transition-colors duration-fast",
    (href || onClick) && "hover:bg-bg-subtle/60",
    unread && "bg-brand-subtle/15",
  );

  const inner = (
    <>
      {leading}
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13px] font-medium text-foreground truncate">{title}</p>
        {meta && (
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary truncate">{meta}</p>
        )}
      </div>
      {trailing}
      {href && (
        <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      )}
      {unread && !trailing && (
        <span aria-hidden className="h-2 w-2 rounded-full bg-brand shrink-0" />
      )}
    </>
  );

  if (href) {
    return (
      <li>
        <Link href={href} className={cls}>
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onClick} className={cn(cls, "w-full text-left")}>
        {inner}
      </button>
    </li>
  );
}

export function MentorGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-2 bg-bg-subtle/80 border-b border-stroke-subtle">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {children}
      </p>
    </div>
  );
}

export const mentorPrimaryBtn = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
);

export const mentorSecondaryBtn = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export const mentorGhostLink = cn(
  "font-body text-[12px] font-semibold text-text-link hover:underline underline-offset-2",
);

export function MentorMetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "danger";
}) {
  return (
    <div className="px-5 py-4">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-display text-[22px] font-semibold tabular-nums leading-tight tracking-[-0.02em]",
          tone === "warn" && "text-warning-text",
          tone === "danger" && "text-error-text",
          !tone && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function MentorMetricBand({
  metrics,
}: {
  metrics: Array<{ label: string; value: string; tone?: "warn" | "danger" }>;
}) {
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-stroke-subtle">
      {metrics.map((m) => (
        <MentorMetricTile key={m.label} {...m} />
      ))}
    </dl>
  );
}

export function MentorSettingsIndex({
  rows,
}: {
  rows: Array<{
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    title: string;
    detail: string;
  }>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className={cn(
            "group rounded-xl border border-stroke-subtle bg-surface p-4",
            "hover:border-stroke transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stroke-subtle text-text-secondary shrink-0"
              >
                <r.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <h2 className="font-body text-[14px] font-semibold text-foreground truncate">
                {r.title}
              </h2>
            </div>
            <ChevronRight
              className="h-3.5 w-3.5 text-text-tertiary shrink-0 group-hover:text-foreground transition-colors"
              strokeWidth={2}
              aria-hidden
            />
          </div>
          <p className="font-body text-[12.5px] text-text-secondary">{r.detail}</p>
        </Link>
      ))}
    </div>
  );
}

export function MentorFormSection({
  title,
  description,
  bordered,
  children,
}: {
  title: string;
  description?: string;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("px-5 py-5", bordered && "border-t border-stroke-subtle")}>
      <header className="mb-4">
        <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}

export const mentorFieldLabel =
  "block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5";

export const mentorInputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke bg-surface",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

export const mentorTextareaCls = cn(
  mentorInputCls,
  "h-auto py-2.5 resize-y min-h-[88px]",
);
