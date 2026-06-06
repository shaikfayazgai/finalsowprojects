"use client";

/**
 * Meridian — NotificationBell
 *
 * Topbar notification button with live unread count from the
 * Postgres-backed notification API. Polls every 60s by default.
 *
 * Phase 1 (this iteration): live data via `useMyNotifications`. The
 * `hasUnread` / `unreadCount` props remain accepted for tests,
 * Storybook, or any caller that wants to override the live value.
 *
 * Phase 2 will swap the poll for a websocket push (notification
 * server-side fanout) — the hook will become a subscription, the
 * component shape stays the same.
 */

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useMyNotifications } from "@/lib/hooks/use-notifications";

interface NotificationBellProps {
  href?: string;
  /** Explicit override — when provided, suppresses the live query. */
  hasUnread?: boolean;
  /** Explicit override — when provided, suppresses the live query. */
  unreadCount?: number;
  /** Pass false to opt out of polling (e.g. embedded in test harness). */
  liveData?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  href = "/enterprise/notifications",
  hasUnread: hasUnreadProp,
  unreadCount: unreadCountProp,
  liveData = true,
}) => {
  // If the caller explicitly passed values, treat those as authoritative
  // and skip the network query. Otherwise pull from the live API.
  const explicit =
    hasUnreadProp !== undefined || unreadCountProp !== undefined;

  const { data } = useMyNotifications({
    limit: 1, // we only need the count; rows discarded
    refetchInterval: 60_000,
    enabled: liveData && !explicit,
  });

  const liveCount = data?.unreadCount ?? 0;
  const unreadCount = explicit ? (unreadCountProp ?? 0) : liveCount;
  const hasUnread = explicit ? !!hasUnreadProp : liveCount > 0;

  const label = hasUnread
    ? `Notifications — ${unreadCount} unread`
    : "Notifications";

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative inline-flex items-center justify-center h-8 w-8 rounded-md",
        "text-text-secondary hover:bg-surface-hover hover:text-foreground",
        "transition-colors duration-fast ease-standard",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
      )}
    >
      <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      {hasUnread && (
        <span
          aria-hidden
          className={cn(
            "absolute top-1 right-1 inline-flex items-center justify-center",
            "h-[14px] min-w-[14px] px-1 rounded-full",
            "bg-[var(--color-error-solid)] text-white",
            "font-body text-[9px] font-bold leading-none tabular-nums",
            "ring-2 ring-surface",
          )}
        >
          {unreadCount > 9 ? "9+" : unreadCount > 0 ? unreadCount : ""}
        </span>
      )}
    </Link>
  );
};
