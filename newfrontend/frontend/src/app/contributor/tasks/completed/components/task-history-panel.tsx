"use client";

/**
 * Completed-task history + quality rating. Read-only: shows the FINAL rating
 * (average of the mentor + QA reviews), each review's per-dimension breakdown,
 * and the full lifecycle timeline (assigned → submitted → revisions → decisions →
 * QA approval → payout → paid).
 */

import * as React from "react";
import {
  Star,
  CircleDot,
  CircleCheck,
  RotateCcw,
  XCircle,
  Coins,
  BadgeCheck,
  Flag,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MENTOR_RATING_DIMENSIONS,
  QA_RATING_DIMENSIONS,
  type RatingDimension,
} from "@/components/delivery/quality-rating";
import type { TaskHistory } from "@/lib/api/contributor-task-views";
import { fmtRelative } from "../lib/completed-ui-utils";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size, color: value >= n ? "#f59e0b" : "#d4d4d8" }}
          fill={value >= n ? "#f59e0b" : "none"}
          strokeWidth={2}
          aria-hidden
        />
      ))}
    </span>
  );
}

function Breakdown({
  title,
  overall,
  ratings,
  dims,
}: {
  title: string;
  overall: number | null;
  ratings: Record<string, number>;
  dims: RatingDimension[];
}) {
  return (
    <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
          {title}
        </p>
        {overall != null && (
          <span className="font-body text-[12px] font-semibold text-foreground tabular-nums">
            {overall.toFixed(1)} / 5
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {dims.map((d) => {
          const v = ratings[d.key] || 0;
          if (!v) return null;
          return (
            <div key={d.key} className="flex items-center justify-between gap-3">
              <span className="font-body text-[12px] text-foreground">{d.label}</span>
              <Stars value={v} size={12} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EVENT_ICON: Record<string, LucideIcon> = {
  assigned: Flag,
  accepted: CircleCheck,
  submitted: Upload,
  revision: RotateCcw,
  rejected: XCircle,
  rating: BadgeCheck,
  payout_eligible: Coins,
  paid: Coins,
};

const EVENT_COLOR: Record<string, string> = {
  revision: "var(--color-warning-text, #b45309)",
  rejected: "var(--color-error-text, #dc2626)",
  rating: "#f59e0b",
  paid: "var(--color-success-text, #15803d)",
  payout_eligible: "var(--color-success-text, #15803d)",
};

export function TaskHistoryPanel({ history }: { history: TaskHistory }) {
  const r = history.ratings;
  const hasRating = !!r && r.final != null;
  const hasTimeline = history.timeline.length > 0;
  if (!hasRating && !hasTimeline) return null;

  return (
    <>
      {hasRating && r && (
        <DashboardSection
          title="Quality rating"
          description="Final score = average of the mentor and QA reviews"
        >
          <div className="flex items-center gap-3 mb-3.5">
            <span className="font-body text-[30px] font-semibold text-foreground tabular-nums leading-none tracking-[-0.02em]">
              {(r.final ?? 0).toFixed(1)}
            </span>
            <span className="font-body text-[13px] text-text-tertiary">/ 5</span>
            <Stars value={Math.round(r.final ?? 0)} size={18} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {r.mentorRatings && (
              <Breakdown
                title="Mentor review"
                overall={r.mentorOverall}
                ratings={r.mentorRatings}
                dims={MENTOR_RATING_DIMENSIONS}
              />
            )}
            {r.qaRatings && (
              <Breakdown
                title="QA review"
                overall={r.qaOverall}
                ratings={r.qaRatings}
                dims={QA_RATING_DIMENSIONS}
              />
            )}
          </div>
        </DashboardSection>
      )}

      {hasTimeline && (
        <DashboardSection title="History" description="Everything that happened on this task">
          <ol className="space-y-3">
            {history.timeline.map((e, i) => {
              const Icon = EVENT_ICON[e.kind] ?? CircleDot;
              const color = EVENT_COLOR[e.kind] ?? "var(--color-text-tertiary, #71717a)";
              const note = typeof e.meta?.note === "string" ? e.meta.note : null;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-stroke-subtle bg-surface shrink-0"
                    style={{ color }}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[12.5px] text-foreground leading-snug">{e.label}</p>
                    {note && (
                      <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {note}
                      </p>
                    )}
                    <p className="mt-0.5 font-body text-[11px] text-text-tertiary tabular-nums">
                      {fmtRelative(e.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </DashboardSection>
      )}
    </>
  );
}
