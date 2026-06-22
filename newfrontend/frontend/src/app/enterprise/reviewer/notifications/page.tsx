"use client";

/**
 * QA reviewer notifications — date-grouped feed with gradient-pill filters.
 *
 * USE-CASE: Enterprise reviewer needs to track SLA warnings, new QA assignments,
 * and recorded decisions from their notification centre.
 *
 * HEURISTIC EVAL:
 * H1 (Visibility): GLASS_CARD with divide-white/60 and bg-white/40 hides state
 *   on solid bg — unread rows blend into the panel.
 * H6 (Recognition): No filter nav → can't distinguish unread from all.
 * H7 (Flexibility): ghostBtnClass (glass backdrop) becomes invisible on solid;
 *   plain text "mark all read" was the only action, no gradient-pill filter.
 * H8 (Minimalist): Inline "Inbox N unread" as a running title was noisy.
 *
 * LAYOUT: DASH_CARD + gradient-pill filter pills + date-grouped timeline feed.
 * Matches the enterprise notifications-workspace pattern.
 */

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Bell, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, primaryBtnClass, primaryStyle, secondaryBtnClass, TONE } from "@/app/admin/_shell/aurora-ui";

type ReviewerNotification = {
  id: string;
  title: string;
  body: string;
  kind: "sla" | "assignment" | "decision";
  read: boolean;
  at: string;
};

// Reviewer notifications are not yet wired to a real feed (that lands in the
// all-role notifications pass). Until then, start empty — no fabricated alerts.
const INITIAL_NOTIFICATIONS: ReviewerNotification[] = [];

type FilterKey = "all" | "unread";

const FILTER_TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
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

function groupByDay(rows: ReviewerNotification[]) {
  const sorted = [...rows].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const groups: Array<{ key: number; label: string; items: ReviewerNotification[] }> = [];
  for (const row of sorted) {
    const key = startOfDay(new Date(row.at));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(row);
    else groups.push({ key, label: dayLabel(row.at), items: [row] });
  }
  return groups;
}

function kindIcon(kind: ReviewerNotification["kind"]) {
  switch (kind) {
    case "sla": return AlertTriangle;
    case "decision": return CheckCircle2;
    default: return Bell;
  }
}

type KindTone = "error" | "success" | "neutral";

function kindTone(kind: ReviewerNotification["kind"]): KindTone {
  switch (kind) {
    case "sla": return "error";
    case "decision": return "success";
    default: return "neutral";
  }
}

export default function ReviewerNotificationsPage() {
  const [items, setItems] = React.useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = React.useState<FilterKey>("all");

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;
  const groups = React.useMemo(() => groupByDay(visible), [visible]);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href="/enterprise/reviewer"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to QA review
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Reviewer · Notifications
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Notifications
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
          QA alerts, SLA warnings, and review assignment updates.
        </p>
      </header>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Toolbar */}
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Notification filters" className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.key;
              const count = tab.key === "unread" ? unread : items.length;
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

          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className={cn(secondaryBtnClass, "h-8 px-3 text-[12.5px]")}
            >
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Mark all read
            </button>
          )}
        </div>

        {/* Date-grouped feed */}
        <div className="px-5 sm:px-6 py-5">
          {visible.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
              <p className="font-body text-[13px] font-semibold text-foreground">
                {filter === "unread" ? "All caught up" : "No notifications"}
              </p>
              <p className="mt-1 font-body text-[12px] text-text-tertiary">
                {filter === "unread"
                  ? "No unread alerts at this time."
                  : "QA alerts and assignment updates will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-3">
                    {g.label}
                  </p>
                  <ul className="divide-y divide-stroke-subtle border border-stroke-subtle rounded-lg overflow-hidden">
                    {g.items.map((n) => {
                      const Icon = kindIcon(n.kind);
                      const tone = kindTone(n.kind);
                      return (
                        <li
                          key={n.id}
                          className={cn(
                            "relative flex items-start gap-3 px-4 py-3.5 transition-colors duration-fast",
                            !n.read ? "bg-brand-subtle hover:bg-bg-subtle" : "hover:bg-bg-subtle/60",
                          )}
                        >
                          {!n.read && (
                            <span
                              aria-hidden
                              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
                              style={{ backgroundImage: "linear-gradient(180deg, var(--c-violet-500) 0%, var(--c-blue-500) 100%)" }}
                            />
                          )}
                          <span
                            className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border mt-0.5"
                            style={{
                              borderColor: TONE[tone].border,
                              color: TONE[tone].text,
                              background: TONE[tone].soft,
                            }}
                          >
                            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p
                                className={cn(
                                  "font-body text-[13px] text-foreground leading-snug",
                                  !n.read && "font-semibold",
                                )}
                              >
                                {n.title}
                              </p>
                              <span className="shrink-0 inline-flex items-center gap-1 font-body text-[11px] text-text-tertiary tabular-nums">
                                <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
                                {fmtRelative(n.at)}
                              </span>
                            </div>
                            <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
                              {n.body}
                            </p>
                            {!n.read && (
                              <div className="mt-2">
                                <Chip tone="ai" dot={false}>Unread</Chip>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
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
