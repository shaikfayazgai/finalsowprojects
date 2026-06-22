"use client";

/**
 * Zone E · Actionable inbox
 *
 * Only rows that need a decision or response. Built from task states:
 *   - revision_requested      → "Open revision"
 *   - awaiting_clarification  → "Reply to mentor"
 *   - blocked                 → "Resolve blocker"
 *   - approved (last 24h)     → "Settled" (positive · read-only)
 *
 * No infinite scroll. Up to 5 rows. Empty state when none.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";

interface InboxItem {
  id: string;
  kind: "revision" | "clarification" | "blocker" | "accepted";
  title: string;
  detail: string;
  meta: string;
  href: string;
  cta: string;
}

const KIND_META: Record<
  InboxItem["kind"],
  {
    label: string;
    chip: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    tone: string;
  }
> = {
  revision: {
    label: "Revision",
    chip: "bg-warning-subtle text-warning-text",
    icon: CircleAlert,
    tone: "warning",
  },
  clarification: {
    label: "Reply",
    chip: "bg-info-subtle text-info-text",
    icon: MessageSquare,
    tone: "info",
  },
  blocker: {
    label: "Blocked",
    chip: "bg-error-subtle text-error-text",
    icon: ShieldAlert,
    tone: "error",
  },
  accepted: {
    label: "Accepted",
    chip: "bg-success-subtle text-success-text",
    icon: CheckCircle2,
    tone: "success",
  },
};

function buildInbox(tasks: ContributorTask[]): InboxItem[] {
  const out: InboxItem[] = [];

  for (const t of tasks) {
    if (t.state === "revision_requested") {
      const corrections = t.mentorFeedback?.requiredCorrections ?? [];
      const note = corrections.length > 0
        ? corrections[0].description
        : t.mentorFeedback?.whatWorked
          ? `Mentor noted: ${t.mentorFeedback.whatWorked}`
          : "Mentor requested changes on your submission.";
      out.push({
        id: `${t.id}-rev`,
        kind: "revision",
        title: `Revision on ${t.title}`,
        detail: note,
        meta: t.lastActivityAt,
        href: `/contributor/tasks/${t.id}`,
        cta: "Open revision",
      });
    } else if (t.state === "awaiting_clarification") {
      out.push({
        id: `${t.id}-clar`,
        kind: "clarification",
        title: `Mentor needs a reply on ${t.title}`,
        detail: "Your SLA is paused while you respond.",
        meta: t.lastActivityAt,
        href: `/contributor/tasks/${t.id}`,
        cta: "Reply",
      });
    } else if (t.state === "blocked") {
      const reason = t.blockers?.[0]?.reason ?? "Blocked by external input.";
      out.push({
        id: `${t.id}-blk`,
        kind: "blocker",
        title: `${t.title} is blocked`,
        detail: reason,
        meta: t.lastActivityAt,
        href: `/contributor/tasks/${t.id}`,
        cta: "Resolve",
      });
    } else if (t.state === "approved" || t.state === "completed") {
      // Only show recent accepts (within ~24h based on lastActivityAt freshness)
      const ts = new Date(t.lastActivityAt).getTime();
      if (!isNaN(ts) && Date.now() - ts < 36 * 60 * 60 * 1000) {
        out.push({
          id: `${t.id}-acc`,
          kind: "accepted",
          title: `${t.title} accepted`,
          detail: `${t.payoutAmount} settled to your account`,
          meta: t.lastActivityAt,
          href: `/contributor/tasks/${t.id}`,
          cta: "Open",
        });
      }
    }
  }

  // Prioritise: blocker > revision > clarification > accepted
  const priority: Record<InboxItem["kind"], number> = {
    blocker: 0,
    revision: 1,
    clarification: 2,
    accepted: 3,
  };
  return out.sort((a, b) => priority[a.kind] - priority[b.kind]).slice(0, 5);
}

export function ActionableInbox() {
  const tasks = useContributorTaskList();
  const items = React.useMemo(() => buildInbox(tasks), [tasks]);

  return (
    <section aria-label="Actionable inbox" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-body text-[14px] font-semibold text-foreground tracking-tight">
            Inbox
          </h2>
          <p className="font-body text-[11.5px] text-text-tertiary mt-0.5 leading-snug">
            Only items that need a decision or reply from you.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle px-5 py-8 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">
            Nothing waiting on you
          </p>
          <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-snug max-w-md mx-auto">
            New revisions, clarifications, or settlements will surface here.
          </p>
        </div>
      ) : (
        <ul className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden divide-y divide-stroke-subtle">
          {items.map((item) => (
            <InboxRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  return (
    <li>
      <Link
        href={item.href}
        className="group flex items-start gap-3 px-5 py-3 hover:bg-[var(--state-hover)] transition-colors duration-fast"
      >
        <span
          aria-hidden
          className={cn(
            "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md",
            meta.chip,
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight truncate">
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={cn(
                  "inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none",
                  meta.chip,
                )}
              >
                {meta.label}
              </span>
              <span className="font-body text-[10.5px] text-text-tertiary">
                {item.meta}
              </span>
            </div>
          </div>
          <p className="font-body text-[11.5px] text-text-tertiary mt-0.5 leading-snug truncate">
            {item.detail}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-[var(--color-brand)] group-hover:gap-1.5 transition-all">
          {item.cta}
          <ArrowRight className="w-3 h-3" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </li>
  );
}
