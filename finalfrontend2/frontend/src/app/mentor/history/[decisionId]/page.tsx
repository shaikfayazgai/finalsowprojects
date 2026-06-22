"use client";

/**
 * Past decision detail (read-only) — spec doc 03 §5.E.2.
 */

import * as React from "react";
import { useParams, notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { MockMentorDecision } from "@/mocks/mentor";
import {
  fetchRealMentorDecision,
  MentorHistoryApiError,
} from "@/lib/api/mentor-real-history";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorPage,
  MentorPageHeader,
  MentorBackLink,
  MentorBanner,
} from "@/app/mentor/_components/mentor-ui";
import { MentorDetailSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import { cn } from "@/lib/utils/cn";

const DECISION_STATUS: Record<
  MockMentorDecision["decision"],
  { status: "success" | "warning" | "error" | "neutral"; label: string }
> = {
  accept: { status: "success", label: "Accepted" },
  rework: { status: "warning", label: "Rework" },
  reject: { status: "error", label: "Rejected" },
  withdrawn: { status: "neutral", label: "Withdrawn" },
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MentorDecisionDetailPage() {
  const params = useParams<{ decisionId: string }>();
  const id = params?.decisionId ?? "";

  const [d, setD] = React.useState<MockMentorDecision | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [nf, setNf] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    const c = new AbortController();
    fetchRealMentorDecision(id, c.signal)
      .then((res) => setD(res.decision))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof MentorHistoryApiError && err.status === 404) setNf(true);
        else setError(err instanceof Error ? err.message : "Could not load decision.");
      });
    return () => c.abort();
  }, [id]);

  if (nf) notFound();

  if (error) {
    return (
      <MentorPage>
        <MentorBackLink href="/mentor/history">Back to history</MentorBackLink>
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          {error}
        </MentorBanner>
      </MentorPage>
    );
  }

  if (!d) return <MentorDetailSkeleton />;

  const chip = DECISION_STATUS[d.decision];

  return (
    <MentorPage>
      <MentorBackLink href="/mentor/history">Back to history</MentorBackLink>

      <MentorPageHeader
        eyebrow={`Decision · Round ${d.round}`}
        title={d.taskTitle}
        subtitle={
          <>
            {d.contributorName}
            <span aria-hidden className="opacity-50 mx-1.5">
              ·
            </span>
            {d.project}
          </>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <StatusChip status={chip.status} size="sm">
              {chip.label}
            </StatusChip>
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
              Round {d.round}/{d.totalRounds}
            </span>
            <span aria-hidden className="text-text-tertiary opacity-50">
              ·
            </span>
            <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
              {fmtDateTime(d.decidedAt)}
            </span>
          </div>
        }
      />

      <DashboardSection title="Decision details">
        <dl className="divide-y divide-stroke-subtle -mx-5 -mb-5">
          <DetailRow k="Reviewer confidence" v={d.reviewerConfidence} capitalize />
          {d.rubricOverall !== undefined && (
            <DetailRow k="Overall rubric" v={`${d.rubricOverall.toFixed(2)} / 5`} mono />
          )}
          <DetailRow
            k="AI alignment"
            v={
              d.aiAlignment === "took_as_is"
                ? "Took AI suggestion as-is"
                : d.aiAlignment === "modified"
                  ? "Modified AI suggestion"
                  : "Overrode AI suggestion"
            }
          />
        </dl>
      </DashboardSection>

      {d.decision === "accept" && d.finalComment && (
        <DashboardSection title="Final comment">
          <p className="font-body text-[12.5px] text-foreground whitespace-pre-wrap">{d.finalComment}</p>
        </DashboardSection>
      )}

      {d.decision === "rework" && d.reworkCorrections && (
        <DashboardSection title="Required corrections">
          <ol className="list-decimal pl-5 space-y-1 font-body text-[12.5px] text-foreground">
            {d.reworkCorrections.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ol>
        </DashboardSection>
      )}

      {d.decision === "reject" && (
        <DashboardSection title="Rejection details">
          {d.rejectCategory && (
            <p className="font-body text-[11.5px] text-text-tertiary mb-1.5">
              Category:{" "}
              <span className="font-medium text-foreground capitalize">
                {d.rejectCategory.replace(/_/g, " ")}
              </span>
            </p>
          )}
          {d.rejectReason && (
            <p className="font-body text-[12.5px] text-foreground whitespace-pre-wrap">{d.rejectReason}</p>
          )}
        </DashboardSection>
      )}

      <p className="font-body text-[11.5px] text-text-tertiary italic">
        Read-only snapshot · captured at decision time.
      </p>
    </MentorPage>
  );
}

function DetailRow({
  k,
  v,
  mono,
  capitalize,
}: {
  k: string;
  v: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <dt className="font-body text-[11.5px] text-text-tertiary">{k}</dt>
      <dd
        className={cn(
          "font-body text-[12.5px] text-foreground",
          mono && "font-mono tabular-nums",
          capitalize && "capitalize",
        )}
      >
        {v}
      </dd>
    </div>
  );
}
