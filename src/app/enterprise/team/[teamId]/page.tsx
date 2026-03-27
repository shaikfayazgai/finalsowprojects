"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Fingerprint,
  Target,
  TrendingUp,
  Star,
  BarChart3,
  ExternalLink,
  X,
  MessageSquare,
  RefreshCw,
  Globe,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Progress, Button } from "@/components/ui";
import {
  mockTeams,
  mockProjects,
  mockMilestones,
} from "@/mocks/data/enterprise-projects";
import type { TeamPool, TeamMember } from "@/types/enterprise";

/* ── FSD §8.2.2: Staffing status per task ── */
type TaskStaffingStatus = "staffed" | "being_matched" | "matching_issue";

const taskStaffingConfig: Record<
  TaskStaffingStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  staffed: { label: "Staffed", color: "text-forest-600", bg: "bg-forest-50", icon: CheckCircle2 },
  being_matched: { label: "Being Matched", color: "text-beige-500", bg: "bg-beige-100", icon: Loader2 },
  matching_issue: { label: "Matching Issue", color: "text-danger", bg: "bg-danger/10", icon: AlertTriangle },
};

/* ── FSD §8.2.2: Team-level staffing status (same 4 states as landing) ── */
type TeamStaffingStatus = "staffing_in_progress" | "fully_staffed" | "partially_staffed" | "matching_issue";

const teamStaffingConfig: Record<
  TeamStaffingStatus,
  { label: string; variant: "blue" | "forest" | "gold" | "danger" }
> = {
  staffing_in_progress: { label: "Staffing In Progress", variant: "blue" },
  fully_staffed: { label: "Fully Staffed", variant: "forest" },
  partially_staffed: { label: "Partially Staffed", variant: "gold" },
  matching_issue: { label: "Matching Issue", variant: "danger" },
};

function getTeamStaffingStatus(team: TeamPool): TeamStaffingStatus {
  if (team.status === "active") return "fully_staffed";
  if (team.status === "disbanded") return "matching_issue";
  if (team.status === "ready" || team.status === "approved") return "partially_staffed";
  return "staffing_in_progress";
}

/* ── FSD §8.2.5: Skill Coverage Review concern types ── */
const concernTypes = [
  { value: "declared_as_verified", label: "Declared skill shown as Verified" },
  { value: "skill_not_in_profile", label: "Required skill not in contributor profile" },
  { value: "match_score_too_low", label: "Match score too low for critical-path task" },
  { value: "other", label: "Other" },
] as const;

/* ── Simulated task data for a team ── */
interface TeamTask {
  id: string;
  name: string;
  milestoneId: string;
  milestoneName: string;
  requiredSkills: string[];
  seniority: "Junior" | "Mid" | "Senior" | "Lead";
  status: TaskStaffingStatus;
  contributorId?: string;
  matchScore?: number;
}

function buildTeamTasks(team: TeamPool): TeamTask[] {
  const milestones = mockMilestones.filter((m) => m.projectId === team.projectId);
  const tasks: TeamTask[] = [];
  let taskIdx = 0;

  const seniorityLevels: ("Junior" | "Mid" | "Senior" | "Lead")[] = ["Senior", "Mid", "Lead", "Senior", "Mid", "Junior", "Mid", "Senior", "Junior", "Lead"];

  for (const ms of milestones) {
    const taskCount = ms.tasksTotal;
    for (let i = 0; i < taskCount; i++) {
      const taskId = `t-${team.id}-${ms.id}-${i}`;
      const assignmentEntry = Object.entries(team.taskAssignments ?? {});
      const memberIdx = taskIdx % team.members.length;
      const member = team.members[memberIdx];
      const isStaffed = team.status === "active" || (team.status !== "disbanded" && taskIdx < team.totalMembers);
      const isIssue = team.status === "disbanded" && taskIdx >= team.totalMembers;

      tasks.push({
        id: taskId,
        name: `Task ${i + 1}: ${ms.title} — Part ${i + 1}`,
        milestoneId: ms.id,
        milestoneName: ms.title,
        requiredSkills: member ? member.skills.slice(0, 2) : team.requiredSkills.slice(0, 2),
        seniority: seniorityLevels[taskIdx % seniorityLevels.length],
        status: isStaffed ? "staffed" : isIssue ? "matching_issue" : "being_matched",
        contributorId: isStaffed ? member?.anonymousId : undefined,
        matchScore: isStaffed ? member?.matchScore : undefined,
      });
      taskIdx++;
    }
  }
  return tasks;
}

