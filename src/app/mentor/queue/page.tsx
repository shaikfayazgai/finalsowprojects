"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, ClipboardCheck, Clock, CheckCircle2, AlertTriangle,
  ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight,
  Inbox, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";

/* ══════════════════════════════════════════ Pill ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════ Configs ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  pending:   { label: "Pending",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)",   dotColor: "bg-teal-500" },
  in_review: { label: "In Review", color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",   dotColor: "bg-gold-500" },
  completed: { label: "Completed", color: "var(--color-forest-700)", bg: "var(--color-forest-50)", dotColor: "bg-forest-500" },
  escalated: { label: "Escalated", color: "var(--danger)",           bg: "var(--danger-light)",    dotColor: "bg-red-500" },
};

const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: "Normal", color: "var(--color-gray-600)",  bg: "var(--color-gray-100)" },
  high:   { label: "High",   color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  urgent: { label: "Urgent", color: "var(--danger)",          bg: "var(--danger-light)" },
};

const reviewTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  initial: { label: "Initial", color: "var(--color-teal-700)",  bg: "var(--color-teal-50)" },
  rework:  { label: "Rework",  color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  final:   { label: "Final",   color: "var(--color-brown-700)", bg: "var(--color-brown-50)" },
};

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeLeft(iso: string) {
  const diff = new Date(iso).getTime() - new Date("2026-03-25T12:00:00Z").getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (diff < 0) return "Overdue";
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

function slaState(iso: string): "overdue" | "urgent" | "normal" {
  const diff = new Date(iso).getTime() - new Date("2026-03-25T12:00:00Z").getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (diff < 0) return "overdue";
  if (hours <= 24) return "urgent";
  return "normal";
}

/* ══════════════════════════════════════════ Mock Data ══════════════════════════════════════════ */

interface QueueItem {
  id: string;
  taskTitle: string;
  contributorId: string;
  projectTitle: string;
  submittedAt: string;
  slaDeadline: string;
  status: string;
  urgency: string;
  reviewType: string;
  submissionVersion: number;
  qualityScore: number | null;
  skillsInvolved: string[];
}

const mockQueue: QueueItem[] = [
  { id: "rev-001", taskTitle: "Build accessible DataTable component with sorting & pagination", contributorId: "Contributor A-7K", projectTitle: "Enterprise Resource Planning Platform", submittedAt: "2026-03-23T09:00:00Z", slaDeadline: "2026-03-26T09:00:00Z", status: "pending", urgency: "urgent", reviewType: "initial", submissionVersion: 1, qualityScore: null, skillsInvolved: ["React", "TypeScript", "Accessibility"] },
  { id: "rev-002", taskTitle: "Implement CRM webhook handler with retry logic", contributorId: "Contributor B-3M", projectTitle: "CRM Integration Suite", submittedAt: "2026-03-22T14:00:00Z", slaDeadline: "2026-03-25T14:00:00Z", status: "pending", urgency: "high", reviewType: "initial", submissionVersion: 1, qualityScore: null, skillsInvolved: ["Node.js", "Webhooks", "Redis"] },
  { id: "rev-003", taskTitle: "Build interactive dashboard charts (rework — area gradient + CSV)", contributorId: "Contributor A-7K", projectTitle: "FinTech Analytics Dashboard", submittedAt: "2026-03-24T11:00:00Z", slaDeadline: "2026-03-27T11:00:00Z", status: "pending", urgency: "normal", reviewType: "rework", submissionVersion: 2, qualityScore: null, skillsInvolved: ["React", "Recharts", "CSV"] },
  { id: "rev-004", taskTitle: "Create data migration script for legacy chart of accounts", contributorId: "Contributor D-9P", projectTitle: "Enterprise Resource Planning Platform", submittedAt: "2026-03-21T16:00:00Z", slaDeadline: "2026-03-24T16:00:00Z", status: "in_review", urgency: "urgent", reviewType: "initial", submissionVersion: 1, qualityScore: null, skillsInvolved: ["PostgreSQL", "Migration", "Python"] },
  { id: "rev-005", taskTitle: "Implement transaction history list with infinite scroll", contributorId: "Contributor C-5L", projectTitle: "Mobile Banking App Redesign", submittedAt: "2026-03-20T10:00:00Z", slaDeadline: "2026-03-23T10:00:00Z", status: "completed", urgency: "normal", reviewType: "initial", submissionVersion: 1, qualityScore: 4.2, skillsInvolved: ["React", "TypeScript", "REST API"] },
  { id: "rev-006", taskTitle: "Build notification service with email and in-app push", contributorId: "Contributor E-2R", projectTitle: "Enterprise Resource Planning Platform", submittedAt: "2026-03-19T08:00:00Z", slaDeadline: "2026-03-22T08:00:00Z", status: "completed", urgency: "normal", reviewType: "initial", submissionVersion: 1, qualityScore: 4.7, skillsInvolved: ["Node.js", "SendGrid", "WebSockets"] },
  { id: "rev-007", taskTitle: "Implement PDF generation service for invoices", contributorId: "Contributor F-8W", projectTitle: "FinTech Analytics Dashboard", submittedAt: "2026-03-24T15:00:00Z", slaDeadline: "2026-03-27T15:00:00Z", status: "pending", urgency: "normal", reviewType: "final", submissionVersion: 3, qualityScore: null, skillsInvolved: ["Node.js", "Puppeteer", "PDF"] },
  { id: "rev-008", taskTitle: "Build authentication flow UI with MFA support", contributorId: "Contributor G-1N", projectTitle: "CRM Integration Suite", submittedAt: "2026-03-23T13:00:00Z", slaDeadline: "2026-03-26T13:00:00Z", status: "escalated", urgency: "urgent", reviewType: "rework", submissionVersion: 2, qualityScore: null, skillsInvolved: ["React", "NextAuth", "MFA"] },
];

