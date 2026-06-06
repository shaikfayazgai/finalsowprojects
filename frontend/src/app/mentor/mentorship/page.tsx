"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { fetchMentees } from "@/lib/api/mentor";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Clock, CheckCircle2, BookOpen,
  ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, ChevronDown,
  Inbox, GraduationCap, Timer, Calendar, Send, MessageSquare, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Textarea, Input } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

/* ══════════════════════════════════════════ Pill ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

/* ══════════════════════════════════════════ Config ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  scheduled:   { label: "Scheduled",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)",   dotColor: "bg-teal-500" },
  in_progress: { label: "In Progress", color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",   dotColor: "bg-gold-500" },
  completed:   { label: "Completed",   color: "var(--color-forest-700)", bg: "var(--color-forest-50)", dotColor: "bg-forest-500" },
  cancelled:   { label: "Cancelled",   color: "var(--color-gray-600)",   bg: "var(--color-gray-100)",  dotColor: "bg-gray-400" },
};

const contextConfig: Record<string, { label: string; color: string; bg: string }> = {
  task_linked: { label: "Task-Linked", color: "var(--color-brown-700)", bg: "var(--color-brown-50)" },
  skill_coaching: { label: "Skill Coaching", color: "var(--color-teal-700)", bg: "var(--color-teal-50)" },
  onboarding: { label: "Onboarding", color: "var(--color-gold-700)", bg: "var(--color-gold-50)" },
};

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

/* ══════════════════════════════════════════ Mock Data ══════════════════════════════════════════ */

interface MentorshipSession {
  id: string;
  contributorId: string;
  context: string;
  taskTitle?: string;
  projectTitle?: string;
  skillArea: string;
  scheduledAt: string;
  duration: string;
  status: string;
  learningVelocity: number;
  verifiedSkills: string[];
  reliabilityScore: number;
  previousNotes?: string;
}

/** Map a backend mentorship row (mentor-service) → MentorshipSession. */
function mapSession(r: Record<string, unknown>): MentorshipSession {
  const g = <T,>(k: string, d: T): T => (r[k] === undefined || r[k] === null ? d : (r[k] as T));
  return {
    id: String(g("id", "")),
    contributorId: g("mentee_name", g("mentee_email", "—")),
    context: g("track", "mentorship"),
    skillArea: g("track", "—"),
    scheduledAt: g("updated_at", g("created_at", "")),
    duration: "—",
    status: g("status", "active"),
    learningVelocity: Number(g<number>("progress", 0)),
    verifiedSkills: g<string[]>("skills", []),
    reliabilityScore: Number(g<number>("progress", 0)),
  };
}

const mockSessions: MentorshipSession[] = [
  { id: "ms-001", contributorId: "Contributor A-7K", context: "task_linked", taskTitle: "Build accessible DataTable component", projectTitle: "Enterprise Resource Planning Platform", skillArea: "React & Accessibility", scheduledAt: "2026-03-25T14:00:00Z", duration: "30 min", status: "scheduled", learningVelocity: 78, verifiedSkills: ["React", "TypeScript"], reliabilityScore: 92, previousNotes: "Contributor is progressing well with React patterns. Focus this session on ARIA attributes and keyboard navigation best practices." },
  { id: "ms-002", contributorId: "Contributor D-9P", context: "skill_coaching", skillArea: "Database & Migration", scheduledAt: "2026-03-25T16:00:00Z", duration: "45 min", status: "scheduled", learningVelocity: 65, verifiedSkills: ["PostgreSQL", "Python"], reliabilityScore: 85, previousNotes: "Contributor needs guidance on writing idempotent migration scripts. Review rollback strategies." },
  { id: "ms-003", contributorId: "Contributor G-1N", context: "task_linked", taskTitle: "Build authentication flow UI with MFA", projectTitle: "CRM Integration Suite", skillArea: "Security & Authentication", scheduledAt: "2026-03-24T10:00:00Z", duration: "30 min", status: "in_progress", learningVelocity: 58, verifiedSkills: ["React", "Node.js"], reliabilityScore: 78 },
  { id: "ms-004", contributorId: "Contributor C-5L", context: "onboarding", skillArea: "Platform Workflow", scheduledAt: "2026-03-23T11:00:00Z", duration: "20 min", status: "completed", learningVelocity: 82, verifiedSkills: ["React", "TypeScript", "REST API"], reliabilityScore: 95, previousNotes: "Onboarding session completed. Contributor is comfortable with submission flow and evidence checklist process." },
  { id: "ms-005", contributorId: "Contributor F-8W", context: "task_linked", taskTitle: "Implement PDF generation service", projectTitle: "FinTech Analytics Dashboard", skillArea: "Node.js & PDF", scheduledAt: "2026-03-22T15:00:00Z", duration: "30 min", status: "completed", learningVelocity: 71, verifiedSkills: ["Node.js", "Puppeteer"], reliabilityScore: 88, previousNotes: "Discussed Puppeteer optimization techniques. Contributor applied suggestions in v3 submission." },
  { id: "ms-006", contributorId: "Contributor B-3M", context: "skill_coaching", skillArea: "CSS & Responsive Design", scheduledAt: "2026-03-21T09:00:00Z", duration: "45 min", status: "completed", learningVelocity: 75, verifiedSkills: ["CSS", "React"], reliabilityScore: 90, previousNotes: "Strong CSS fundamentals. Focus was on container queries and modern responsive patterns." },
];

