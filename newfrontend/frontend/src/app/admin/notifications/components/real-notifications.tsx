"use client";

/**
 * Admin notifications — the REAL feed (Postgres contributor_notifications via
 * /api/notifications), replacing the old mock. Same source as the bell, with
 * the canonical category tabs: Action / Update / Payment / Complaint / Security.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, AlertOctagon, Info, AlertTriangle } from "lucide-react";
import {
  useMyNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/lib/hooks/use-notifications";
import type { NotificationSummary } from "@/lib/api/notifications";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "action", label: "Action" },
  { key: "update", label: "Update" },
  { key: "payment", label: "Payment" },
  { key: "complaint", label: "Complaint" },
  { key: "security", label: "Security" },
] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  const days = Math.floor(diff / (24 * 60 * 60_000));
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}
function SevIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-error-text" />;
  if (severity === "important") return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-text" />;
}

export function RealNotificationsWorkspace() {
  const router = useRouter();
  const { data, isFetching } = useMyNotifications({ limit: 50, refetchInterval: 60_000, enabled: true });
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();
  const [tab, setTab] = useState<string>("all");

  const all: NotificationSummary[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const n of all) {
      const k = n.category || "update";
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [all]);

  const items = tab === "all" ? all : all.filter((n) => (n.category || "update") === tab);

  const click = (n: NotificationSummary) => {
    if (!n.readAt) markOne.mutate(n.id);
    if (n.actionUrl) router.push(n.actionUrl);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-text-secondary">{unreadCount} unread · {all.length} total · live feed</p>
        </div>
        <button
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || unreadCount === 0}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline disabled:cursor-not-allowed disabled:text-text-tertiary disabled:no-underline"
        >
          <CheckCheck className="h-3.5 w-3.5" /> {markAll.isPending ? "Marking…" : "Mark all read"}
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setTab(c.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              tab === c.key ? "bg-brand text-white" : "bg-surface-sunken text-text-secondary hover:text-foreground"
            }`}
          >
            {c.label}
            <span className={`rounded-full px-1.5 text-[10px] ${tab === c.key ? "bg-white/25" : "bg-stroke-subtle text-text-secondary"}`}>
              {counts[c.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {isFetching && !data ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stroke-subtle p-10 text-center text-sm text-text-secondary">
          No notifications in this category.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => click(n)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                  n.readAt ? "border-stroke-subtle bg-surface hover:bg-surface-hover" : "border-brand/30 bg-brand-subtle/40 hover:bg-brand-subtle/60"
                }`}
              >
                <SevIcon severity={n.severity} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                    <span className="shrink-0 text-[10px] text-text-tertiary">{timeAgo(n.dispatchedAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-text-secondary line-clamp-2">{n.body}</span>
                  <span className="mt-1 inline-flex items-center gap-2 text-[10px] uppercase tracking-wide text-text-tertiary">
                    {n.category || "update"}
                    {n.actionLabel && <span className="text-teal-600">· {n.actionLabel} →</span>}
                  </span>
                </span>
                {!n.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
