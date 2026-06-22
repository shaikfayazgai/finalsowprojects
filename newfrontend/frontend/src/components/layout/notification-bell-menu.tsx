"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck, AlertOctagon, Info, AlertTriangle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMyNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/lib/hooks/use-notifications";
import type { NotificationSummary } from "@/lib/api/notifications";
import { cn } from "@/lib/utils/cn";

/**
 * Top-bar notification bell with a preview popover (UI4b).
 *
 * - Polls the durable notifications API every 60s for unread count.
 * - Opening the popover surfaces the 5 most recent unread items,
 *   each with a kind/severity icon, title + truncated body, and
 *   relative timestamp.
 * - Mark-all-read fires the bulk endpoint and invalidates queries.
 * - Footer link goes to the role-appropriate /notifications page.
 *
 * Critical-severity unread items raise the badge from gold to red.
 */
function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  const days = Math.floor(diff / (24 * 60 * 60_000));
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical")
    return <AlertOctagon className="w-3.5 h-3.5 text-red-500" />;
  if (severity === "important")
    return <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />;
  return <Info className="w-3.5 h-3.5 text-teal-500" />;
}

export function NotificationBellMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";
  const [open, setOpen] = React.useState(false);

  const { data, isFetching } = useMyNotifications({
    limit: 25,
    refetchInterval: 60_000,
    enabled: isAuthenticated,
  });
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const all = data?.notifications ?? [];
  const unread = all.filter((n) => !n.readAt);
  const preview: NotificationSummary[] = unread.slice(0, 5);
  const unreadCount = data?.unreadCount ?? 0;
  const hasCritical = unread.some((n) => n.severity === "critical");
  // Dark text on the light gold badge (was white-on-gold = unreadable); white only
  // on the dark critical-red badge.
  const badgeColor = hasCritical ? "bg-red-500 text-white" : "bg-gold-500 text-gray-900";
  const display = unreadCount > 9 ? "9+" : String(unreadCount);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const notificationsHref =
    role === "contributor"
      ? "/contributor/notifications"
      : role === "mentor"
      ? "/mentor/notifications"
      : role === "admin" || role === "super_admin"
      ? "/admin/notifications"
      : "/enterprise/notifications";

  function handleItemClick(n: NotificationSummary) {
    if (!n.readAt) markOne.mutate(n.id);
    setOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
    else router.push(notificationsHref);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications, ${unreadCount} unread`}
          suppressHydrationWarning
          className="relative flex items-center justify-center w-8 h-8 rounded-full text-gray-500 bg-white/50 border border-white/30 hover:bg-white/70 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-200/40"
        >
          <Bell className="w-[14px] h-[14px]" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center",
                badgeColor,
              )}
              style={{
                boxShadow: `0 0 6px ${
                  hasCritical ? "rgba(239,68,68,0.5)" : "rgba(208,176,96,0.5)"
                }`,
              }}
            >
              {display}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] p-0 bg-white ring-1 ring-stroke-subtle shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stroke-subtle/70">
          <div>
            <div className="font-display text-[13px] font-semibold text-foreground">
              Notifications
            </div>
            <div className="font-body text-[11px] text-text-tertiary">
              {unreadCount === 0
                ? "You're all caught up"
                : `${unreadCount} unread${hasCritical ? " · includes critical" : ""}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || unreadCount === 0}
            className="inline-flex items-center gap-1 font-body text-[11.5px] text-teal-600 hover:underline disabled:text-text-tertiary disabled:no-underline disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3 h-3" />
            {markAll.isPending ? "Marking…" : "Mark all read"}
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[400px] overflow-y-auto">
          {!isAuthenticated ? (
            <div className="px-4 py-8 text-center font-body text-[12px] text-text-tertiary">
              Sign in to see notifications.
            </div>
          ) : preview.length === 0 ? (
            <div className="px-4 py-10 text-center font-body text-[12.5px] text-text-tertiary">
              {isFetching && !data ? "Loading…" : "No unread notifications."}
            </div>
          ) : (
            <ul>
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left px-4 py-3 border-b border-stroke-subtle/50 last:border-b-0 hover:bg-surface-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <SeverityIcon severity={n.severity} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-body text-[12.5px] font-semibold text-foreground truncate">
                            {n.title}
                          </div>
                          <div className="font-mono text-[10px] text-text-tertiary shrink-0">
                            {timeAgo(n.dispatchedAt)}
                          </div>
                        </div>
                        <p className="mt-0.5 font-body text-[11.5px] text-text-secondary line-clamp-2">
                          {n.body}
                        </p>
                        {n.actionLabel && (
                          <div className="mt-1 font-body text-[11px] text-teal-600">
                            {n.actionLabel} →
                          </div>
                        )}
                      </div>
                      {!n.readAt && (
                        <span
                          className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stroke-subtle/70">
          <Link
            href={notificationsHref}
            onClick={() => setOpen(false)}
            className="block w-full text-center px-4 py-2.5 font-body text-[12px] text-teal-600 hover:bg-surface-muted/30 hover:underline"
          >
            See all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
