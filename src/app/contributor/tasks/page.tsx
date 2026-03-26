"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, Layers, Clock, CheckCircle2, Sparkles,
  Inbox, GraduationCap, ArrowUp, ArrowDown, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { mockContributorTasks, mockContributorProfile } from "@/mocks/data/contributor";
import type { ContributorTaskStatus } from "@/types/contributor";

/* ══════════════════════════════════════════ Pill helper ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════ Status & Priority Configs ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  available:   { label: "Available",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)",    dotColor: "bg-teal-500" },
  assigned:    { label: "Assigned",    color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    dotColor: "bg-gold-500" },
  in_progress: { label: "In Progress", color: "var(--color-brown-700)",  bg: "var(--color-brown-50)",   dotColor: "bg-brown-500" },
  submitted:   { label: "Submitted",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    dotColor: "bg-gold-500" },
  in_review:   { label: "In Review",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    dotColor: "bg-gold-500" },
  accepted:    { label: "Completed",   color: "var(--color-forest-700)", bg: "var(--color-forest-50)",  dotColor: "bg-forest-500" },
  rework:      { label: "Rework",      color: "var(--danger)",           bg: "var(--danger-light)",     dotColor: "bg-red-500" },
  rejected:    { label: "Rejected",    color: "var(--danger)",           bg: "var(--danger-light)",     dotColor: "bg-red-500" },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  medium:   { label: "Medium",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  high:     { label: "High",     color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  critical: { label: "Critical", color: "var(--danger)",           bg: "var(--danger-light)" },
};

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

/* ══════════════════════════════════════════ Sort config ══════════════════════════════════════════ */

type SortField = "task" | "project" | "status" | "priority" | "match" | "dueDate" | "pricing";
type SortDir = "asc" | "desc";

