"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Lock,
  Siren,
  ShieldAlert,
  FileWarning,
  Clock,
  ChevronRight,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OperationalCard, SectionHeader } from "./operational-primitives";
import type { GovernanceAlert, GovernanceAlertKind, RiskSeverity } from "@/mocks/data/mentor-workspace";

// No backend endpoint for governance alerts yet — component renders empty state.
const governanceAlerts: GovernanceAlert[] = [];

const kindMeta: Record<
  GovernanceAlertKind,
  { label: string; icon: React.ElementType; tint: string; rail: string }
> = {
  escalation: {
    label: "Escalation",
    icon: Siren,
    tint: "text-red-700 bg-red-50 border-red-200",
    rail: "bg-red-500",
  },
  blocked: {
    label: "Blocked",
    icon: AlertOctagon,
    tint: "text-brown-700 bg-brown-50 border-brown-200",
    rail: "bg-brown-500",
  },
  hold: {
    label: "Hold",
    icon: Lock,
    tint: "text-gold-700 bg-gold-50 border-gold-200",
    rail: "bg-gold-500",
  },
  policy: {
    label: "Policy",
    icon: FileWarning,
    tint: "text-teal-700 bg-teal-50 border-teal-200",
    rail: "bg-teal-500",
  },
};

const severityRank: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };

const kindOrder: GovernanceAlertKind[] = ["escalation", "blocked", "hold", "policy"];

export function GovernanceAlertsPanel() {
  const [filter, setFilter] = React.useState<GovernanceAlertKind | "all">("all");

  const filtered = React.useMemo(() => {
    const list =
      filter === "all" ? governanceAlerts : governanceAlerts.filter((a) => a.kind === filter);
    return [...list].sort((a, b) => {
      const k = kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind);
      if (k !== 0) return k;
      return severityRank[a.severity] - severityRank[b.severity];
    });
  }, [filter]);

  const counts = governanceAlerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.kind] = (acc[a.kind] ?? 0) + 1;
    return acc;
  }, {});

  const highCount = governanceAlerts.filter((a) => a.severity === "high").length;
  const escalationCount = counts["escalation"] ?? 0;

  return (
    <OperationalCard padded={false} className="overflow-hidden flex flex-col">
      <div className="px-5 pt-4">
        <SectionHeader
          title="Governance Alerts"
          caption={`${governanceAlerts.length} open · ${highCount} high severity · ${escalationCount} mentor escalations`}
          trailing={
            <button className="text-[11px] font-semibold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          }
        />

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <FilterChip
            label="All"
            count={governanceAlerts.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {kindOrder.map((k) => (
            <FilterChip
              key={k}
              label={kindMeta[k].label}
              count={counts[k] ?? 0}
              active={filter === k}
              onClick={() => setFilter(k)}
              accent={k === "escalation" ? "danger" : "default"}
            />
          ))}
        </div>
      </div>

      <ul className="px-5 pb-4 space-y-2 overflow-y-auto">
        {filtered.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </ul>
    </OperationalCard>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  accent = "default",
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
        active
          ? accent === "danger"
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-forest-300 bg-forest-50 text-forest-700"
          : accent === "danger" && count > 0
          ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      )}
    >
      {label}
      <span
        className={cn(
          "tabular-nums",
          active ? (accent === "danger" ? "text-red-600" : "text-forest-600") : "text-gray-400"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function severityBadge(severity: RiskSeverity) {
  if (severity === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white">
        <span className="h-1 w-1 rounded-full bg-white" />
        High
      </span>
    );
  }
  if (severity === "medium") {
    return (
      <span className="inline-flex items-center rounded-md border border-gold-300 bg-gold-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gold-800">
        Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-gray-600">
      Low
    </span>
  );
}

function AlertRow({ alert }: { alert: GovernanceAlert }) {
  const meta = kindMeta[alert.kind];
  const Icon = meta.icon;
  const isHighEscalation = alert.kind === "escalation" && alert.severity === "high";

  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border bg-white/80 pl-4 pr-3 py-2.5 hover:bg-white transition-colors cursor-pointer",
        isHighEscalation
          ? "border-red-200 hover:border-red-300 shadow-[0_1px_0_rgba(220,38,38,0.05)]"
          : alert.kind === "blocked"
          ? "border-brown-200/70 hover:border-brown-300"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <span
        aria-hidden
        className={cn("absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full", meta.rail)}
      />
      <span
        className={cn(
          "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border",
          meta.tint
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider",
              meta.tint
            )}
          >
            {meta.label}
          </span>
          {severityBadge(alert.severity)}
          {alert.kind === "blocked" && (
            <span className="inline-flex items-center rounded border border-brown-200 bg-brown-50 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider text-brown-700">
              Workflow halted
            </span>
          )}
        </div>
        <p className="mt-1 text-[12.5px] font-semibold text-brown-950 truncate">{alert.title}</p>
        <p className="mt-0.5 text-[11.5px] text-gray-600 truncate">{alert.context}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-gray-500">
          <span className="truncate">by {alert.raisedBy}</span>
          <span className="inline-flex items-center gap-0.5 shrink-0">
            <Clock className="h-2.5 w-2.5" /> {alert.raisedAt}
          </span>
          {alert.slaRemainingHours !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-[1px] tabular-nums shrink-0",
                alert.slaRemainingHours <= 6
                  ? "border-red-200 bg-red-50 text-red-700 font-bold"
                  : "border-gray-200 bg-gray-50 text-gray-600"
              )}
            >
              <ShieldAlert className="h-2.5 w-2.5" />
              {alert.slaRemainingHours}h to resolve
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
    </li>
  );
}
