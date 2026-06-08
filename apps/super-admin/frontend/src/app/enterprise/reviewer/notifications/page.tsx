"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Bell, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ReviewerNotification = {
  id: string;
  title: string;
  body: string;
  kind: "sla" | "assignment" | "decision";
  read: boolean;
  at: string;
};

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

function kindStyle(kind: ReviewerNotification["kind"]) {
  switch (kind) {
    case "sla":
      return "border-warning-border text-warning-text bg-warning-subtle/30";
    case "decision":
      return "border-success-border text-success-text bg-success-subtle/30";
    default:
      return "border-stroke text-text-secondary bg-bg-subtle/40";
  }
}

export default function ReviewerNotificationsPage() {
  const [items, setItems] = React.useState<ReviewerNotification[]>([]);

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
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
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
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-stroke bg-surface font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
          >
            Mark all read
          </button>
        )}
      </header>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-stroke-subtle flex items-center justify-between">
          <p className="font-body text-[13px] font-semibold text-foreground">
            Inbox
            {unread > 0 && (
              <span className="ml-2 font-mono text-[11px] text-warning-text tabular-nums">
                {unread} unread
              </span>
            )}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Bell className="h-7 w-7 text-text-tertiary mx-auto mb-2" strokeWidth={1.75} aria-hidden />
            <p className="font-body text-[13.5px] font-semibold text-foreground">No notifications yet</p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
              QA alerts, SLA warnings, and review assignment updates will appear here.
            </p>
          </div>
        ) : (
        <ul className="divide-y divide-stroke-subtle">
          {items.map((n) => {
            const Icon = kindIcon(n.kind);
            return (
              <li
                key={n.id}
                className={cn(
                  "px-5 py-4 flex gap-3",
                  !n.read && "bg-brand/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border",
                    kindStyle(n.kind),
                  )}
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
        )}
      </section>
    </div>
  );
}
