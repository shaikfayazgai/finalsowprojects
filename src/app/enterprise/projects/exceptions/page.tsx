"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Eye,
  Flame,
  ShieldAlert,
  Timer,
  TrendingDown,
  User,
  Wrench,
  Zap,
  CheckCircle2,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui";
import { mockProjects } from "@/mocks/data/enterprise-projects";

/* -- Exception types -- */
type ExceptionType = "escalation" | "sla_breach" | "quality_issue" | "overdue";
type Severity = "critical" | "high" | "warning";
type ExceptionStatus = "open" | "investigating" | "resolved";

interface ExceptionItem {
  id: string;
  type: ExceptionType;
  severity: Severity;
  status: ExceptionStatus;
  projectId: string;
  projectName: string;
  taskName: string;
  description: string;
  reportedDate: string;
  assignedTo: string;
}

/* -- Type config -- */
const typeConfig: Record<
  ExceptionType,
  {
    label: string;
    badge: "danger" | "gold" | "brown" | "teal";
    icon: React.ElementType;
  }
> = {
  escalation: { label: "Escalation", badge: "danger", icon: Flame },
  sla_breach: { label: "SLA Breach", badge: "brown", icon: Timer },
  quality_issue: { label: "Quality Issue", badge: "gold", icon: TrendingDown },
  overdue: { label: "Overdue", badge: "gold", icon: Clock },
};

/* -- Severity config -- */
const severityConfig: Record<
  Severity,
  { label: string; color: string; border: string }
> = {
  critical: {
    label: "Critical",
    color: "bg-brown-100 text-brown-700",
    border: "border-l-brown-600",
  },
  high: {
    label: "High",
    color: "bg-gold-100 text-gold-700",
    border: "border-l-gold-500",
  },
  warning: {
    label: "Warning",
    color: "bg-beige-200 text-beige-600",
    border: "border-l-beige-400",
  },
};

/* -- Status config -- */
const statusConfig: Record<
  ExceptionStatus,
  { label: string; variant: "gold" | "teal" | "forest" }
> = {
  open: { label: "Open", variant: "gold" },
  investigating: { label: "Investigating", variant: "teal" },
  resolved: { label: "Resolved", variant: "forest" },
};

/* -- Filter tabs -- */
const filterTabs: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "escalation", label: "Escalations" },
  { key: "sla_breach", label: "SLA Breaches" },
  { key: "quality_issue", label: "Quality Issues" },
  { key: "overdue", label: "Overdue" },
];

