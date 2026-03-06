"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Bot,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";

/* ══════════════════════════════════════════
   I3 — Governance & Risk Dashboard
   Incidents, fraud flags, APG overrides,
   governance score
   ══════════════════════════════════════════ */

/* ── Inline Mock Data ── */
const kpis = [
  { label: "Open Incidents", value: "7", change: "+2", positive: false, icon: AlertTriangle, bg: "bg-gold-50", iconColor: "text-gold-600" },
  { label: "Fraud Flags", value: "3", change: "+1", positive: false, icon: ShieldAlert, bg: "bg-brown-50", iconColor: "text-brown-600" },
  { label: "APG Overrides", value: "12", change: "+4", positive: false, icon: Bot, bg: "bg-teal-50", iconColor: "text-teal-600" },
  { label: "Governance Score", value: "84%", change: "+2.1%", positive: true, icon: ShieldCheck, bg: "bg-forest-50", iconColor: "text-forest-600" },
];

const incidentTimeline = [
  { id: "inc-001", timestamp: "2026-03-06T10:30:00Z", severity: "high" as const, type: "Quality Breach", description: "Deliverable 'Auth Service MFA' failed quality gate — acceptance score 62/85.", actor: "APG System", status: "open" as const },
  { id: "inc-002", timestamp: "2026-03-06T08:15:00Z", severity: "critical" as const, type: "Fraud Flag", description: "Anomalous submission pattern detected for Contributor X-4R — 3 identical files in 2 hours.", actor: "Fraud Engine", status: "investigating" as const },
  { id: "inc-003", timestamp: "2026-03-05T17:45:00Z", severity: "medium" as const, type: "SLA Breach", description: "Review turnaround for 'Database Schema v2' exceeded 48h SLA by 6 hours.", actor: "APG System", status: "open" as const },
  { id: "inc-004", timestamp: "2026-03-05T14:00:00Z", severity: "high" as const, type: "Budget Overrun", description: "CRM Integration project spending at 91% of budget with only 18% completion.", actor: "APG System", status: "escalated" as const },
  { id: "inc-005", timestamp: "2026-03-05T11:30:00Z", severity: "low" as const, type: "Rework Limit", description: "Contributor B-3K has 3 consecutive rework cycles on Auth Service — approaching limit.", actor: "APG System", status: "resolved" as const },
  { id: "inc-006", timestamp: "2026-03-04T16:00:00Z", severity: "medium" as const, type: "Fraud Flag", description: "Unusual login pattern detected — 4 different IPs in 30 minutes for team account.", actor: "Fraud Engine", status: "resolved" as const },
  { id: "inc-007", timestamp: "2026-03-04T09:30:00Z", severity: "critical" as const, type: "Fraud Flag", description: "Evidence files contain metadata from a different contributor — possible submission proxy.", actor: "Fraud Engine", status: "investigating" as const },
];

const riskMatrix = [
  /* [likelihood 0-4, severity 0-4, label, count] */
  { likelihood: 4, severity: 4, label: "Budget overrun + delay", count: 1 },
  { likelihood: 3, severity: 4, label: "Fraud attempt", count: 2 },
  { likelihood: 3, severity: 3, label: "Quality breach", count: 3 },
  { likelihood: 2, severity: 3, label: "SLA violation", count: 2 },
  { likelihood: 4, severity: 2, label: "Rework cycles", count: 4 },
  { likelihood: 1, severity: 4, label: "Data leak", count: 0 },
  { likelihood: 2, severity: 2, label: "Team capacity", count: 1 },
  { likelihood: 3, severity: 1, label: "Minor escalation", count: 3 },
];

const apgInterventions = [
  { id: "apg-001", timestamp: "2026-03-06T10:30:00Z", rule: "Quality Gate Threshold", action: "Flagged for manual review", target: "Auth Service MFA", decision: "rework_requested" as const, overridden: false },
  { id: "apg-002", timestamp: "2026-03-05T17:45:00Z", rule: "Response Time SLA", action: "Reassigned to backup reviewer", target: "Database Schema v2", decision: "auto_reassigned" as const, overridden: false },
  { id: "apg-003", timestamp: "2026-03-05T14:00:00Z", rule: "Budget Overrun Alert", action: "Froze non-critical tasks", target: "CRM Integration Module", decision: "auto_freeze" as const, overridden: true },
  { id: "apg-004", timestamp: "2026-03-04T11:00:00Z", rule: "Auto-Escalation", action: "Created escalation ticket", target: "Auth Service MFA", decision: "escalated" as const, overridden: false },
  { id: "apg-005", timestamp: "2026-03-03T16:30:00Z", rule: "Quality Gate Threshold", action: "Auto-approved (score 92/85)", target: "Monorepo Infrastructure", decision: "auto_approved" as const, overridden: false },
  { id: "apg-006", timestamp: "2026-03-03T09:00:00Z", rule: "Rework Limit", action: "Sent warning notification", target: "Contributor B-3K", decision: "warning_sent" as const, overridden: false },
  { id: "apg-007", timestamp: "2026-03-02T14:30:00Z", rule: "Timeline SLA Warning", action: "Alert sent to project manager", target: "Finance Module tasks", decision: "alert_sent" as const, overridden: false },
  { id: "apg-008", timestamp: "2026-03-01T10:00:00Z", rule: "Budget Overrun Alert", action: "Notification to owner", target: "Mobile Banking App", decision: "alert_sent" as const, overridden: true },
];

