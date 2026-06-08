"use client";

/**
 * Shared NotificationsList — portal-agnostic body for the notifications
 * page. Mounted by /enterprise/notifications, /contributor/notifications,
 * and /mentor/notifications with identical behavior. Each portal's page
 * adds its own page header + spacing.
 *
 * Reads from `useMyNotifications` (Postgres-backed, polled every 60s).
 * Mutations via `useMarkNotificationRead` + `useMarkAllNotificationsRead`.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Inbox,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/hooks/use-notifications";
import { NotificationsApiError } from "@/lib/api/notifications";
import type { NotificationSummary } from "@/lib/api/notifications";

/* ─────────────────────────── Tone + label maps ─────────────────────── */

function severityTone(severity: string) {
  switch (severity) {
    case "critical":
      return {
        chip: "bg-error-subtle text-error-text",
        icon: AlertTriangle,
        iconTone: "text-error-text",
      };
    case "important":
      return {
        chip: "bg-warning-subtle text-warning-text",
        icon: Bell,
        iconTone: "text-warning-text",
      };
    default:
      return {
        chip: "bg-info-subtle text-info-text",
        icon: Sparkles,
        iconTone: "text-info-text",
      };
  }
}

const KIND_LABELS: Record<string, string> = {
  "auth.password_changed": "Password changed",
  "auth.mfa_setup_required": "MFA setup required",
  "auth.session_revoked": "Session revoked",
  "task.assigned": "Task assigned",
  "task.accepted": "Task accepted",
  "task.revision_requested": "Revision requested",
  "task.accepted_final": "Task accepted (final)",
  "submission.under_review": "Submission under review",
  "review.assigned": "Review assigned",
  "review.sla_warning": "Review SLA warning",
  "review.sla_breach": "Review SLA breach",
  "mentorship.session_in_30min": "Mentorship session soon",
  "mentorship.session_no_show": "Mentorship no-show",
  "payout.eligible": "Payout eligible",
  "payout.sent": "Payout sent",
  "payout.failed": "Payout failed",
  "sow.stage_changed": "SOW stage changed",
  "sow.approved": "SOW approved",
  "sow.rejected": "SOW rejected",
  "governance.case_assigned": "Governance case assigned",
  "governance.case_resolved": "Governance case resolved",
  "safety.case_received": "Safety case received",
  "kyc.approved": "KYC approved",
  "kyc.rejected": "KYC rejected",
  "system.tenant_paused": "Tenant paused",
  "system.agent_unavailable": "AI agent unavailable",
  "system.generic": "Notification",
};
function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

