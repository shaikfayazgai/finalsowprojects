"use client";

/**
 * Diff viewer — spec doc 03 §5.D.7.
 * Side-by-side v1 vs v2 evidence + criteria addressed counts + cover note.
 */

import * as React from "react";
import { useParams, notFound } from "next/navigation";
import { FileText, Play, Plus } from "lucide-react";
import type { MockReview } from "@/mocks/mentor";
import { fetchRealMentorSubmission, MentorQueueError } from "@/lib/api/mentor-queue-real";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorPage,
  MentorPageHeader,
  MentorBackLink,
  mentorFieldLabel,
} from "@/app/mentor/_components/mentor-ui";
import { MentorDetailSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import { cn } from "@/lib/utils/cn";

interface DiffFile {
  name: string;
  status: "added" | "modified" | "unchanged";
  detail?: string;
  kind?: "doc" | "text" | "image" | "video";
}

function buildV1(review: MockReview): DiffFile[] {
  return review.evidence
    .filter((e) => !/aria-test/.test(e.name))
    .map((e) => ({ name: e.name, status: "unchanged", kind: e.kind }));
}

function buildV2(review: MockReview): DiffFile[] {
  return review.evidence.map((e) => {
    if (/aria-test/.test(e.name) || /\.mp4$/i.test(e.name))
      return { name: e.name, status: "added" as const, detail: "(new)", kind: e.kind };
    if (/spec/i.test(e.name))
      return { name: e.name, status: "modified" as const, detail: "(+12 lines, −2)", kind: e.kind };
    return { name: e.name, status: "unchanged" as const, kind: e.kind };
  });
}

export default function MentorReviewDiffPage() {
  const params = useParams<{ reviewId: string }>();
  const reviewId = params?.reviewId ?? "";
  const [review, setReview] = React.useState<MockReview | null>(null);
  const [nf, setNf] = React.useState(false);

  React.useEffect(() => {
    if (!reviewId) return;
    const c = new AbortController();
    fetchRealMentorSubmission(reviewId, c.signal)
      .then((res) => setReview(res.review))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof MentorQueueError && err.status === 404) setNf(true);
      });
    return () => c.abort();
  }, [reviewId]);

  if (nf) notFound();
  if (!review) return <MentorDetailSkeleton />;

  const v1 = buildV1(review);
  const v2 = buildV2(review);

  const totalCriteria = review.criteria.length;
  const correctionsCount = review.priorFeedback?.requiredCorrections.length ?? 0;
  const v1Addressed = Math.max(0, totalCriteria - correctionsCount);
  const newlyAddressedCount =
    review.priorFeedback?.requiredCorrections.filter((c) => c.addressed).length ?? 0;
  const v2Addressed = Math.min(totalCriteria, v1Addressed + newlyAddressedCount);

  const newlyAddressed = review.priorFeedback?.requiredCorrections.filter((c) => c.addressed) ?? [];

  return (
    <MentorPage>
      <MentorBackLink href={`/mentor/queue/${reviewId}`}>Back to review</MentorBackLink>

      <MentorPageHeader
        eyebrow={`Version diff · Round ${review.round - 1} → ${review.round}`}
        title="v1 ↔ v2 comparison"
        subtitle={
          <>
            {review.taskTitle} · Round {review.round - 1} → Round {review.round}
          </>
        }
      />

      <DashboardSection title="Evidence" className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stroke-subtle -mx-5 -mb-5">
          <FileColumn label={`v1 · Round ${review.round - 1}`} files={v1} />
          <FileColumn label={`v2 · Round ${review.round}`} files={v2} />
        </div>
      </DashboardSection>

      <DashboardSection title="Criteria">
        <p className="font-body text-[13px] text-foreground">
          v1:{" "}
          <span className="font-mono font-semibold tabular-nums">
            {v1Addressed} / {totalCriteria}
          </span>{" "}
          addressed → v2:{" "}
          <span className="font-mono font-semibold tabular-nums">
            {v2Addressed} / {totalCriteria}
          </span>{" "}
          addressed
        </p>
        {newlyAddressed.length > 0 && (
          <div className="mt-3">
            <p className={mentorFieldLabel}>Newly addressed</p>
            <ul className="space-y-1.5 font-body text-[12.5px] text-foreground">
              {newlyAddressed.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span aria-hidden className="text-success-text mt-0.5">
                    ✓
                  </span>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Contributor's v2 cover note">
        <p className="font-body text-[12.5px] text-foreground leading-relaxed">
          &ldquo;Tested in Chrome, Firefox, Safari + mobile Safari. Added aria-live region for month
          change per your round 1 feedback. Mobile touch-outside dismiss is implemented with a
          pointerdown listener; verified on iOS 18.&rdquo;
        </p>
      </DashboardSection>
    </MentorPage>
  );
}

function FileColumn({ label, files }: { label: string; files: DiffFile[] }) {
  return (
    <div className="px-5 py-4">
      <p className={cn(mentorFieldLabel, "mb-2")}>{label}</p>
      <ul className="space-y-1.5">
        {files.map((f, i) => {
          const Icon = f.kind === "video" ? Play : FileText;
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-md font-body text-[12.5px]",
                f.status === "added"
                  ? "bg-success-subtle text-success-text"
                  : f.status === "modified"
                    ? "bg-warning-subtle text-warning-text"
                    : "bg-bg-subtle text-text-secondary",
              )}
            >
              {f.status === "added" && <Plus className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />}
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="truncate flex-1 min-w-0 font-mono text-[11.5px]">{f.name}</span>
              {f.detail && <span className="text-[11px] shrink-0">{f.detail}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
