"use client";

/**
 * Personal metrics — spec doc 03 §5.E.3.
 *
 * Self-observations only. NO peer comparison. Numbers are observations,
 * not performance scores. Metrics are derived from the real history endpoint.
 */

import * as React from "react";
import { Info, AlertCircle } from "lucide-react";
import {
  fetchRealMentorHistory,
  MentorHistoryApiError,
  type MentorMetrics,
} from "@/lib/api/mentor-real-history";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  MentorPage,
  MentorPageHeader,
  MentorBackLink,
  MentorBanner,
  MentorMetricBand,
  MentorListPanel,
} from "@/app/mentor/_components/mentor-ui";
import { MentorDetailSkeleton } from "@/app/mentor/_components/mentor-skeletons";

export default function MentorMetricsPage() {
  const [m, setM] = React.useState<MentorMetrics | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchRealMentorHistory(c.signal)
      .then((res) => setM(res.metrics))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(
          err instanceof MentorHistoryApiError ? err.message : "Could not load metrics.",
        );
      });
    return () => c.abort();
  }, []);

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

  if (!m) return <MentorDetailSkeleton />;

  const totalDecisions = m.decisionsByKind.accept + m.decisionsByKind.rework + m.decisionsByKind.reject;
  const aiTotal = m.aiAlignment.tookAsIs + m.aiAlignment.modified + m.aiAlignment.overrode;

  return (
    <MentorPage>
      <MentorBackLink href="/mentor/history">Back to history</MentorBackLink>

      <MentorPageHeader
        title="Your metrics"
        subtitle={`Last ${m.periodDays} days · observations of your own work.`}
      />

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <MentorMetricBand
          metrics={[
            { label: "Reviews", value: String(m.reviewCount) },
            { label: "Avg time", value: `${m.avgTimeMin} min` },
            { label: "SLA hit", value: `${m.slaHitPct}%` },
            { label: "Accept rate", value: `${m.acceptPct}%` },
          ]}
        />
      </section>

      <DashboardSection title="Decisions">
        <div className="space-y-3">
          <Bar label="Accept" count={m.decisionsByKind.accept} total={totalDecisions} />
          <Bar label="Rework" count={m.decisionsByKind.rework} total={totalDecisions} />
          <Bar label="Reject" count={m.decisionsByKind.reject} total={totalDecisions} />
        </div>
      </DashboardSection>

      <MentorListPanel
        title="AI alignment (assistive, never automatic)"
        footer={
          <p className="font-body text-[11px] text-text-tertiary">All overrides logged in audit.</p>
        }
      >
        <AiRow label="Took AI suggestion as-is" count={m.aiAlignment.tookAsIs} total={aiTotal} />
        <AiRow label="Modified AI suggestion" count={m.aiAlignment.modified} total={aiTotal} />
        <AiRow label="Overrode AI suggestion" count={m.aiAlignment.overrode} total={aiTotal} />
      </MentorListPanel>

      <DashboardSection title="Coaching notes">
        <p className="font-body text-[12.5px] text-foreground">
          Coaching notes written:{" "}
          <span className="font-semibold tabular-nums">{m.coachingNotesWritten}</span>
        </p>
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">Saved to contributor profiles.</p>
      </DashboardSection>

      <MentorBanner
        tone="brand"
        icon={<Info className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
      >
        These are observations of your own work. Not performance scores or comparisons to peers.
      </MentorBanner>
    </MentorPage>
  );
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[12.5px] text-foreground w-20 shrink-0">{label}</span>
      <span className="font-mono text-[11.5px] tabular-nums text-text-tertiary w-6 shrink-0">{count}</span>
      <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AiRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <li className="px-5 py-3 flex items-center gap-3 min-h-[52px]">
      <span className="font-body text-[12.5px] text-foreground flex-1">{label}</span>
      <span className="font-mono text-[11.5px] tabular-nums text-text-tertiary shrink-0">
        {count} ({pct}%)
      </span>
    </li>
  );
}
