"use client";

/**
 * Escalation queue — spec doc 03 §5.F.1.
 * Visible only to senior + lead mentors. Mock filters by status.
 */

import * as React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Timer } from "lucide-react";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import type { MockEscalation } from "@/mocks/mentor";
import { listMentorEscalations, type MentorEscalation } from "@/lib/api/mentor";
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

/** Map the backend escalation `category` → the UI's escalation type. */
function categoryToType(category?: string): MockEscalation["type"] {
  switch ((category ?? "").toLowerCase()) {
    case "quality": return "sla_breach";
    case "conduct": return "conflict";
    case "technical": return "dispute";
    default: return "dispute";
  }
}

/** Map a real backend escalation row → the MockEscalation shape the UI renders. */
function backendEscalationToMock(e: MentorEscalation): MockEscalation {
  const created = e.created_at ?? new Date().toISOString();
  const status: MockEscalation["status"] =
    e.status === "in_progress" ? "in_review"
    : e.status === "closed" ? "resolved"
    : (e.status as MockEscalation["status"]) ?? "open";
  return {
    id: String(e.id),
    type: categoryToType(e.category ?? undefined),
    severity: (e.priority === "urgent" ? "critical" : e.priority === "high" ? "high" : e.priority === "low" ? "low" : "medium") as MockEscalation["severity"],
    status,
    openedAt: created,
    resolvedAt: e.resolved_at ?? undefined,
    assignedTo: e.assignee ?? undefined,
    taskTitle: e.subject || "Escalation",
    contributorName: "—",
    contributorId: e.mentee_id ? String(e.mentee_id) : "",
    project: e.review_id ? `Review #${e.review_id}` : "—",
    originalMentorName: "",
    originalDecision: "rework",
    originalDecisionAt: created,
    rejectReason: e.description ?? undefined,
  };
}

/** Derive the header/KPI metrics from the real escalation list. */
function deriveMetrics(items: MockEscalation[]): EscalationMetrics {
  const open = items.filter((e) => e.status === "open" || e.status === "assigned" || e.status === "in_review").length;
  const cutoff = Date.now() - 30 * 86_400_000;
  const resolved30 = items.filter((e) => e.status === "resolved" && e.resolvedAt && new Date(e.resolvedAt).getTime() >= cutoff);
  let avgHours = 0;
  if (resolved30.length > 0) {
    const total = resolved30.reduce((s, e) => s + (new Date(e.resolvedAt!).getTime() - new Date(e.openedAt).getTime()), 0);
    avgHours = Math.round(total / resolved30.length / 3_600_000);
  }
  return { openCount: open, resolvedLast30: resolved30.length, avgResolveHours: avgHours };
}

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
    const c = new AbortController();
    // Load the REAL backend escalations (scoped to this mentor). On error, show
    // an error banner with an empty list — no mock fallback.
    void (async () => {
      try {
        const real = await listMentorEscalations();
        if (c.signal.aborted) return;
        const mapped = real.map(backendEscalationToMock);
        setItems(mapped);
        setMetrics(deriveMetrics(mapped));
        setError(null);
      } catch (err: unknown) {
        if (c.signal.aborted || (err as { name?: string }).name === "AbortError") return;
        setItems([]);
        setMetrics(null);
        setError("Could not load escalations.");
      }
    })();
    return () => c.abort();
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