/* ── FSD §8.2.3: Contributor profile data ── */
function getContributorProfile(member: TeamMember, requiredSkills: string[]) {
  const memberSkillSet = new Set(member.skills);
  /* Build skills list with VERIFIED / DECLARED / NOT_MATCHED levels per FSD §8.2.3 */
  const skills = requiredSkills.map((s) => {
    if (!memberSkillSet.has(s)) {
      return { name: s, level: "not_matched" as const };
    }
    return {
      name: s,
      level: Math.random() > 0.3 ? "verified" as const : "declared" as const,
    };
  });
  /* Also include contributor's own skills not in required list as verified/declared */
  for (const s of member.skills) {
    if (!requiredSkills.includes(s)) {
      skills.push({
        name: s,
        level: Math.random() > 0.3 ? "verified" as const : "declared" as const,
      });
    }
  }

  /* FSD §8.2.3: Broad region for scheduling awareness (not city/country) */
  const regions = ["South Asia", "Southeast Asia", "East Africa", "Western Europe", "Latin America", "North America"];
  const regionIdx = member.id.charCodeAt(member.id.length - 1) % regions.length;

  return {
    anonymisedId: member.displayName,
    skills,
    seniority: member.tasksCompleted > 30 ? "Senior" : member.tasksCompleted > 15 ? "Mid" : "Junior",
    completedSimilarTasks: member.tasksCompleted,
    acceptanceRate: Math.round(75 + Math.random() * 20),
    avgReworkRounds: +(0.5 + Math.random() * 1.5).toFixed(1),
    activeAssignments: Math.floor(1 + Math.random() * 3),
    activeProjects: Math.floor(1 + Math.random() * 2),
    declaredWeeklyHours: member.availability === "full_time" ? 40 : member.availability === "part_time" ? 20 : 10,
    verifiedStatus: member.tasksCompleted > 20 ? "verified" as const : "standard" as const,
    matchScore: member.matchScore,
    broadRegion: regions[regionIdx],
  };
}

/* ══════════════════════════════════════════════════════════════
   TEAM DETAIL PAGE — FSD §8.2.2
   ══════════════════════════════════════════════════════════════ */
