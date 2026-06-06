"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { fetchMentorHistory } from "@/lib/api/mentor";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, RotateCcw, Ban, Clock, Star,
  ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, ChevronDown,
  Inbox, ClipboardCheck, Timer, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";

/* ══════════════════════════════════════════ Pill ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

/* ══════════════════════════════════════════ Config ══════════════════════════════════════════ */

const decisionConfig: Record<string, { label: string; color: string; bg: string; dotColor: string; icon: React.ElementType }> = {
  accepted: { label: "Accepted", color: "var(--color-forest-700)", bg: "var(--color-forest-50)", dotColor: "bg-forest-500", icon: CheckCircle2 },
  rework:   { label: "Rework",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",   dotColor: "bg-gold-500",   icon: RotateCcw },
  rejected: { label: "Rejected", color: "var(--danger)",           bg: "var(--danger-light)",     dotColor: "bg-red-500",    icon: Ban },
};

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

/* ══════════════════════════════════════════ Mock Data ══════════════════════════════════════════ */

interface ReviewRecord {
  id: string;
  taskTitle: string;
  contributorId: string;
  projectTitle: string;
  decision: string;
  reviewedAt: string;
  reviewTime: string;
  qualityScore: number;
  feedback: string;
  skillsInvolved: string[];
}

/** Map a backend review row (mentor-service /history) → ReviewRecord. */
function mapHistory(r: Record<string, unknown>): ReviewRecord {
  const g = <T,>(k: string, d: T): T => (r[k] === undefined || r[k] === null ? d : (r[k] as T));
  const score = Number(g<number>("score", 0));
  return {
    id: String(g("id", "")),
    taskTitle: g("title", "Untitled"),
    contributorId: g("contributor_name", "—"),
    projectTitle: g("project_title", g("submission_type", "—")),
    decision: g("decision", g("status", "accepted")),
    reviewedAt: g("updated_at", g("created_at", "")),
    reviewTime: g("review_time", "—"),
    qualityScore: isNaN(score) ? 0 : score,
    feedback: g("feedback", ""),
    skillsInvolved: g<string[]>("skills", []),
  };
}

/* ══════════════════════════════════════════ Sort ══════════════════════════════════════════ */

type SortField = "task" | "contributor" | "project" | "decision" | "score" | "time" | "date";
type SortDir = "asc" | "desc";

const columns: { field: SortField; label: string; align: string }[] = [
  { field: "task",        label: "Task",        align: "left" },
  { field: "contributor", label: "Contributor",  align: "left" },
  { field: "project",     label: "Project",      align: "left" },
  { field: "decision",    label: "Decision",     align: "left" },
  { field: "score",       label: "Score",        align: "center" },
  { field: "time",        label: "Review Time",  align: "center" },
  { field: "date",        label: "Date",         align: "left" },
];

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function ReviewHistoryPage() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [history, setHistory] = React.useState<ReviewRecord[]>([]);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMentorHistory(token)
      .then((d) => { if (!cancelled) setHistory((d?.items ?? []).map((r) => mapHistory(r as unknown as Record<string, unknown>))); })
      .catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, [token]);

  const [decisionFilter, setDecisionFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

  const [sortField, setSortField] = React.useState<SortField>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  /* KPIs */
  const totalReviews = history.length;
  const acceptedCount = history.filter((r) => r.decision === "accepted").length;
  const acceptRate = totalReviews > 0 ? Math.round((acceptedCount / totalReviews) * 100) : 0;
  const avgTime = totalReviews > 0 ? (history.reduce((sum, r) => sum + parseFloat(r.reviewTime), 0) / totalReviews).toFixed(1) : "0";
  const avgScore = totalReviews > 0 ? (history.reduce((sum, r) => sum + r.qualityScore, 0) / totalReviews).toFixed(1) : "0";

  /* Filtered + sorted */
  const filteredItems = React.useMemo(() => {
    let list = [...history];
    if (decisionFilter !== "all") list = list.filter((r) => r.decision === decisionFilter);
    if (dateFilter !== "all") {
      const now = new Date("2026-03-25T00:00:00Z");
      const cutoff = new Date(now);
      switch (dateFilter) {
        case "7d": cutoff.setDate(now.getDate() - 7); break;
        case "30d": cutoff.setDate(now.getDate() - 30); break;
        case "90d": cutoff.setDate(now.getDate() - 90); break;
      }
      list = list.filter((r) => new Date(r.reviewedAt) >= cutoff);
    }
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
        case "decision": cmp = a.decision.localeCompare(b.decision); break;
        case "score": cmp = a.qualityScore - b.qualityScore; break;
        case "time": cmp = parseFloat(a.reviewTime) - parseFloat(b.reviewTime); break;
        case "date": cmp = new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [history, decisionFilter, dateFilter, searchQuery, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [decisionFilter, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [decisionFilter, dateFilter].filter((v) => v !== "all").length;

  function clearAllFilters() { setDecisionFilter("all"); setDateFilter("all"); setSearchQuery(""); }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Review History
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Your completed reviews — decisions, scores, and feedback
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total Reviews", value: totalReviews, icon: ClipboardCheck, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Acceptance Rate", value: `${acceptRate}%`, icon: TrendingUp, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Avg Review Time", value: `${avgTime}h`, icon: Timer, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Avg Quality Score", value: `${avgScore}/5`, icon: Star, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
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
            <span className="text-sm font-semibold text-gray-800">Completed Reviews</span>
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
            <Select value={decisionFilter} onValueChange={setDecisionFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="All Decisions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rework">Rework</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="All Time" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
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
                      style={{ padding: "11px 16px", textAlign: col.align as "left" | "center", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? "var(--ink-mid)" : "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }}>
                      <div className="flex items-center gap-1" style={{ justifyContent: col.align === "center" ? "center" : "flex-start" }}>
                        <span>{col.label}</span>
                        <span style={{ opacity: active ? 1 : 0, transition: "opacity 0.15s" }}>
                          {active && sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th style={{ padding: "11px 16px", width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const dc = decisionConfig[item.decision] || decisionConfig.accepted;
                const isExpanded = expandedRow === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <tr onClick={() => setExpandedRow(isExpanded ? null : item.id)} className="group cursor-pointer transition-colors hover:bg-black/[0.02]" style={{ borderBottom: isExpanded ? undefined : "1px solid var(--border-hair)" }}>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="flex items-start gap-3">
                          <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", dc.dotColor)} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-gray-800 truncate max-w-[260px]">{item.taskTitle}</div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {item.skillsInvolved.slice(0, 3).map((s) => (
                                <span key={s} className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><span className="text-[12.5px] text-gray-600">{item.contributorId}</span></td>
                      <td style={{ padding: "13px 16px" }}><span className="text-[12.5px] text-gray-600 truncate block max-w-[150px]">{item.projectTitle}</span></td>
                      <td style={{ padding: "13px 16px" }}><Pill bg={dc.bg} color={dc.color}>{dc.label}</Pill></td>
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <span className={cn("font-mono text-[12px] font-semibold",
                          item.qualityScore >= 4 ? "text-forest-600" : item.qualityScore >= 3 ? "text-gold-600" : "text-red-500"
                        )}>{item.qualityScore}/5</span>
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <span className="font-mono text-[12px] text-gray-500">{item.reviewTime}</span>
                      </td>
                      <td style={{ padding: "13px 16px" }}><span className="text-[11.5px] text-gray-500">{fmtDate(item.reviewedAt)}</span></td>
                      <td style={{ padding: "13px 16px" }}>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-300 transition-transform", isExpanded && "rotate-180")} />
                      </td>
                    </tr>
                    {/* Expanded feedback row */}
                    {isExpanded && (
                      <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <td colSpan={8} className="px-16 py-4" style={{ background: "color-mix(in srgb, var(--color-gray-50) 50%, white)" }}>
                          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Your Feedback</div>
                          <p className="text-[12px] text-gray-600 leading-relaxed">{item.feedback}</p>
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

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Inbox className="w-6 h-6 text-gray-300" /></div>
              <p className="text-[14px] font-medium text-gray-700 mb-1">No reviews found</p>
              <p className="text-[12px] text-gray-400 text-center max-w-xs mb-4">
                {searchQuery ? "Try adjusting your search query or clearing filters." : activeFilterCount > 0 ? "No reviews match the selected filters." : "Completed reviews will appear here."}
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
