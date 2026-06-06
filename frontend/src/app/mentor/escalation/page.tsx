"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { fetchEscalations } from "@/lib/api/mentor";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, AlertTriangle, Clock, CheckCircle2, RotateCcw,
  ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, ChevronDown,
  Inbox, Shield, Users, Timer, Send,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Textarea } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

/* ══════════════════════════════════════════ Pill ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

/* ══════════════════════════════════════════ Config ══════════════════════════════════════════ */

const typeConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  sla_breach:     { label: "SLA Breach",     color: "var(--danger)",           bg: "var(--danger-light)",    dotColor: "bg-red-500" },
  quality_dispute: { label: "Quality Dispute", color: "var(--color-gold-700)",  bg: "var(--color-gold-50)",   dotColor: "bg-gold-500" },
  grievance:      { label: "Grievance",      color: "var(--color-brown-700)",  bg: "var(--color-brown-50)",  dotColor: "bg-brown-500" },
  reassignment:   { label: "Reassignment",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)",   dotColor: "bg-teal-500" },
};

const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "var(--danger)",          bg: "var(--danger-light)" },
  high:     { label: "High",     color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  medium:   { label: "Medium",   color: "var(--color-teal-700)",  bg: "var(--color-teal-50)" },
  low:      { label: "Low",      color: "var(--color-gray-600)",  bg: "var(--color-gray-100)" },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  in_progress: { label: "In Progress", color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  resolved:    { label: "Resolved",    color: "var(--color-forest-700)", bg: "var(--color-forest-50)" },
};

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

/* ══════════════════════════════════════════ Mock Data ══════════════════════════════════════════ */

interface Escalation {
  id: string;
  type: string;
  urgency: string;
  status: string;
  taskTitle: string;
  contributorId: string;
  projectTitle: string;
  escalatedAt: string;
  description: string;
  relatedSubmissionId?: string;
}

/** Map a backend escalation row (mentor-service) → Escalation. */
function mapEscalation(r: Record<string, unknown>): Escalation {
  const g = <T,>(k: string, d: T): T => (r[k] === undefined || r[k] === null ? d : (r[k] as T));
  return {
    id: String(g("id", "")),
    type: g("category", "general"),
    urgency: g("priority", "normal"),
    status: g("status", "open"),
    taskTitle: g("subject", "Untitled"),
    contributorId: String(g("mentee_id", "—")),
    projectTitle: g("assignee", "—"),
    escalatedAt: g("created_at", ""),
    description: g("subject", ""),
    relatedSubmissionId: g("review_id", undefined) ? String(g("review_id", "")) : undefined,
  };
}

const mockEscalations: Escalation[] = [
  { id: "esc-001", type: "sla_breach", urgency: "critical", status: "open", taskTitle: "Create data migration script for legacy chart of accounts", contributorId: "Contributor D-9P", projectTitle: "Enterprise Resource Planning Platform", escalatedAt: "2026-03-24T16:30:00Z", description: "SLA deadline passed without review completion. The submission was received on March 21 but review was not started within the 48-hour window. Contributor has been waiting 3 days for feedback.", relatedSubmissionId: "rev-004" },
  { id: "esc-002", type: "quality_dispute", urgency: "high", status: "open", taskTitle: "Build authentication flow UI with MFA support", contributorId: "Contributor G-1N", projectTitle: "CRM Integration Suite", escalatedAt: "2026-03-24T10:00:00Z", description: "Contributor disputes the rework request. Claims the MFA implementation follows the TOTP standard as specified. Reviewer cited 'non-standard approach' but contributor has provided RFC 6238 compliance evidence.", relatedSubmissionId: "rev-008" },
  { id: "esc-003", type: "grievance", urgency: "high", status: "in_progress", taskTitle: "Implement real-time collaboration with WebSocket sync", contributorId: "Contributor D-9P", projectTitle: "Enterprise Resource Planning Platform", escalatedAt: "2026-03-22T09:00:00Z", description: "Contributor filed a grievance regarding the review feedback. States the CRDT requirement was not in the original acceptance criteria, and the reviewer is adding scope during rework. Requests the original acceptance criteria be honored." },
  { id: "esc-004", type: "reassignment", urgency: "medium", status: "open", taskTitle: "Implement PDF generation service for invoices", contributorId: "Contributor F-8W", projectTitle: "FinTech Analytics Dashboard", escalatedAt: "2026-03-23T14:00:00Z", description: "Contributor requested reassignment due to extended medical leave starting March 28. Current progress is at 80% (version 3 submitted). Requesting handoff to another contributor with Puppeteer experience." },
  { id: "esc-005", type: "sla_breach", urgency: "high", status: "resolved", taskTitle: "Build responsive navigation component with mobile drawer", contributorId: "Contributor B-3M", projectTitle: "Mobile Banking App Redesign", escalatedAt: "2026-03-16T08:00:00Z", description: "SLA breach due to reviewer unavailability. Review was completed 6 hours past deadline. Resolution: SLA penalty waived for contributor, reviewer workload rebalanced." },
];

/* ══════════════════════════════════════════ Sort ══════════════════════════════════════════ */

type SortField = "type" | "task" | "contributor" | "project" | "urgency" | "status" | "date";
type SortDir = "asc" | "desc";

const columns: { field: SortField; label: string; align: string }[] = [
  { field: "type",        label: "Type",         align: "left" },
  { field: "task",        label: "Task",         align: "left" },
  { field: "contributor", label: "Contributor",   align: "left" },
  { field: "urgency",     label: "Urgency",       align: "left" },
  { field: "status",      label: "Status",        align: "left" },
  { field: "date",        label: "Escalated",     align: "left" },
];

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function EscalationsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [escalations, setEscalations] = React.useState<Escalation[]>(mockEscalations);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchEscalations(token)
      .then((d) => {
        const items = (d?.items ?? []).map((r) => mapEscalation(r as unknown as Record<string, unknown>));
        if (!cancelled && items.length) setEscalations(items);
      })
      .catch(() => { /* keep mock fallback */ });
    return () => { cancelled = true; };
  }, [token]);

  const [typeFilter, setTypeFilter] = React.useState("all");
  const [urgencyFilter, setUrgencyFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

  /* Resolve drawer */
  const [resolveTarget, setResolveTarget] = React.useState<Escalation | null>(null);
  const [resolveNotes, setResolveNotes] = React.useState("");
  const [resolveAction, setResolveAction] = React.useState("resolve");

  const [sortField, setSortField] = React.useState<SortField>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  /* KPIs */
  const openCount = escalations.filter((e) => e.status === "open").length;
  const inProgressCount = escalations.filter((e) => e.status === "in_progress").length;
  const criticalCount = escalations.filter((e) => e.urgency === "critical" && e.status !== "resolved").length;
  const resolvedCount = escalations.filter((e) => e.status === "resolved").length;

  const filteredItems = React.useMemo(() => {
    let list = [...escalations];
    if (typeFilter !== "all") list = list.filter((e) => e.type === typeFilter);
    if (urgencyFilter !== "all") list = list.filter((e) => e.urgency === urgencyFilter);
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) =>
        e.taskTitle.toLowerCase().includes(q) || e.contributorId.toLowerCase().includes(q) ||
        e.projectTitle.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "type": cmp = a.type.localeCompare(b.type); break;
        case "task": cmp = a.taskTitle.localeCompare(b.taskTitle); break;
        case "contributor": cmp = a.contributorId.localeCompare(b.contributorId); break;
        case "urgency": { const o: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 }; cmp = (o[a.urgency] ?? 0) - (o[b.urgency] ?? 0); break; }
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "date": cmp = new Date(a.escalatedAt).getTime() - new Date(b.escalatedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [escalations, typeFilter, urgencyFilter, statusFilter, searchQuery, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [typeFilter, urgencyFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [typeFilter, urgencyFilter, statusFilter].filter((v) => v !== "all").length;

  function clearAllFilters() { setTypeFilter("all"); setUrgencyFilter("all"); setStatusFilter("all"); setSearchQuery(""); }

  function handleResolve() {
    if (!resolveNotes.trim()) { toast.warning("Please provide resolution notes"); return; }
    toast.success("Escalation resolved", `${resolveTarget?.contributorId} has been notified`);
    setResolveTarget(null);
    setResolveNotes("");
    setResolveAction("resolve");
  }

  function handleReassign(esc: Escalation) {
    toast.success("Reassignment initiated", `Task "${esc.taskTitle}" will be reassigned`);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Escalations
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          SLA breaches, disputes, grievances, and reassignment requests requiring your attention
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Open", value: openCount, icon: AlertTriangle, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "In Progress", value: inProgressCount, icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Critical", value: criticalCount, icon: Shield, iconBg: "bg-gradient-to-br from-red-400 to-red-600" },
          { label: "Resolved", value: resolvedCount, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ TABLE CARD ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800">All Escalations</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>{filteredItems.length}</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0", searchFocused ? "w-64" : "w-[220px]")}
            style={{ background: searchFocused ? "white" : "var(--color-gray-50)", border: searchFocused ? "1px solid var(--color-brown-300)" : "1px solid var(--border-soft)", padding: "7px 12px", boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : undefined }}>
            <Search className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <input type="text" placeholder="Search escalations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="border-none outline-none bg-transparent w-full text-[12.5px] text-gray-700 placeholder:text-gray-400" />
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
            ) : !searchFocused ? (
              <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-px rounded">⌘F</kbd>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 130 }}><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sla_breach">SLA Breach</SelectItem>
                <SelectItem value="quality_dispute">Quality Dispute</SelectItem>
                <SelectItem value="grievance">Grievance</SelectItem>
                <SelectItem value="reassignment">Reassignment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}><SelectValue placeholder="All Urgency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                {columns.map((col) => {
                  const active = sortField === col.field;
                  return (
                    <th key={col.field} onClick={() => handleSort(col.field)} className="cursor-pointer select-none transition-colors"
                      style={{ padding: "11px 16px", textAlign: col.align as "left", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "var(--ink-mid)" : "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }}>
                      <div className="flex items-center gap-1">
                        <span>{col.label}</span>
                        <span style={{ opacity: active ? 1 : 0, transition: "opacity 0.15s" }}>
                          {active && sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th style={{ padding: "11px 16px", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((esc) => {
                const tc = typeConfig[esc.type] || typeConfig.sla_breach;
                const uc = urgencyConfig[esc.urgency] || urgencyConfig.medium;
                const sc = statusConfig[esc.status] || statusConfig.open;
                const isExpanded = expandedRow === esc.id;
                const isResolved = esc.status === "resolved";

                return (
                  <React.Fragment key={esc.id}>
                    <tr onClick={() => setExpandedRow(isExpanded ? null : esc.id)} className="group cursor-pointer transition-colors hover:bg-black/[0.02]" style={{ borderBottom: isExpanded ? undefined : "1px solid var(--border-hair)" }}>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", tc.dotColor)} />
                          <Pill bg={tc.bg} color={tc.color}>{tc.label}</Pill>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-gray-800 truncate max-w-[240px]">{esc.taskTitle}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">{esc.projectTitle}</div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><span className="text-[12.5px] text-gray-600">{esc.contributorId}</span></td>
                      <td style={{ padding: "13px 16px" }}><Pill bg={uc.bg} color={uc.color}>{uc.label}</Pill></td>
                      <td style={{ padding: "13px 16px" }}><Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill></td>
                      <td style={{ padding: "13px 16px" }}><span className="text-[11.5px] text-gray-500">{fmtDate(esc.escalatedAt)}</span></td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        {!isResolved && (
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => { setResolveTarget(esc); setResolveNotes(""); setResolveAction("resolve"); }} className="text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">Resolve</button>
                            {esc.type === "reassignment" && (
                              <button onClick={() => handleReassign(esc)} className="text-[11px] font-medium text-teal-500 hover:text-teal-600 transition-colors">Reassign</button>
                            )}
                          </div>
                        )}
                        {isResolved && (
                          <CheckCircle2 className="w-4 h-4 text-forest-500 ml-auto" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <td colSpan={7} className="px-16 py-4" style={{ background: "color-mix(in srgb, var(--color-gray-50) 50%, white)" }}>
                          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Description</div>
                          <p className="text-[12px] text-gray-600 leading-relaxed">{esc.description}</p>
                          {esc.relatedSubmissionId && (
                            <button onClick={() => router.push(`/mentor/queue/${esc.relatedSubmissionId}`)} className="flex items-center gap-1 mt-3 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">
                              View related submission →
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Rows per page</span>
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-7 w-auto rounded-lg bg-white border border-gray-200 px-2.5 text-[11px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 52 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-gray-400">{filteredItems.length > 0 ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredItems.length)} of ${filteredItems.length}` : "0 results"}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Inbox className="w-6 h-6 text-gray-300" /></div>
              <p className="text-[14px] font-medium text-gray-700 mb-1">No escalations found</p>
              <p className="text-[12px] text-gray-400 text-center max-w-xs mb-4">
                {searchQuery ? "Try adjusting your search." : activeFilterCount > 0 ? "No escalations match the selected filters." : "No escalations to handle right now."}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 hover:bg-brown-50 transition-all"><X className="w-3 h-3" /> Clear all filters</button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ RESOLVE DRAWER ═══ */}
      <AnimatePresence>
        {resolveTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setResolveTarget(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <h3 className="text-[16px] font-semibold text-gray-900">Resolve Escalation</h3>
                <button onClick={() => setResolveTarget(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Summary */}
                <div className="space-y-2">
                  {[
                    { label: "Type", value: typeConfig[resolveTarget.type]?.label || resolveTarget.type },
                    { label: "Task", value: resolveTarget.taskTitle },
                    { label: "Contributor", value: resolveTarget.contributorId },
                    { label: "Project", value: resolveTarget.projectTitle },
                    { label: "Urgency", value: urgencyConfig[resolveTarget.urgency]?.label || resolveTarget.urgency },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className="text-[12px] font-medium text-gray-700 truncate max-w-[240px] text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Description</label>
                  <p className="text-[12px] text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">{resolveTarget.description}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Resolution Action</label>
                  <Select value={resolveAction} onValueChange={setResolveAction}>
                    <SelectTrigger className="h-10 rounded-xl bg-white border border-gray-200 px-3.5 text-[13px] text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolve">Resolve — Issue addressed</SelectItem>
                      <SelectItem value="waive">Waive — No penalty applied</SelectItem>
                      <SelectItem value="reassign">Reassign — Transfer to another reviewer</SelectItem>
                      <SelectItem value="escalate_further">Escalate Further — Send to governance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Resolution Notes *</label>
                  <Textarea value={resolveNotes} onChange={(e) => setResolveNotes(e.target.value)} placeholder="Describe the resolution, actions taken, and any follow-up required..." className="min-h-[120px]" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => setResolveTarget(null)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={handleResolve} className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                    <Send className="w-3.5 h-3.5" /> Submit Resolution
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
