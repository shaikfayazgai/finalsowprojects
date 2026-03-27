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
  Zap,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Search,
  ArrowUpDown,
  ArrowUpRight,
  Wallet,
  X,
  ChevronDown,
  Plus,
  Download,
  MessageSquare,
  CalendarDays,
  HelpCircle,
  UserCog,
  ThumbsUp,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import {
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";
import { mockProjects, mockMilestones } from "@/mocks/data/enterprise-projects";
import { RaiseEscalationModal } from "@/components/enterprise/raise-escalation-modal";
import { ResolveExceptionModal } from "@/components/enterprise/resolve-exception-modal";
import type {
  ExceptionType,
  ExceptionSeverity,
  ExceptionStatus,
  ExceptionItem,
  ExceptionRaisedBy,
  RaiseEscalationPayload,
} from "@/types/enterprise";

/* ── Type config — FSD §9.2.1: 10 exception types ── */
const typeConfig: Record<
  ExceptionType,
  { label: string; badge: "danger" | "gold" | "brown" | "teal"; icon: React.ElementType; severity: ExceptionSeverity }
> = {
  task_sla_breach:        { label: "Task SLA Breach",       badge: "danger", icon: Timer,        severity: "high" },
  milestone_breach:       { label: "Milestone Breach",      badge: "danger", icon: Flame,        severity: "critical" },
  rework_deadline_missed: { label: "Rework Deadline Missed", badge: "danger", icon: Clock,       severity: "high" },
  payment_overdue:        { label: "Payment Overdue",       badge: "danger", icon: Wallet,       severity: "critical" },
  quality_concern:        { label: "Quality Concern",       badge: "gold",   icon: TrendingDown, severity: "medium" },
  capacity_flag:          { label: "Capacity Flag",         badge: "gold",   icon: AlertTriangle, severity: "medium" },
  matching_issue:         { label: "Matching Issue",        badge: "brown",  icon: User,         severity: "high" },
  evidence_dispute:       { label: "Evidence Dispute",      badge: "brown",  icon: FileText,     severity: "high" },
  scope_concern:          { label: "Scope Concern",         badge: "gold",   icon: Eye,          severity: "medium" },
  admin_decision_pending: { label: "Admin Decision Pending", badge: "teal",  icon: MessageSquare, severity: "high" },
  overdue:                { label: "Overdue",               badge: "danger", icon: Clock,        severity: "high" },
  payment_delay:          { label: "Payment Delay",         badge: "danger", icon: Wallet,       severity: "high" },
  quality_issue:          { label: "Quality Issue",         badge: "gold",   icon: TrendingDown, severity: "medium" },
  escalation:             { label: "Escalation",            badge: "brown",  icon: AlertTriangle, severity: "high" },
  sla_breach:             { label: "SLA Breach",            badge: "danger", icon: Timer,        severity: "high" },
};

/* ── Severity config — FSD §9.2.1: CRITICAL / HIGH / MEDIUM ── */
const severityConfig: Record<
  ExceptionSeverity,
  { label: string; color: string; border: string; bg: string; dot: string }
> = {
  critical: {
    label: "Critical",
    color: "text-red-700",
    border: "border-l-red-600",
    bg: "bg-red-50",
    dot: "bg-red-600",
  },
  high: {
    label: "High",
    color: "text-danger",
    border: "border-l-danger",
    bg: "bg-danger/10",
    dot: "bg-danger",
  },
  medium: {
    label: "Medium",
    color: "text-gold-700",
    border: "border-l-gold-500",
    bg: "bg-gold-50",
    dot: "bg-gold-500",
  },
};

/* ── Status config — FSD §9.2.5: 4-stage lifecycle ── */
const statusConfig: Record<
  ExceptionStatus,
  { label: string; variant: "danger" | "gold" | "teal" | "forest" }
> = {
  open: { label: "Open", variant: "danger" },
  pending_admin_review: { label: "Pending Admin Review", variant: "gold" },
  pending_enterprise_response: { label: "Pending Enterprise Response", variant: "teal" },
  resolved: { label: "Resolved", variant: "forest" },
  closed: { label: "Closed", variant: "forest" },
};

/* ── Sorting order ── */
const severityOrder: Record<ExceptionSeverity, number> = { critical: 0, high: 1, medium: 2 };
const statusOrder: Record<ExceptionStatus, number> = {
  open: 0,
  pending_admin_review: 1,
  pending_enterprise_response: 2,
  resolved: 3,
  closed: 4,
};

/* ── SLA helpers ── */
function getSlaHoursRemaining(slaDeadline: string): number {
  return (new Date(slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
}

function formatSlaCountdown(slaDeadline: string): string {
  const hours = getSlaHoursRemaining(slaDeadline);
  if (hours <= 0) return "SLA BREACHED";
  if (hours < 1) return `${Math.ceil(hours * 60)}m remaining`;
  if (hours < 24) return `${Math.ceil(hours)}h remaining`;
  return `${Math.ceil(hours / 24)}d remaining`;
}

function getSlaColor(slaDeadline: string): string {
  const hours = getSlaHoursRemaining(slaDeadline);
  if (hours <= 0) return "text-red-700 bg-red-50";
  if (hours < 24) return "text-danger bg-danger/10";
  if (hours < 48) return "text-gold-700 bg-gold-50";
  return "text-beige-600 bg-beige-100";
}

/* ── Age helper ── */
function getExceptionAge(reportedDate: string): string {
  const diffMs = Date.now() - new Date(reportedDate).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "<1h old";
  if (hours < 24) return `${hours}h old`;
  if (days === 1) return "1d old";
  return `${days}d old`;
}

function getRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Mock exceptions — FSD-compliant data ── */
const mockExceptions: ExceptionItem[] = [
  {
    id: "exc-001",
    type: "evidence_dispute",
    severity: "critical",
    status: "open",
    projectId: mockProjects[1]?.id ?? "proj-002",
    projectName: mockProjects[1]?.title ?? "Mobile Banking App Redesign",
    milestoneId: "ms-002",
    milestoneName: "Milestone 2 — Core Features",
    taskId: "task-010",
    taskName: "API Integration Module",
    description:
      "Client escalated: API integration deliverable has failed review twice. Requesting senior mentor reassignment and timeline extension. Production deployment at risk.",
    raisedBy: "enterprise",
    raisedByName: "Enterprise Admin",
    reportedDate: "2026-03-25T10:00:00Z",
    assignedTo: "Contributor I-6T",
    slaDeadline: "2026-03-26T10:00:00Z",
    history: [
      { id: "h1", timestamp: "2026-03-25T10:00:00Z", actor: "Enterprise Admin", action: "Exception raised", toStatus: "open" },
    ],
  },
  {
    id: "exc-002",
    type: "task_sla_breach",
    severity: "high",
    status: "pending_admin_review",
    projectId: mockProjects[3]?.id ?? "proj-004",
    projectName: mockProjects[3]?.title ?? "CRM Integration Module",
    milestoneId: "ms-001",
    milestoneName: "Milestone 1 — Setup",
    taskId: "task-020",
    taskName: "CRM Data Sync Engine",
    description:
      "Review SLA breached: Task evidence pack pending mentor review for 52 hours, exceeding the 48-hour SLA threshold.",
    raisedBy: "agi",
    raisedByName: "APG System",
    reportedDate: "2026-03-25T06:00:00Z",
    assignedTo: "Contributor D-2M",
    slaDeadline: "2026-03-27T06:00:00Z",
    adminNotes: "Under investigation — reassigning reviewer.",
    history: [
      { id: "h2", timestamp: "2026-03-25T06:00:00Z", actor: "APG System", action: "SLA breach auto-detected", toStatus: "open" },
      { id: "h3", timestamp: "2026-03-25T08:00:00Z", actor: "Admin", action: "Moved to admin review", fromStatus: "open", toStatus: "pending_admin_review" },
    ],
  },
  {
    id: "exc-003",
    type: "quality_concern",
    severity: "medium",
    status: "pending_enterprise_response",
    projectId: mockProjects[1]?.id ?? "proj-002",
    projectName: mockProjects[1]?.title ?? "Mobile Banking App Redesign",
    milestoneId: "ms-002",
    milestoneName: "Milestone 2 — Core Features",
    taskId: "task-015",
    taskName: "Biometric Auth Flow",
    description:
      "APG flagged: Review pass rate dropped to 58% over the last 5 submissions. APG quality threshold is 75%. Rework cycle increasing.",
    raisedBy: "agi",
    raisedByName: "APG System",
    reportedDate: "2026-03-24T18:00:00Z",
    assignedTo: "Contributor H-4P",
    slaDeadline: "2026-03-28T18:00:00Z",
    history: [
      { id: "h4", timestamp: "2026-03-24T18:00:00Z", actor: "APG System", action: "Quality threshold breach detected", toStatus: "open" },
      { id: "h5", timestamp: "2026-03-25T09:00:00Z", actor: "Admin", action: "Reviewed and forwarded to enterprise", fromStatus: "open", toStatus: "pending_admin_review" },
      { id: "h6", timestamp: "2026-03-25T14:00:00Z", actor: "Admin", action: "Awaiting enterprise decision on rework approach", fromStatus: "pending_admin_review", toStatus: "pending_enterprise_response" },
    ],
  },
  {
    id: "exc-004",
    type: "overdue",
    severity: "high",
    status: "open",
    projectId: mockProjects[0]?.id ?? "proj-001",
    projectName: mockProjects[0]?.title ?? "Enterprise Resource Planning Platform",
    milestoneId: "ms-003",
    milestoneName: "Milestone 3 — Finance Module",
    taskId: "task-030",
    taskName: "Finance Module - General Ledger",
    description:
      'Milestone "Finance Module" has 3 tasks overdue by an average of 4 days. General Ledger API and Accounts Payable UI are blocking downstream work.',
    raisedBy: "agi",
    raisedByName: "APG System",
    reportedDate: "2026-03-23T08:00:00Z",
    assignedTo: "Contributor A-7X",
    slaDeadline: "2026-03-26T08:00:00Z",
    history: [
      { id: "h7", timestamp: "2026-03-23T08:00:00Z", actor: "APG System", action: "Overdue tasks detected", toStatus: "open" },
    ],
  },
  {
    id: "exc-005",
    type: "payment_delay",
    severity: "high",
    status: "open",
    projectId: mockProjects[0]?.id ?? "proj-001",
    projectName: mockProjects[0]?.title ?? "Enterprise Resource Planning Platform",
    milestoneId: "ms-002",
    milestoneName: "Milestone 2 — Backend Services",
    taskId: "task-025",
    taskName: "Auth Service Payment",
    description:
      "Payment pending for 8 days after evidence approval. Contributor payment release SLA breached. Auto-release in 6 days.",
    raisedBy: "agi",
    raisedByName: "APG System",
    reportedDate: "2026-03-20T12:00:00Z",
    assignedTo: "Contributor C-9R",
    slaDeadline: "2026-03-27T12:00:00Z",
    history: [
      { id: "h8", timestamp: "2026-03-20T12:00:00Z", actor: "APG System", action: "Payment SLA breach detected", toStatus: "open" },
    ],
  },
  {
    id: "exc-006",
    type: "quality_issue",
    severity: "medium",
    status: "resolved",
    projectId: mockProjects[3]?.id ?? "proj-004",
    projectName: mockProjects[3]?.title ?? "CRM Integration Module",
    taskId: "task-035",
    taskName: "Lead Scoring Algorithm",
    description:
      "Quality gate warning: Evidence pack did not include required test coverage report. Contributor notified; resubmission received.",
    raisedBy: "admin",
    raisedByName: "GlimmoraTeam Admin",
    reportedDate: "2026-03-18T09:00:00Z",
    assignedTo: "Contributor B-3K",
    slaDeadline: "2026-03-22T09:00:00Z",
    resolvedAt: "2026-03-20T14:00:00Z",
    resolutionNotes: "Contributor resubmitted evidence pack with complete test coverage report. Quality gate passed on resubmission.",
    resolvedBy: "Admin",
    history: [
      { id: "h9", timestamp: "2026-03-18T09:00:00Z", actor: "Admin", action: "Exception raised", toStatus: "open" },
      { id: "h10", timestamp: "2026-03-18T12:00:00Z", actor: "Admin", action: "Moved to admin review", fromStatus: "open", toStatus: "pending_admin_review" },
      { id: "h11", timestamp: "2026-03-19T10:00:00Z", actor: "Admin", action: "Forwarded to enterprise", fromStatus: "pending_admin_review", toStatus: "pending_enterprise_response" },
      { id: "h12", timestamp: "2026-03-20T14:00:00Z", actor: "Admin", action: "Resolved — resubmission accepted", fromStatus: "pending_enterprise_response", toStatus: "resolved", notes: "Contributor resubmitted evidence pack with complete test coverage report." },
    ],
  },
];

/* ── Simulated user role (toggle for demo) ── */
type ViewRole = "enterprise" | "admin";

/* ── Page-level constants ── */
const ITEMS_PER_PAGE = 10;
const SEARCH_MIN_CHARS = 3;

/* ── Filter Pill component ── */
function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "danger" | "gold" | "beige" | "forest" | "red" | "teal";
}) {
  const colorStyles: Record<string, string> = {
    danger: "bg-danger/10 text-danger border-danger/20",
    red: "bg-red-50 text-red-700 border-red-200",
    gold: "bg-gold-50 text-gold-700 border-gold-200",
    beige: "bg-beige-100 text-beige-600 border-beige-200",
    forest: "bg-forest-50 text-forest-600 border-forest-200",
    teal: "bg-teal-50 text-teal-600 border-teal-200",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
        active
          ? (color ? colorStyles[color] : "bg-brown-100 text-brown-700 border-brown-200")
          : "bg-white/60 text-beige-500 border-beige-200/60 hover:border-beige-300 hover:text-beige-600"
      )}
    >
      {active && <CheckCircle2 className="w-3 h-3" />}
      {label}
    </button>
  );
}

