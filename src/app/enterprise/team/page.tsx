"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Target,
  RefreshCw,
  ChevronDown,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Progress } from "@/components/ui";
import { mockTeams, mockProjects } from "@/mocks/data/enterprise-projects";
import type { TeamPool } from "@/types/enterprise";

/* ── FSD §8.2.1: Team Status Badge Definitions ── */
type StaffingStatus = "staffing_in_progress" | "fully_staffed" | "partially_staffed" | "matching_issue";

const staffingConfig: Record<
  StaffingStatus,
  { label: string; variant: "blue" | "forest" | "gold" | "danger"; icon: React.ElementType; description: string }
> = {
  staffing_in_progress: {
    label: "Staffing In Progress",
    variant: "blue",
    icon: Loader2,
    description: "GlimmoraTeam is matching contributors. No action needed.",
  },
  fully_staffed: {
    label: "Fully Staffed",
    variant: "forest",
    icon: CheckCircle2,
    description: "All tasks have confirmed contributors. Delivery underway.",
  },
  partially_staffed: {
    label: "Partially Staffed",
    variant: "gold",
    icon: Clock,
    description: "Some tasks staffed. Remaining are being matched by GlimmoraTeam.",
  },
  matching_issue: {
    label: "Matching Issue",
    variant: "danger",
    icon: AlertTriangle,
    description: "Task(s) could not be matched. GlimmoraTeam Admin notified.",
  },
};

/* ── Derive staffing status from team data ── */
function getStaffingStatus(team: TeamPool): StaffingStatus {
  if (team.status === "active") return "fully_staffed";
  if (team.status === "disbanded") return "matching_issue";
  if (team.status === "ready" || team.status === "approved") return "partially_staffed";
  return "staffing_in_progress";
}

/* ── Get total/staffed task counts ── */
function getStaffedCount(team: TeamPool): { total: number; staffed: number } {
  const total = team.requiredSkills.length > 0 ? Math.max(team.totalMembers + 2, 8) : team.totalMembers;
  const staffed = team.status === "active" ? total : Math.min(team.totalMembers, total);
  return { total, staffed };
}

function getProjectForTeam(team: TeamPool) {
  return mockProjects.find((p) => p.id === team.projectId);
}

/* ══════════════════════════════════════════════════════════════
   TEAMS LANDING — FSD §8.2.1
   ══════════════════════════════════════════════════════════════ */
/* ── FSD §8.2.1: Metric filter type ── */
type MetricFilter = "all" | "assigned" | "offers_pending" | "re_matching" | "unmatched";

/* ── Status dropdown filter options ── */
type StatusFilter = "All" | StaffingStatus;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "fully_staffed", label: "Fully Staffed" },
  { value: "partially_staffed", label: "Partially Staffed" },
  { value: "matching_issue", label: "Matching Issue" },
  { value: "staffing_in_progress", label: "Staffing In Progress" },
];