/* ══════════════════════════════════════════ Sort ══════════════════════════════════════════ */

type SortField = "task" | "contributor" | "project" | "status" | "urgency" | "type" | "sla" | "submitted";
type SortDir = "asc" | "desc";

const columns: { field: SortField; label: string; align: string }[] = [
  { field: "task",        label: "Task",        align: "left" },
  { field: "contributor", label: "Contributor",  align: "left" },
  { field: "project",     label: "Project",      align: "left" },
  { field: "status",      label: "Status",       align: "left" },
  { field: "urgency",     label: "Urgency",      align: "left" },
  { field: "type",        label: "Type",         align: "left" },
  { field: "sla",         label: "SLA",          align: "left" },
  { field: "submitted",   label: "Submitted",    align: "left" },
];

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function ReviewQueuePage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [urgencyFilter, setUrgencyFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);

  const [sortField, setSortField] = React.useState<SortField>("sla");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const pendingCount = mockQueue.filter((r) => r.status === "pending").length;
  const inReviewCount = mockQueue.filter((r) => r.status === "in_review").length;
  const completedCount = mockQueue.filter((r) => r.status === "completed").length;
  const escalatedCount = mockQueue.filter((r) => r.status === "escalated").length;

  const filteredItems = React.useMemo(() => {
    let list = [...mockQueue];
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (urgencyFilter !== "all") list = list.filter((r) => r.urgency === urgencyFilter);
    if (typeFilter !== "all") list = list.filter((r) => r.reviewType === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        r.taskTitle.toLowerCase().includes(q) || r.contributorId.toLowerCase().includes(q) ||
        r.projectTitle.toLowerCase().includes(q) || r.skillsInvolved.some((s) => s.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "task": cmp = a.taskTitle.localeCompare(b.taskTitle); break;
        case "contributor": cmp = a.contributorId.localeCompare(b.contributorId); break;
        case "project": cmp = a.projectTitle.localeCompare(b.projectTitle); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "urgency": { const o: Record<string, number> = { normal: 0, high: 1, urgent: 2 }; cmp = (o[a.urgency] ?? 0) - (o[b.urgency] ?? 0); break; }
        case "type": cmp = a.reviewType.localeCompare(b.reviewType); break;
        case "sla": cmp = new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime(); break;
        case "submitted": cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [statusFilter, urgencyFilter, typeFilter, searchQuery, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [statusFilter, urgencyFilter, typeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [statusFilter, urgencyFilter, typeFilter].filter((v) => v !== "all").length;

  function clearAllFilters() { setStatusFilter("all"); setUrgencyFilter("all"); setTypeFilter("all"); setSearchQuery(""); }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Review Queue
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Submissions waiting for your review — sorted by SLA deadline
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Pending", value: pendingCount, icon: ClipboardCheck, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "In Review", value: inReviewCount, icon: Eye, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Escalated", value: escalatedCount, icon: AlertTriangle, iconBg: "bg-gradient-to-br from-red-400 to-red-600" },
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

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800">All Submissions</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>{filteredItems.length}</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0", searchFocused ? "w-64" : "w-[220px]")}
            style={{ background: searchFocused ? "white" : "var(--color-gray-50)", border: searchFocused ? "1px solid var(--color-brown-300)" : "1px solid var(--border-soft)", padding: "7px 12px", boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : undefined }}>
            <Search className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <input type="text" placeholder="Search tasks, contributors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="border-none outline-none bg-transparent w-full text-[12.5px] text-gray-700 placeholder:text-gray-400" />
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
            ) : !searchFocused ? (
              <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-px rounded">⌘F</kbd>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="All Urgency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="initial">Initial</SelectItem>
                <SelectItem value="rework">Rework</SelectItem>
                <SelectItem value="final">Final</SelectItem>
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
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const sc = statusConfig[item.status] || statusConfig.pending;
                const urg = urgencyConfig[item.urgency] || urgencyConfig.normal;
                const rt = reviewTypeConfig[item.reviewType] || reviewTypeConfig.initial;
                const sla = slaState(item.slaDeadline);

                return (
                  <tr key={item.id} onClick={() => router.push(`/mentor/queue/${item.id}`)} className="group cursor-pointer transition-colors hover:bg-black/[0.02]" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <td style={{ padding: "13px 16px" }}>
                      <div className="flex items-start gap-3">
                        <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", sc.dotColor)} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-gray-800 truncate max-w-[280px]">{item.taskTitle}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {item.skillsInvolved.slice(0, 3).map((s) => (
                              <span key={s} className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                            {item.skillsInvolved.length > 3 && <span className="font-mono text-[10px] text-gray-400">+{item.skillsInvolved.length - 3}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}><span className="text-[12.5px] text-gray-600">{item.contributorId}</span></td>
                    <td style={{ padding: "13px 16px" }}><span className="text-[12.5px] text-gray-600 truncate block max-w-[160px]">{item.projectTitle}</span></td>
                    <td style={{ padding: "13px 16px" }}><Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill></td>
                    <td style={{ padding: "13px 16px" }}><Pill bg={urg.bg} color={urg.color}>{urg.label}</Pill></td>
                    <td style={{ padding: "13px 16px" }}>
                      <div className="flex items-center gap-1.5">
                        <Pill bg={rt.bg} color={rt.color}>{rt.label}</Pill>
                        {item.submissionVersion > 1 && <span className="font-mono text-[10px] text-gray-400">v{item.submissionVersion}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {item.status === "completed" ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-forest-500" />
                          <span className="text-[11.5px] text-forest-600 font-medium">{item.qualityScore}/5</span>
                        </div>
                      ) : sla === "overdue" ? (
                        <Pill bg="var(--danger-light)" color="var(--danger)">Overdue</Pill>
                      ) : sla === "urgent" ? (
                        <Pill bg="var(--color-gold-50)" color="var(--color-gold-700)"><Clock className="w-3 h-3" /> {timeLeft(item.slaDeadline)}</Pill>
                      ) : (
                        <span className="text-[11.5px] text-gray-500">{timeLeft(item.slaDeadline)}</span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px" }}><span className="text-[11.5px] text-gray-500">{formatDate(item.submittedAt)}</span></td>
                  </tr>
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

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Inbox className="w-6 h-6 text-gray-300" /></div>
              <p className="text-[14px] font-medium text-gray-700 mb-1">No submissions found</p>
              <p className="text-[12px] text-gray-400 text-center max-w-xs mb-4">
                {searchQuery ? "Try adjusting your search query or clearing filters." : activeFilterCount > 0 ? "No submissions match the selected filters." : "New submissions will appear here once contributors submit their work."}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 hover:bg-brown-50 transition-all"><X className="w-3 h-3" /> Clear all filters</button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
