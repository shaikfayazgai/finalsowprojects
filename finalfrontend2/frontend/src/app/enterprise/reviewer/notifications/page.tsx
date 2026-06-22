"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Bell, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { ghostBtnClass } from "@/app/admin/_shell/aurora-ui";

type ReviewerNotification = {
  id: string;
  title: string;
  body: string;
  kind: "sla" | "assignment" | "decision";
  read: boolean;
  at: string;
};

const MOCK_NOTIFICATIONS: ReviewerNotification[] = [
  {
    id: "rn-1",
    title: "SLA at risk — Date Picker · FocusScope",
    body: "Review due in under 2 hours. Mentor sign-off recorded 12 minutes ago.",
    kind: "sla",
    read: false,
    at: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "rn-2",
    title: "New QA assignment — CSV export",
    body: "Yusuf Okeke's submission is ready for second-stage review on Reporting V2.",
    kind: "assignment",
    read: false,
    at: new Date(Date.now() - 20 * 60_000).toISOString(),
  },
  {
    id: "rn-3",
    title: "Decision recorded — Audit log timestamp fix",
    body: "Your accept decision was forwarded to enterprise acceptance.",
    kind: "decision",
    read: true,
    at: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
];

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function kindIcon(kind: ReviewerNotification["kind"]) {
  switch (kind) {
    case "sla":
      return AlertTriangle;
    case "decision":
      return CheckCircle2;
    default:
      return Bell;
  }
}

function kindStyle(kind: ReviewerNotification["kind"]): React.CSSProperties {
  switch (kind) {
    case "sla":
      return {
        borderColor: "var(--color-warning-border)",
        color: "var(--color-warning-text)",
        background: "var(--color-warning-subtle)",
      };
    case "decision":
      return {
        borderColor: "var(--color-success-border)",
        color: "var(--color-success-text)",
        background: "var(--color-success-subtle)",
      };
    default:
      return {
        borderColor: "rgba(255,255,255,0.7)",
        color: "var(--color-text-secondary)",
        background: "rgba(255,255,255,0.5)",
      };
  }
}

export default function ReviewerNotificationsPage() {
  const [items, setItems] = React.useState(MOCK_NOTIFICATIONS);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link
        href="/enterprise/reviewer"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-medium text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Back to QA review
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Reviewer · Notifications
          </p>
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Notifications
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            QA alerts, SLA warnings, and review assignment updates.
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className={ghostBtnClass}
          >
            Mark all read
          </button>
        )}
      </header>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 py-3 border-b border-white/55 flex items-center justify-between">
          <p className="font-display text-[13px] font-semibold text-foreground">
            Inbox
            {unread > 0 && (
              <span className="ml-2 font-mono text-[11px] text-warning-text tabular-nums">
                {unread} unread
              </span>
            )}
          </p>
        </div>

        <ul className="divide-y divide-white/60">
          {items.map((n) => {
            const Icon = kindIcon(n.kind);
            return (
              <li
                key={n.id}
                className={cn(
                  "relative px-5 py-4 flex gap-3 transition-colors duration-fast",
                  !n.read ? "bg-white/40 hover:bg-white/50" : "hover:bg-white/40",
                )}
              >
                {!n.read && (
                  <span aria-hidden className="absolute left-0 w-[3px] self-stretch rounded-full" style={{ backgroundImage: AURORA_ACCENT }} />
                )}
                <span
                  className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur"
                  style={kindStyle(n.kind)}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn(
                        "font-body text-[13.5px] text-foreground",
                        !n.read && "font-semibold",
                      )}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 inline-flex items-center gap-1 font-body text-[11px] text-text-tertiary">
                      <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
                      {fmtRelative(n.at)}
                    </span>
                  </div>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
                    {n.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
