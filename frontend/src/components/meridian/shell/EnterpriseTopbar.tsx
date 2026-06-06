"use client";

/**
 * Meridian — EnterpriseTopbar
 *
 * Breadcrumb-led wayfinding (Notion-style) with a compact tool strip.
 * Search is icon-triggered — opens the ⌘K command palette, not an inline field.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search } from "lucide-react";
import type { ModuleConfig, NavItem } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { Breadcrumbs } from "../navigation/Breadcrumbs";
import { Tooltip } from "../primitives/Tooltip";
import { useShell } from "./ShellContext";
import { AccountMenu } from "./AccountMenu";
import { usePageActionsValue } from "./PageActionsContext";
import { useEnterpriseTenantRoles } from "@/lib/hooks/use-enterprise-tenant-roles";
import { SHELL_HEADER_ROW_CLASS } from "./shell-chrome";
import {
  humanizePathSegment,
  resolveContributorSegmentLabel,
} from "@/lib/contributor/breadcrumb-labels";
import { resolveMentorSegmentLabel } from "@/lib/mentor/breadcrumb-labels";
import { resolveReviewerSegmentLabel } from "@/lib/reviewer/breadcrumb-labels";

interface EnterpriseTopbarProps {
  config: ModuleConfig;
  operator?: {
    name: string;
    initials: string;
    email?: string;
  };
  unreadNotifications?: number;
}

export const EnterpriseTopbar: React.FC<EnterpriseTopbarProps> = ({
  config,
  operator,
}) => {
  const pathname = usePathname() ?? "";
  const { openCommand, openMobile } = useShell();
  const pageActions = usePageActionsValue();
  const scrolled = useScrolled(4);
  const { canAccessSettings } = useEnterpriseTenantRoles();
  const crumbs = React.useMemo(
    () => buildTopbarCrumbs(pathname, config),
    [pathname, config],
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        SHELL_HEADER_ROW_CLASS,
        "gap-3 px-4 lg:px-6",
        "bg-surface",
        "transition-shadow duration-base ease-standard",
        scrolled && "shadow-[var(--shadow-xs)]",
      )}
    >
        {/* Mobile nav */}
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
          className={cn(
            "lg:hidden shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md",
            "text-text-secondary hover:text-foreground hover:bg-surface",
            "transition-colors duration-fast",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
          )}
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>

        {/* Wayfinding — single title on top-level pages, trail on deep routes */}
        <div className="flex-1 min-w-0">
          {crumbs.length === 1 ? (
            <p className="font-body text-[15px] font-semibold text-foreground tracking-[-0.02em] truncate">
              {crumbs[0].label}
            </p>
          ) : (
            <Breadcrumbs
              items={crumbs}
              className="text-[12.5px]"
              renderLink={(item, content) => (
                <Link href={item.href!} prefetch={false} className="min-w-0 truncate">
                  {content}
                </Link>
              )}
            />
          )}
        </div>

        {/* Tool strip */}
        <div className="flex items-center gap-2 shrink-0">
          {pageActions && (
            <div className="hidden md:flex items-center gap-2">{pageActions}</div>
          )}

          <span
            aria-hidden
            className="hidden sm:block h-5 w-px bg-stroke-subtle"
          />

          <Tooltip content="Search · ⌘K" side="bottom">
            <button
              type="button"
              onClick={openCommand}
              aria-label="Search or ask AI"
              aria-keyshortcuts="Meta+K Control+K"
              className={toolBtnClass}
            >
              <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          </Tooltip>

          {operator && (
            <AccountMenu
              operator={operator}
              profileHref={`${config.basePath}/profile`}
              settingsHref={`${config.basePath}/settings`}
              showSettings={
                config.id === "admin" ||
                config.id === "contributor" ||
                canAccessSettings
              }
              notificationsHref={`${config.basePath}/notifications`}
            />
          )}

          {config.cta && (
            <Link
              href={config.cta.href}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-md",
                "border border-stroke bg-surface text-foreground",
                "font-body text-[12.5px] font-semibold",
                "hover:border-stroke-strong hover:bg-surface-hover",
                "transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              <Plus className="h-3.5 w-3.5 text-brand" strokeWidth={2.25} aria-hidden />
              <span className="hidden sm:inline">{config.cta.label}</span>
            </Link>
          )}
          {config.id === "enterprise" && !config.cta && (
            <Link
              href="/enterprise/sow/intake"
              className={cn(
                "inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-md",
                "border border-stroke bg-surface text-foreground",
                "font-body text-[12.5px] font-semibold",
                "hover:border-stroke-strong hover:bg-surface-hover",
                "transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              <Plus className="h-3.5 w-3.5 text-brand" strokeWidth={2.25} aria-hidden />
              <span className="hidden sm:inline">New SOW</span>
            </Link>
          )}
        </div>
    </header>
  );
};

