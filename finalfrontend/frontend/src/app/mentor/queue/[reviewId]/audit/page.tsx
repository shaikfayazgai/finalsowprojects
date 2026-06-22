"use client";

/**
 * Per-review audit — spec doc 03 §5.D.8.
 *
 * Chronological event log for this review: assignment → opened → drafts →
 * AI override deltas → decision → (resubmission, if rework) → final.
 */

import * as React from "react";
import { useParams, notFound } from "next/navigation";
import { CircleCheck, AlertTriangle, Save, FileText, Sparkles, UserPlus } from "lucide-react";
import type { MockReview } from "@/mocks/mentor";
import { fetchMentorReview, MentorApiError } from "@/lib/api/mentor-mock";
import { Avatar } from "@/components/meridian";
import {
  MentorPage,
  MentorPageHeader,
  MentorBackLink,
  MentorListPanel,
} from "@/app/mentor/_components/mentor-ui";
import { MentorDetailSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import { cn } from "@/lib/utils/cn";

type EventKind =
  | "assigned"
  | "opened"
  | "saved_draft"
  | "ai_override"
  | "decision"
  | "resubmitted"
  | "final"
  | "reassigned";

interface AuditEvent {
  id: string;
  kind: EventKind;
  at: string;
  actor: string;
  summary: string;
  detail?: string;
}

const KIND_LABEL: Record<EventKind, string> = {
  assigned: "Assigned",
  opened: "Opened",
  saved_draft: "Draft saved",
  ai_override: "AI override delta",
  decision: "Decision recorded",
  resubmitted: "Resubmitted",
  final: "Finalized",
  reassigned: "Reassigned",
};

const KIND_ICON: Record<EventKind, typeof CircleCheck> = {
  assigned: UserPlus,
  opened: FileText,
  saved_draft: Save,
  ai_override: Sparkles,
  decision: CircleCheck,
  resubmitted: FileText,
  final: CircleCheck,
  reassigned: AlertTriangle,
};

function minutesAgo(m: number) {
  return new Date(Date.now() - m * 60_000).toISOString();
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString();
}
function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actorInitials(actor: string): string {
  if (actor === "System" || actor === "you") return actor.slice(0, 2).toUpperCase();
  const parts = actor.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return actor.slice(0, 2).toUpperCase();
}

export default function MentorReviewAuditPage() {
  const params = useParams<{ reviewId: string }>();
  const reviewId = params?.reviewId ?? "";
  const [review, setReview] = React.useState<MockReview | null>(null);
  const [nf, setNf] = React.useState(false);

  React.useEffect(() => {
    if (!reviewId) return;
    const c = new AbortController();
    fetchMentorReview(reviewId, c.signal)
      .then((res) => setReview(res.review))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof MentorApiError && err.status === 404) setNf(true);
      });
    return () => c.abort();
  }, [reviewId]);

  if (nf) notFound();
  if (!review) return <MentorDetailSkeleton />;

  const events: AuditEvent[] = [];
  if (review.round >= 2) {
    events.push({
      id: "ev-1",
      kind: "assigned",
      at: hoursAgo(72),
      actor: "System",
      summary: `Round 1 assigned to ${"Priya Iyer"}`,
    });
    events.push({
      id: "ev-2",
      kind: "opened",
      at: hoursAgo(70),
      actor: "Priya Iyer",
      summary: "Mentor opened the review",
    });
    events.push({
      id: "ev-3",
      kind: "saved_draft",
      at: hoursAgo(68),
      actor: "Priya Iyer",
      summary: "Draft saved",
    });
    events.push({
      id: "ev-4",
      kind: "ai_override",
      at: hoursAgo(67),
      actor: "Priya Iyer",
      summary: "AI override on Screen reader month change",
      detail: "AI ⭐5 → mentor ⭐4 · low confidence (78%)",
    });
    events.push({
      id: "ev-5",
      kind: "decision",
      at: hoursAgo(66),
      actor: "Priya Iyer",
      summary: "Rework requested (round 1)",
      detail: "2 required corrections logged",
    });
    events.push({
      id: "ev-6",
      kind: "resubmitted",
      at: minutesAgo(15),
      actor: review.contributorName,
      summary: `v2 submitted by ${review.contributorName}`,
    });
    events.push({
      id: "ev-7",
      kind: "assigned",
      at: minutesAgo(14),
      actor: "System",
      summary: "Round 2 routed back to original mentor (continuity)",
    });
  } else {
    events.push({
      id: "ev-1",
      kind: "assigned",
      at: minutesAgo(60),
      actor: "System",
      summary: "Assigned to you",
    });
    events.push({
      id: "ev-2",
      kind: "opened",
      at: minutesAgo(58),
      actor: "you",
      summary: "Mentor opened the review",
    });
  }

  return (
    <MentorPage>
      <MentorBackLink href={`/mentor/queue/${reviewId}`}>Back to review</MentorBackLink>

      <MentorPageHeader
        eyebrow="Audit trail"
        title="Review activity log"
        subtitle="Every event on this review — assigned, opened, drafted, AI override delta, decided, resubmitted."
      />

      <MentorListPanel title="Timeline" description={`${events.length} events`}>
        {events.map((e) => {
          const Icon = KIND_ICON[e.kind];
          return (
            <li key={e.id} className="px-5 py-3 flex items-start gap-3 min-h-[52px]">
              <span
                aria-hidden
                className={cn(
                  "h-7 w-7 rounded-full inline-flex items-center justify-center shrink-0 mt-0.5",
                  e.kind === "ai_override"
                    ? "bg-brand-subtle text-brand-subtle-text"
                    : e.kind === "reassigned"
                      ? "bg-warning-subtle text-warning-text"
                      : e.kind === "decision" || e.kind === "final"
                        ? "bg-success-subtle text-success-text"
                        : "bg-bg-subtle text-text-secondary",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[12.5px] text-foreground">
                  <span className="font-semibold">{KIND_LABEL[e.kind]}</span>
                  <span aria-hidden className="opacity-50 mx-1.5">
                    ·
                  </span>
                  {e.summary}
                </p>
                {e.detail && (
                  <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">{e.detail}</p>
                )}
                <p className="mt-1 font-mono text-[10.5px] text-text-tertiary tabular-nums">
                  {fmt(e.at)} · {e.actor}
                </p>
              </div>
              <Avatar initials={actorInitials(e.actor)} size="sm" tone="neutral" className="shrink-0 hidden sm:flex" />
            </li>
          );
        })}
      </MentorListPanel>
    </MentorPage>
  );
}