/* ══════════════════════════════════════════ Sort ══════════════════════════════════════════ */

type SortField = "contributor" | "context" | "skill" | "status" | "date" | "velocity";
type SortDir = "asc" | "desc";

const columns: { field: SortField; label: string; align: string }[] = [
  { field: "contributor", label: "Contributor",     align: "left" },
  { field: "context",     label: "Context",          align: "left" },
  { field: "skill",       label: "Skill Area",       align: "left" },
  { field: "status",      label: "Status",           align: "left" },
  { field: "velocity",    label: "Learning",         align: "center" },
  { field: "date",        label: "Scheduled",        align: "left" },
];

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function MentorshipPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";
  const [sessions, setSessions] = React.useState<MentorshipSession[]>(mockSessions);

  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMentees(token)
      .then((d) => {
        const items = (d?.items ?? []).map((r) => mapSession(r as unknown as Record<string, unknown>));
        if (!cancelled && items.length) setSessions(items);
      })
      .catch(() => { /* keep mock fallback */ });
    return () => { cancelled = true; };
  }, [token]);

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [contextFilter, setContextFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);

  /* Session notes drawer */
  const [notesTarget, setNotesTarget] = React.useState<MentorshipSession | null>(null);
  const [skillGaps, setSkillGaps] = React.useState("");
  const [nextActions, setNextActions] = React.useState("");
  const [strengths, setStrengths] = React.useState("");
  const [sessionNotes, setSessionNotes] = React.useState("");

  const [sortField, setSortField] = React.useState<SortField>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  /* KPIs */
  const scheduledCount = sessions.filter((s) => s.status === "scheduled").length;
  const inProgressCount = sessions.filter((s) => s.status === "in_progress").length;
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const avgVelocity = Math.round(sessions.reduce((sum, s) => sum + s.learningVelocity, 0) / sessions.length);

  const filteredItems = React.useMemo(() => {
    let list = [...sessions];
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (contextFilter !== "all") list = list.filter((s) => s.context === contextFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) =>
        s.contributorId.toLowerCase().includes(q) || s.skillArea.toLowerCase().includes(q) ||
        (s.taskTitle?.toLowerCase().includes(q) ?? false) || (s.projectTitle?.toLowerCase().includes(q) ?? false)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "contributor": cmp = a.contributorId.localeCompare(b.contributorId); break;
        case "context": cmp = a.context.localeCompare(b.context); break;
        case "skill": cmp = a.skillArea.localeCompare(b.skillArea); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "velocity": cmp = a.learningVelocity - b.learningVelocity; break;
        case "date": cmp = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [sessions, statusFilter, contextFilter, searchQuery, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [statusFilter, contextFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [statusFilter, contextFilter].filter((v) => v !== "all").length;

  function clearAllFilters() { setStatusFilter("all"); setContextFilter("all"); setSearchQuery(""); }

  function openNotes(session: MentorshipSession) {
    setNotesTarget(session);
    setSessionNotes("");
    setSkillGaps("");
    setNextActions("");
    setStrengths("");
  }

  function handleCompleteSession() {
    if (!sessionNotes.trim()) { toast.warning("Please add session notes before completing"); return; }
    toast.success("Session completed", `Notes saved for ${notesTarget?.contributorId}`);
    setNotesTarget(null);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Mentorship
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Coaching sessions assigned to you — track contributor progress and provide guidance
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Scheduled", value: scheduledCount, icon: Calendar, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "In Progress", value: inProgressCount, icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Avg Learning", value: `${avgVelocity}%`, icon: GraduationCap, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
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
            <span className="text-sm font-semibold text-gray-800">Mentorship Sessions</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>{filteredItems.length}</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0", searchFocused ? "w-64" : "w-[220px]")}
            style={{ background: searchFocused ? "white" : "var(--color-gray-50)", border: searchFocused ? "1px solid var(--color-brown-300)" : "1px solid var(--border-soft)", padding: "7px 12px", boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : undefined }}>
            <Search className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <input type="text" placeholder="Search contributors, skills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} className="border-none outline-none bg-transparent w-full text-[12.5px] text-gray-700 placeholder:text-gray-400" />
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 130 }}><SelectValue placeholder="All Context" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Context</SelectItem>
                <SelectItem value="task_linked">Task-Linked</SelectItem>
                <SelectItem value="skill_coaching">Skill Coaching</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
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
                <th style={{ padding: "11px 16px", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((session) => {
                const sc = statusConfig[session.status] || statusConfig.scheduled;
                const cc = contextConfig[session.context] || contextConfig.skill_coaching;
                const isExpanded = expandedRow === session.id;

                return (
                  <React.Fragment key={session.id}>
                    <tr onClick={() => setExpandedRow(isExpanded ? null : session.id)} className="group cursor-pointer transition-colors hover:bg-black/[0.02]" style={{ borderBottom: isExpanded ? undefined : "1px solid var(--border-hair)" }}>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="flex items-start gap-3">
                          <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", sc.dotColor)} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-gray-800">{session.contributorId}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">Reliability: {session.reliabilityScore}%</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div>
                          <Pill bg={cc.bg} color={cc.color}>{cc.label}</Pill>
                          {session.taskTitle && (
                            <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[180px]">{session.taskTitle}</div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div>
                          <span className="text-[12.5px] text-gray-700">{session.skillArea}</span>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {session.verifiedSkills.map((s) => (
                              <span key={s} className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill></td>
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-10 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${session.learningVelocity}%`, background: session.learningVelocity >= 75 ? "var(--color-forest-500)" : session.learningVelocity >= 60 ? "var(--color-gold-500)" : "var(--color-brown-500)" }} />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-gray-600 w-8 text-right">{session.learningVelocity}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div>
                          <span className="text-[11.5px] text-gray-600">{fmtDate(session.scheduledAt)}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{fmtTime(session.scheduledAt)} · {session.duration}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        {session.status === "scheduled" && (
                          <button onClick={() => openNotes(session)} className="text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">Begin Session</button>
                        )}
                        {session.status === "in_progress" && (
                          <button onClick={() => openNotes(session)} className="text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">Add Notes</button>
                        )}
                        {session.status === "completed" && (
                          <CheckCircle2 className="w-4 h-4 text-forest-500 ml-auto" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <td colSpan={7} className="px-16 py-4" style={{ background: "color-mix(in srgb, var(--color-gray-50) 50%, white)" }}>
                          {session.previousNotes ? (
                            <>
                              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Previous Session Notes</div>
                              <p className="text-[12px] text-gray-600 leading-relaxed">{session.previousNotes}</p>
                            </>
                          ) : (
                            <p className="text-[12px] text-gray-400 italic">No previous session notes</p>
                          )}
                          {session.projectTitle && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                              Project: <span className="text-gray-600 font-medium">{session.projectTitle}</span>
                            </div>
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
              <p className="text-[14px] font-medium text-gray-700 mb-1">No mentorship sessions</p>
              <p className="text-[12px] text-gray-400 text-center max-w-xs mb-4">
                {searchQuery ? "Try adjusting your search." : activeFilterCount > 0 ? "No sessions match the selected filters." : "No mentorship sessions currently assigned."}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 hover:bg-brown-50 transition-all"><X className="w-3 h-3" /> Clear all filters</button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ SESSION NOTES DRAWER (Flow B2 Steps 2-4) ═══ */}
      <AnimatePresence>
        {notesTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setNotesTarget(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <h3 className="text-[16px] font-semibold text-gray-900">Session Notes</h3>
                <button onClick={() => setNotesTarget(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Session context */}
                <div className="space-y-2">
                  {[
                    { label: "Contributor", value: notesTarget.contributorId },
                    { label: "Skill Area", value: notesTarget.skillArea },
                    { label: "Context", value: contextConfig[notesTarget.context]?.label || notesTarget.context },
                    { label: "Learning Velocity", value: `${notesTarget.learningVelocity}%` },
                    { label: "Reliability", value: `${notesTarget.reliabilityScore}%` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className="text-[12px] font-medium text-gray-700">{row.value}</span>
                    </div>
                  ))}
                </div>

                {notesTarget.previousNotes && (
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Previous Notes</label>
                    <p className="text-[12px] text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">{notesTarget.previousNotes}</p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Session Notes *</label>
                  <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="Describe what was covered in this session..." className="min-h-[100px]" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Skill Gaps Identified</label>
                  <Input value={skillGaps} onChange={(e) => setSkillGaps(e.target.value)} placeholder="e.g. ARIA attributes, keyboard navigation patterns" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Recommended Next Actions</label>
                  <Input value={nextActions} onChange={(e) => setNextActions(e.target.value)} placeholder="e.g. Practice with screen reader testing, review WAI-ARIA spec" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Strengths Observed</label>
                  <Input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="e.g. Strong TypeScript fundamentals, clean code structure" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button onClick={() => { router.push("/mentor/escalation"); setNotesTarget(null); }} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors">
                    <AlertTriangle className="w-3 h-3" /> Escalate Concern
                  </button>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNotesTarget(null)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                    <button onClick={handleCompleteSession} className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                      <Send className="w-3.5 h-3.5" /> Complete Session
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