const columns: { field: SortField; label: string; align: string }[] = [
  { field: "task",     label: "Task",     align: "left" },
  { field: "project",  label: "Project",  align: "left" },
  { field: "status",   label: "Status",   align: "left" },
  { field: "priority", label: "Priority", align: "left" },
  { field: "match",    label: "Match",    align: "center" },
  { field: "dueDate",  label: "Due Date", align: "left" },
  { field: "pricing",  label: "Effort",   align: "right" },
];

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function ContributorTasksPage() {
  const router = useRouter();
  const tasks = mockContributorTasks;

  /* Filter state */
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [timeFilter, setTimeFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);

  /* Sort state */
  const [sortField, setSortField] = React.useState<SortField>("match");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  /* Pagination */
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  /* KPI counts */
  const availableCount = tasks.filter((t) => t.status === "available").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress" || t.status === "assigned").length;
  const submittedCount = tasks.filter((t) => t.status === "submitted" || t.status === "in_review").length;
  const completedCount = tasks.filter((t) => t.status === "accepted").length;

  /* Filtered + sorted tasks */
  const filteredTasks = React.useMemo(() => {
    let list = [...tasks];

    /* Status filter */
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "available": list = list.filter((t) => t.status === "available"); break;
        case "in_progress": list = list.filter((t) => t.status === "in_progress" || t.status === "assigned"); break;
        case "submitted": list = list.filter((t) => t.status === "submitted" || t.status === "in_review"); break;
        case "completed": list = list.filter((t) => t.status === "accepted"); break;
        case "rework": list = list.filter((t) => t.status === "rework"); break;
      }
    }

    /* Priority filter */
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    /* Time filter */
    if (timeFilter !== "all") {
      const now = new Date();
      if (timeFilter === "week") {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        list = list.filter((t) => new Date(t.dueDate) <= weekEnd);
      } else if (timeFilter === "month") {
        const monthEnd = new Date(now);
        monthEnd.setMonth(now.getMonth() + 1);
        list = list.filter((t) => new Date(t.dueDate) <= monthEnd);
      }
    }

    /* Search */
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.projectTitle.toLowerCase().includes(q) ||
        t.skillsRequired.some((s) => s.toLowerCase().includes(q))
      );
    }

    /* Sort */
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "task": cmp = a.title.localeCompare(b.title); break;
        case "project": cmp = a.projectTitle.localeCompare(b.projectTitle); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "priority": {
          const order: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
          cmp = (order[a.priority] ?? 0) - (order[b.priority] ?? 0);
          break;
        }
        case "match": cmp = a.matchScore - b.matchScore; break;
        case "dueDate": cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); break;
        case "pricing": cmp = a.pricing.amount - b.pricing.amount; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [tasks, statusFilter, priorityFilter, timeFilter, searchQuery, sortField, sortDir]);

  /* Reset page on filter/search change */
  React.useEffect(() => { setCurrentPage(1); }, [statusFilter, priorityFilter, timeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount = [statusFilter, priorityFilter, timeFilter].filter((v) => v !== "all").length;

  function clearAllFilters() {
    setStatusFilter("all");
    setPriorityFilter("all");
    setTimeFilter("all");
    setSearchQuery("");
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
              Tasks
            </h1>
            <p className="mt-1.5 text-[13px] text-gray-500">
              Browse, accept, and manage your task assignments
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Available", value: availableCount, icon: Sparkles, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "In Progress", value: inProgressCount, icon: Layers, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Submitted", value: submittedCount, icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
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

      {/* ═══ STUDENT TRACK BANNER ═══ */}
      {mockContributorProfile.track === "student" && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-teal-50 rounded-xl px-4 py-3 mb-5">
          <GraduationCap className="w-5 h-5 text-teal-500 shrink-0" />
          <p className="text-[12px] text-teal-700">
            <span className="font-semibold">Student Track</span> — You&apos;re seeing tasks appropriate for your academic level. Tasks have supervised review and count toward academic credits.
          </p>
        </motion.div>
      )}

      {/* ═══ TABLE CARD ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-5">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-800">All Tasks</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>
              {filteredTasks.length}
            </span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          {/* Search */}
          <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0", searchFocused ? "w-64" : "w-[220px]")}
            style={{
              background: searchFocused ? "white" : "var(--color-gray-50)",
              border: searchFocused ? "1px solid var(--color-brown-300)" : "1px solid var(--border-soft)",
              padding: "7px 12px",
              boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : undefined,
            }}
          >
            <Search className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <input type="text" placeholder="Search tasks, projects, skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              className="border-none outline-none bg-transparent w-full text-[12.5px] text-gray-700 placeholder:text-gray-400" />
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
            ) : !searchFocused ? (
              <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-px rounded">⌘F</kbd>
            ) : null}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rework">Rework</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="All Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}><SelectValue placeholder="All Time" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Due This Week</SelectItem>
                <SelectItem value="month">Due This Month</SelectItem>
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
                    <th key={col.field} onClick={() => handleSort(col.field)}
                      className="cursor-pointer select-none transition-colors"
                      style={{
                        padding: "11px 16px", textAlign: col.align as "left" | "center" | "right",
                        fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: active ? "var(--ink-mid)" : "var(--color-gray-400)",
                        background: "color-mix(in srgb, var(--color-gray-100) 40%, white)",
                      }}>
                      <div className="flex items-center gap-1" style={{ justifyContent: col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start" }}>
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
              {paginatedTasks.map((task) => {
                const sc = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.available;
                const pr = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                const days = daysUntil(task.dueDate);
                const isOverdue = days < 0;
                const isUrgent = days >= 0 && days <= 3;

                return (
                  <tr key={task.id} onClick={() => router.push(`/contributor/tasks/${task.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                    style={{ borderBottom: "1px solid var(--border-hair)" }}>

                    {/* TASK */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="flex items-start gap-3">
                        <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", sc.dotColor)} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-gray-800 truncate max-w-[280px]">{task.title}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {task.skillsRequired.slice(0, 3).map((skill) => (
                              <span key={skill} className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{skill}</span>
                            ))}
                            {task.skillsRequired.length > 3 && <span className="font-mono text-[10px] text-gray-400">+{task.skillsRequired.length - 3}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PROJECT */}
                    <td style={{ padding: "13px 16px" }}>
                      <span className="text-[12.5px] text-gray-600 truncate block max-w-[180px]">{task.projectTitle}</span>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: "13px 16px" }}>
                      <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
                    </td>

                    {/* PRIORITY */}
                    <td style={{ padding: "13px 16px" }}>
                      <Pill bg={pr.bg} color={pr.color}>{pr.label}</Pill>
                    </td>

                    {/* MATCH */}
                    <td style={{ padding: "13px 16px", textAlign: "center" }}>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-10 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${task.matchScore}%`,
                              background: task.matchScore >= 90
                                ? "var(--color-forest-500)"
                                : task.matchScore >= 75
                                  ? "var(--color-gold-500)"
                                  : "var(--color-brown-500)",
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-gray-600 w-8 text-right">
                          {task.matchScore}%
                        </span>
                      </div>
                    </td>

                    {/* DUE DATE */}
                    <td style={{ padding: "13px 16px" }}>
                      {isOverdue ? (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                          Overdue
                        </span>
                      ) : isUrgent ? (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "var(--color-gold-50)", color: "var(--color-gold-700)" }}>
                          {formatDate(task.dueDate)}
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-gray-500">
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </td>

                    {/* EFFORT */}
                    <td style={{ padding: "13px 16px", textAlign: "right" }}>
                      <div className="text-right">
                        <span className="text-[13px] font-semibold text-gray-800">{task.estimatedHours}h</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{formatCurrency(task.pricing.amount)}</span>
                      </div>
                    </td>
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
                <span className="font-mono text-[11px] text-gray-400">
                  {filteredTasks.length > 0
                    ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredTasks.length)} of ${filteredTasks.length}`
                    : "0 results"
                  }
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-[14px] font-medium text-gray-700 mb-1">No tasks found</p>
              <p className="text-[12px] text-gray-400 text-center max-w-xs mb-4">
                {searchQuery
                  ? "Try adjusting your search query or clearing filters."
                  : activeFilterCount > 0
                    ? "No tasks match the selected filters. Try different criteria."
                    : "New tasks matching your skills will appear here once available."
                }
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters}
                  className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 hover:bg-brown-50 transition-all">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

      </motion.div>

    </motion.div>
  );
}
