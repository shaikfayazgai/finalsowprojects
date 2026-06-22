"use client";

/**
 * Mentor notifications — spec doc 03 §5.I.1.
 * Filters: All / Unread / Review / Mentorship / Escalation / Digest.
 */

import * as React from "react";
import { Bell, AlertTriangle, Clock, Calendar, Mail } from "lucide-react";
import type { MockMentorNotification } from "@/mocks/mentor";
import { fetchMentorNotifications, MentorApiError } from "@/lib/api/mentor-mock";
import { cn } from "@/lib/utils/cn";
import { MentorListSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
  MentorFilterChip,
  MentorListPanel,
  MentorListRow,
  mentorSecondaryBtn,
} from "@/app/mentor/_components/mentor-ui";

type Filter = "all" | "unread" | "review_assigned" | "mentorship_reminder" | "escalation" | "digest";

const ICON: Record<MockMentorNotification["kind"], typeof Bell> = {
  review_assigned: Bell,
  sla_approaching: Clock,
  mentorship_reminder: Calendar,
  escalation: AlertTriangle,
  digest: Mail,
};

const TONE: Record<MockMentorNotification["kind"], string> = {
  review_assigned: "bg-brand-subtle text-brand-subtle-text",
  sla_approaching: "bg-warning-subtle text-warning-text",
  mentorship_reminder: "bg-bg-subtle text-text-secondary",
  escalation: "bg-error-subtle text-error-text",
  digest: "bg-bg-subtle text-text-secondary",
};

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export default function MentorNotificationsPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [items, setItems] = React.useState<MockMentorNotification[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchMentorNotifications(c.signal)
      .then((res) => {
        setItems(res.items);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof MentorApiError ? err.message : "Could not load notifications.");
        setLoaded(true);
      });
    return () => c.abort();
  }, []);

  const filtered = items.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return n.unread;
    if (filter === "review_assigned") return n.kind === "review_assigned" || n.kind === "sla_approaching";
    return n.kind === filter;
  });

  const markAllRead = () => setItems((p) => p.map((n) => ({ ...n, unread: false })));
  const unreadCount = items.filter((n) => n.unread).length;

  return (
    <MentorPage>
      <MentorPageHeader
        title="Notifications"
        meta={
          <>
            <span className="font-medium text-foreground tabular-nums">{unreadCount}</span> unread
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="font-medium text-foreground tabular-nums">{items.length}</span> total
          </>
        }
        actions={
          unreadCount > 0 ? (
            <button type="button" onClick={markAllRead} className={mentorSecondaryBtn}>
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <MentorFilterChip selected={filter === "all"} onClick={() => setFilter("all")}>All {items.length}</MentorFilterChip>
        <MentorFilterChip selected={filter === "unread"} onClick={() => setFilter("unread")}>Unread {unreadCount}</MentorFilterChip>
        <MentorFilterChip selected={filter === "review_assigned"} onClick={() => setFilter("review_assigned")}>Review</MentorFilterChip>
        <MentorFilterChip selected={filter === "mentorship_reminder"} onClick={() => setFilter("mentorship_reminder")}>Mentorship</MentorFilterChip>
        <MentorFilterChip selected={filter === "escalation"} onClick={() => setFilter("escalation")}>Escalation</MentorFilterChip>
        <MentorFilterChip selected={filter === "digest"} onClick={() => setFilter("digest")}>Digest</MentorFilterChip>
      </div>

      {error && (
        <MentorBanner tone="error" icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          {error}
        </MentorBanner>
      )}

      {!loaded ? (
        <MentorListSkeleton rows={4} />
      ) : (
        <MentorListPanel
          title="Inbox"
          description={filtered.length === 0 ? "No notifications match this filter" : `${filtered.length} notification${filtered.length === 1 ? "" : "s"}`}
          empty={
            filtered.length === 0 ? (
              <p className="px-5 py-8 text-center font-body text-[12.5px] text-text-tertiary italic">
                No notifications match this filter.
              </p>
            ) : undefined
          }
        >
          {filtered.map((n) => {
            const Icon = ICON[n.kind];
            return (
              <MentorListRow
                key={n.id}
                href={n.link}
                unread={n.unread}
                title={
                  <span className={cn(n.unread && "text-text-link")}>{n.title}</span>
                }
                meta={n.body}
                leading={
                  <span
                    aria-hidden
                    className={cn(
                      "h-8 w-8 rounded-lg inline-flex items-center justify-center shrink-0",
                      TONE[n.kind],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </span>
                }
                trailing={
                  <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                    {fmtRelative(n.at)}
                  </span>
                }
              />
            );
          })}
        </MentorListPanel>
      )}
    </MentorPage>
  );
}