/* ── Helpers ── */
const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-brown-100", text: "text-brown-800", border: "border-brown-300" },
  high: { bg: "bg-gold-50", text: "text-gold-700", border: "border-gold-300" },
  medium: { bg: "bg-beige-100", text: "text-beige-700", border: "border-beige-300" },
  low: { bg: "bg-forest-50", text: "text-forest-700", border: "border-forest-300" },
};

const statusConfig: Record<string, { variant: "gold" | "brown" | "teal" | "forest" | "beige"; label: string }> = {
  open: { variant: "gold", label: "Open" },
  investigating: { variant: "brown", label: "Investigating" },
  escalated: { variant: "teal", label: "Escalated" },
  resolved: { variant: "forest", label: "Resolved" },
};

const decisionBadge: Record<string, { variant: "forest" | "gold" | "brown" | "teal" | "beige"; label: string }> = {
  rework_requested: { variant: "gold", label: "Rework" },
  auto_reassigned: { variant: "teal", label: "Reassigned" },
  auto_freeze: { variant: "brown", label: "Freeze" },
  escalated: { variant: "brown", label: "Escalated" },
  auto_approved: { variant: "forest", label: "Approved" },
  warning_sent: { variant: "beige", label: "Warning" },
  alert_sent: { variant: "beige", label: "Alert" },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

/* ── Risk Matrix Component ── */
function RiskMatrixGrid() {
  const severityLabels = ["Negligible", "Minor", "Moderate", "Major", "Critical"];
  const likelihoodLabels = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];

  // Map risk items to grid cells
  const cellMap: Record<string, typeof riskMatrix> = {};
  riskMatrix.forEach((r) => {
    const key = `${r.likelihood}-${r.severity}`;
    if (!cellMap[key]) cellMap[key] = [];
    cellMap[key].push(r);
  });

  function cellColor(lik: number, sev: number): string {
    const score = lik + sev;
    if (score >= 7) return "bg-brown-200/80";
    if (score >= 5) return "bg-gold-100/80";
    if (score >= 3) return "bg-beige-100/60";
    return "bg-forest-50/60";
  }

  return (
    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
      <h3 className="text-[14px] font-semibold text-brown-800 mb-1">
        Risk Matrix
      </h3>
      <p className="text-[11px] text-beige-500 mb-4">
        Severity vs likelihood of identified risks
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Column headers (Severity) */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
            <div />
            {severityLabels.map((s) => (
              <div key={s} className="text-center text-[9px] font-semibold text-beige-500 uppercase tracking-wider py-1">
                {s}
              </div>
            ))}
          </div>

          {/* Rows (Likelihood, from top = high to bottom = low) */}
          {[4, 3, 2, 1, 0].map((lik) => (
            <div key={lik} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
              <div className="flex items-center text-[9px] font-semibold text-beige-500 uppercase tracking-wider pr-1 text-right">
                {likelihoodLabels[lik]}
              </div>
              {[0, 1, 2, 3, 4].map((sev) => {
                const items = cellMap[`${lik}-${sev}`] || [];
                return (
                  <div
                    key={sev}
                    className={cn(
                      "h-12 rounded-lg flex items-center justify-center relative border border-white/50",
                      cellColor(lik, sev)
                    )}
                  >
                    {items.length > 0 && (
                      <div className="text-center">
                        <span className="text-[11px] font-bold text-brown-800">
                          {items.reduce((s, i) => s + i.count, 0)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Axis labels */}
          <div className="flex items-center justify-between mt-2 px-[80px]">
            <span className="text-[9px] text-beige-400">Low Severity</span>
            <span className="text-[9px] text-beige-400 font-medium">SEVERITY &rarr;</span>
            <span className="text-[9px] text-beige-400">High Severity</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-beige-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm bg-brown-200" />
          <span className="text-[10px] text-beige-500">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm bg-gold-100" />
          <span className="text-[10px] text-beige-500">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm bg-beige-100" />
          <span className="text-[10px] text-beige-500">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm bg-forest-50" />
          <span className="text-[10px] text-beige-500">Low</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════ */
export default function GovernanceRiskPage() {
  const [incidentFilter, setIncidentFilter] = React.useState<string | null>(null);

  const filteredIncidents = incidentTimeline.filter((inc) => {
    if (!incidentFilter) return true;
    return inc.status === incidentFilter;
  });

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back + header */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/analytics"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal-600 hover:text-teal-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analytics
        </Link>
        <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
          Governance & Risk
        </h1>
        <p className="text-[13px] text-beige-500 mt-1">
          Incident tracking, fraud detection flags, APG autonomous interventions, and risk posture.
        </p>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("w-4 h-4", kpi.iconColor)} />
                </div>
                <div className="flex items-center gap-1">
                  {kpi.positive ? (
                    <ArrowUpRight className="w-3 h-3 text-forest-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-gold-600" />
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      kpi.positive ? "text-forest-600" : "text-gold-600"
                    )}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
              <p className="text-[24px] font-bold text-brown-900 tracking-tight">
                {kpi.value}
              </p>
              <p className="text-[11px] text-beige-500 mt-0.5">{kpi.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Incident Timeline + Risk Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Incident Timeline (3/5) */}
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-semibold text-brown-800">
                  Incident Timeline
                </h3>
                <p className="text-[11px] text-beige-500 mt-0.5">
                  Recent governance events and alerts
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {(["all", "open", "investigating", "escalated", "resolved"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setIncidentFilter(f === "all" ? null : f)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all capitalize",
                      (f === "all" && !incidentFilter) || incidentFilter === f
                        ? "bg-brown-500 text-white border-brown-500"
                        : "bg-white/60 text-brown-600 border-beige-200 hover:border-beige-300"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredIncidents.map((inc) => {
                const sc = severityConfig[inc.severity];
                const st = statusConfig[inc.status];
                return (
                  <div
                    key={inc.id}
                    className={cn(
                      "rounded-xl border p-4 hover:shadow-md transition-all",
                      sc.border, "bg-white/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md uppercase", sc.bg, sc.text)}>
                          {inc.severity}
                        </span>
                        <span className="text-[12px] font-semibold text-brown-800">
                          {inc.type}
                        </span>
                      </div>
                      <Badge variant={st.variant} size="sm" dot>
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-brown-600 leading-relaxed mb-2">
                      {inc.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-beige-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(inc.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        <span>{inc.actor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredIncidents.length === 0 && (
                <div className="text-center py-8">
                  <ShieldCheck className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                  <p className="text-[12px] text-beige-500">No incidents match the filter.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Risk Matrix (2/5) */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <RiskMatrixGrid />
        </motion.div>
      </div>

      {/* ── APG Intervention Log ── */}
      <motion.div variants={fadeUp}>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-beige-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-500" />
              <h3 className="text-[14px] font-semibold text-brown-800">
                APG Intervention Log
              </h3>
              <Badge variant="teal" size="sm">{apgInterventions.length}</Badge>
            </div>
            <span className="text-[10px] font-medium text-beige-500">
              Automated governance actions
            </span>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-beige-50 text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">Rule</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-1 text-center">Decision</div>
            <div className="col-span-2 text-center">Override</div>
          </div>

          {/* Table Rows */}
          {apgInterventions.map((apg) => {
            const db = decisionBadge[apg.decision] || decisionBadge.alert_sent;
            return (
              <div
                key={apg.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-3 border-b border-beige-50 last:border-0 hover:bg-beige-50/40 transition-colors items-center"
              >
                <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-beige-500">
                  <Clock className="w-3 h-3 text-beige-400 shrink-0" />
                  {formatTime(apg.timestamp)}
                </div>
                <div className="col-span-2 text-[11px] font-medium text-brown-700 truncate">
                  {apg.rule}
                </div>
                <div className="col-span-3 text-[11px] text-brown-600 truncate">
                  {apg.action}
                </div>
                <div className="col-span-2 text-[11px] text-beige-600 truncate">
                  {apg.target}
                </div>
                <div className="col-span-1 text-center">
                  <Badge variant={db.variant} size="sm">
                    {db.label}
                  </Badge>
                </div>
                <div className="col-span-2 text-center">
                  {apg.overridden ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-md">
                      <RotateCcw className="w-3 h-3" />
                      Overridden
                    </span>
                  ) : (
                    <span className="text-[10px] text-beige-400">
                      --
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
