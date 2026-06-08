"use client";

/**
 * Escalation queue — spec doc 03 §5.F.1.
 * Visible only to senior + lead mentors. Mock filters by status.
 */

import * as React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Timer } from "lucide-react";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import type { MockEscalation } from "@/mocks/mentor";
import { StatusChip } from "@/components/meridian";
import { DashboardSection, KeyMetricCard } from "@/components/meridian/dashboard";
import { MentorListSkeleton } from "@/app/mentor/_components/mentor-skeletons";
import {
  MentorPage,
  MentorPageHeader,
  MentorBanner,
  MentorFilterChip,
  MentorListPanel,
  MentorListRow,
} from "@/app/mentor/_components/mentor-ui";

type EscalationMetrics = { openCount: number; resolvedLast30: number; avgResolveHours: number };

type Filter = "all" | "open" | "sla_breach" | "dispute" | "conflict";

function escalationTypeStatus(type: MockEscalation["type"]) {
  if (type === "sla_breach" || type === "plagiarism") return "error" as const;
  if (type === "dispute") return "warning" as const;
  return "neutral" as const;
}

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

export default function MentorEscalationPage() {
  const { isSeniorOrLead } = useActiveMentor();

  const [filter, setFilter] = React.useState<Filter>("all");
  const [items, setItems] = React.useState<MockEscalation[] | null>(null);
  const [metrics, setMetrics] = React.useState<EscalationMetrics | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSeniorOrLead) return;
    // No mock data — escalations come only from real adjudications routed
    // through the process. Until a real escalations endpoint exists, show an
    // empty queue (never fabricated escalations).
    setItems([]);
    setMetrics(null);
    setError(null);
  }, [isSeniorOrLead]);

  const rows = React.useMemo(() => {
    let list = items ?? [];
    if (filter === "open") list = list.filter((e) => e.status === "open" || e.status === "assigned" || e.status === "in_review");
    else if (filter === "sla_breach") list = list.filter((e) => e.type === "sla_breach");
    else if (filter === "dispute") list = list.filter((e) => e.type === "dispute");
    else if (filter === "conflict") list = list.filter((e) => e.type === "conflict");
    return [...list].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [filter, items]);

  if (!isSeniorOrLead) {
    return (
      <MentorPage>
        <MentorPageHeader title="Escalations" />
        <DashboardSection title="Escalation access" description="Restricted to senior and lead mentors">
          <div className="py-6 text-center">
            <AlertTriangle className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} aria-hidden />
            <p className="font-body text-[13px] font-semibold text-foreground">Escalation access</p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
              Visible to senior and lead mentors only. Your role tier is set by your program manager when you are invited.
            </p>
          </div>
        </DashboardSection>
      </MentorPage>
    );
  }

  return (
    <MentorPage>
      <MentorPageHeader
        title="Escalations"
        meta={
          <>
            <span className="font-medium text-foreground tabular-nums">{metrics?.openCount ?? "…"}</span> open
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            <span className="font-medium text-foreground tabular-nums">{metrics?.resolvedLast30 ?? "…"}</span> resolved last 30d
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Avg time to resolve:{" "}
            <span className="font-medium text-foreground tabular-nums">{metrics?.avgResolveHours ?? "…"}h</span>
          </>
        }
      />

      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KeyMetricCard icon={AlertTriangle} tone="red" label="Open" value={metrics.openCount} />
          <KeyMetricCard icon={CheckCircle2} tone="green" label="Resolved (30d)" value={metrics.resolvedLast30} />
          <KeyMetricCard icon={Timer} tone="amber" label="Avg resolve time" value={`${metrics.avgResolveHours}h`} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <MentorFilterChip selected={filter === "all"} onClick={() => setFilter("all")}>All</MentorFilterChip>
        <MentorFilterChip selected={filter === "open"} onClick={() => setFilter("open")}>Open</MentorFilterChip>
        <MentorFilterChip selected={filter === "sla_breach"} onClick={() => setFilter("sla_breach")}>SLA breach</MentorFilterChip>
        <MentorFilterChip selected={filter === "dispute"} onClick={() => setFilter("dispute")}>Dispute</MentorFilterChip>
        <MentorFilterChip selected={filter === "conflict"} onClick={() => setFilter("conflict")}>Conflict</MentorFilterChip>
      </div>

      {error && (
        <MentorBanner tone="error" icon={<AlertCircle className="h-4 w-4" strokeWidth={2} aria-hidden />}>
          {error}
        </MentorBanner>
      )}

      {items === null && !error ? (
        <MentorListSkeleton rows={3} />
      ) : (
        <MentorListPanel
          title="Escalation queue"
          description={rows.length === 0 ? "No escalations match this filter" : `${rows.length} escalation${rows.length === 1 ? "" : "s"}`}
          empty={
            rows.length === 0 ? (
              <p className="px-5 py-8 text-center font-body text-[12.5px] text-text-tertiary italic">
                No escalations match this filter.
              </p>
            ) : undefined
          }
        >
          {rows.map((e) => (
            <MentorListRow
              key={e.id}
              href={`/mentor/escalation/${e.id}`}
              title={e.taskTitle}
              meta={`${e.contributorName} · ${e.assignedTo ?? "unassigned"}`}
              trailing={
                <div className="flex items-center gap-2 shrink-0">
                  <StatusChip status={escalationTypeStatus(e.type)} size="sm">
                    {e.type.replace("_", " ")}
                  </StatusChip>
                  {e.status === "resolved" && (
                    <StatusChip status="success" size="sm" showDot={false}>
                      closed
                    </StatusChip>
                  )}
                  <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
                    {fmtRelative(e.openedAt)}
                  </span>
                </div>
              }
            />
          ))}
        </MentorListPanel>
      )}
    </MentorPage>
  );
}
