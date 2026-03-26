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
  women: {
    label: "Women's Program",
    gradient: "from-teal-400 to-teal-600",
    bg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-200",
  },
  student: {
    label: "University Track",
    gradient: "from-gold-400 to-gold-600",
    bg: "bg-gold-50",
    text: "text-gold-700",
    ring: "ring-gold-200",
  },
  general: {
    label: "General",
    gradient: "from-beige-400 to-beige-600",
    bg: "bg-gray-100",
    text: "text-gray-600",
    ring: "ring-gray-200",
  },
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

/* ── Star rating ── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= Math.round(rating)
              ? "text-gold-500 fill-gold-500"
              : "text-gray-300"
          )}
        />
      ))}
      <span className="ml-1 text-[10px] font-semibold text-gray-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
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
    <motion.div
      variants={scaleIn}
      className="group relative card-parchment overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Track accent stripe */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
          track.gradient
        )}
      />

      <div className="p-5 pt-4">
        {/* Header: avatar + name + track */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <Avatar size="lg">
              <AvatarFallback
                className={cn(
                  "bg-gradient-to-br text-white font-bold text-sm",
                  track.gradient
                )}
              >
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                member.availability === "full_time"
                  ? "bg-forest-400"
                  : member.availability === "part_time"
                    ? "bg-gold-400"
                    : "bg-beige-400"
              )}
            </div>
            <p className="text-[13px] text-beige-500 mt-1">{project.sowTitle}</p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-gray-900 truncate">
                {member.displayName}
              </p>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Fingerprint className="w-3 h-3 text-gray-400 shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Anonymized ID: {member.anonymousId}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant={avail.variant} size="sm">
                {avail.label}
              </Badge>
              <span
                className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-md",
                  track.bg,
                  track.text
                )}
              >
                {track.label}
              </span>
            </div>
          </div>

          {/* Mini metric ring */}
          <MetricRing
            value={member.matchScore}
            size={40}
            strokeWidth={3.5}
            color={matchScoreColor(member.matchScore)}
          />
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {member.skills.map((skill) => (
            <span
              key={skill}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Match score bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-medium">
              Match Score
            </span>
            <span
              className={cn(
                "text-[12px] font-bold",
                matchScoreTextClass(member.matchScore)
              )}
            >
              {member.matchScore}%
            </span>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-forest-500" />
            <span className="text-[11px] text-gray-700 font-medium">
              {member.tasksCompleted} deliveries
            </span>
          </div>
          <StarRating rating={member.rating} />
        </div>

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

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors group">
      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate">
          {task?.title ?? taskId}
        </p>
        {task && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400 font-mono">
              {task.id}
            </span>
            <Badge
              variant={
                task.priority === "critical"
                  ? "gold"
                  : task.priority === "high"
                    ? "brown"
                    : "beige"
              }
              size="sm"
            >
              {task.priority}
            </Badge>
            {task.estimatedHours && (
              <span className="text-[10px] text-gray-400">
                {task.estimatedHours}h est.
              </span>
            )}
          </div>
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
                {member.avatar}
              </AvatarFallback>
            </Avatar>
            <span className="text-[12px] font-medium text-gray-800 hidden sm:inline">
              {member.displayName}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-gray-400 italic">
            {memberId}
          </span>
        )}
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

  /* ── 404 state ── */
  if (!team) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[600px] mx-auto mt-24 text-center"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Team not found
          </h2>
          <p className="text-[13px] text-gray-400 mb-6">
            The team &quot;{teamId}&quot; doesn&apos;t exist or has been
            removed.
          </p>
          <Link href="/enterprise/team">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  const status = teamStatusConfig[team.status];
  const plan = mockPlans.find((p) => p.id === team.planId);

  /* ── Skill coverage analysis ── */
  const memberSkills = new Set(team.members.flatMap((m) => m.skills));
  const coveredSkills = team.requiredSkills.filter((s) => memberSkills.has(s));
  const coveragePct =
    team.requiredSkills.length > 0
      ? Math.round((coveredSkills.length / team.requiredSkills.length) * 100)
      : 100;

  /* ── Track distribution ── */
  const trackCounts = team.members.reduce(
    (acc, m) => {
      acc[m.track] = (acc[m.track] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  /* ── Team stats ── */
  const totalDeliveries = team.members.reduce(
    (s, m) => s + m.tasksCompleted,
    0
  );
  const avgRating =
    team.members.length > 0
      ? team.members.reduce((s, m) => s + m.rating, 0) / team.members.length
      : 0;
  const fullTimeCount = team.members.filter(
    (m) => m.availability === "full_time"
  ).length;
  const partTimeCount = team.members.filter(
    (m) => m.availability === "part_time"
  ).length;
  const avgMatchScore =
    team.members.length > 0
      ? Math.round(
          team.members.reduce((s, m) => s + m.matchScore, 0) /
            team.members.length
        )
      : 0;

  /* ── Task assignments as entries ── */
  const assignmentEntries = team.taskAssignments
    ? Object.entries(team.taskAssignments)
    : [];

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-[1280px] mx-auto space-y-6"
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="mb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge variant={status.variant} dot>{status.label}</Badge>
                <span className="inline-flex items-center text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {team.matchScore}% match
                </span>
              </div>
              <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">{team.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px] text-gray-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{team.totalMembers} members</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{team.requiredSkills.length} required skills</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                {plan ? (
                  <Link href={`/enterprise/decomposition/${plan.id}`} className="text-brown-500 hover:text-brown-600 font-medium transition-colors">{plan.title}</Link>
                ) : (
                  <span>Plan: {team.planId}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(team.status === "forming" || team.status === "ready") && (
                <Link href={`/enterprise/team/${team.id}/confirm`}>
                  <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                    <ShieldCheck className="w-3.5 h-3.5" /> Confirm Team
                  </button>
                </Link>
              )}
              {team.status === "active" && team.projectId && (
                <Link href={`/enterprise/projects/${team.projectId}`}>
                  <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                    <ExternalLink className="w-3.5 h-3.5" /> View Project
                  </button>
                </Link>
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

        {/* ── Privacy notice ── */}
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-2 rounded-lg bg-forest-50 px-3 py-2"
        >
          <div className="shrink-0">
            <EyeOff className="w-3.5 h-3.5 text-forest-500" />
          </div>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            <span className="font-semibold">Privacy-first.</span> All
            contributor identities are anonymized. Skill-based matching only
            &mdash; no personal data is shared with enterprise clients.
          </p>
        </motion.div>

        {/* ── Main content: 2-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ─── Left Column (2/3) ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Assignments */}
            {assignmentEntries.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="card-parchment overflow-hidden"
              >
                <div className="px-5 pt-5 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center">
                        <ListChecks className="w-3.5 h-3.5 text-white" />
                      </div>
                      Task Assignments
                    </h2>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {assignmentEntries.length} tasks assigned
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-beige-100/60">
                  {assignmentEntries.map(([taskId, memberId]) => (
                    <TaskAssignmentRow
                      key={taskId}
                      taskId={taskId}
                      memberId={memberId}
                      members={team.members}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Team Members */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                  Team Members
                </h2>
                <span className="text-[11px] text-gray-400">
                  {team.members.length} contributors
                </span>
              </div>
              <motion.div
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {team.members.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* ─── Right Column (1/3) ─── */}
          <motion.div variants={slideInRight} className="space-y-5">
            {/* Skill Coverage */}
            <div className="card-parchment p-5">
              <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center">
                  <Target className="w-3 h-3 text-teal-600" />
                </div>
                Skill Coverage
              </h3>

              <div className="text-center mb-4">
                <MetricRing
                  value={coveragePct}
                  size={80}
                  strokeWidth={7}
                  color={coveragePct === 100 ? "forest" : "teal"}
                  label="Covered"
                  className="mx-auto"
                />
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {coveredSkills.length} of {team.requiredSkills.length} skills
                  matched
                </p>
              </div>

              <div className="space-y-1.5">
                {team.requiredSkills.map((skill) => {
                  const covered = memberSkills.has(skill);
                  const memberCount = team.members.filter((m) =>
                    m.skills.includes(skill)
                  ).length;
                  return (
                    <div
                      key={skill}
                      className={cn(
                        "flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors",
                        covered
                          ? "bg-forest-50/50"
                          : "bg-gray-50/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {covered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        <span
                          className={cn(
                            "text-[12px] font-medium",
                            covered ? "text-gray-800" : "text-gray-400"
                          )}
                        >
                          {skill}
                        </span>
                      </div>
                      {covered && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] text-forest-600 font-mono bg-forest-100/60 px-1.5 py-0.5 rounded cursor-help">
                              {memberCount}x
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {memberCount} member{memberCount !== 1 && "s"}{" "}
                              with this skill
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Track Distribution */}
            <div className="card-parchment p-5">
              <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-gray-400" />
                </div>
                Track Distribution
              </h3>

              {/* Stacked bar */}
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex mb-4">
                {(["women", "student", "general"] as const).map((key) => {
                  const count = trackCounts[key] || 0;
                  const pct =
                    team.totalMembers > 0
                      ? (count / team.totalMembers) * 100
                      : 0;
                  if (pct === 0) return null;
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-500 first:rounded-l-full last:rounded-r-full cursor-help",
                            trackConfig[key].gradient
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {trackConfig[key].label}: {count} (
                          {Math.round(pct)}%)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {(
                  [
                    ["women", "Women's Program"],
                    ["student", "University Track"],
                    ["general", "General"],
                  ] as const
                ).map(([key, label]) => {
                  const count = trackCounts[key] || 0;
                  const pct =
                    team.totalMembers > 0
                      ? Math.round((count / team.totalMembers) * 100)
                      : 0;
                  const cfg = trackConfig[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full bg-gradient-to-r",
                            cfg.gradient
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            cfg.text
                          )}
                        >
                          {label}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Stats */}
            <div className="card-parchment p-5">
              <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-forest-100 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-forest-600" />
                </div>
                Team Stats
              </h3>

              <div className="space-y-3">
                {[
                  {
                    label: "Total Deliveries",
                    value: totalDeliveries.toLocaleString(),
                    icon: (
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                    ),
                  },
                  {
                    label: "Average Rating",
                    value: `${avgRating.toFixed(1)}/5.0`,
                    icon: (
                      <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                    ),
                  },
                  {
                    label: "Full-time",
                    value: fullTimeCount.toString(),
                    icon: (
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                    ),
                  },
                  {
                    label: "Part-time",
                    value: partTimeCount.toString(),
                    icon: (
                      <Clock className="w-3.5 h-3.5 text-gold-500" />
                    ),
                  },
                  {
                    label: "Avg Match Score",
                    value: `${avgMatchScore}%`,
                    icon: (
                      <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-[12px] text-gray-500">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[13px] font-bold text-gray-800 font-mono">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
