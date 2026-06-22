"use client";

/**
 * Mentor dashboard — real data wired to:
 *   GET /api/v1/mentor/me  (via /api/mentor/me — session-backed, no proxy change needed)
 *   GET /api/v1/mentor/queue (via /api/mentor/queue proxy)
 *   GET /api/mentor/history  (via /api/mentor/history proxy)
 *
 * governance-alerts and ai-review-insights have no backend endpoint yet —
 * those panels show empty state (see stillMock in task output).
 */

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import { fetchRealQueue, fetchRealHistory, deriveKpisFromQueue } from "@/lib/api/mentor-dashboard";
import type { PriorityReviewRow, ReviewActivityEntry, OperationalKpi } from "@/mocks/data/mentor-workspace";
import { MentorDashboardSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
} from "@/app/mentor/_components/mentor-ui";
import { OperationalKpiRow } from "./components/operational-kpi-row";
import { PriorityReviewQueue } from "./components/priority-review-queue";
import { RecentReviewActivity } from "./components/recent-review-activity";
import { AiReviewInsights } from "./components/ai-review-insights";
import { GovernanceAlertsPanel } from "./components/governance-alerts-panel";

function fmtDay(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function greeting(firstName: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Good morning, ${firstName}`;
  if (h < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

interface DashboardState {
  queue: PriorityReviewRow[];
  history: ReviewActivityEntry[];
  kpis: OperationalKpi[];
}

export default function MentorDashboardPage() {
  const { profile, loading: profileLoading } = useActiveMentor();
  const [data, setData] = React.useState<DashboardState | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    Promise.all([
      fetchRealQueue(c.signal),
      fetchRealHistory(c.signal),
    ])
      .then(([queue, history]) => {
        if (c.signal.aborted) return;
        setData({ queue, history, kpis: deriveKpisFromQueue(queue) });
      })
      .catch((err: unknown) => {
        if (c.signal.aborted) return;
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load dashboard.");
      });
    return () => c.abort();
  }, []);

  if (error) {
    return (
      <MentorPage>
        <MentorPageHeader title="Dashboard" />
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} />}>
          {error}
        </MentorBanner>
      </MentorPage>
    );
  }

  if (profileLoading || !data) return <MentorDashboardSkeleton />;

  const pendingCount = data.queue.length;
  const slaRiskCount = data.queue.filter(
    (r) => r.slaTier === "breached" || r.slaTier === "critical",
  ).length;

  return (
    <MentorPage className="space-y-6">
      <MentorPageHeader
        title={greeting(profile.firstName)}
        subtitle={fmtDay()}
        meta={
          <>
            <span className="font-medium text-foreground tabular-nums">{pendingCount}</span>{" "}
            reviews pending
            <span aria-hidden className="opacity-50 mx-1.5">
              ·
            </span>
            <span
              className={
                slaRiskCount > 0 ? "font-medium text-warning-text tabular-nums" : "font-medium tabular-nums"
              }
            >
              {slaRiskCount}
            </span>{" "}
            SLA at risk
          </>
        }
      />

      {/* KPI row — derived from real queue data */}
      <OperationalKpiRow kpis={data.kpis} />

      {/* Priority review queue — real queue items */}
      <PriorityReviewQueue rows={data.queue} />

      {/* Two-column panel: recent activity + ai insights (stillMock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentReviewActivity entries={data.history} />
        {/* AI insights: no backend endpoint — empty state */}
        <AiReviewInsights />
      </div>

      {/* Governance alerts: no backend endpoint — empty state */}
      <GovernanceAlertsPanel />
    </MentorPage>
  );
}
