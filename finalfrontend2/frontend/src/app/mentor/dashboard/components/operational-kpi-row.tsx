"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, Minus, AlertTriangle, Siren, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OperationalCard } from "./operational-primitives";
import type { OperationalKpi } from "@/mocks/data/mentor-workspace";

/**
 * KPI row split into two zones so urgency reads first:
 *  - Zone A (left, dominant): SLA breach risks · Escalated · Governance holds
 *  - Zone B (right, supporting): Pending · Avg time · Throughput
 *
 * Order is enforced here so the operator's eye always lands on the action
 * KPIs first, regardless of the source ordering in mock data.
 */
const URGENCY_KEYS = ["sla_risk", "escalated", "holds"] as const;
const SUPPORTING_KEYS = ["pending", "avg_time", "throughput"] as const;

const kpiIcon: Record<string, React.ElementType> = {
  sla_risk: AlertTriangle,
  escalated: Siren,
  holds: Lock,
};

function DeltaPill({ kpi, dense = false }: { kpi: OperationalKpi; dense?: boolean }) {
  if (!kpi.delta) return null;
  const Icon =
    kpi.deltaDirection === "up"
      ? ArrowUp
      : kpi.deltaDirection === "down"
      ? ArrowDown
      : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md font-semibold tabular-nums",
        dense ? "text-[10px] px-1 py-px" : "text-[10.5px] px-1.5 py-0.5",
        kpi.deltaTone === "positive" && "bg-forest-50 text-forest-700",
        kpi.deltaTone === "negative" && "bg-red-50 text-red-700",
        kpi.deltaTone === "neutral" && "bg-gray-100 text-gray-600"
      )}
    >
      <Icon className="h-3 w-3" />
      {kpi.delta}
    </span>
  );
}

function UrgencyTile({ kpi }: { kpi: OperationalKpi }) {
  const Icon = kpiIcon[kpi.key] ?? AlertTriangle;
  const isCritical = kpi.emphasis === "critical";
  const isWarning = kpi.emphasis === "warning";
  const railColor = isCritical
    ? "bg-red-500"
    : isWarning
    ? "bg-gold-500"
    : "bg-gray-300";
  const iconTint = isCritical
    ? "text-red-700 bg-red-50 border-red-200"
    : isWarning
    ? "text-gold-700 bg-gold-50 border-gold-200"
    : "text-brown-700 bg-brown-50 border-brown-200";
  const cardBorder = isCritical
    ? "border-red-200"
    : isWarning
    ? "border-gold-200"
    : "border-gray-200";

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white p-4 pl-5 transition-shadow hover:shadow-[0_2px_6px_rgba(76,52,40,0.06)]",
        cardBorder
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", railColor)}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
              iconTint
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            {kpi.label}
          </p>
        </div>
        <DeltaPill kpi={kpi} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <p className="font-heading text-[32px] leading-none font-bold tracking-tight text-brown-950 tabular-nums">
          {kpi.value}
        </p>
        {isCritical && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Action
          </span>
        )}
        {isWarning && (
          <span className="mb-1 inline-flex items-center rounded-md bg-gold-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-700">
            Monitor
          </span>
        )}
      </div>

      {kpi.caption && (
        <p className="mt-2 text-[11.5px] text-gray-600 leading-snug">{kpi.caption}</p>
      )}
    </div>
  );
}

function SupportingTile({ kpi }: { kpi: OperationalKpi }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
          {kpi.label}
        </p>
        <DeltaPill kpi={kpi} dense />
      </div>
      <p className="mt-2 font-heading text-[22px] leading-none font-bold tracking-tight text-brown-950 tabular-nums">
        {kpi.value}
      </p>
      {kpi.caption && (
        <p className="mt-1.5 text-[10.5px] text-gray-500 leading-snug">{kpi.caption}</p>
      )}
    </div>
  );
}

export function OperationalKpiRow({ kpis = [] }: { kpis?: OperationalKpi[] }) {
  const urgency = URGENCY_KEYS.map((k) => kpis.find((x) => x.key === k)).filter(Boolean) as OperationalKpi[];
  const supporting = SUPPORTING_KEYS.map((k) => kpis.find((x) => x.key === k)).filter(Boolean) as OperationalKpi[];

  return (
    <OperationalCard padded={false} className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Urgency zone — dominant */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-[3px] w-6 rounded-full bg-red-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">
              Action required
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {urgency.map((k) => (
              <UrgencyTile key={k.key} kpi={k} />
            ))}
          </div>
        </div>

        {/* Supporting zone */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-[3px] w-6 rounded-full bg-gray-300" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
              Throughput health
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {supporting.map((k) => (
              <SupportingTile key={k.key} kpi={k} />
            ))}
          </div>
        </div>
      </div>
    </OperationalCard>
  );
}