/* -- Mock exceptions across all projects -- */
const mockExceptions: ExceptionItem[] = [
  {
    id: "exc-001",
    type: "escalation",
    severity: "critical",
    status: "open",
    projectId: mockProjects[1]?.id ?? "proj-002",
    projectName: mockProjects[1]?.title ?? "Mobile Banking App Redesign",
    taskName: "API Integration Module",
    description:
      "Client escalated: API integration deliverable has failed review twice. Requesting senior mentor reassignment and timeline extension.",
    reportedDate: "2026-03-06T10:00:00Z",
    assignedTo: "Contributor I-6T",
  },
  {
    id: "exc-002",
    type: "sla_breach",
    severity: "critical",
    status: "investigating",
    projectId: mockProjects[3]?.id ?? "proj-004",
    projectName: mockProjects[3]?.title ?? "CRM Integration Module",
    taskName: "CRM Data Sync Engine",
    description:
      "Review SLA breached: Task evidence pack pending mentor review for 52 hours, exceeding the 48-hour SLA threshold.",
    reportedDate: "2026-03-06T06:00:00Z",
    assignedTo: "Contributor D-2M",
  },
  {
    id: "exc-003",
    type: "quality_issue",
    severity: "high",
    status: "open",
    projectId: mockProjects[1]?.id ?? "proj-002",
    projectName: mockProjects[1]?.title ?? "Mobile Banking App Redesign",
    taskName: "Biometric Auth Flow",
    description:
      "APG flagged: Review pass rate dropped to 58% over the last 5 submissions. APG quality threshold is 75%. Rework cycle increasing.",
    reportedDate: "2026-03-05T18:00:00Z",
    assignedTo: "Contributor H-4P",
  },
  {
    id: "exc-004",
    type: "overdue",
    severity: "high",
    status: "open",
    projectId: mockProjects[0]?.id ?? "proj-001",
    projectName:
      mockProjects[0]?.title ?? "Enterprise Resource Planning Platform",
    taskName: "Finance Module - General Ledger",
    description:
      'Milestone "Finance Module" has 3 tasks overdue by an average of 4 days. General Ledger API and Accounts Payable UI are blocking downstream work.',
    reportedDate: "2026-03-05T08:00:00Z",
    assignedTo: "Contributor A-7X",
  },
  {
    id: "exc-005",
    type: "escalation",
    severity: "critical",
    status: "investigating",
    projectId: mockProjects[3]?.id ?? "proj-004",
    projectName: mockProjects[3]?.title ?? "CRM Integration Module",
    taskName: "Contact Sync Pipeline",
    description:
      "Team capacity alert: 2 of 4 contributors are at part-time availability this week. APG recommends temporary team augmentation.",
    reportedDate: "2026-03-04T14:00:00Z",
    assignedTo: "Contributor E-5L",
  },
  {
    id: "exc-006",
    type: "sla_breach",
    severity: "warning",
    status: "resolved",
    projectId: mockProjects[0]?.id ?? "proj-001",
    projectName:
      mockProjects[0]?.title ?? "Enterprise Resource Planning Platform",
    taskName: "Auth Service Deployment",
    description:
      "Payment release SLA breached: Approved deliverable payment not released within the 72-hour window. Finance action completed.",
    reportedDate: "2026-03-03T12:00:00Z",
    assignedTo: "Contributor C-9R",
  },
  {
    id: "exc-007",
    type: "quality_issue",
    severity: "warning",
    status: "resolved",
    projectId: mockProjects[3]?.id ?? "proj-004",
    projectName: mockProjects[3]?.title ?? "CRM Integration Module",
    taskName: "Lead Scoring Algorithm",
    description:
      "Quality gate warning: Evidence pack did not include required test coverage report. Contributor notified; resubmission received.",
    reportedDate: "2026-03-02T09:00:00Z",
    assignedTo: "Contributor B-3K",
  },
  {
    id: "exc-008",
    type: "overdue",
    severity: "high",
    status: "open",
    projectId: mockProjects[3]?.id ?? "proj-004",
    projectName: mockProjects[3]?.title ?? "CRM Integration Module",
    taskName: "Email Template Engine",
    description:
      "Task overdue by 3 days. Contributor reported blocked on API dependency from upstream CRM Data Sync Engine task.",
    reportedDate: "2026-03-05T16:00:00Z",
    assignedTo: "Contributor D-2M",
  },
];

/* -- Date formatter -- */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ================================================================
   EXCEPTION MANAGEMENT PAGE
   ================================================================ */