const toolBtnClass = cn(
  "inline-flex items-center justify-center h-8 w-8 rounded-md",
  "text-text-secondary hover:text-foreground hover:bg-surface",
  "transition-colors duration-fast",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
);

/* ─── Breadcrumb builder ─── */

function buildTopbarCrumbs(
  pathname: string,
  config: ModuleConfig,
): Array<{ label: string; href?: string }> {
  const match = findBestNavMatch(pathname, config);

  if (match) {
    const tail = pathname
      .slice(match.item.href.length)
      .split("/")
      .filter(Boolean);

    // Top-level nav page (Dashboard, SOW Workspace, etc.) — title only
    if (tail.length === 0) {
      return [{ label: match.item.label }];
    }

    const items: Array<{ label: string; href?: string }> = [
      { label: match.item.label, href: match.item.href },
    ];
    let acc = match.item.href;
    tail.forEach((seg, i) => {
      acc += `/${seg}`;
      const isLast = i === tail.length - 1;
      items.push({
        label: labelForSegment(config, acc.slice(0, acc.lastIndexOf(`/${seg}`)), seg),
        href: isLast ? undefined : acc,
      });
    });
    return items;
  }

  if (pathname === `${config.basePath}/dashboard` || pathname === config.basePath) {
    return [{ label: "Dashboard" }];
  }

  const basePrefix = `${config.basePath}/`;
  if (pathname.startsWith(basePrefix)) {
    const parts = pathname.slice(basePrefix.length).split("/").filter(Boolean);
    if (parts.length === 0) {
      return [{ label: "Dashboard" }];
    }
    const items: Array<{ label: string; href?: string }> = [];
    let acc = config.basePath;
    parts.forEach((seg, i) => {
      acc += `/${seg}`;
      items.push({
        label: labelForSegment(config, acc.slice(0, acc.lastIndexOf(`/${seg}`)), seg),
        href: i < parts.length - 1 ? acc : undefined,
      });
    });
    return items;
  }

  if (pathname === "/enterprise/dashboard") {
    return [{ label: "Dashboard" }];
  }

  const parts = pathname.replace(/^\/enterprise\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) {
    return [{ label: "Dashboard" }];
  }

  const items: Array<{ label: string; href?: string }> = [];
  let acc = "/enterprise";
  parts.forEach((seg, i) => {
    acc += `/${seg}`;
    items.push({
      label: humanizePathSegment(seg),
      href: i < parts.length - 1 ? acc : undefined,
    });
  });
  return items;
}

function labelForSegment(
  config: ModuleConfig,
  pathBefore: string,
  segment: string,
): string {
  if (config.id === "contributor") {
    const resolved = resolveContributorSegmentLabel(pathBefore, segment);
    if (resolved) return resolved;
  }
  if (config.id === "reviewer") {
    const resolved = resolveReviewerSegmentLabel(pathBefore, segment);
    if (resolved) return resolved;
  }
  if (config.id === "mentor") {
    const resolved = resolveMentorSegmentLabel(pathBefore, segment);
    if (resolved) return resolved;
  }
  return humanizePathSegment(segment);
}

function findBestNavMatch(
  pathname: string,
  config: ModuleConfig,
): { item: NavItem } | null {
  let best: { item: NavItem; len: number } | null = null;
  for (const section of config.sections) {
    for (const item of section.items) {
      const hit =
        pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (!hit) continue;
      if (!best || item.href.length > best.len) {
        best = { item, len: item.href.length };
      }
    }
  }
  return best ? { item: best.item } : null;
}

function useScrolled(threshold = 4): boolean {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}
