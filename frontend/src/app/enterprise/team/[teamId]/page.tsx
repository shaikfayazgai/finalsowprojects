"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  X,
  MessageSquare,
  Ban,
  PlayCircle,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge, Progress, Button } from "@/components/ui";
import {
  useTeamComposition,
  useSkillCoverage,
  useSkillReviewRequest,
} from "@/lib/hooks/use-teams";
import type { TaskExecutionStatus, TeamTaskItem } from "@/lib/api/teams";

/* ── Execution status presentation ── */
const execStatusConfig: Record<
  TaskExecutionStatus,
  { label: string; color: string; bg: string; icon: React.ElementType; variant: "forest" | "blue" | "danger" | "beige" }
> = {
  NOT_STARTED: { label: "Not Started", color: "text-beige-600", bg: "bg-beige-50",   icon: Circle,        variant: "beige"  },
  IN_PROGRESS: { label: "In Progress", color: "text-teal-600",  bg: "bg-teal-50",    icon: PlayCircle,    variant: "blue"   },
  BLOCKED:     { label: "Blocked",     color: "text-danger",    bg: "bg-danger/10",  icon: Ban,           variant: "danger" },
  DONE:        { label: "Done",        color: "text-forest-600",bg: "bg-forest-50",  icon: CheckCircle2,  variant: "forest" },
};

type TabKey = "composition" | "coverage";

/* ══════════════════════════════════════════════════════════════
   TEAM DETAIL PAGE — wired to real API
   /api/v1/projects/{project_id}/team-composition
   /api/v1/projects/{project_id}/skill-coverage
   /api/v1/projects/{project_id}/skill-review-request
   ══════════════════════════════════════════════════════════════ */