export default function ExceptionsPage() {
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"card" | "table">("table");

  const filtered =
    activeFilter === "all"
      ? mockExceptions
      : mockExceptions.filter((e) => e.type === activeFilter);

  /* Tab counts */
  const tabCounts: Record<string, number> = {
    all: mockExceptions.length,
    escalation: mockExceptions.filter((e) => e.type === "escalation").length,
    sla_breach: mockExceptions.filter((e) => e.type === "sla_breach").length,
    quality_issue: mockExceptions.filter((e) => e.type === "quality_issue")
      .length,
    overdue: mockExceptions.filter((e) => e.type === "overdue").length,
  };

  /* KPIs */
  const totalExceptions = mockExceptions.length;
  const openCount = mockExceptions.filter((e) => e.status === "open").length;
  const criticalCount = mockExceptions.filter(
    (e) => e.severity === "critical"
  ).length;
  const resolvedCount = mockExceptions.filter(
    (e) => e.status === "resolved"
  ).length;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/projects"
          className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-brown-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Exception Management
            </h1>
            <p className="text-[13px] text-beige-500 mt-1">
              Track escalations, SLA breaches, quality issues, and overdue tasks
              across all active projects.
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI Summary Row */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Total Exceptions",
            value: totalExceptions,
            icon: ShieldAlert,
            color: "from-brown-400 to-brown-600",
          },
          {
            label: "Open",
            value: openCount,
            icon: AlertTriangle,
            color: "from-gold-400 to-gold-600",
          },
          {
            label: "Critical",
            value: criticalCount,
            icon: Flame,
            color: "from-brown-500 to-brown-700",
          },
          {
            label: "Avg Resolution",
            value: "4.2h",
            icon: Clock,
            color: "from-teal-400 to-teal-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                stat.color
              )}
            >
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-beige-500 mt-0.5 font-medium">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-0 border-b border-beige-200/60"
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-1.5",
              activeFilter === tab.key
                ? "text-brown-800 border-brown-500"
                : "text-beige-500 border-transparent hover:text-brown-600"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                activeFilter === tab.key
                  ? "bg-brown-100 text-brown-700"
                  : "bg-beige-100 text-beige-500"
              )}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Exceptions Table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((exception) => {
              const tc = typeConfig[exception.type];
              const sc = severityConfig[exception.severity];
              const st = statusConfig[exception.status];
              const TypeIcon = tc.icon;

              return (
                <TableRow
                  key={exception.id}
                  className={cn(
                    "border-l-[3px]",
                    sc.border
                  )}
                >
                  {/* Type */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          exception.severity === "critical"
                            ? "bg-brown-100 text-brown-700"
                            : "bg-gold-100 text-gold-700"
                        )}
                      >
                        <TypeIcon className="w-3.5 h-3.5" />
                      </div>
                      <Badge variant={tc.badge} size="sm">
                        {tc.label}
                      </Badge>
                    </div>
                  </TableCell>

                  {/* Project */}
                  <TableCell>
                    <Link
                      href={`/enterprise/projects/${exception.projectId}`}
                      className="group"
                    >
                      <p className="text-[12px] font-semibold text-brown-900 group-hover:text-teal-700 transition-colors max-w-[160px] truncate">
                        {exception.projectName}
                      </p>
                    </Link>
                  </TableCell>

                  {/* Task */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-beige-400 shrink-0" />
                      <span className="text-[12px] text-brown-700 max-w-[140px] truncate">
                        {exception.taskName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Severity */}
                  <TableCell>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                        sc.color
                      )}
                    >
                      {sc.label}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={st.variant} size="sm" dot>
                      {st.label}
                    </Badge>
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell>
                    <span className="text-[11px] text-beige-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-beige-400" />
                      {exception.assignedTo}
                    </span>
                  </TableCell>

                  {/* Reported */}
                  <TableCell>
                    <span className="text-[11px] text-beige-500">
                      {fmtDate(exception.reportedDate)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {exception.status !== "resolved" && (
                        <>
                          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brown-600 hover:bg-brown-700 text-white text-[10px] font-semibold shadow-sm hover:shadow-md transition-all">
                            <Eye className="w-3 h-3" />
                            Investigate
                          </button>
                          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-beige-200 bg-white text-brown-700 text-[10px] font-semibold hover:bg-beige-50 transition-all">
                            <Wrench className="w-3 h-3" />
                            Resolve
                          </button>
                        </>
                      )}
                      {exception.status === "resolved" && (
                        <span className="flex items-center gap-1 text-[10px] text-forest-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-forest-50 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-forest-400" />
            </div>
            <h3 className="text-[16px] font-bold text-brown-900">
              No Exceptions Found
            </h3>
            <p className="text-[13px] text-beige-500 mt-1">
              All clear -- no items match the selected filter.
            </p>
          </div>
        )}
      </motion.div>

      {/* Detail cards below the table for expanded descriptions */}
      <motion.div variants={stagger} className="space-y-3">
        {filtered
          .filter((e) => e.status !== "resolved")
          .slice(0, 3)
          .map((exception) => {
            const tc = typeConfig[exception.type];
            const sc = severityConfig[exception.severity];
            const st = statusConfig[exception.status];
            const TypeIcon = tc.icon;

            return (
              <motion.div
                key={`detail-${exception.id}`}
                variants={scaleIn}
                className={cn(
                  "rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 border-l-[4px]",
                  sc.border
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      exception.severity === "critical"
                        ? "bg-brown-100 text-brown-700"
                        : "bg-gold-100 text-gold-700"
                    )}
                  >
                    <TypeIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={tc.badge} size="sm" dot>
                        {tc.label}
                      </Badge>
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                          sc.color
                        )}
                      >
                        {sc.label}
                      </span>
                      <Badge variant={st.variant} size="sm">
                        {st.label}
                      </Badge>
                    </div>
                    <Link
                      href={`/enterprise/projects/${exception.projectId}`}
                      className="inline-block"
                    >
                      <span className="text-[13px] font-bold text-brown-900 hover:text-teal-700 transition-colors underline decoration-beige-300 underline-offset-2">
                        {exception.projectName}
                      </span>
                    </Link>
                    <span className="text-[11px] text-beige-400 ml-2">
                      / {exception.taskName}
                    </span>
                    <p className="text-[12px] text-beige-600 mt-1.5 leading-relaxed">
                      {exception.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2.5 flex-wrap">
                      <span className="text-[10px] text-beige-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmtDate(exception.reportedDate)}
                      </span>
                      <span className="text-[10px] text-beige-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {exception.assignedTo}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </motion.div>
    </motion.div>
  );
}