export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId);
  const project = team ? mockProjects.find((p) => p.id === team.projectId) : null;

  /* Build tasks grouped by milestone */
  const tasks = React.useMemo(() => (team ? buildTeamTasks(team) : []), [team]);
  const milestoneGroups = React.useMemo(() => {
    const groups = new Map<string, { name: string; tasks: TeamTask[] }>();
    for (const t of tasks) {
      if (!groups.has(t.milestoneId)) groups.set(t.milestoneId, { name: t.milestoneName, tasks: [] });
      groups.get(t.milestoneId)!.tasks.push(t);
    }
    return Array.from(groups.entries());
  }, [tasks]);

  /* Accordion state — FSD: milestones with issues expanded by default */
  const [expandedMilestones, setExpandedMilestones] = React.useState<Set<string>>(() => {
    const expanded = new Set<string>();
    for (const [msId, group] of milestoneGroups) {
      if (group.tasks.some((t) => t.status !== "staffed")) expanded.add(msId);
    }
    // Expand first milestone if all are staffed
    if (expanded.size === 0 && milestoneGroups.length > 0) expanded.add(milestoneGroups[0][0]);
    return expanded;
  });

  /* Contributor profile side panel — FSD §8.2.3 */
  const [selectedContributor, setSelectedContributor] = React.useState<TeamMember | null>(null);

  /* Skill Coverage Review — FSD §8.2.5 */
  const [reviewReason, setReviewReason] = React.useState("");
  const [reviewConcernType, setReviewConcernType] = React.useState("");
  const [reviewTaskName, setReviewTaskName] = React.useState("");
  const [showReviewForm, setShowReviewForm] = React.useState(false);

  /* FSD §8.2.2: Auto-refresh every 60 seconds */
  const [, setRefreshTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setRefreshTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  /* FSD §8.2.2: Team-level staffing status badge */
  const teamStaffingStatus = team ? getTeamStaffingStatus(team) : null;
  const teamBadgeCfg = teamStaffingStatus ? teamStaffingConfig[teamStaffingStatus] : null;

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const staffedCount = tasks.filter((t) => t.status === "staffed").length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((staffedCount / totalCount) * 100) : 0;

  const handleSkillReview = () => {
    if (!reviewConcernType) {
      toast.error("Concern type required", "Please select a concern type.");
      return;
    }
    if (reviewReason.trim().length < 30) {
      toast.error("Too short", "Please provide at least 30 characters.");
      return;
    }
    toast.success("Review Requested", "Skill coverage review submitted to GlimmoraTeam Admin. Response within 2 business days.");
    setShowReviewForm(false);
    setReviewReason("");
    setReviewConcernType("");
    setReviewTaskName("");
  };

  /* Helper to open review form with optional task pre-fill — FSD §8.2.5 */
  const openReviewForm = (taskName?: string) => {
    setReviewTaskName(taskName ?? "");
    setShowReviewForm(true);
  };

  if (!team || !project) {
    return (
      <div className="max-w-[1200px] mx-auto p-12 text-center">
        <p className="text-beige-500">Team not found.</p>
        <Link href="/enterprise/team" className="text-teal-600 hover:underline text-sm mt-2 block">← Back to Teams</Link>
      </div>
    );
  }

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
        {/* Breadcrumb */}
        <motion.div variants={fadeUp}>
          <Link href="/enterprise/team" className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project Teams
          </Link>
        </motion.div>

        {/* Header — FSD §8.2.2 */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">{project.title}</h1>
              {/* FSD §8.2.2: Team status badge — same 4 states as landing table */}
              {teamBadgeCfg && (
                <Badge variant={teamBadgeCfg.variant} size="sm" dot>
                  {teamBadgeCfg.label}
                </Badge>
              )}
            </div>
            <p className="text-[13px] text-beige-500 mt-1">{project.sowTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Assignment progress bar — FSD: "N of N tasks staffed" */}
            <div className="text-right">
              <p className="text-[12px] font-semibold text-brown-800">{staffedCount} of {totalCount} tasks staffed</p>
              <Progress value={pct} className="h-2 w-40 mt-1" />
            </div>
            {/* [Request Skill Coverage Review] — FSD §8.2.2 project-level */}
            <Button
              variant="outline"
              onClick={() => openReviewForm()}
              className="text-[11px]"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Request Skill Coverage Review
            </Button>
          </div>
        </motion.div>

        {/* Anonymisation notice */}
        <motion.div variants={fadeUp} className="rounded-xl bg-teal-50 border border-teal-200/60 p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-teal-700">
            All contributor identities are anonymised. Click a contributor ID to view their anonymised skill profile.
          </p>
        </motion.div>

        {/* Milestone Accordion — FSD §8.2.2 */}
        <motion.div variants={fadeUp} className="space-y-3">
          {milestoneGroups.map(([msId, group]) => {
            const assigned = group.tasks.filter((t) => t.status === "staffed").length;
            const total = group.tasks.length;
            const hasIssue = group.tasks.some((t) => t.status === "matching_issue");
            const allAssigned = assigned === total;
            const isExpanded = expandedMilestones.has(msId);

            return (
              <div key={msId} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
                {/* Milestone header row — FSD: name, tasks count, status badge */}
                <button
                  onClick={() => toggleMilestone(msId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-beige-50/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-beige-400" /> : <ChevronRight className="w-4 h-4 text-beige-400" />}
                    <div className="text-left">
                      <h3 className="text-[14px] font-semibold text-brown-900">{group.name}</h3>
                      <p className="text-[11px] text-beige-500 mt-0.5">Tasks: {assigned} assigned / {total} total</p>
                    </div>
                  </div>
                  <Badge
                    variant={hasIssue ? "danger" : allAssigned ? "forest" : "gold"}
                    size="sm"
                    dot
                  >
                    {hasIssue ? "Matching Issue" : allAssigned ? "All Assigned" : "Offers Pending"}
                  </Badge>
                </button>

                {/* Task rows — FSD §8.2.2 per-task assignment row */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Column headers */}
                      <div className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1.2fr] gap-3 px-5 py-2 border-t border-beige-100/60 text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
                        <span>Task</span>
                        <span>Required Skills</span>
                        <span>Seniority</span>
                        <span>Status</span>
                        <span>Contributor</span>
                      </div>

                      {group.tasks.map((task) => {
                        const cfg = taskStaffingConfig[task.status];
                        const StatusIcon = cfg.icon;
                        const member = task.contributorId ? team.members.find((m) => m.anonymousId === task.contributorId) : null;

                        return (
                          <div
                            key={task.id}
                            className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1.2fr] gap-3 px-5 py-3 border-t border-beige-100/40 hover:bg-beige-50/30 transition-colors items-center"
                          >
                            {/* Task name */}
                            <span className="text-[12px] text-brown-800 font-medium truncate">{task.name}</span>

                            {/* Required skills */}
                            <div className="flex gap-1 flex-wrap">
                              {task.requiredSkills.map((s) => (
                                <span key={s} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700">{s}</span>
                              ))}
                            </div>

                            {/* Seniority */}
                            <span className="text-[11px] text-beige-600">{task.seniority}</span>

                            {/* Status badge */}
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={cn("w-3.5 h-3.5", cfg.color, task.status === "being_matched" && "animate-spin")} />
                              <span className={cn("text-[11px] font-medium", cfg.color)}>{cfg.label}</span>
                            </div>

                            {/* Contributor — FSD: anonymised ID + match score, clickable */}
                            {member ? (
                              <button
                                onClick={() => setSelectedContributor(member)}
                                className="flex items-center gap-2 text-left group"
                              >
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[9px] font-bold text-white">
                                  {member.avatar}
                                </div>
                                <div>
                                  <span className="text-[11px] font-semibold text-brown-800 group-hover:text-teal-700 transition-colors">
                                    {member.displayName}
                                  </span>
                                  <span className="text-[10px] text-forest-600 ml-1">{member.matchScore}%</span>
                                </div>
                              </button>
                            ) : (
                              <span className="text-[11px] text-beige-400">—</span>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ── Contributor Profile Side Panel — FSD §8.2.3 ── */}
      <AnimatePresence>
        {selectedContributor && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brown-950/30 backdrop-blur-sm z-40"
              onClick={() => setSelectedContributor(null)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-white/95 backdrop-blur-lg border-l border-beige-200/60 z-50 overflow-y-auto shadow-2xl"
            >
              <ContributorProfilePanel
                member={selectedContributor}
                requiredSkills={team.requiredSkills}
                onClose={() => setSelectedContributor(null)}
                onRequestReview={() => { setSelectedContributor(null); openReviewForm(); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Skill Coverage Review Modal — FSD §8.2.5 ── */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-brown-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReviewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-brown-900">Request Skill Coverage Review</h3>
              <button onClick={() => setShowReviewForm(false)} className="p-1 rounded-lg hover:bg-beige-100 text-beige-400"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[12px] text-beige-500">
              Submit a concern about match quality for this project. Routes to GlimmoraTeam Admin — not to any contributor. Response within 2 business days.
            </p>

            {/* FSD §8.2.5: Task name — pre-filled when opened from task level */}
            <div>
              <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">Task Name</label>
              <input
                value={reviewTaskName}
                onChange={(e) => setReviewTaskName(e.target.value)}
                placeholder="Project-level review (or enter a specific task name)"
                className="w-full rounded-xl border border-beige-200/60 bg-white/60 px-3 py-2 text-[13px] text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200/40"
              />
            </div>

            {/* FSD §8.2.5: Concern type selector */}
            <div>
              <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
                Concern Type <span className="text-danger">*</span>
              </label>
              <select
                value={reviewConcernType}
                onChange={(e) => setReviewConcernType(e.target.value)}
                className="w-full rounded-xl border border-beige-200/60 bg-white/60 px-3 py-2 text-[13px] text-brown-800 focus:outline-none focus:ring-2 focus:ring-brown-200/40 appearance-none"
              >
                <option value="">Select a concern type...</option>
                {concernTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>

            {/* FSD §8.2.5: Description (min 30 chars) */}
            <div>
              <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
                Description <span className="text-danger">*</span>
                <span className="text-beige-400 font-normal ml-1">(min 30 characters)</span>
              </label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Explain which skills or match quality you believe is insufficient..."
                className="w-full min-h-[80px] rounded-xl border border-beige-200/60 bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200/40 resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-beige-400">{reviewReason.length} characters</span>
                <span className={cn("text-[11px]", reviewReason.length >= 30 ? "text-forest-600" : "text-beige-400")}>
                  {reviewReason.length >= 30 ? "✓ Valid" : `${30 - reviewReason.length} more needed`}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleSkillReview}
                disabled={!reviewConcernType || reviewReason.trim().length < 30}
                className="flex-1 bg-gradient-to-r from-brown-500 to-brown-600"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Contributor Profile Panel Content — FSD §8.2.3 ── */
function ContributorProfilePanel({
  member,
  requiredSkills,
  onClose,
  onRequestReview,
}: {
  member: TeamMember;
  requiredSkills: string[];
  onClose: () => void;
  onRequestReview: () => void;
}) {
  const profile = getContributorProfile(member, requiredSkills);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[14px] font-bold text-white">
            {member.avatar}
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-brown-900">{profile.anonymisedId}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Fingerprint className="w-3 h-3 text-beige-400" />
              <span className="text-[10px] text-beige-500">Anonymised identity — consistent within this project only</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-beige-100 text-beige-400"><X className="w-4 h-4" /></button>
      </div>

      {/* Verification badge — FSD §8.2.3 */}
      <div className="flex items-center gap-2">
        <Badge variant={profile.verifiedStatus === "verified" ? "forest" : "beige"} size="sm" dot>
          {profile.verifiedStatus === "verified" ? "Platform Verified" : "Standard"}
        </Badge>
        <Badge variant="teal" size="sm">{profile.seniority}</Badge>
        <span className="text-[11px] font-semibold text-forest-600 ml-auto">Match: {profile.matchScore}%</span>
      </div>

      {/* Skill Match Summary — FSD §8.2.3: VERIFIED (green) / DECLARED (amber) / NOT MATCHED (red) */}
      <div>
        <h4 className="text-[12px] font-semibold text-brown-700 mb-2">Skill Match Summary</h4>
        <div className="space-y-1.5">
          {profile.skills.map((s) => (
            <div
              key={s.name}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                s.level === "not_matched" ? "bg-red-50/80" : "bg-beige-50/80"
              )}
            >
              <span className={cn(
                "text-[12px] font-medium",
                s.level === "not_matched" ? "text-red-700" : "text-brown-800"
              )}>
                {s.name}
              </span>
              <Badge
                variant={s.level === "verified" ? "forest" : s.level === "declared" ? "gold" : "danger"}
                size="sm"
              >
                {s.level === "verified" ? "Verified" : s.level === "declared" ? "Declared" : "Not Matched"}
              </Badge>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-beige-500 mt-2">Overall match score: {profile.matchScore}%</p>
      </div>

      {/* Performance metrics — FSD §8.2.3 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Completed Similar Tasks", value: profile.completedSimilarTasks.toString(), icon: Target },
          { label: "Evidence Acceptance Rate", value: `${profile.acceptanceRate}%`, icon: TrendingUp },
          { label: "Avg Rework Rounds", value: profile.avgReworkRounds.toString(), icon: RefreshCw },
          { label: "Active Assignments", value: `${profile.activeAssignments} tasks / ${profile.activeProjects} projects`, icon: BarChart3 },
        ].map((m) => (
          <div key={m.label} className="p-3 rounded-xl bg-beige-50/80 border border-beige-100/60">
            <m.icon className="w-3.5 h-3.5 text-beige-400 mb-1" />
            <p className="text-[14px] font-bold text-brown-900">{m.value}</p>
            <p className="text-[9px] text-beige-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Availability — FSD §8.2.3 */}
      <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100/60 space-y-1.5">
        <p className="text-[11px] text-teal-700">
          <span className="font-semibold">Declared availability:</span> {profile.declaredWeeklyHours} hours/week
        </p>
      </div>

      {/* FSD §8.2.3: Broad region for scheduling awareness */}
      <div className="p-3 rounded-xl bg-beige-50/60 border border-beige-100/60 flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-beige-400 shrink-0" />
        <p className="text-[11px] text-beige-600">
          <span className="font-semibold">Region:</span> {profile.broadRegion}
        </p>
      </div>

      {/* What is NOT shown — FSD §8.2.3 */}
      <div className="rounded-xl bg-beige-50 border border-beige-200/60 p-3">
        <p className="text-[10px] text-beige-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-beige-400" />
          Real name, photo, contact details, location, and portfolio are not shown. Privacy enforced at API level.
        </p>
      </div>

      {/* Action — FSD §8.2.3: [Request Skill Coverage Review] */}
      <Button
        variant="outline"
        onClick={onRequestReview}
        className="w-full text-[12px]"
      >
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        Request Skill Coverage Review
      </Button>
    </div>
  );
}
