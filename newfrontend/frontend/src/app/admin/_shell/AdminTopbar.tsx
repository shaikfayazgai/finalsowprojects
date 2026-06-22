"use client";

/**
 * Admin topbar — contextual wayfinding, search, account.
 * Stays out of the way; page content carries the workflow.
 */

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import type { ModuleConfig } from "@/lib/config/navigation";
import { cn } from "@/lib/utils/cn";
import { useShell } from "@/components/meridian/shell/ShellContext";
import { AccountMenu } from "@/components/meridian/shell/AccountMenu";
import { NotificationBellMenu } from "@/components/layout/notification-bell-menu";
import { usePageActionsValue } from "@/components/meridian/shell/PageActionsContext";
import { activeNavItem, humanizeSegment } from "./nav-utils";
import { GLASS_BAR, GLASS_BAR_SHADOW } from "./aurora";

interface Operator {
  name: string;
  initials: string;
  email?: string;
}

export function AdminTopbar({ config, operator }: { config: ModuleConfig; operator?: Operator }) {
  const pathname = usePathname() ?? "";
  const { openCommand, openMobile } = useShell();
  const pageActions = usePageActionsValue();

  const { title, tail, isDashboard } = React.useMemo(() => {
    const item = activeNavItem(pathname, config);
    const dash = pathname === `${config.basePath}/dashboard` || pathname === `${config.basePath}/dashboard/`;
    if (!item) return { title: "Operations", tail: [] as string[], isDashboard: dash };
    const rest = pathname.slice(item.href.length).split("/").filter(Boolean).map(humanizeSegment);
    return { title: item.label, tail: rest, isDashboard: dash };
  }, [pathname, config]);

  return (
    <header className={cn("sticky top-0 z-header", GLASS_BAR)} style={GLASS_BAR_SHADOW}>
      <div className="flex items-center gap-3 h-[52px] px-4 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
          className="lg:hidden shrink-0 grid place-items-center h-9 w-9 rounded-lg text-text-secondary hover:text-foreground hover:bg-bg-subtle transition-colors"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>

        <nav aria-label="Breadcrumb" className="flex-1 min-w-0 flex items-center gap-1.5">
          {!isDashboard && (
            <Link
              href={`${config.basePath}/dashboard`}
              className="hidden sm:inline font-body text-[12px] font-medium text-text-tertiary hover:text-foreground transition-colors shrink-0"
            >
              Home
            </Link>
          )}
          {!isDashboard && (
            <span aria-hidden className="hidden sm:inline text-text-disabled text-[12px]">
              /
            </span>
          )}
          <div className="min-w-0 flex items-baseline gap-2">
            <span className="font-body text-[14px] font-semibold text-foreground truncate">
              {isDashboard ? "Today" : title}
            </span>
            {tail.length > 0 && (
              <span className="hidden md:flex items-baseline gap-1.5 min-w-0">
                {tail.map((seg, i) => (
                  <React.Fragment key={i}>
                    <span aria-hidden className="text-text-disabled">/</span>
                    <span className="font-body text-[12px] text-text-tertiary truncate">{seg}</span>
                  </React.Fragment>
                ))}
              </span>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {pageActions && <div className="hidden md:flex items-center gap-2">{pageActions}</div>}

          <button
            type="button"
            onClick={openCommand}
            aria-label="Search or jump to page"
            aria-keyshortcuts="Meta+K Control+K"
            className={cn(
              "group hidden sm:inline-flex items-center gap-2 h-8 rounded-lg transition-colors",
              "border border-stroke-subtle bg-bg-subtle hover:border-stroke",
              "pl-2.5 pr-2 min-w-[200px]",
            )}
          >
            <Search className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
            <span className="flex-1 text-left font-body text-[12px] text-text-tertiary">Jump to…</span>
            <kbd className="inline-flex items-center h-5 px-1 rounded border border-stroke-subtle bg-surface font-mono text-[10px] text-text-tertiary">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={openCommand}
            aria-label="Search"
            className="sm:hidden grid place-items-center h-9 w-9 rounded-lg text-text-secondary hover:bg-bg-subtle"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>

          {/* Standalone notification bell — sits between Search and the account
              menu, with a live 2-colour count badge (gold = unread, red = includes
              a critical item). Notifications are NO LONGER nested in the profile. */}
          <NotificationBellMenu />

          {operator && (
            <AccountMenu
              operator={operator}
              profileHref={`${config.basePath}/profile`}
              settingsHref={`${config.basePath}/settings`}
              showSettings
              signOutTo={`${config.basePath}/login`}
            />
          )}
        </div>
      </div>
    </header>
  );
}