export default function TeamsPage() {
  const [activeFilter, setActiveFilter] = React.useState<MetricFilter>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  /* Compute summary metrics — FSD: Total tasks, Assigned, Offers pending, Re-matching, Unmatched */
  const teamData = mockTeams.map((t) => ({
    team: t,
    project: getProjectForTeam(t),
    status: getStaffingStatus(t),
    counts: getStaffedCount(t),
  }));

  const totalTasks = teamData.reduce((s, d) => s + d.counts.total, 0);
  const assignedTasks = teamData.reduce((s, d) => s + d.counts.staffed, 0);
  const offersPending = teamData.filter((d) => d.status === "staffing_in_progress" || d.status === "partially_staffed").reduce((s, d) => s + (d.counts.total - d.counts.staffed), 0);
  const reMatching = teamData.filter((d) => d.status === "partially_staffed").reduce((s, d) => s + Math.max(0, d.counts.total - d.counts.staffed - 1), 0);
  const unmatchedAdmin = teamData.filter((d) => d.status === "matching_issue").reduce((s, d) => s + (d.counts.total - d.counts.staffed), 0);

  /* Filter: apply search, status dropdown, and metric filter */
  const filteredTeamData = teamData.filter((d) => {
    /* Search filter — FSD §8.2.1: search by project name or SOW ID, min 3 chars */
    if (searchQuery.length >= 3) {
      const q = searchQuery.toLowerCase();
      const projectName = (d.project?.title ?? d.team.name).toLowerCase();
      const sowRef = (d.project?.sowTitle ?? d.team.planId).toLowerCase();
      if (!projectName.includes(q) && !sowRef.includes(q)) return false;
    }
    /* Status dropdown filter */
    if (selectedStatus !== "All" && d.status !== selectedStatus) return false;
    /* Metric card filter */
    if (activeFilter === "all") return true;
    if (activeFilter === "assigned") return d.counts.staffed > 0;
    if (activeFilter === "offers_pending") return d.status === "staffing_in_progress" || d.status === "partially_staffed";
    if (activeFilter === "re_matching") return d.status === "partially_staffed";
    if (activeFilter === "unmatched") return d.status === "matching_issue";
    return true;
  });

  const hasActiveFilters = activeFilter !== "all" || selectedStatus !== "All" || searchQuery.length >= 3;

  const metrics: { key: MetricFilter; label: string; value: number; icon: React.ElementType; color: string }[] = [
    { key: "all", label: "Total Tasks", value: totalTasks, icon: Target, color: "from-brown-400 to-brown-600" },
    { key: "assigned", label: "Assigned", value: assignedTasks, icon: CheckCircle2, color: "from-forest-400 to-forest-600" },
    { key: "offers_pending", label: "Offers Pending", value: offersPending, icon: Clock, color: "from-gold-400 to-gold-600" },
    { key: "re_matching", label: "Re-matching", value: reMatching, icon: RefreshCw, color: "from-blue-400 to-blue-600" },
    { key: "unmatched", label: "Unmatched — Admin Alerted", value: unmatchedAdmin, icon: AlertTriangle, color: "from-danger to-danger-dark" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
      {/* Header — FSD §8.2.1 */}
      <motion.div variants={fadeUp} className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brown-500 to-brown-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">Project Teams</h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Track contributor assignment status across your active projects. Contributor identities are anonymised.
          </p>
        </div>
      </motion.div>

      {/* Anonymisation notice — FSD §8.2 governance rule */}
      <motion.div variants={fadeUp} className="rounded-xl bg-teal-50 border border-teal-200/60 p-3 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-teal-700">
          Contributor identities are anonymised. You see assignment outcomes and skill match quality — not personal details. This is an immutable platform governance rule.
        </p>
      </motion.div>

      {/* Assignment Health Summary — FSD §8.2.1: 5 metrics, each clickable to filter */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map((s) => (
          <motion.button
            key={s.key}
            variants={scaleIn}
            onClick={() => setActiveFilter(activeFilter === s.key ? "all" : s.key)}
            className={cn(
              "rounded-2xl border bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3 text-left transition-all cursor-pointer",
              activeFilter === s.key
                ? "border-brown-300 ring-2 ring-brown-200/50 shadow-md"
                : "border-beige-200/50 hover:border-beige-300/60 hover:shadow-sm"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", s.color)}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">{s.value}</p>
              <p className="text-[10px] text-beige-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Filter bar — Search + Status dropdown + active filter indicator */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SOWs..."
              className={cn(
                "w-full rounded-xl border bg-white/80 backdrop-blur-sm pl-9 pr-3 py-2 text-[12px] font-medium text-brown-800 placeholder:text-beige-400 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-brown-200/50 focus:border-brown-300",
                searchQuery.length >= 3
                  ? "border-brown-300 shadow-sm"
                  : "border-beige-200/60 hover:border-beige-300"
              )}
            />
          </div>

          {/* Right: Status dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
              className={cn(
                "appearance-none rounded-xl border bg-white/80 backdrop-blur-sm pl-3 pr-8 py-2 text-[12px] font-medium text-brown-800 transition-all cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-brown-200/50 focus:border-brown-300",
                selectedStatus !== "All"
                  ? "border-brown-300 shadow-sm"
                  : "border-beige-200/60 hover:border-beige-300"
              )}
            >
              {statusFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.value === "All" ? "Status: All" : opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
          </div>
        </div>

        {/* Active filter indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-beige-400" />
            <span className="text-[11px] text-beige-500">
              {searchQuery.length >= 3 && (
                <>Search: <span className="font-semibold text-brown-700">&ldquo;{searchQuery}&rdquo;</span></>
              )}
              {searchQuery.length >= 3 && (activeFilter !== "all" || selectedStatus !== "All") && <span className="mx-1 text-beige-300">·</span>}
              {activeFilter !== "all" && (
                <>Metric: <span className="font-semibold text-brown-700">{metrics.find((m) => m.key === activeFilter)?.label}</span></>
              )}
              {activeFilter !== "all" && selectedStatus !== "All" && <span className="mx-1 text-beige-300">·</span>}
              {selectedStatus !== "All" && (
                <>Status: <span className="font-semibold text-brown-700">{staffingConfig[selectedStatus].label}</span></>
              )}
            </span>
            <button
              onClick={() => { setActiveFilter("all"); setSelectedStatus("All"); setSearchQuery(""); }}
              className="text-[11px] text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* Project Assignment Table — FSD §8.2.1 */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 border-b border-beige-200/40 text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
          <span>Project</span>
          <span>Team Status</span>
          <span>Total Tasks</span>
          <span>Staffed</span>
          <span>Action</span>
        </div>

        {/* Table rows */}
        {filteredTeamData.map(({ team, project, status, counts }) => {
          const cfg = staffingConfig[status];
          const pct = counts.total > 0 ? Math.round((counts.staffed / counts.total) * 100) : 0;

          return (
            <div
              key={team.id}
              className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-4 border-b border-beige-100/60 hover:bg-beige-50/40 transition-colors items-center"
            >
              {/* Project — FSD: name as link, SOW ref below */}
              <div>
                <Link href={`/enterprise/team/${team.id}`} className="text-[13px] font-semibold text-brown-900 hover:text-teal-700 transition-colors">
                  {project?.title ?? team.name}
                </Link>
                <p className="text-[10px] text-beige-400 mt-0.5">{project?.sowTitle ?? `SOW: ${team.planId}`}</p>
              </div>

              {/* Team Status Badge — FSD: 4 states */}
              <div className="flex items-center gap-2">
                <Badge variant={cfg.variant} size="sm" dot>
                  {cfg.label}
                </Badge>
              </div>

              {/* Total Tasks */}
              <div>
                <span className="text-[13px] font-semibold text-brown-800">{counts.total}</span>
              </div>

              {/* Staffed — FSD: count + progress bar */}
              <div className="space-y-1">
                <span className="text-[13px] font-semibold text-brown-800">{counts.staffed}</span>
                <Progress value={pct} className="h-1.5" />
              </div>

              {/* Action — FSD: FULLY STAFFED → [View Team], others → [View Staffing Status] */}
              <div>
                <Link
                  href={`/enterprise/team/${team.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all bg-brown-100 text-brown-700 hover:bg-brown-200"
                >
                  {status === "fully_staffed" ? "View Team" : "View Staffing Status"}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}

        {filteredTeamData.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-beige-400" />
            </div>
            <h3 className="text-[15px] font-bold text-brown-800">
              {hasActiveFilters ? "No projects found for selected status" : "No project teams yet"}
            </h3>
            <p className="text-[13px] text-beige-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try selecting a different status or clear the filters."
                : "Teams appear here after a project plan is confirmed and GlimmoraTeam begins matching contributors."}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
