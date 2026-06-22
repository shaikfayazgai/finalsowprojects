"use client";

/**
 * Mentor notifications — spec doc 03 §5.I.1.
 * Filters: All / Unread / Review / Mentorship / Escalation / Digest.
 *
 * Data source: GET /api/mentor/notifications → /api/v1/notifications (real backend).
 * Backend shape: { notifications: RealNotification[], unreadCount: number, total: number }
 */

import * as React from "react";
import { Bell, AlertTriangle, Clock, Calendar, Mail } from "lucide-react";
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

// ── Real backend notification shape ──────────────────────────────────────────

interface RealNotification {
  id: string;
  kind: string;
  severity: string;
  title: string;
  body: string;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceId: string | null;
  channels: string[];
  dispatchedAt: string | null;
  readAt: string | null;
}

// Normalised shape used by this component — a strict subset of the real shape
// plus derived `unread` and `at` fields for UI convenience.
interface NormNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  at: string;
  unread: boolean;
  link: string | null;
}

function normalize(n: RealNotification): NormNotification {
  return {
    id: n.id,
    kind: n.kind ?? "system.generic",
    title: n.title,
    body: n.body,
    at: n.dispatchedAt ?? new Date().toISOString(),
    unread: n.readAt == null,
    link: n.actionUrl ?? null,
  };
}

// ── Filter categories ─────────────────────────────────────────────────────────

type Filter = "all" | "unread" | "review" | "mentorship" | "escalation" | "digest";

function matchesFilter(n: NormNotification, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "unread") return n.unread;
  const k = n.kind.toLowerCase();
  if (filter === "review") return k.includes("review") || k.includes("sla");
  if (filter === "mentorship") return k.includes("mentorship") || k.includes("session");
  if (filter === "escalation") return k.includes("escalat");
  if (filter === "digest") return k.includes("digest") || k.includes("weekly") || k.includes("summary");
  return false;
}

// ── Icon + tone helpers ───────────────────────────────────────────────────────

const FALLBACK_ICON = Bell;

function iconForKind(kind: string): typeof Bell {
  const k = kind.toLowerCase();
  if (k.includes("sla") || k.includes("deadline")) return Clock;
  if (k.includes("mentorship") || k.includes("session")) return Calendar;
  if (k.includes("escalat")) return AlertTriangle;
  if (k.includes("digest") || k.includes("weekly")) return Mail;
  return FALLBACK_ICON;
}

function toneForKind(kind: string): string {
  const k = kind.toLowerCase();
  if (k.includes("sla") || k.includes("deadline")) return "bg-warning-subtle text-warning-text";
  if (k.includes("escalat")) return "bg-error-subtle text-error-text";
  if (k.includes("mentorship") || k.includes("session")) return "bg-bg-subtle text-text-secondary";
  if (k.includes("digest")) return "bg-bg-subtle text-text-secondary";
  return "bg-brand-subtle text-brand-subtle-text";
}

// ── Time formatter ────────────────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MentorNotificationsPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [items, setItems] = React.useState<NormNotification[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();

    fetch("/api/mentor/notifications", { signal: c.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
          throw new Error(body.message ?? body.error ?? `Request failed (${res.status})`);
        }
        return res.json() as Promise<{
          notifications?: RealNotification[];
          items?: RealNotification[];
          unreadCount?: number;
          total?: number;
        }>;
      })
      .then((data) => {
        // Backend returns `notifications`; fallback to `items` for compatibility.
        const raw = data.notifications ?? data.items ?? [];
        setItems(raw.map(normalize));
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load notifications.");
        setLoaded(true);
      });

    return () => c.abort();
  }, []);

  const filtered = items.filter((n) => matchesFilter(n, filter));
  const unreadCount = items.filter((n) => n.unread).length;

  const markAllRead = () => setItems((p) => p.map((n) => ({ ...n, unread: false })));

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
        <MentorFilterChip selected={filter === "review"} onClick={() => setFilter("review")}>Review</MentorFilterChip>
        <MentorFilterChip selected={filter === "mentorship"} onClick={() => setFilter("mentorship")}>Mentorship</MentorFilterChip>
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
          description={
            filtered.length === 0
              ? "No notifications match this filter"
              : `${filtered.length} notification${filtered.length === 1 ? "" : "s"}`
          }
          empty={
            filtered.length === 0 ? (
              <p className="px-5 py-8 text-center font-body text-[12.5px] text-text-tertiary italic">
                No notifications match this filter.
              </p>
            ) : undefined
          }
        >
          {filtered.map((n) => {
            const Icon = iconForKind(n.kind);
            return (
              <MentorListRow
                key={n.id}
                href={n.link ?? undefined}
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
                      toneForKind(n.kind),
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
