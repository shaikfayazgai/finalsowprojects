"use client";

import * as React from "react";
import {
  Eye,
  FileText,
  Play,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { MockReviewerItem } from "@/mocks/reviewer";
import { cn } from "@/lib/utils/cn";
import { TONE, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";
import { EvidencePreviewDialog } from "./evidence-preview-dialog";

const EVIDENCE_ICON = {
  doc: FileText,
  text: FileText,
  image: FileText,
  video: Play,
} as const;

export function MentorVerdictSection({ review }: { review: MockReviewerItem }) {
  return (
    <div className="space-y-3 -mx-5 sm:-mx-6 px-5 sm:px-6">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-body text-[13px] font-semibold text-foreground">
            {review.mentorName}
            <span className="text-text-tertiary font-normal mx-1.5">·</span>
            <span className="font-mono tabular-nums text-text-secondary font-medium">
              {review.mentorOverall.toFixed(2)}
            </span>
            <span className="text-text-tertiary font-normal"> / 5 overall</span>
          </p>
          {review.mentorNote ? (
            <p className="mt-1.5 font-body text-[13px] text-text-secondary leading-relaxed">
              {review.mentorNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CriteriaSection({ review }: { review: MockReviewerItem }) {
  return (
    <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
      {review.criteria.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-bg-subtle">
          <span className="font-body text-[13px] text-foreground min-w-0">{c.label}</span>
          <span className="inline-flex items-center gap-0.5 shrink-0" aria-label={`Mentor score ${c.mentorStars} of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-3 w-3", i < c.mentorStars ? "" : "text-text-disabled")}
                style={i < c.mentorStars ? { color: TONE.warning.text, fill: TONE.warning.text } : undefined}
                strokeWidth={2}
                aria-hidden
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EvidenceSection({ review }: { review: MockReviewerItem }) {
  const [previewFile, setPreviewFile] = React.useState<
    MockReviewerItem["evidence"][number] | null
  >(null);

  return (
    <>
      <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
        {review.evidence.map((e) => {
          const Icon = EVIDENCE_ICON[e.kind] ?? FileText;
          return (
            <li key={e.id} className="flex items-center justify-between gap-3 px-5 sm:px-6 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-bg-subtle">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="h-7 w-7 rounded-lg bg-foreground/[0.08] flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                </span>
                <span className="font-body text-[13px] font-medium text-foreground truncate">
                  {e.name}
                </span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {e.sizeBytes > 0 && (
                  <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                    {(e.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                )}
                {e.url ? (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(secondaryBtnClass, "h-7 px-2 text-[11px] gap-1")}
                  >
                    <Eye className="h-3 w-3" strokeWidth={2} aria-hidden />
                    Open
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(e)}
                    className={cn(secondaryBtnClass, "h-7 px-2 text-[11px] gap-1")}
                  >
                    <Eye className="h-3 w-3" strokeWidth={2} aria-hidden />
                    {e.kind === "video" ? "Play" : "View"}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <EvidencePreviewDialog
        file={previewFile}
        open={previewFile !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
      />
    </>
  );
}

export function CoverNoteSection({ review }: { review: MockReviewerItem }) {
  return (
    <p className="font-body text-[13px] text-foreground leading-relaxed -mx-5 sm:-mx-6 px-5 sm:px-6">
      {review.contributorCoverNote}
    </p>
  );
}

export function DeliveryFactsSection({ review }: { review: MockReviewerItem }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Review ID" value={review.id} mono />
      <Fact label="Project" value={review.project} />
      <Fact label="Tenant" value={review.tenant} />
      <Fact label="Contributor" value={review.contributorName} />
      <Fact label="Round" value={`${review.round} of ${review.totalRounds}`} mono />
      <Fact
        label="Criteria validated"
        value={`${review.criteriaValidatedCount} of ${review.criteria.length}`}
        mono
      />
      <Fact
        label="Submitted"
        value={new Date(review.submittedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      />
      <Fact
        label="Mentor accepted"
        value={new Date(review.mentorAcceptedAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      />
    </dl>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12.5px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ── File scan ── */

export function FileScanSection({ review }: { review: MockReviewerItem }) {
  // Automated file scanning (virus + similarity) is not yet integrated on the
  // backend — show an honest empty state rather than fabricated verdicts.
  return (
    <div className="-mx-5 sm:-mx-6 px-5 sm:px-6">
      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-text-tertiary" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary">
          <span className="font-semibold text-foreground">Automated scanning not run.</span>{" "}
          Virus and similarity scanning are not yet integrated for this workspace.
          The {review.evidence.length} attached file{review.evidence.length === 1 ? "" : "s"} can be
          reviewed under the Evidence tab.
        </p>
      </div>
    </div>
  );
}

/* ── Version diff ── */

export function VersionDiffSection({ review }: { review: MockReviewerItem }) {
  // Prior-round submission contents are not stored for diffing on the backend,
  // so there is nothing real to compare — show an honest empty state.
  return (
    <div className="-mx-5 sm:-mx-6 px-5 sm:px-6">
      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3">
        <p className="font-body text-[12.5px] text-text-secondary">
          <span className="font-semibold text-foreground">Version comparison not available.</span>{" "}
          This is round {review.round} of {review.totalRounds}, but earlier submissions are not
          stored for side-by-side diffing. Review the current evidence under the Evidence tab.
        </p>
      </div>
    </div>
  );
}

/** File scanning is not yet integrated — the worst status is always "not run". */
export function useScanWorstStatus(_reviewId: string): "not_run" {
  return "not_run";
}
