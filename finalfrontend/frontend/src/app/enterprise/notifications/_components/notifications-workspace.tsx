"use client";

/**
 * Enterprise notifications workspace — inbox with URL-synced filters.
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
import { ACCENT_TEXT, AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { Chip, TONE, type Tone, ghostBtnClass, primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";

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
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Notifications
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          SOW approvals, payouts, reviews, compliance, and security events that need your attention.
        </p>
        <RecordLinks />
      </header>

      <OverviewCard
        total={allNotifications.length}
        unread={unreadCount}
        criticalUnread={criticalUnread}
        loading={isLoading}
      />

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 pt-4 pb-0 border-b border-white/55">
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
                          ? "bg-white/70"
                          : tab.key === "unread" && count > 0
                            ? "bg-error-subtle text-error-text"
                            : "border border-white/55 bg-white/40 text-text-tertiary",
                      )}
                      style={active ? { color: TONE.ai.text } : undefined}
                    >
                      {count}
                    </span>
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                        style={{ backgroundImage: AURORA_ACCENT }}
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
                className={ghostBtnClass}
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
        </div>

        <div aria-label="Notification list">
          {isLoading && <ListSkeleton />}
          {error && (
            <ListError error={error} onRetry={() => void refetch()} />
          )}
          {!isLoading && !error && visible.length === 0 && (
            <EmptyState unreadOnly={filter === "unread"} />
          )}
          {!isLoading && !error && visible.length > 0 && (
            <ul className="divide-y divide-white/60">
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
    <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-white/60">
        <div className="flex items-start gap-3 px-5 py-4 min-w-0 flex-1">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0"
            style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 10px 22px -12px rgba(108,76,230,0.6)" }}
          >
            <Inbox className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground">Your inbox</p>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Click a row to open the related SOW, project, or billing record
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 sm:w-[300px] shrink-0 divide-x divide-white/60">
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
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 font-display text-[18px] font-semibold tabular-nums",
          highlight ? (tone === "error" ? "text-error-text" : "") : "text-foreground",
        )}
        style={highlight && tone !== "error" ? ACCENT_TEXT : undefined}
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
  const Icon = style.icon;
  const unread = notification.readAt === null;

  return (
    <li
      className={cn(
        "relative flex items-start gap-3 px-5 py-4 min-h-[72px] transition-colors duration-fast",
        unread ? "bg-white/40 hover:bg-white/50" : "hover:bg-white/40",
      )}
    >
      {unread && (
        <span
          aria-hidden
          className="absolute left-0 w-[3px] self-stretch rounded-full"
          style={{ backgroundImage: AURORA_ACCENT }}
        />
      )}
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur shrink-0 mt-0.5"
        style={{
          borderColor: TONE[style.tone].border,
          color: TONE[style.tone].text,
          background: TONE[style.tone].soft,
        }}
      >
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
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
        {notification.actionUrl && (
          <Link
            href={notification.actionUrl}
            className={cn(
              "inline-flex items-center gap-1 h-8 px-2.5 rounded-xl",
              "border border-white/70 bg-white/55 backdrop-blur font-body text-[11.5px] font-semibold text-foreground",
              "hover:bg-white/75 transition-colors duration-fast",
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
              "font-body text-[11px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast",
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
    <ul className="divide-y divide-white/60">
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
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/55 bg-white/40 text-text-tertiary">
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
          className={cn(ghostBtnClass, "mt-3")}
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
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Profile
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/dashboard"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Dashboard
      </Link>
    </p>
  );
}