function formatRelative(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatExact(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/* ─────────────────────────── Component ─────────────────────────────── */

type FilterTab = "all" | "unread";

/** When set, action links outside this portal prefix are hidden. */
export type NotificationsPortalScope = "/contributor" | "/enterprise" | "/mentor" | "/admin";

function actionUrlAllowed(url: string, portalScope?: NotificationsPortalScope): boolean {
  if (!portalScope) return true;
  if (portalScope === "/contributor") {
    return url.startsWith("/contributor") || url.startsWith("/public");
  }
  if (portalScope === "/enterprise") {
    return url.startsWith("/enterprise");
  }
  if (portalScope === "/mentor") {
    return url.startsWith("/mentor") || url.startsWith("/contributor");
  }
  return true;
}

export function NotificationsList({
  portalScope,
}: {
  portalScope?: NotificationsPortalScope;
} = {}) {
  const [tab, setTab] = React.useState<FilterTab>("all");
  const { data, isLoading, error, refetch, isFetching } = useMyNotifications({
    unreadOnly: tab === "unread",
    limit: 100,
    refetchInterval: 60_000,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: NotificationSummary[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Filter notifications"
          className="flex items-center gap-1.5"
        >
          <TabButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            count={notifications.length}
          >
            All
          </TabButton>
          <TabButton
            active={tab === "unread"}
            onClick={() => setTab("unread")}
            count={unreadCount}
            tone={unreadCount > 0 ? "brand" : "neutral"}
          >
            Unread
          </TabButton>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
              "font-body text-[11.5px] font-medium text-text-secondary",
              "ring-1 ring-stroke-subtle bg-surface",
              "hover:bg-[var(--state-hover)] hover:text-foreground transition-colors",
              "disabled:opacity-50",
            )}
            aria-label="Refresh notifications"
          >
            <RefreshCw
              className={cn("h-3 w-3", isFetching && "animate-spin")}
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
              "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
              "font-body text-[11.5px] font-semibold",
              unreadCount > 0
                ? "bg-[var(--color-brand)] text-text-inverse hover:opacity-95"
                : "bg-surface ring-1 ring-stroke-subtle text-text-tertiary cursor-not-allowed",
              "transition-opacity",
            )}
          >
            <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
            Mark all read
          </button>
        </div>
      </div>

      {/* List */}
      <section
        aria-label="Notification list"
        className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden"
      >
        {isLoading && <NotificationsLoading />}
        {error && (
          <NotificationsError error={error} onRetry={() => void refetch()} />
        )}
        {!isLoading && !error && notifications.length === 0 && (
          <NotificationsEmpty unreadOnly={tab === "unread"} />
        )}
        {!isLoading && !error && notifications.length > 0 && (
          <ul className="divide-y divide-stroke-subtle">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                portalScope={portalScope}
                onMarkRead={() => markRead.mutate(n.id)}
                marking={markRead.isPending && markRead.variables === n.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────── Sub-components ────────────────────────── */

function TabButton({
  active,
  onClick,
  count,
  tone = "neutral",
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  tone?: "neutral" | "brand";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
        "font-body text-[11.5px] font-semibold transition-colors",
        active
          ? "bg-[var(--color-brand)] text-text-inverse"
          : "bg-surface ring-1 ring-stroke-subtle text-text-secondary hover:bg-[var(--state-hover)] hover:text-foreground",
      )}
    >
      {children}
      <span
        className={cn(
          "inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded font-mono text-[10px] font-bold leading-none",
          active
            ? "bg-white/20 text-text-inverse"
            : tone === "brand" && count > 0
              ? "bg-[var(--color-brand)] text-text-inverse"
              : "bg-bg-subtle text-text-tertiary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function NotificationRow({
  notification,
  portalScope,
  onMarkRead,
  marking,
}: {
  notification: NotificationSummary;
  portalScope?: NotificationsPortalScope;
  onMarkRead: () => void;
  marking: boolean;
}) {
  const tone = severityTone(notification.severity);
  const Icon = tone.icon;
  const unread = notification.readAt === null;

  return (
    <li
      className={cn(
        "px-5 py-4 flex items-start gap-4 transition-colors",
        unread ? "bg-bg/0" : "bg-bg-subtle/30",
        "hover:bg-[var(--state-hover)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "shrink-0 mt-0.5 inline-flex items-center justify-center h-8 w-8 rounded-lg",
          "bg-bg-subtle",
          tone.iconTone,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center h-[18px] px-1.5 rounded",
              "font-body text-[10px] font-bold uppercase tracking-wide leading-none",
              tone.chip,
            )}
          >
            {kindLabel(notification.kind)}
          </span>
          {unread && (
            <span
              aria-label="Unread"
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]"
            />
          )}
        </div>

        <h3
          className={cn(
            "mt-1 font-body text-[13px] leading-snug",
            unread
              ? "font-semibold text-foreground"
              : "font-medium text-text-secondary",
          )}
        >
          {notification.title}
        </h3>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-relaxed">
          {notification.body}
        </p>

        <div className="mt-2 flex items-center gap-3 flex-wrap font-body text-[11px] text-text-tertiary">
          <span
            className="tabular-nums"
            title={formatExact(notification.dispatchedAt)}
          >
            {formatRelative(notification.dispatchedAt)}
          </span>
          {notification.channels.length > 0 && (
            <span>via {notification.channels.join(" · ")}</span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2">
        {notification.actionUrl &&
          actionUrlAllowed(notification.actionUrl, portalScope) && (
          <Link
            href={notification.actionUrl}
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-md",
              "font-body text-[11px] font-semibold",
              "bg-surface ring-1 ring-stroke-subtle text-foreground",
              "hover:bg-[var(--state-hover)] transition-colors",
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
              "inline-flex items-center gap-1 h-6 px-2 rounded-md",
              "font-body text-[10.5px] font-medium text-text-tertiary",
              "hover:text-foreground hover:bg-[var(--state-hover)] transition-colors",
              "disabled:opacity-50",
            )}
          >
            Mark read
          </button>
        )}
      </div>
    </li>
  );
}

function NotificationsLoading() {
  return (
    <ul className="divide-y divide-stroke-subtle">
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          aria-hidden
          className="px-5 py-4 flex items-start gap-4 animate-pulse"
        >
          <div className="h-8 w-8 rounded-lg bg-bg-subtle" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-bg-subtle" />
            <div className="h-3 w-72 rounded bg-bg-subtle" />
            <div className="h-2.5 w-40 rounded bg-bg-subtle" />
          </div>
          <div className="h-7 w-20 rounded-md bg-bg-subtle" />
        </li>
      ))}
    </ul>
  );
}

function NotificationsEmpty({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className="px-5 py-12 text-center">
      <span
        aria-hidden
        className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-bg-subtle text-text-tertiary"
      >
        <Inbox className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="mt-3 font-body text-[13px] font-semibold text-foreground">
        {unreadOnly ? "All caught up" : "No notifications yet"}
      </p>
      <p className="mt-1 font-body text-[11.5px] text-text-tertiary">
        {unreadOnly
          ? "You've read everything in your inbox."
          : "Consequential events will appear here as they happen."}
      </p>
    </div>
  );
}

function NotificationsError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const isAuth =
    error instanceof NotificationsApiError && error.status === 401;
  return (
    <div className="px-5 py-12 text-center">
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
            "mt-2 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
            "font-body text-[11.5px] font-semibold",
            "bg-surface ring-1 ring-stroke-subtle text-text-secondary",
            "hover:bg-[var(--state-hover)] hover:text-foreground transition-colors",
          )}
        >
          <RefreshCw className="h-3 w-3" strokeWidth={2} aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}