export default function TeamDetailPage() {
  const params = useParams();
  const projectId = (params.teamId as string) || "";

  const composition = useTeamComposition(projectId);
  const coverage = useSkillCoverage(projectId);
  const reviewMutation = useSkillReviewRequest(projectId);

  const [activeTab, setActiveTab] = React.useState<TabKey>("composition");
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [reviewNote, setReviewNote] = React.useState("");

  const tasks: TeamTaskItem[] = composition.data?.tasks ?? [];

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.execution_status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.execution_status === "IN_PROGRESS").length;
  const blockedTasks = tasks.filter((t) => t.execution_status === "BLOCKED").length;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  /* Aggregate unique contributors across all tasks */
  const uniqueContributors = React.useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) for (const c of t.contributors) if (c) set.add(c);
    return Array.from(set);
  }, [tasks]);

  const handleSubmitReview = async () => {
    if (!projectId) return;
    try {
      await reviewMutation.mutateAsync(
        reviewNote.trim() ? { note: reviewNote.trim() } : undefined,
      );
      toast.success(
        "Review Requested",
        "Skill coverage review submitted to GlimmoraTeam Admin.",
      );
      setShowReviewForm(false);
      setReviewNote("");
    } catch (err) {
      toast.error(
        "Submission Failed",
        err instanceof Error ? err.message : "Could not submit review request.",
      );
    }
  };

  /* ── Error ── */
  if (composition.isError) {
    return (
      <div className="max-w-[1200px] mx-auto p-12 text-center space-y-3">
        <AlertTriangle className="w-6 h-6 text-danger mx-auto" />
        <p className="text-danger text-sm font-medium">Failed to load team composition</p>
        <p className="text-beige-500 text-xs">
          {composition.error instanceof Error ? composition.error.message : "Unknown error"}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" onClick={() => composition.refetch()} className="text-[11px]">
            Retry
          </Button>
          <Link href="/enterprise/team" className="text-teal-600 hover:underline text-sm">
            ← Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-[1200px] mx-auto space-y-6"
      >
        {/* Breadcrumb */}
        <motion.div variants={fadeUp}>
          <Link
            href="/enterprise/team"
            className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Project Teams
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
                Project Team
              </h1>
              <Badge variant="teal" size="sm">
                {composition.data?.project_id ?? projectId}
              </Badge>
            </div>
            <p className="text-[13px] text-beige-500 mt-1">
              {totalTasks} task{totalTasks === 1 ? "" : "s"} · {uniqueContributors.length} contributor
              {uniqueContributors.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12px] font-semibold text-brown-800">
                {doneTasks} of {totalTasks} tasks done
              </p>
              <Progress value={pct} className="h-2 w-40 mt-1" />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowReviewForm(true)}
              className="text-[11px]"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Request Skill Coverage Review
            </Button>
          </div>
        </motion.div>

        {/* Status summary chips */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
          <SummaryChip icon={CheckCircle2} label="Done"        value={doneTasks}        color="text-forest-600" bg="bg-forest-50" />
          <SummaryChip icon={PlayCircle}   label="In Progress" value={inProgressTasks}  color="text-teal-600"   bg="bg-teal-50"   />
          <SummaryChip icon={Ban}          label="Blocked"     value={blockedTasks}     color="text-danger"     bg="bg-danger/10" />
          <SummaryChip icon={Circle}       label="Not Started" value={totalTasks - doneTasks - inProgressTasks - blockedTasks} color="text-beige-600" bg="bg-beige-50" />
        </motion.div>

        {/* Anonymisation notice */}
        <motion.div
          variants={fadeUp}
          className="rounded-xl bg-teal-50 border border-teal-200/60 p-3 flex items-start gap-2.5"
        >
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-teal-700">
            Contributor identifiers are anonymised. Real names, contact details, and locations are not exposed.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeUp} className="flex gap-1 border-b border-beige-200/60">
          <TabButton active={activeTab === "composition"} onClick={() => setActiveTab("composition")}>
            <Users className="w-3.5 h-3.5" />
            Team Composition
            <span className="text-[10px] text-beige-400 ml-1">({totalTasks})</span>
          </TabButton>
          <TabButton active={activeTab === "coverage"} onClick={() => setActiveTab("coverage")}>
            <ShieldCheck className="w-3.5 h-3.5" />
            Skill Coverage
            <span className="text-[10px] text-beige-400 ml-1">
              ({coverage.data?.skills.length ?? 0})
            </span>
          </TabButton>
        </motion.div>

        {/* ── Tab: Composition ── */}
        {activeTab === "composition" && (
          <motion.div variants={fadeUp}>
            {tasks.length === 0 ? (
              <EmptyState message="No tasks have been composed for this project yet." />
            ) : (
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-3 px-5 py-2.5 border-b border-beige-100/60 text-[10px] font-semibold text-beige-500 uppercase tracking-wider bg-beige-50/40">
                  <span>Task</span>
                  <span>Contributors</span>
                  <span>Skills</span>
                  <span>Status</span>
                </div>
                {tasks.map((task) => {
                  const cfg = execStatusConfig[task.execution_status] ?? execStatusConfig.NOT_STARTED;
                  const StatusIcon = cfg.icon;
                  return (
                    <div
                      key={task.task_id}
                      className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-3 px-5 py-3 border-b border-beige-100/40 last:border-b-0 hover:bg-beige-50/30 transition-colors items-start"
                    >
                      <div>
                        <p className="text-[12px] text-brown-800 font-medium">{task.task_title}</p>
                        <p className="text-[10px] text-beige-400 mt-0.5">ID: {task.task_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.contributors.length === 0 ? (
                          <span className="text-[11px] text-beige-400">Unassigned</span>
                        ) : (
                          task.contributors.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brown-50 text-brown-700"
                            >
                              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[8px] text-white">
                                {c.slice(0, 2).toUpperCase()}
                              </span>
                              {c}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {task.skills.length === 0 ? (
                          <span className="text-[11px] text-beige-400">—</span>
                        ) : (
                          task.skills.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700"
                            >
                              {s}
                            </span>
                          ))
                        )}
                      </div>
                      <div className={cn("inline-flex items-center gap-1.5 self-start px-2 py-1 rounded-md", cfg.bg)}>
                        <StatusIcon
                          className={cn(
                            "w-3.5 h-3.5",
                            cfg.color,
                            task.execution_status === "IN_PROGRESS" && "animate-pulse",
                          )}
                        />
                        <span className={cn("text-[10px] font-semibold", cfg.color)}>{cfg.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Skill Coverage ── */}
        {activeTab === "coverage" && (
          <motion.div variants={fadeUp}>
            {coverage.isError ? (
              <div className="p-8 text-center space-y-2">
                <AlertTriangle className="w-5 h-5 text-danger mx-auto" />
                <p className="text-danger text-sm">Failed to load skill coverage</p>
                <p className="text-beige-500 text-xs">
                  {coverage.error instanceof Error ? coverage.error.message : "Unknown error"}
                </p>
                <Button variant="outline" onClick={() => coverage.refetch()} className="text-[11px] mt-2">
                  Retry
                </Button>
              </div>
            ) : (coverage.data?.skills.length ?? 0) === 0 ? (
              <EmptyState message="No skill coverage data available for this project." />
            ) : (
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr] gap-3 px-5 py-2.5 border-b border-beige-100/60 text-[10px] font-semibold text-beige-500 uppercase tracking-wider bg-beige-50/40">
                  <span>Skill</span>
                  <span className="text-right">Tasks Requiring</span>
                </div>
                {coverage.data!.skills.map((row) => {
                  const maxCount = Math.max(...coverage.data!.skills.map((s) => s.task_count), 1);
                  const widthPct = Math.round((row.task_count / maxCount) * 100);
                  return (
                    <div
                      key={row.skill}
                      className="grid grid-cols-[2fr_1fr] gap-3 px-5 py-3 border-b border-beige-100/40 last:border-b-0 hover:bg-beige-50/30 transition-colors items-center"
                    >
                      <div>
                        <p className="text-[12px] text-brown-800 font-medium">{row.skill}</p>
                        <div className="mt-1.5 h-1.5 rounded-full bg-beige-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brown-400 to-brown-600 transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold">
                          {row.task_count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Skill Coverage Review Modal ── */}
      {showReviewForm && (
        <div
          className="fixed inset-0 bg-brown-950/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !reviewMutation.isPending && setShowReviewForm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-brown-900">Request Skill Coverage Review</h3>
              <button
                onClick={() => setShowReviewForm(false)}
                disabled={reviewMutation.isPending}
                className="p-1 rounded-lg hover:bg-beige-100 text-beige-400 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-beige-500">
              Submit a concern about match quality for this project. Routes to GlimmoraTeam Admin.
            </p>

            <div>
              <label className="text-[12px] font-semibold text-brown-700 mb-1.5 block">
                Note <span className="text-beige-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Optional message to Admin…"
                className="w-full min-h-[100px] rounded-xl border border-beige-200/60 bg-white/60 p-3 text-[13px] text-brown-800 placeholder:text-beige-400 focus:outline-none focus:ring-2 focus:ring-brown-200/40 resize-none"
              />
              <p className="text-[10px] text-beige-400 mt-1">{reviewNote.length} characters</p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                disabled={reviewMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={reviewMutation.isPending}
                className="flex-1 bg-gradient-to-r from-brown-500 to-brown-600"
              >
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Small presentational helpers ── */

function SummaryChip({
  icon: Icon, label, value, color, bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg", bg)}>
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span className="text-[11px] font-semibold text-brown-800">{value}</span>
      <span className={cn("text-[11px]", color)}>{label}</span>
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold transition-colors border-b-2 -mb-px",
        active
          ? "text-brown-900 border-brown-500"
          : "text-beige-500 border-transparent hover:text-brown-700",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-beige-200/60 bg-white/40 p-12 text-center">
      <Clock className="w-6 h-6 text-beige-300 mx-auto mb-2" />
      <p className="text-[12px] text-beige-500">{message}</p>
    </div>
  );
}
