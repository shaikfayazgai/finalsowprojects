"use client";

/**
 * Contributor notifications workspace — inbox aligned with enterprise / admin UX.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Inbox,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/meridian";
import { NotificationsApiError } from "@/lib/api/notifications";
import type { NotificationSummary } from "@/lib/api/notifications";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from "@/lib/hooks/use-notifications";
import { cn } from "@/lib/utils/cn";
import { NotificationsSkeleton } from "./notifications-skeleton";
import {
  actionUrlAllowed,
  FILTER_TABS,
  formatExact,
  formatRelative,
  kindLabel,
  severityStyle,
  type InboxFilter,
} from "../lib/notifications-ui-utils";

function severityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return AlertTriangle;
    case "warning":
    case "important":
      return Bell;
    case "success":
      return CheckCircle2;
    default:
      return Sparkles;
  }
}

export function NotificationsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = (searchParams.get("filter") as InboxFilter | null) ?? "all";
  const category = (searchParams.get("category") ?? "all").toLowerCase();
  const CATS = ["all", "action", "update", "payment", "complaint", "security"] as const;
  const catOf = (n: NotificationSummary) => (n.category || "update").toLowerCase();

  const { data, isLoading, error, refetch, isFetching } = useMyNotifications({
    limit: 100,
    refetchInterval: 60_000,
  });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const allNotifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const criticalUnread = allNotifications.filter(
    (n) => !n.readAt && n.severity === "critical",
  ).length;

  const visible = allNotifications
    .filter((n) => filter !== "unread" || n.readAt === null)
    .filter((n) => category === "all" || catOf(n) === category);

  const setFilter = React.useCallback(
    (next: InboxFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("filter");
      else params.set("filter", next);
      const qs = params.toString();
      router.replace(
        qs ? `/contributor/notifications?${qs}` : "/contributor/notifications",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const setCategory = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("category");
      else params.set("category", next);
      const qs = params.toString();
      router.replace(
        qs ? `/contributor/notifications?${qs}` : "/contributor/notifications",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  if (isLoading && !data) {
    return <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Notifications
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Task assignments, revision requests, payouts, mentorship reminders, and credentials —
          events that need your attention.
        </p>
      </header>

      <OverviewCard
        total={allNotifications.length}
        unread={unreadCount}
        criticalUnread={criticalUnread}
        loading={isLoading}
      />

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <nav aria-label="Notification filters" className="flex flex-wrap gap-x-1 -mb-px">
              {FILTER_TABS.map((tab) => {
                const active = filter === tab.key;
                const count = tab.key === "unread" ? unreadCount : allNotifications.length;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                      "font-body text-[13px] font-medium whitespace-nowrap",
                      active ? "text-foreground" : "text-text-secondary",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full font-body text-[10px] font-semibold tabular-nums",
                        active
                          ? "bg-brand-subtle text-brand-subtle-text"
                          : tab.key === "unread" && count > 0
                            ? "bg-error-subtle text-error-text"
                            : "border border-stroke-subtle text-text-tertiary",
                      )}
                    >
                      {count}
                    </span>
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
                  "border border-stroke bg-surface font-body text-[12px] font-semibold text-foreground",
                  "hover:bg-surface-hover transition-colors duration-fast",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                  strokeWidth={2}
                  aria-hidden
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || unreadCount === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
                  "font-body text-[12px] font-semibold",
                  unreadCount > 0
                    ? "bg-brand text-[var(--color-on-primary)] hover:bg-brand-hover transition-colors duration-fast"
                    : "border border-stroke-subtle text-text-tertiary cursor-not-allowed",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Mark all read
              </button>
            </div>
          </div>
        </div>

        {/* Category filter — Action / Update / Payment / Complaint / Security */}
        <nav
          aria-label="Filter by category"
          className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 border-b border-stroke-subtle"
        >
          {CATS.map((c) => {
            const active = category === c;
            const count =
              c === "all"
                ? allNotifications.length
                : allNotifications.filter((n) => catOf(n) === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full font-body text-[12px] font-semibold transition-colors",
                  active
                    ? "bg-brand text-[var(--color-on-primary)]"
                    : "border border-stroke text-text-secondary hover:bg-bg-subtle",
                )}
              >
                {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                <span className={cn("tabular-nums text-[10px]", active ? "opacity-90" : "text-text-tertiary")}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <div aria-label="Notification list">
          {isLoading && <ListSkeleton />}
          {error && <ListError error={error} onRetry={() => void refetch()} />}
          {!isLoading && !error && visible.length === 0 && (
            <EmptyState unreadOnly={filter === "unread"} />
          )}
          {!isLoading && !error && visible.length > 0 && (
            <ul className="divide-y divide-stroke-subtle">
              {visible.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => markRead.mutate(notification.id)}
                  marking={markRead.isPending && markRead.variables === notification.id}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function OverviewCard({
  total,
  unread,
  criticalUnread,
  loading,
}: {
  total: number;
  unread: number;
  criticalUnread: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle">
        <div className="flex items-start gap-3 px-5 py-4 min-w-0 flex-1">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
            <Inbox className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground">Your inbox</p>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Click a row to open the related task, credential, or payout record
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 sm:w-[300px] shrink-0 divide-x divide-stroke-subtle">
          <Stat label="Total" value={loading ? "—" : String(total)} />
          <Stat label="Unread" value={loading ? "—" : String(unread)} highlight={unread > 0} />
          <Stat
            label="Critical"
            value={loading ? "—" : String(criticalUnread)}
            highlight={criticalUnread > 0}
            tone="error"
          />
        </dl>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  tone = "brand",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "brand" | "error";
}) {
  return (
    <div className="px-3 py-3 text-center">
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[18px] font-semibold tabular-nums",
          highlight
            ? tone === "error"
              ? "text-error-text"
              : "text-brand"
            : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  marking,
}: {
  notification: NotificationSummary;
  onMarkRead: () => void;
  marking: boolean;
}) {
  const style = severityStyle(notification.severity);
  const Icon = severityIcon(notification.severity);
  const unread = notification.readAt === null;
  const showAction =
    notification.actionUrl && actionUrlAllowed(notification.actionUrl);

  return (
    <li className="flex items-start gap-3 px-5 py-4 min-h-[72px] hover:bg-bg-subtle/60 transition-colors duration-fast">
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border shrink-0 mt-0.5",
          style.iconWrap,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full font-body text-[10px] font-semibold",
              style.pill,
            )}
          >
            {kindLabel(notification.kind)}
          </span>
          {unread && (
            <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-text font-body text-[10px] font-semibold">
              Unread
            </span>
          )}
        </div>

        <p
          className={cn(
            "mt-1.5 font-body text-[13.5px] leading-snug",
            unread ? "font-semibold text-foreground" : "font-medium text-text-secondary",
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-relaxed line-clamp-2">
          {notification.body}
        </p>
        <p
          className="mt-1.5 font-body text-[11px] text-text-tertiary tabular-nums"
          title={formatExact(notification.dispatchedAt)}
        >
          {formatRelative(notification.dispatchedAt)}
          {notification.channels.length > 0 && (
            <span className="text-text-disabled"> · {notification.channels.join(" · ")}</span>
          )}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
        {showAction && (
          <Link
            href={notification.actionUrl!}
            className={cn(
              "inline-flex items-center gap-1 h-8 px-2.5 rounded-md",
              "border border-stroke bg-surface font-body text-[11.5px] font-semibold text-foreground",
              "hover:bg-surface-hover transition-colors duration-fast",
            )}
          >
            {notification.actionLabel ?? "Open"}
            <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </Link>
        )}
        {unread && (
          <button
            type="button"
            onClick={onMarkRead}
            disabled={marking}
            className={cn(
              "font-body text-[11px] font-semibold text-text-secondary",
              "hover:text-foreground transition-colors duration-fast",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {marking ? "Saving…" : "Mark read"}
          </button>
        )}
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-stroke-subtle">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md shrink-0" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle text-text-tertiary">
        <Inbox className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <p className="mt-3 font-body text-[14px] font-semibold text-foreground">
        {unreadOnly ? "All caught up" : "No notifications yet"}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {unreadOnly
          ? "You've read everything in your inbox."
          : "Task updates, payouts, and credential events will appear here as they happen."}
      </p>
    </div>
  );
}

function ListError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isAuth = error instanceof NotificationsApiError && error.status === 401;
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-body text-[12.5px] text-error-text">
        {isAuth
          ? "Your session is no longer valid. Sign in again."
          : "Couldn't load notifications."}
      </p>
      {!isAuth && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
            "border border-stroke bg-surface font-body text-[12px] font-semibold text-foreground",
            "hover:bg-surface-hover transition-colors duration-fast",
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}
