"use client";

/**
 * Enterprise notifications workspace — inbox with URL-synced filters.
 *
 * USE-CASE: Enterprise operator needs to monitor SOW approvals, payouts,
 * reviews, compliance, and security events that need attention.
 *
 * HEURISTIC EVAL:
 * H1 (Visibility): Old GLASS_CARD hide-behind opacity obscures state; unread
 *   accent line was the only status signal. Need a DASH_CARD surface that
 *   stays readable at all states.
 * H6 (Recognition): ghostBtnClass had glass-backdrop that became invisible on
 *   solid bg. Replace with secondaryBtnClass.
 * H7 (Flexibility): Filter pills had underline-tab nav (glass-only pattern).
 *   Replace with gradient-pill pattern from exemplar (reviewer-history).
 * H8 (Minimalist): divide-white/60 and bg-white/40 unread rows need solid
 *   equivalents: divide-stroke-subtle, bg-brand-subtle for unread.
 *
 * LAYOUT: DASH_CARD shell + gradient-pill filter row + date-grouped feed.
 * Unread emphasis: left accent bar (gradient) + bg-brand-subtle row + bold title.
 * Action links: secondaryBtnClass-style solid pill.
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
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, TONE, type Tone, primaryBtnClass, primaryStyle, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";

type InboxFilter = "all" | "unread";

const FILTER_TABS: Array<{ key: InboxFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

const KIND_LABELS: Record<string, string> = {
  "auth.password_changed": "Password changed",
  "auth.mfa_setup_required": "MFA setup required",
  "auth.session_revoked": "Session revoked",
  "task.assigned": "Task assigned",
  "review.queued": "Review queue",
  "review.assigned": "Review assigned",
  "review.sla_warning": "SLA warning",
  "review.sla_breach": "SLA breach",
  "payout.eligible": "Payout eligible",
  "payout.batch_sent": "Payout sent",
  "payout.failed": "Payout failed",
  "invoice.due": "Invoice due",
  "sow.approved": "SOW approved",
  "sow.rejected": "SOW rejected",
  "sow.stage_advanced": "SOW stage",
  "sow.stage_changed": "SOW stage",
  "compliance.consent_missing": "Compliance",
  "project.at_risk": "Project at risk",
  "rate_card.activated": "Rate card",
  "mentor.decision": "Mentor decision",
  "audit.export_ready": "Audit export",
  "settings.integration": "Integration",
  "billing.cycle_close": "Billing cycle",
  "security.session": "Security",
  "governance.case_assigned": "Governance",
  "system.generic": "System",
};

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replace(/\./g, " · ");
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
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function groupByDay(rows: NotificationSummary[]) {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime(),
  );
  const groups: Array<{ key: number; label: string; items: NotificationSummary[] }> = [];
  for (const row of sorted) {
    const key = startOfDay(new Date(row.dispatchedAt));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(row);
    else groups.push({ key, label: dayLabel(row.dispatchedAt), items: [row] });
  }
  return groups;
}

function severityStyle(severity: string): { icon: typeof AlertTriangle; tone: Tone } {
  switch (severity) {
    case "critical":
      return { icon: AlertTriangle, tone: "error" };
    case "warning":
      return { icon: Bell, tone: "warning" };
    case "success":
      return { icon: CheckCircle2, tone: "success" };
    default:
      return { icon: Sparkles, tone: "neutral" };
  }
}

export function NotificationsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filter = (searchParams.get("filter") as InboxFilter | null) ?? "all";

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

  const visible =
    filter === "unread"
      ? allNotifications.filter((n) => n.readAt === null)
      : allNotifications;

  const groups = React.useMemo(() => groupByDay(visible), [visible]);

  const setFilter = React.useCallback(
    (next: InboxFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("filter");
      else params.set("filter", next);
      const qs = params.toString();
      router.replace(
        qs ? `/enterprise/notifications?${qs}` : "/enterprise/notifications",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Notifications
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Notifications
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          SOW approvals, payouts, reviews, compliance, and security events that need your attention.
        </p>
        <RecordLinks />
      </header>

      {/* KPI band */}
      <section aria-label="Inbox summary" className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={isLoading ? "—" : String(allNotifications.length)} icon={Inbox} />
        <StatCard
          label="Unread"
          value={isLoading ? "—" : String(unreadCount)}
          hintTone={unreadCount > 0 ? "warning" : "neutral"}
          hint={unreadCount > 0 ? "need attention" : undefined}
        />
        <StatCard
          label="Critical unread"
          value={isLoading ? "—" : String(criticalUnread)}
          hintTone={criticalUnread > 0 ? "error" : "neutral"}
          hint={criticalUnread > 0 ? "act now" : undefined}
        />
      </section>

      {/* Feed */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Toolbar */}
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Notification filters" className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.key;
              const count = tab.key === "unread" ? unreadCount : allNotifications.length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className={secondaryBtnClass}
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
              className={primaryBtnClass}
              style={primaryStyle}
            >
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Mark all read
            </button>
          </div>
        </div>

        <div aria-label="Notification list" className="px-5 sm:px-6 py-5">
          {isLoading && <ListSkeleton />}
          {error && (
            <ListError error={error} onRetry={() => void refetch()} />
          )}
          {!isLoading && !error && visible.length === 0 && (
            <EmptyState unreadOnly={filter === "unread"} />
          )}
          {!isLoading && !error && groups.length > 0 && (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-3">
                    {g.label}
                  </p>
                  <ul className="space-y-1 divide-y divide-stroke-subtle border border-stroke-subtle rounded-lg overflow-hidden">
                    {g.items.map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        onMarkRead={() => markRead.mutate(notification.id)}
                        marking={markRead.isPending && markRead.variables === notification.id}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  const Icon = style.icon;
  const unread = notification.readAt === null;

  return (
    <li
      className={cn(
        "relative flex items-start gap-3 px-4 py-3.5 min-h-[68px] transition-colors duration-fast",
        unread ? "bg-brand-subtle hover:bg-bg-subtle" : "hover:bg-bg-subtle/60",
      )}
    >
      {unread && (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
          style={{ backgroundImage: "linear-gradient(180deg, var(--c-violet-500) 0%, var(--c-blue-500) 100%)" }}
        />
      )}
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 mt-0.5"
        style={{
          borderColor: TONE[style.tone].border,
          color: TONE[style.tone].text,
          background: TONE[style.tone].soft,
        }}
      >
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={style.tone} dot={false}>
            {kindLabel(notification.kind)}
          </Chip>
          {unread && (
            <Chip tone="ai" dot={false}>
              Unread
            </Chip>
          )}
        </div>

        <p
          className={cn(
            "mt-1.5 font-body text-[13px] leading-snug",
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
        {notification.actionUrl && (
          <Link
            href={notification.actionUrl}
            className={cn(
              secondaryBtnClass,
              "h-8 px-2.5 text-[11.5px]",
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
            className="font-body text-[11px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <div className="py-12 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-bg-subtle text-text-tertiary">
        <Inbox className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <p className="mt-3 font-body text-[14px] font-semibold text-foreground">
        {unreadOnly ? "All caught up" : "No notifications yet"}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {unreadOnly
          ? "You've read everything in your inbox."
          : "Consequential workspace events will appear here as they happen."}
      </p>
    </div>
  );
}

function ListError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const isAuth = error instanceof NotificationsApiError && error.status === 401;
  return (
    <div className="py-10 text-center">
      <p className="font-body text-[12.5px] text-error-text">
        {isAuth
          ? "Your session is no longer valid. Sign in again."
          : "Couldn't load notifications."}
      </p>
      {!isAuth && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(secondaryBtnClass, "mt-3")}
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/profile"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Profile
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/dashboard"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Dashboard
      </Link>
    </p>
  );
}
