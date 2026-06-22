"use client";

/**
 * Mentor decision history — spec doc 03 §5.E.1.
 * Status chip filters + scannable list rows sorted by recency.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import type { MockMentorDecision } from "@/mocks/mentor";
import {
  fetchRealMentorHistory,
  MentorHistoryApiError,
} from "@/lib/api/mentor-real-history";
import { StatusChip } from "@/components/meridian";
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

type Filter = "all" | "accept" | "rework" | "reject" | "withdrawn";

const DECISION_CHIP: Record<
  MockMentorDecision["decision"],
  { status: "success" | "warning" | "error" | "neutral"; label: string }
> = {
  accept: { status: "success", label: "Accept" },
  rework: { status: "warning", label: "Rework" },
  reject: { status: "error", label: "Reject" },
  withdrawn: { status: "neutral", label: "Withdrawn" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MentorHistoryPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [items, setItems] = React.useState<MockMentorDecision[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchRealMentorHistory(c.signal)
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(
          err instanceof MentorHistoryApiError ? err.message : "Could not load history.",
        );
      });
    return () => c.abort();
  }, []);

  const list = items ?? [];
  const rows = React.useMemo(
    () => (filter === "all" ? list : list.filter((d) => d.decision === filter)),
    [list, filter],
  );
  const counts = {
    all: list.length,
    accept: list.filter((d) => d.decision === "accept").length,
    rework: list.filter((d) => d.decision === "rework").length,
    reject: list.filter((d) => d.decision === "reject").length,
    withdrawn: list.filter((d) => d.decision === "withdrawn").length,
  };

  return (
    <MentorPage>
      <MentorPageHeader
        title="History"
        subtitle="Your decisions, ordered by most recent."
        actions={
          <Link href="/mentor/history/metrics" className={mentorSecondaryBtn}>
            Personal metrics
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <MentorFilterChip selected={filter === "all"} onClick={() => setFilter("all")}>All {counts.all}</MentorFilterChip>
        <MentorFilterChip selected={filter === "accept"} onClick={() => setFilter("accept")}>Accepted {counts.accept}</MentorFilterChip>
        <MentorFilterChip selected={filter === "rework"} onClick={() => setFilter("rework")}>Rework {counts.rework}</MentorFilterChip>
        <MentorFilterChip selected={filter === "reject"} onClick={() => setFilter("reject")}>Rejected {counts.reject}</MentorFilterChip>
        <MentorFilterChip selected={filter === "withdrawn"} onClick={() => setFilter("withdrawn")}>Withdrawn {counts.withdrawn}</MentorFilterChip>
      </div>

      {error && (
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          {error}
        </MentorBanner>
      )}

      {items === null && !error ? (
        <MentorListSkeleton rows={4} />
      ) : (
        <MentorListPanel
          title="Decision log"
          description={rows.length === 0 ? "No decisions match this filter" : `${rows.length} decision${rows.length === 1 ? "" : "s"}`}
          empty={
            rows.length === 0 ? (
              <p className="px-5 py-8 text-center font-body text-[12.5px] text-text-tertiary italic">
                No decisions match this filter.
              </p>
            ) : undefined
          }
        >
          {rows.map((d) => {
            const chip = DECISION_CHIP[d.decision];
            return (
              <MentorListRow
                key={d.id}
                href={`/mentor/history/${d.id}`}
                title={d.taskTitle}
                meta={`${d.contributorName} · Round ${d.round}/${d.totalRounds}`}
                trailing={
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusChip status={chip.status} size="sm">
                      {chip.label}
                    </StatusChip>
                    <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
                      {fmtDate(d.decidedAt)}
                    </span>
                  </div>
                }
              />
            );
          })}
        </MentorListPanel>
      )}
    </MentorPage>
  );
}