/* ================================================================
   EXCEPTION MANAGEMENT PAGE
   ================================================================ */
type SortKey = "type" | "project" | "task" | "severity" | "status" | "assignedTo" | "reportedDate";

export default function ExceptionsPage() {
  const [activeTypeFilter, setActiveTypeFilter] = React.useState("all");
  const [severityFilters, setSeverityFilters] = React.useState<Set<ExceptionSeverity>>(new Set());
  const [statusFilters, setStatusFilters] = React.useState<Set<ExceptionStatus>>(new Set());
  const [projectFilter, setProjectFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("severity");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);

  /* State overrides (simulating backend mutations) */
  const [exceptions, setExceptions] = React.useState<ExceptionItem[]>(mockExceptions);
  const [selectedException, setSelectedException] = React.useState<ExceptionItem | null>(null);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null);

  /* Modal states */
  const [showRaiseModal, setShowRaiseModal] = React.useState(false);
  const [resolveTarget, setResolveTarget] = React.useState<ExceptionItem | null>(null);
  const [requestInfoTarget, setRequestInfoTarget] = React.useState<ExceptionItem | null>(null);
  const [reassignTarget, setReassignTarget] = React.useState<ExceptionItem | null>(null);
  const [disputeTarget, setDisputeTarget] = React.useState<ExceptionItem | null>(null);

  /* Role toggle for demo */
  const [viewRole, setViewRole] = React.useState<ViewRole>("enterprise");

  /* Hydration guard — date-dependent rendering only after mount */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    setLastRefreshed(new Date());
  }, []);

  /* Auto-refresh every 60 seconds — FSD PP-001 */
  React.useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
      // In production: re-fetch exceptions from API here
    }, 60000);
    return () => clearInterval(interval);
  }, [mounted]);

  /* Toggle severity filter */
  const toggleSeverityFilter = (severity: ExceptionSeverity) => {
    setSeverityFilters((prev) => {
      const next = new Set(prev);
      next.has(severity) ? next.delete(severity) : next.add(severity);
      return next;
    });
    setCurrentPage(1);
  };

  /* Toggle status filter */
  const toggleStatusFilter = (status: ExceptionStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
    setCurrentPage(1);
  };

  /* Get unique projects */
  const uniqueProjects = React.useMemo(() => {
    const projects = new Map<string, string>();
    exceptions.forEach((e) => projects.set(e.projectId, e.projectName));
    return Array.from(projects.entries());
  }, [exceptions]);

  /* Available projects for raise modal */
  const projectOptions = React.useMemo(
    () => uniqueProjects.map(([id, name]) => ({ id, name })),
    [uniqueProjects]
  );

  /* Filter exceptions */
  const filtered = React.useMemo(() => {
    let results = exceptions;

    if (activeTypeFilter !== "all") {
      results = results.filter((e) => e.type === activeTypeFilter);
    }
    if (severityFilters.size > 0) {
      results = results.filter((e) => severityFilters.has(e.severity));
    }
    if (statusFilters.size > 0) {
      results = results.filter((e) => statusFilters.has(e.status));
    }
    if (projectFilter !== "all") {
      results = results.filter((e) => e.projectId === projectFilter);
    }
    // FSD: min 3 chars for search
    if (searchQuery.trim().length >= SEARCH_MIN_CHARS) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (e) =>
          e.projectName.toLowerCase().includes(q) ||
          e.taskName.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.assignedTo.toLowerCase().includes(q)
      );
    }
    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      results = results.filter((e) => new Date(e.reportedDate).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000; // end of day
      results = results.filter((e) => new Date(e.reportedDate).getTime() <= to);
    }

    return results;
  }, [exceptions, activeTypeFilter, severityFilters, statusFilters, projectFilter, searchQuery, dateFrom, dateTo]);

  /* Sort — FSD: Critical → High → Medium, then oldest first */
  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "severity": {
          const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
          if (sevDiff !== 0) return sevDiff;
          return new Date(a.reportedDate).getTime() - new Date(b.reportedDate).getTime();
        }
        case "reportedDate":
          return dir * (new Date(a.reportedDate).getTime() - new Date(b.reportedDate).getTime());
        case "type":
          return dir * a.type.localeCompare(b.type);
        case "project":
          return dir * a.projectName.localeCompare(b.projectName);
        case "task":
          return dir * a.taskName.localeCompare(b.taskName);
        case "status":
          return dir * (statusOrder[a.status] - statusOrder[b.status]);
        case "assignedTo":
          return dir * a.assignedTo.localeCompare(b.assignedTo);
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  /* Pagination */
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  /* Tab counts */
  const tabCounts: Record<string, number> = {
    all: exceptions.length,
    escalation: exceptions.filter((e) => e.type === "escalation").length,
    sla_breach: exceptions.filter((e) => e.type === "sla_breach").length,
    quality_issue: exceptions.filter((e) => e.type === "quality_issue").length,
    overdue: exceptions.filter((e) => e.type === "overdue").length,
    payment_delay: exceptions.filter((e) => e.type === "payment_delay").length,
  };

  /* KPIs */
  const totalCount = exceptions.length;
  const openCount = exceptions.filter((e) => e.status === "open").length;
  const criticalCount = exceptions.filter((e) => e.severity === "critical").length;
  const resolvedCount = exceptions.filter((e) => e.status === "resolved").length;

  const filterTabs: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "escalation", label: "Escalations" },
    { key: "sla_breach", label: "SLA Breaches" },
    { key: "quality_issue", label: "Quality Issues" },
    { key: "overdue", label: "Overdue" },
    { key: "payment_delay", label: "Payment Delays" },
  ];

  const hasActiveFilters =
    severityFilters.size > 0 || statusFilters.size > 0 || projectFilter !== "all" || searchQuery.length >= SEARCH_MIN_CHARS || dateFrom || dateTo;

  /* ── Action Handlers ── */
  const handleStatusTransition = (exc: ExceptionItem, newStatus: ExceptionStatus, notes?: string) => {
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === exc.id
          ? {
              ...e,
              status: newStatus,
              ...(newStatus === "resolved" ? { resolvedAt: new Date().toISOString(), resolutionNotes: notes, resolvedBy: viewRole === "admin" ? "Admin" : "Enterprise" } : {}),
              ...(newStatus === "pending_admin_review" ? { adminNotes: notes } : {}),
              ...(newStatus === "pending_enterprise_response" ? { enterpriseResponse: notes } : {}),
              history: [
                ...e.history,
                {
                  id: `h-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  actor: viewRole === "admin" ? "Admin" : "Enterprise Admin",
                  action: `Status changed to ${statusConfig[newStatus].label}`,
                  fromStatus: e.status,
                  toStatus: newStatus,
                  notes,
                },
              ],
            }
          : e
      )
    );
  };

  const handleResolve = (exc: ExceptionItem) => {
    setResolveTarget(exc);
  };

  const handleConfirmResolve = (notes: string) => {
    if (resolveTarget) {
      handleStatusTransition(resolveTarget, "resolved", notes);
      toast.success("Exception resolved", `${resolveTarget.taskName} marked as resolved`);
      setResolveTarget(null);
    }
  };

  const handleMoveToAdminReview = (exc: ExceptionItem) => {
    handleStatusTransition(exc, "pending_admin_review");
    toast.info("Moved to Admin Review", `${exc.taskName} is now pending admin review`);
  };

  const handleMoveToEnterpriseResponse = (exc: ExceptionItem) => {
    handleStatusTransition(exc, "pending_enterprise_response");
    toast.info("Forwarded to Enterprise", `${exc.taskName} awaiting enterprise response`);
  };

  const handleEscalate = (exc: ExceptionItem) => {
    toast.error("Escalated to Governance", `${exc.taskName} escalated for immediate governance review`);
  };

  const handleRaiseException = (payload: RaiseEscalationPayload) => {
    const project = projectOptions.find((p) => p.id === payload.projectId);
    const newException: ExceptionItem = {
      id: `exc-${Date.now()}`,
      type: payload.type,
      severity: payload.severity,
      status: "open",
      projectId: payload.projectId,
      projectName: project?.name ?? "Unknown Project",
      milestoneId: payload.milestoneId,
      milestoneName: payload.milestoneId ? mockMilestones.find((m) => m.id === payload.milestoneId)?.title : undefined,
      taskId: payload.taskId,
      taskName: payload.taskId || "General",
      description: payload.description,
      raisedBy: viewRole === "admin" ? "admin" : "enterprise",
      raisedByName: viewRole === "admin" ? "GlimmoraTeam Admin" : "Enterprise Admin",
      reportedDate: new Date().toISOString(),
      assignedTo: "Unassigned",
      slaDeadline: new Date(Date.now() + (payload.severity === "critical" ? 24 : payload.severity === "high" ? 48 : 96) * 60 * 60 * 1000).toISOString(),
      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: viewRole === "admin" ? "Admin" : "Enterprise Admin",
          action: "Exception raised",
          toStatus: "open",
        },
      ],
    };
    setExceptions((prev) => [newException, ...prev]);
    toast.success("Exception raised", `New ${payload.severity} ${typeConfig[payload.type].label} created`);
  };

  /* GAP 3: Request More Info (Admin → Enterprise) */
  const handleRequestInfo = (exc: ExceptionItem, question: string) => {
    handleStatusTransition(exc, "pending_enterprise_response", question);
    toast.info("Info Requested", `Request sent to enterprise for: ${exc.taskName}`);
  };

  /* GAP 4: Reassign */
  const handleReassign = (exc: ExceptionItem, newAssignee: string) => {
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === exc.id
          ? {
              ...e,
              assignedTo: newAssignee,
              history: [
                ...e.history,
                {
                  id: `h-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  actor: "Admin",
                  action: `Reassigned to ${newAssignee}`,
                  notes: `Previously assigned to ${exc.assignedTo}`,
                },
              ],
            }
          : e
      )
    );
    toast.info("Reassigned", `${exc.taskName} reassigned to ${newAssignee}`);
  };

  /* GAP 5: Accept (Enterprise resolves with acceptance) */
  const handleAccept = (exc: ExceptionItem, notes: string) => {
    handleStatusTransition(exc, "resolved", notes);
    toast.success("Exception Accepted", `${exc.taskName} accepted and resolved`);
  };

  /* GAP 5: Dispute (Enterprise disputes, keeps in review) */
  const handleDispute = (exc: ExceptionItem, reason: string) => {
    handleStatusTransition(exc, "pending_admin_review", reason);
    toast.error("Exception Disputed", `${exc.taskName} sent back to admin with dispute`);
  };

  const handleExport = () => {
    toast.info("Export started", `Exporting ${filtered.length} exceptions as CSV...`);
    // In production: generate CSV/PDF from filtered data
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
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

        {/* Header with CTA */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-brown-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">Exception Management</h1>
              <p className="text-[13px] text-beige-500 mt-1">
                Global triage queue — escalations, SLA breaches, quality issues, and overdue tasks across all projects.
                {mounted && lastRefreshed && (
                  <span className="ml-2 text-[11px] text-beige-400">Updated {getRelativeTime(lastRefreshed.toISOString())}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Role toggle (dev/demo only) */}
            <div className="flex items-center gap-1 rounded-lg border border-beige-200/60 bg-white/60 p-0.5">
              {(["enterprise", "admin"] as ViewRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setViewRole(role)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all capitalize",
                    viewRole === role ? "bg-brown-100 text-brown-700" : "text-beige-500 hover:text-brown-600"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-beige-200/60 bg-white/60 text-[12px] font-medium text-brown-700 hover:bg-white/80 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={() => setShowRaiseModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-danger to-danger-dark text-white text-[12px] font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Raise Exception
            </button>
          </div>
        </motion.div>

        {/* KPI Summary */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Exceptions", value: totalCount, icon: ShieldAlert, color: "from-brown-400 to-brown-600" },
            { label: "Open", value: openCount, icon: AlertTriangle, color: "from-gold-400 to-gold-600" },
            { label: "Critical", value: criticalCount, icon: Flame, color: "from-red-500 to-red-700" },
            { label: "Resolved", value: resolvedCount, icon: CheckCircle2, color: "from-forest-400 to-forest-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", stat.color)}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">{stat.value}</p>
                <p className="text-[10px] text-beige-500 mt-0.5 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp} className="space-y-3">
          {/* Search bar — FSD: min 3 chars */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by project, task, description... (min 3 characters)"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-10 rounded-xl bg-white/60 border border-beige-200/60 pl-10 pr-4 text-[13px] text-brown-800 placeholder:text-beige-400 transition-all focus:outline-none focus:ring-2 focus:ring-brown-200/40 focus:border-brown-200/60 focus:bg-white/80"
            />
            {searchQuery && searchQuery.length < SEARCH_MIN_CHARS && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-beige-400">
                {SEARCH_MIN_CHARS - searchQuery.length} more chars needed
              </span>
            )}
          </div>

          {/* Multi-select filters */}
          <div className="space-y-2">
            {/* Severity — CRITICAL / HIGH / MEDIUM */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-beige-500 uppercase tracking-wider">Severity:</span>
              <FilterPill label="Critical" active={severityFilters.has("critical")} onClick={() => toggleSeverityFilter("critical")} color="red" />
              <FilterPill label="High" active={severityFilters.has("high")} onClick={() => toggleSeverityFilter("high")} color="danger" />
              <FilterPill label="Medium" active={severityFilters.has("medium")} onClick={() => toggleSeverityFilter("medium")} color="gold" />
            </div>

            {/* Status — 4-stage lifecycle */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-beige-500 uppercase tracking-wider">Status:</span>
              <FilterPill label="Open" active={statusFilters.has("open")} onClick={() => toggleStatusFilter("open")} color="danger" />
              <FilterPill label="Pending Admin Review" active={statusFilters.has("pending_admin_review")} onClick={() => toggleStatusFilter("pending_admin_review")} color="gold" />
              <FilterPill label="Pending Enterprise Response" active={statusFilters.has("pending_enterprise_response")} onClick={() => toggleStatusFilter("pending_enterprise_response")} color="teal" />
              <FilterPill label="Resolved" active={statusFilters.has("resolved")} onClick={() => toggleStatusFilter("resolved")} color="forest" />
            </div>

            {/* Project + Date Range + Clear */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-beige-500 uppercase tracking-wider">Project:</span>
              <div className="relative">
                <select
                  value={projectFilter}
                  onChange={(e) => { setProjectFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none h-8 pl-3 pr-8 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40 cursor-pointer min-w-[140px]"
                >
                  <option value="all">All Projects</option>
                  {uniqueProjects.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-beige-400 pointer-events-none" />
              </div>

              {/* Date range */}
              <span className="text-[11px] font-medium text-beige-500 uppercase tracking-wider ml-2">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="h-8 px-2 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40"
              />
              <span className="text-[11px] font-medium text-beige-500 uppercase tracking-wider">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="h-8 px-2 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40"
              />

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSeverityFilters(new Set());
                    setStatusFilters(new Set());
                    setProjectFilter("all");
                    setSearchQuery("");
                    setDateFrom("");
                    setDateTo("");
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-beige-500 hover:text-brown-700 hover:bg-beige-100 transition-colors ml-2"
                >
                  <X className="w-3 h-3" />
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-0 border-b border-beige-200/60 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTypeFilter(tab.key); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap",
                  activeTypeFilter === tab.key
                    ? "text-brown-800 border-brown-500"
                    : "text-beige-500 border-transparent hover:text-brown-600"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    activeTypeFilter === tab.key ? "bg-brown-100 text-brown-700" : "bg-beige-100 text-beige-500"
                  )}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-forest-400" />
            </div>
            <h3 className="text-[15px] font-bold text-brown-800">No exceptions found</h3>
            <p className="text-[13px] text-beige-500 mt-1 max-w-sm">
              {hasActiveFilters
                ? "No exceptions match your filters. Try adjusting your search criteria."
                : "All projects on track. No escalations, breaches, or overdue tasks."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSeverityFilters(new Set());
                  setStatusFilters(new Set());
                  setProjectFilter("all");
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                  setActiveTypeFilter("all");
                }}
                className="mt-3 text-[12px] text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        )}

        {/* Exceptions Table */}
        {filtered.length > 0 && (
          <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  {(
                    [
                      ["severity", "Severity", ""],
                      ["type", "Type", ""],
                      ["project", "Project", ""],
                      ["task", "Task", ""],
                      ["status", "Status", ""],
                      ["reportedDate", "Age / SLA", "hidden lg:table-cell"],
                      ["assignedTo", "Assigned", "hidden xl:table-cell"],
                    ] as [SortKey, string, string][]
                  ).map(([key, label, responsive]) => (
                    <TableHead key={key} className={responsive}>
                      <button onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-brown-700 transition-colors group">
                        {label}
                        <ArrowUpDown className={cn("w-3 h-3 transition-colors", sortKey === key ? "text-brown-600" : "text-beige-300 group-hover:text-beige-500")} />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((exception) => {
                  const tc = typeConfig[exception.type];
                  const sc = severityConfig[exception.severity];
                  const st = statusConfig[exception.status];
                  const TypeIcon = tc.icon;
                  const slaHours = getSlaHoursRemaining(exception.slaDeadline);

                  return (
                    <TableRow key={exception.id} className={cn("border-l-[3px]", sc.border)}>
                      {/* Severity */}
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md", sc.bg, sc.color)}>
                          <span className={cn("w-2 h-2 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-beige-100">
                            <TypeIcon className="w-3.5 h-3.5 text-beige-600" />
                          </div>
                          <Badge variant={tc.badge} size="sm">{tc.label}</Badge>
                        </div>
                      </TableCell>

                      {/* Project + Milestone */}
                      <TableCell>
                        <Link href={`/enterprise/projects/${exception.projectId}`} className="group">
                          <p className="text-[12px] font-semibold text-brown-900 group-hover:text-teal-700 transition-colors max-w-[160px] truncate">
                            {exception.projectName}
                          </p>
                          {exception.milestoneName && (
                            <p className="text-[10px] text-beige-400 truncate max-w-[160px]">{exception.milestoneName}</p>
                          )}
                        </Link>
                      </TableCell>

                      {/* Task */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-beige-400 shrink-0" />
                          <span className="text-[12px] text-brown-700 max-w-[140px] truncate">{exception.taskName}</span>
                        </div>
                      </TableCell>

                      {/* Status — 4-stage lifecycle */}
                      <TableCell>
                        <Badge variant={st.variant} size="sm" dot>{st.label}</Badge>
                      </TableCell>

                      {/* Age + SLA */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          <span className="text-[11px] text-beige-500 flex items-center gap-1" title={fmtDate(exception.reportedDate)}>
                            <Clock className="w-3 h-3" />
                            {mounted ? getExceptionAge(exception.reportedDate) : "—"}
                          </span>
                          {mounted && exception.status !== "resolved" && (
                            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md inline-flex items-center gap-1", getSlaColor(exception.slaDeadline))}>
                              <Timer className="w-3 h-3" />
                              {formatSlaCountdown(exception.slaDeadline)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Assigned */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-[11px] text-beige-600 flex items-center gap-1">
                          <User className="w-3 h-3 text-beige-400" />
                          {exception.assignedTo}
                        </span>
                      </TableCell>

                      {/* Actions — Role-based */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {/* View Details — always */}
                          <button
                            onClick={() => setSelectedException(exception)}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-brown-100 hover:bg-brown-200 text-brown-700 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {exception.status !== "resolved" && (
                            <>
                              {/* ── Admin actions ── */}
                              {viewRole === "admin" && exception.status === "open" && (
                                <button
                                  onClick={() => handleMoveToAdminReview(exception)}
                                  title="Take for Review"
                                  className="p-1.5 rounded-lg border border-beige-200 bg-white text-gold-600 hover:bg-gold-50 transition-all"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {viewRole === "admin" && exception.status === "pending_admin_review" && (
                                <>
                                  <button
                                    onClick={() => handleMoveToEnterpriseResponse(exception)}
                                    title="Forward to Enterprise"
                                    className="p-1.5 rounded-lg border border-beige-200 bg-white text-teal-600 hover:bg-teal-50 transition-all"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </button>
                                  {/* GAP 3: Request More Info */}
                                  <button
                                    onClick={() => setRequestInfoTarget(exception)}
                                    title="Request More Info"
                                    className="p-1.5 rounded-lg border border-beige-200 bg-white text-brown-600 hover:bg-brown-50 transition-all"
                                  >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* GAP 4: Reassign — Admin only, any non-resolved status */}
                              {viewRole === "admin" && (
                                <button
                                  onClick={() => setReassignTarget(exception)}
                                  title="Reassign"
                                  className="p-1.5 rounded-lg border border-beige-200 bg-white text-brown-500 hover:bg-beige-50 transition-all"
                                >
                                  <UserCog className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* ── Enterprise actions ── */}
                              {viewRole === "enterprise" && exception.status === "open" && (
                                <button
                                  onClick={() => handleMoveToAdminReview(exception)}
                                  title="Submit for Admin Review"
                                  className="p-1.5 rounded-lg border border-beige-200 bg-white text-gold-600 hover:bg-gold-50 transition-all"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* GAP 5: Accept / Dispute — Enterprise when pending their response */}
                              {viewRole === "enterprise" && exception.status === "pending_enterprise_response" && (
                                <>
                                  <button
                                    onClick={() => handleResolve(exception)}
                                    title="Accept & Resolve"
                                    className="p-1.5 rounded-lg border border-beige-200 bg-white text-forest-600 hover:bg-forest-50 transition-all"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDisputeTarget(exception)}
                                    title="Dispute"
                                    className="p-1.5 rounded-lg border border-beige-200 bg-white text-danger hover:bg-danger/10 transition-all"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Resolve — Admin can resolve from review states */}
                              {viewRole === "admin" && (exception.status === "pending_admin_review" || exception.status === "pending_enterprise_response") && (
                                <button
                                  onClick={() => handleResolve(exception)}
                                  title="Resolve"
                                  className="p-1.5 rounded-lg border border-beige-200 bg-white text-forest-600 hover:bg-forest-50 transition-all"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Escalate — available for any unresolved exception */}
                              <button
                                onClick={() => handleEscalate(exception)}
                                title="Escalate to Governance"
                                className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-beige-200/40">
                <span className="text-[11px] text-beige-500">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-beige-200/60 bg-white/60 text-brown-700 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-[11px] font-medium transition-all",
                        page === currentPage ? "bg-brown-100 text-brown-700 border border-brown-200" : "text-beige-500 hover:bg-beige-100"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-beige-200/60 bg-white/60 text-brown-700 hover:bg-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Exception Detail Dialog */}
      <Dialog open={!!selectedException} onOpenChange={() => setSelectedException(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedException && (
                <>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", severityConfig[selectedException.severity].bg)}>
                    {React.createElement(typeConfig[selectedException.type].icon, {
                      className: cn("w-5 h-5", severityConfig[selectedException.severity].color),
                    })}
                  </div>
                  <div>
                    <DialogTitle className="text-[16px] font-bold text-brown-900">
                      {typeConfig[selectedException.type].label}
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-beige-500">
                      {selectedException.projectName} / {selectedException.taskName}
                    </DialogDescription>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>
          {selectedException && (
            <div className="space-y-4 py-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md", severityConfig[selectedException.severity].bg, severityConfig[selectedException.severity].color)}>
                  {severityConfig[selectedException.severity].label} Severity
                </span>
                <Badge variant={statusConfig[selectedException.status].variant} size="sm" dot>
                  {statusConfig[selectedException.status].label}
                </Badge>
                {mounted && selectedException.status !== "resolved" && (
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1", getSlaColor(selectedException.slaDeadline))}>
                    <Timer className="w-3 h-3" />
                    {formatSlaCountdown(selectedException.slaDeadline)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[13px] text-brown-700 leading-relaxed">{selectedException.description}</p>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-lg bg-beige-50">
                  <span className="text-beige-400 block mb-1">Age</span>
                  <span className="text-brown-700 font-medium">{mounted ? getExceptionAge(selectedException.reportedDate) : "—"}</span>
                </div>
                <div className="p-3 rounded-lg bg-beige-50">
                  <span className="text-beige-400 block mb-1">Raised</span>
                  <span className="text-brown-700 font-medium">{fmtDate(selectedException.reportedDate)}</span>
                </div>
                <div className="p-3 rounded-lg bg-beige-50">
                  <span className="text-beige-400 block mb-1">Raised By</span>
                  <span className="text-brown-700 font-medium">{selectedException.raisedByName}</span>
                </div>
                <div className="p-3 rounded-lg bg-beige-50">
                  <span className="text-beige-400 block mb-1">Assigned To</span>
                  <span className="text-brown-700 font-medium">{selectedException.assignedTo}</span>
                </div>
                {selectedException.milestoneName && (
                  <div className="p-3 rounded-lg bg-beige-50 col-span-2">
                    <span className="text-beige-400 block mb-1">Milestone</span>
                    <span className="text-brown-700 font-medium">{selectedException.milestoneName}</span>
                  </div>
                )}
              </div>

              {/* Resolution notes */}
              {selectedException.resolutionNotes && (
                <div className="p-3 rounded-lg bg-forest-50 border border-forest-200">
                  <span className="text-[11px] font-semibold text-forest-700 block mb-1">Resolution Notes</span>
                  <p className="text-[12px] text-forest-800">{selectedException.resolutionNotes}</p>
                  {selectedException.resolvedBy && (
                    <span className="text-[10px] text-forest-500 mt-1 block">
                      Resolved by {selectedException.resolvedBy} on {selectedException.resolvedAt ? fmtDate(selectedException.resolvedAt) : "—"}
                    </span>
                  )}
                </div>
              )}

              {/* History timeline */}
              {selectedException.history.length > 0 && (
                <div>
                  <h4 className="text-[12px] font-semibold text-brown-700 mb-2">Exception History</h4>
                  <div className="space-y-2">
                    {selectedException.history.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 text-[11px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-beige-400 mt-1.5 shrink-0" />
                        <div>
                          <span className="text-brown-700 font-medium">{entry.action}</span>
                          <span className="text-beige-400 ml-1">by {entry.actor}</span>
                          {entry.notes && <p className="text-beige-500 mt-0.5">{entry.notes}</p>}
                          <span className="text-beige-400 block">{mounted ? getRelativeTime(entry.timestamp) : fmtDate(entry.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedException.status !== "resolved" ? (
                  <>
                    {/* OPEN: Submit for admin review */}
                    {selectedException.status === "open" && (
                      <button
                        onClick={() => {
                          handleMoveToAdminReview(selectedException);
                          setSelectedException(null);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-white text-[12px] font-semibold transition-colors"
                      >
                        Submit for Admin Review
                      </button>
                    )}

                    {/* ADMIN: Forward / Request Info / Resolve */}
                    {viewRole === "admin" && selectedException.status === "pending_admin_review" && (
                      <>
                        <button
                          onClick={() => {
                            handleMoveToEnterpriseResponse(selectedException);
                            setSelectedException(null);
                          }}
                          className="flex-1 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold transition-colors"
                        >
                          Forward to Enterprise
                        </button>
                        <button
                          onClick={() => {
                            setRequestInfoTarget(selectedException);
                            setSelectedException(null);
                          }}
                          className="px-4 py-2 rounded-lg border border-brown-200 text-brown-700 hover:bg-brown-50 text-[12px] font-semibold transition-colors"
                        >
                          Request Info
                        </button>
                      </>
                    )}

                    {/* ADMIN: Reassign (any non-resolved status) */}
                    {viewRole === "admin" && (
                      <button
                        onClick={() => {
                          setReassignTarget(selectedException);
                          setSelectedException(null);
                        }}
                        className="px-4 py-2 rounded-lg border border-beige-200 text-brown-600 hover:bg-beige-50 text-[12px] font-semibold transition-colors"
                      >
                        Reassign
                      </button>
                    )}

                    {/* ADMIN: Resolve from review states */}
                    {viewRole === "admin" && (selectedException.status === "pending_admin_review" || selectedException.status === "pending_enterprise_response") && (
                      <button
                        onClick={() => {
                          handleResolve(selectedException);
                          setSelectedException(null);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[12px] font-semibold transition-colors"
                      >
                        Resolve
                      </button>
                    )}

                    {/* ENTERPRISE: Accept / Dispute when pending their response */}
                    {viewRole === "enterprise" && selectedException.status === "pending_enterprise_response" && (
                      <>
                        <button
                          onClick={() => {
                            handleResolve(selectedException);
                            setSelectedException(null);
                          }}
                          className="flex-1 px-4 py-2 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[12px] font-semibold transition-colors"
                        >
                          Accept & Resolve
                        </button>
                        <button
                          onClick={() => {
                            setDisputeTarget(selectedException);
                            setSelectedException(null);
                          }}
                          className="px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger/10 text-[12px] font-semibold transition-colors"
                        >
                          Dispute
                        </button>
                      </>
                    )}

                    {/* Escalate — always available for non-resolved */}
                    <button
                      onClick={() => {
                        handleEscalate(selectedException);
                        setSelectedException(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 text-[12px] font-semibold transition-colors"
                    >
                      Escalate
                    </button>
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-[12px] text-forest-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    This exception has been resolved
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Raise Escalation Modal */}
      <RaiseEscalationModal
        isOpen={showRaiseModal}
        onClose={() => setShowRaiseModal(false)}
        onSubmit={handleRaiseException}
        projects={projectOptions}
        milestones={mockMilestones.map((m) => ({ id: m.id, title: m.title, projectId: m.projectId }))}
      />

      {/* Resolve Exception Modal */}
      {resolveTarget && (
        <ResolveExceptionModal
          isOpen={!!resolveTarget}
          onClose={() => setResolveTarget(null)}
          onConfirm={handleConfirmResolve}
          exceptionTitle={`${resolveTarget.taskName} — ${resolveTarget.projectName}`}
          severity={resolveTarget.severity}
        />
      )}

      {/* GAP 3: Request More Info Modal (Admin → Enterprise) */}
      <Dialog open={!!requestInfoTarget} onOpenChange={() => setRequestInfoTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-brown-900">Request More Information</DialogTitle>
            <DialogDescription className="text-[12px] text-beige-500">
              {requestInfoTarget?.taskName} — {requestInfoTarget?.projectName}
            </DialogDescription>
          </DialogHeader>
          {requestInfoTarget && (
            <RequestInfoForm
              onSubmit={(question) => {
                handleRequestInfo(requestInfoTarget, question);
                setRequestInfoTarget(null);
              }}
              onCancel={() => setRequestInfoTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* GAP 4: Reassign Modal (Admin) */}
      <Dialog open={!!reassignTarget} onOpenChange={() => setReassignTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-brown-900">Reassign Exception</DialogTitle>
            <DialogDescription className="text-[12px] text-beige-500">
              {reassignTarget?.taskName} — Currently: {reassignTarget?.assignedTo}
            </DialogDescription>
          </DialogHeader>
          {reassignTarget && (
            <ReassignForm
              currentAssignee={reassignTarget.assignedTo}
              onSubmit={(newAssignee) => {
                handleReassign(reassignTarget, newAssignee);
                setReassignTarget(null);
              }}
              onCancel={() => setReassignTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* GAP 5: Dispute Modal (Enterprise) */}
      <Dialog open={!!disputeTarget} onOpenChange={() => setDisputeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold text-brown-900">Dispute Exception</DialogTitle>
            <DialogDescription className="text-[12px] text-beige-500">
              {disputeTarget?.taskName} — {disputeTarget?.projectName}
            </DialogDescription>
          </DialogHeader>
          {disputeTarget && (
            <DisputeForm
              onSubmit={(reason) => {
                handleDispute(disputeTarget, reason);
                setDisputeTarget(null);
              }}
              onCancel={() => setDisputeTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── Inline Form Components for GAP 3/4/5 Modals ── */

function RequestInfoForm({ onSubmit, onCancel }: { onSubmit: (q: string) => void; onCancel: () => void }) {
  const [question, setQuestion] = React.useState("");
  const minLen = 20;
  return (
    <div className="py-4 space-y-3">
      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
        <p className="text-[11px] text-teal-700">This will send the exception back to the enterprise with your question. The status will change to Pending Enterprise Response.</p>
      </div>
      <div>
        <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
          What information do you need? <span className="text-danger">*</span>
          <span className="text-beige-400 font-normal ml-1">(min {minLen} characters)</span>
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Describe what additional information you need from the enterprise..."
          className="w-full min-h-[80px] rounded-xl border border-beige-200/60 bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200/40 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-beige-400">{question.length} characters</span>
          <span className={cn("text-[11px]", question.length >= minLen ? "text-forest-600" : "text-beige-400")}>
            {question.length >= minLen ? "✓ Valid" : `${minLen - question.length} more needed`}
          </span>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-beige-200 text-brown-700 text-[12px] font-semibold hover:bg-beige-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(question.trim())}
          disabled={question.trim().length < minLen}
          className="flex-1 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Request
        </button>
      </div>
    </div>
  );
}

function ReassignForm({ currentAssignee, onSubmit, onCancel }: { currentAssignee: string; onSubmit: (a: string) => void; onCancel: () => void }) {
  const [assignee, setAssignee] = React.useState("");
  const contributors = [
    "Contributor A-7X", "Contributor B-3K", "Contributor C-9R",
    "Contributor D-2M", "Contributor E-5N", "Contributor F-8Q",
    "Contributor G-1L", "Contributor H-4P", "Contributor I-6T",
  ].filter((c) => c !== currentAssignee);

  return (
    <div className="py-4 space-y-3">
      <div>
        <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
          Reassign to <span className="text-danger">*</span>
        </label>
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="w-full h-10 rounded-xl border border-beige-200/60 bg-white/60 px-3 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40"
        >
          <option value="">Select contributor...</option>
          {contributors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-beige-200 text-brown-700 text-[12px] font-semibold hover:bg-beige-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(assignee)}
          disabled={!assignee}
          className="flex-1 px-4 py-2 rounded-lg bg-brown-500 hover:bg-brown-600 text-white text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Reassign
        </button>
      </div>
    </div>
  );
}

function DisputeForm({ onSubmit, onCancel }: { onSubmit: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = React.useState("");
  const minLen = 20;
  return (
    <div className="py-4 space-y-3">
      <div className="rounded-lg bg-danger/5 border border-danger/20 p-3">
        <p className="text-[11px] text-danger">Disputing will send this exception back to Admin Review with your objection. Provide a detailed reason for the dispute.</p>
      </div>
      <div>
        <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
          Dispute Reason <span className="text-danger">*</span>
          <span className="text-beige-400 font-normal ml-1">(min {minLen} characters)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you are disputing this exception finding..."
          className="w-full min-h-[80px] rounded-xl border border-beige-200/60 bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200/40 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-beige-400">{reason.length} characters</span>
          <span className={cn("text-[11px]", reason.length >= minLen ? "text-forest-600" : "text-beige-400")}>
            {reason.length >= minLen ? "✓ Valid" : `${minLen - reason.length} more needed`}
          </span>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-beige-200 text-brown-700 text-[12px] font-semibold hover:bg-beige-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSubmit(reason.trim())}
          disabled={reason.trim().length < minLen}
          className="flex-1 px-4 py-2 rounded-lg bg-danger hover:bg-danger-dark text-white text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Dispute
        </button>
      </div>
    </div>
  );
}
