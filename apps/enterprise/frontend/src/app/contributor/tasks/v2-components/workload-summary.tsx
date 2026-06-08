"use client";

import * as React from "react";
import {
  ListChecks,
  Clock,
  Pause,
  MessageCircleQuestion,
  RotateCcw,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContributorCard } from "@/app/contributor/_shared/primitives";
import { isActive } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

interface Kpi {
  key: string;
  label: string;
  value: string | number;
  caption?: string;
  Icon: LucideIcon;
  tone?: "default" | "warning" | "positive";
}

/**
 * Top KPI strip for the contributor's workload page.
 * Calm operational tiles — no severity rails, no shouty deltas.
 * Tone is "here's where things stand" rather than "act now".
 */
export function WorkloadSummary() {
  const rows = useContributorTaskList();
  const assigned = rows.filter((t) => isActive(t) || t.state === "assigned" || t.state === "revision_requested").length;
  const dueSoon = rows.filter(
    (t) =>
      t.deadlineHoursRemaining > 0 &&
      t.deadlineHoursRemaining <= 24 &&
      ["assigned", "accepted", "in_progress", "awaiting_clarification", "ready_for_submission"].includes(t.state)
  ).length;
  const blocked = rows.filter((t) => t.state === "blocked").length;
  const awaiting = rows.filter((t) => t.state === "awaiting_clarification").length;
  const revisions = rows.filter((t) => t.state === "revision_requested").length;
  const submitted = rows.filter((t) => t.state === "under_review").length;

  const kpis: Kpi[] = [
    { key: "assigned", label: "Assigned work", value: assigned, caption: "Across all states", Icon: ListChecks },
    { key: "due_soon", label: "Due in 24h", value: dueSoon, caption: "Focus here first", Icon: Clock, tone: dueSoon > 0 ? "warning" : undefined },
    { key: "blocked", label: "Paused", value: blocked, caption: "Outside your control", Icon: Pause },
    { key: "awaiting", label: "Awaiting reply", value: awaiting, caption: "From mentors", Icon: MessageCircleQuestion },
    { key: "revisions", label: "Revisions", value: revisions, caption: "Polish notes ready", Icon: RotateCcw, tone: revisions > 0 ? "warning" : undefined },
    { key: "submitted", label: "Submitted", value: submitted, caption: "Under review", Icon: Send },
  ];

  return (
    <ContributorCard padded={false} className="p-4 md:p-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <KpiTile key={k.key} kpi={k} />
        ))}
      </div>
    </ContributorCard>
  );
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  const accent =
    kpi.tone === "positive"
      ? "border-teal-200 bg-gradient-to-br from-teal-50/50 to-white"
      : kpi.tone === "warning"
      ? "border-gold-200 bg-gradient-to-br from-gold-50/50 to-white"
      : "border-beige-200 bg-white";
  const iconWrap =
    kpi.tone === "positive"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : kpi.tone === "warning"
      ? "border-gold-200 bg-gold-50 text-gold-700"
      : "border-beige-200 bg-beige-50 text-beige-700";

  return (
    <div className={cn("rounded-xl border p-4", accent)}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg border", iconWrap)}>
          <kpi.Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-700">{kpi.label}</p>
      <p className="mt-1 font-heading text-[24px] leading-none font-bold tracking-tight text-brown-950 tabular-nums">
        {kpi.value}
      </p>
      {kpi.caption && <p className="mt-1.5 text-[10.5px] text-beige-600 leading-snug">{kpi.caption}</p>}
    </div>
  );
}
