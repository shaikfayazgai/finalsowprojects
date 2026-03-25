"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileCheck,
  FileText,
  Flag,
  Layers,
  ListChecks,
  ShieldCheck,
  Users,
  Zap,
  AlertTriangle,
  Eye,
  Sparkles,
  Package,
  Timer,
  BarChart3,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn, slideInRight } from "@/lib/utils/motion-variants";
import {
  Badge,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import {
  mockProjects,
  mockTasks,
  mockTeams,
  mockMilestones,
  mockDeliverables,
} from "@/mocks/data/enterprise-projects";
import type {
  ProjectHealth,
  MilestoneStatus,
  TaskStatus,
} from "@/types/enterprise";

/* -- Health config -- */
const healthConfig: Record<
  ProjectHealth,
  {
    label: string;
    dot: string;
    variant: "forest" | "gold" | "danger" | "teal";
    ringColor: "forest" | "gold" | "brown" | "teal";
  }
> = {
  on_track: {
    label: "On Track",
    dot: "bg-forest-500",
    variant: "forest",
    ringColor: "forest",
  },
  at_risk: {
    label: "At Risk",
    dot: "bg-gold-500",
    variant: "gold",
    ringColor: "gold",
  },
  behind: {
    label: "Behind",
    dot: "bg-[var(--danger)]",
    variant: "danger",
    ringColor: "brown",
  },
  completed: {
    label: "Completed",
    dot: "bg-teal-500",
    variant: "teal",
    ringColor: "teal",
  },
};

/* -- Task status config -- */
const taskStatusConfig: Record<
  TaskStatus,
  { label: string; variant: "forest" | "teal" | "gold" | "brown" | "danger" | "beige" }
> = {
  backlog: { label: "Backlog", variant: "beige" },
  in_progress: { label: "In Progress", variant: "teal" },
  in_review: { label: "In Review", variant: "gold" },
  rework: { label: "Rework", variant: "brown" },
  accepted: { label: "Accepted", variant: "forest" },
  rejected: { label: "Rejected", variant: "danger" },
};

const priorityConfig: Record<
  string,
  { label: string; color: string }
> = {
  critical: { label: "Critical", color: "bg-brown-100 text-brown-700" },
  high: { label: "High", color: "bg-gold-100 text-gold-700" },
  medium: { label: "Medium", color: "bg-teal-100 text-teal-700" },
  low: { label: "Low", color: "bg-beige-200 text-beige-600" },
};

/* -- Milestone status colors -- */
const msStatusColors: Record<
  MilestoneStatus,
  { dot: string; text: string; bg: string }
> = {
  completed: {
    dot: "bg-forest-500",
    text: "text-forest-700",
    bg: "bg-forest-50",
  },
  in_progress: {
    dot: "bg-teal-500",
    text: "text-teal-700",
    bg: "bg-teal-50",
  },
  upcoming: {
    dot: "bg-beige-300",
    text: "text-beige-500",
    bg: "bg-beige-50",
  },
  overdue: {
    dot: "bg-[var(--danger)]",
    text: "text-[var(--danger)]",
    bg: "bg-brown-50",
  },
};

/* -- Deliverable status config -- */
const deliverableStatusConfig: Record<
  string,
  { label: string; variant: "gold" | "forest" | "danger" | "brown" }
> = {
  pending: { label: "Pending Review", variant: "gold" },
  approved: { label: "Approved", variant: "forest" },
  rejected: { label: "Rejected", variant: "danger" },
  rework: { label: "Rework Requested", variant: "brown" },
};

/* -- Track label helper -- */
function trackLabel(track: string) {
  switch (track) {
    case "women":
      return { label: "Women's Track", color: "bg-brown-100 text-brown-700" };
    case "student":
      return { label: "University Track", color: "bg-teal-100 text-teal-700" };
    default:
      return { label: "General", color: "bg-beige-200 text-beige-600" };
  }
}

/* -- Date formatter -- */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShortDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ================================================================
   PROJECT DETAIL PAGE
   ================================================================ */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const project =
    mockProjects.find((p) => p.id === projectId) ?? mockProjects[0];
  const milestones = mockMilestones.filter(
    (m) => m.projectId === project.id
  );
  const team = mockTeams.find((t) => t.id === project.teamId);
  const tasks = mockTasks.filter((t) => t.planId === project.planId);
  const deliverables = mockDeliverables.filter(
    (d) => d.projectId === project.id
  );
  const hc = healthConfig[project.health];
  const [resolvedExceptions, setResolvedExceptions] = React.useState<Set<string>>(new Set());

  const budgetPct = Math.round((project.spent / project.budget) * 100);
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(project.endDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  /* Inline exceptions for this project */
  const projectExceptions = [
    ...(project.escalations > 0
      ? [
          {
            id: "pe-1",
            type: "escalation",
            description:
              "Client escalation: deliverable review cycle exceeding SLA threshold.",
            severity: "critical" as const,
            date: "2 hours ago",
            status: "open" as const,
          },
        ]
      : []),
    ...(project.slaCompliance < 90
      ? [
          {
            id: "pe-2",
            type: "sla_breach",
            description:
              "SLA compliance dropped below 90% target. Evidence packs pending review beyond 48h window.",
            severity: "warning" as const,
            date: "6 hours ago",
            status: "investigating" as const,
          },
        ]
      : []),
    ...(project.health === "behind"
      ? [
          {
            id: "pe-3",
            type: "quality_issue",
            description:
              "Review pass rate dropped to 58% over last 5 submissions. APG quality threshold is 75%.",
            severity: "warning" as const,
            date: "1 day ago",
            status: "open" as const,
          },
        ]
      : []),
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
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

      {/* Header Card */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Title, client, health */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
                {project.title}
              </h1>
              <Badge variant={hc.variant} size="sm" dot>
                {hc.label}
              </Badge>
            </div>
            <p className="text-[13px] text-beige-500 mt-1">
              {project.client}
            </p>
            <Link
              href={`/enterprise/sow/${project.sowId}`}
              className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 hover:underline font-medium mt-0.5 transition-colors"
            >
              <FileText className="w-3 h-3" />
              SOW: {project.sowTitle}
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </Link>
          </div>

          {/* Right: Key metrics row */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Progress + APG */}
            <div className="flex items-center gap-4">
              <MetricRing
                value={project.apgScore}
                size={64}
                strokeWidth={5}
                color={hc.ringColor}
                label="APG"
              />
              <div className="text-right">
                <p className="text-[28px] font-bold text-brown-900 tracking-tight leading-none">
                  {project.progress}%
                </p>
                <p className="text-[10px] text-beige-500 mt-0.5">Complete</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">
                  ${(project.budget / 1000).toFixed(0)}k budget
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">
                  {project.teamSize} members
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-beige-400" />
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    project.slaCompliance >= 95
                      ? "text-forest-700"
                      : project.slaCompliance >= 85
                      ? "text-gold-700"
                      : "text-brown-700"
                  )}
                >
                  {project.slaCompliance}% SLA
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">
                  {daysLeft} days left
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sub-page navigation */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Link
          href={`/enterprise/projects/${projectId}/milestones`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-beige-200 bg-white/80 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 hover:border-brown-300 transition-all"
        >
          <Layers className="w-3.5 h-3.5" /> View Milestones
        </Link>
        <Link
          href={`/enterprise/projects/${projectId}/monitor`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-beige-200 bg-white/80 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 hover:border-brown-300 transition-all"
        >
          <Zap className="w-3.5 h-3.5" /> Live Monitor
        </Link>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <motion.div variants={fadeUp}>
          <TabsList className="bg-beige-100/80 p-1">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ---- TASKS TAB ---- */}
        <TabsContent value="tasks">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Summary row */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {[
                {
                  label: "Total Tasks",
                  value: tasks.length,
                  icon: ListChecks,
                  color: "from-brown-400 to-brown-600",
                },
                {
                  label: "Accepted",
                  value: tasks.filter((t) => t.status === "accepted").length,
                  icon: CheckCircle2,
                  color: "from-forest-400 to-forest-600",
                },
                {
                  label: "In Progress",
                  value: tasks.filter((t) => t.status === "in_progress").length,
                  icon: Zap,
                  color: "from-teal-400 to-teal-600",
                },
                {
                  label: "In Review",
                  value: tasks.filter((t) => t.status === "in_review").length,
                  icon: Eye,
                  color: "from-gold-400 to-gold-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                      s.color
                    )}
                  >
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-brown-900 leading-none">
                      {s.value}
                    </p>
                    <p className="text-[10px] text-beige-500 mt-0.5">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Task table */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Est. Hours</TableHead>
                    <TableHead>Phase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => {
                    const ts = taskStatusConfig[task.status];
                    const pc = priorityConfig[task.priority];
                    return (
                      <TableRow key={task.id} className="cursor-pointer hover:bg-beige-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <Link
                              href={`/enterprise/projects/${projectId}/tasks/${task.id}`}
                              className="text-[13px] font-semibold text-brown-900 hover:text-teal-700 hover:underline transition-colors"
                            >
                              {task.title}
                            </Link>
                            <p className="text-[11px] text-beige-500 mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ts.variant} size="sm" dot>
                            {ts.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                              pc.color
                            )}
                          >
                            {pc.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {task.skillsRequired.map((skill) => (
                              <span
                                key={skill.name}
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-beige-100 text-beige-600"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[12px] font-mono font-semibold text-brown-700">
                            {task.estimatedHours}h
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-medium text-beige-600">
                            Phase {task.phase}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {tasks.length === 0 && (
                <div className="py-12 text-center">
                  <ListChecks className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                  <p className="text-[13px] text-beige-400">
                    No tasks found for this project.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ---- TEAM TAB ---- */}
        <TabsContent value="team">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {team ? (
              <>
                {/* Team header */}
                <motion.div
                  variants={fadeUp}
                  className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <MetricRing
                      value={team.matchScore}
                      size={64}
                      strokeWidth={5}
                      color={
                        team.matchScore >= 90
                          ? "forest"
                          : team.matchScore >= 80
                          ? "teal"
                          : "gold"
                      }
                      label="Match"
                    />
                    <div>
                      <h3 className="text-[16px] font-bold text-brown-900">
                        {team.name}
                      </h3>
                      <p className="text-[11px] text-beige-500 mt-0.5">
                        {team.totalMembers} members - Plan: {team.planId}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {team.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Privacy notice */}
                <motion.div
                  variants={fadeUp}
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brown-50/60 via-beige-50/60 to-forest-50/60 border border-beige-200/40 px-4 py-3"
                >
                  <ShieldCheck className="w-4 h-4 text-forest-500 shrink-0" />
                  <p className="text-[11px] text-beige-600">
                    All contributor identities are anonymized. No real names,
                    resumes, or public profiles are exposed. Privacy by
                    architecture.
                  </p>
                </motion.div>

                {/* Members table */}
                <motion.div
                  variants={fadeUp}
                  className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contributor</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Match Score</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Track</TableHead>
                        <TableHead>Tasks Done</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.members.map((member) => {
                        const tl = trackLabel(member.track);
                        return (
                          <TableRow key={member.id} className="hover:bg-beige-50/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                >
                                  {member.avatar}
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold text-brown-900">
                                    {member.displayName}
                                  </p>
                                  <p className="text-[10px] text-beige-400 font-mono">
                                    {member.anonymousId}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {member.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-beige-100 text-beige-600"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 rounded-full bg-beige-100 overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      member.matchScore >= 90
                                        ? "bg-forest-500"
                                        : member.matchScore >= 80
                                        ? "bg-teal-500"
                                        : "bg-gold-500"
                                    )}
                                    style={{
                                      width: `${member.matchScore}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[12px] font-bold text-brown-800">
                                  {member.matchScore}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  member.availability === "full_time"
                                    ? "forest"
                                    : member.availability === "part_time"
                                    ? "gold"
                                    : "beige"
                                }
                                size="sm"
                              >
                                {member.availability === "full_time"
                                  ? "Full-time"
                                  : member.availability === "part_time"
                                  ? "Part-time"
                                  : "Limited"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                  tl.color
                                )}
                              >
                                {tl.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-[12px] font-bold text-brown-800">
                                {member.tasksCompleted}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-gold-500" />
                                <span className="text-[12px] font-bold text-brown-800">
                                  {member.rating}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </motion.div>
              </>
            ) : (
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center"
              >
                <Users className="w-10 h-10 text-beige-300 mx-auto mb-3" />
                <h3 className="text-[16px] font-bold text-brown-900">
                  No Team Assigned
                </h3>
                <p className="text-[13px] text-beige-500 mt-1">
                  A team will be formed once the plan is approved.
                </p>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        {/* ---- TIMELINE (GANTT) TAB ---- */}
        <TabsContent value="timeline">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <span className="text-[13px] font-semibold text-brown-800">
                  Milestone Timeline
                </span>
                <span className="text-[11px] text-beige-400 ml-auto">
                  {fmtDate(project.startDate)} - {fmtDate(project.endDate)}
                </span>
              </div>

              {milestones.length > 0 ? (
                <div className="space-y-1">
                  {/* Gantt header with month labels */}
                  <div className="flex items-center mb-4">
                    <div className="w-[200px] shrink-0" />
                    <div className="flex-1 flex items-center justify-between px-2">
                      {(() => {
                        const start = new Date(project.startDate);
                        const end = new Date(project.endDate);
                        const months: string[] = [];
                        const cursor = new Date(
                          start.getFullYear(),
                          start.getMonth(),
                          1
                        );
                        while (cursor <= end) {
                          months.push(
                            cursor.toLocaleDateString("en-US", {
                              month: "short",
                              year: "2-digit",
                            })
                          );
                          cursor.setMonth(cursor.getMonth() + 1);
                        }
                        return months.map((m) => (
                          <span
                            key={m}
                            className="text-[9px] text-beige-400 font-medium uppercase tracking-wider"
                          >
                            {m}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Gantt bars */}
                  {milestones.map((ms) => {
                    const msC = msStatusColors[ms.status];
                    const projectStart = new Date(
                      project.startDate
                    ).getTime();
                    const projectEnd = new Date(project.endDate).getTime();
                    const totalDuration = projectEnd - projectStart;

                    /* Calculate bar start: midpoint between previous milestone due date and this one, or project start */
                    const msIndex = milestones.indexOf(ms);
                    const barStart =
                      msIndex === 0
                        ? projectStart
                        : new Date(
                            milestones[msIndex - 1].dueDate
                          ).getTime();
                    const barEnd = new Date(ms.dueDate).getTime();
                    const leftPct = Math.max(
                      0,
                      ((barStart - projectStart) / totalDuration) * 100
                    );
                    const widthPct = Math.max(
                      5,
                      ((barEnd - barStart) / totalDuration) * 100
                    );

                    return (
                      <motion.div
                        key={ms.id}
                        variants={scaleIn}
                        className="flex items-center group"
                      >
                        {/* Label */}
                        <div className="w-[200px] shrink-0 pr-4">
                          <p className="text-[12px] font-semibold text-brown-800 truncate">
                            {ms.title}
                          </p>
                          <p className="text-[10px] text-beige-400">
                            Due {fmtShortDate(ms.dueDate)}
                          </p>
                        </div>

                        {/* Bar container */}
                        <div className="flex-1 h-10 relative">
                          <div className="absolute inset-0 border-l border-beige-100" />
                          <div
                            className="absolute top-1.5 h-7 rounded-lg overflow-hidden"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                          >
                            {/* Background */}
                            <div
                              className={cn(
                                "absolute inset-0 opacity-20",
                                msC.bg
                              )}
                            />
                            {/* Progress fill */}
                            <div
                              className={cn(
                                "absolute inset-y-0 left-0 rounded-lg opacity-40",
                                msC.dot
                              )}
                              style={{ width: `${ms.progress}%` }}
                            />
                            {/* Border */}
                            <div
                              className={cn(
                                "absolute inset-0 rounded-lg border",
                                ms.status === "completed"
                                  ? "border-forest-300"
                                  : ms.status === "in_progress"
                                  ? "border-teal-300"
                                  : ms.status === "overdue"
                                  ? "border-brown-300"
                                  : "border-beige-200"
                              )}
                            />
                            {/* Label inside bar */}
                            <div className="absolute inset-0 flex items-center px-2">
                              <span
                                className={cn(
                                  "text-[10px] font-bold",
                                  msC.text
                                )}
                              >
                                {ms.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-beige-100/80">
                    {(
                      [
                        "completed",
                        "in_progress",
                        "upcoming",
                        "overdue",
                      ] as MilestoneStatus[]
                    ).map((status) => (
                      <div
                        key={status}
                        className="flex items-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-sm",
                            msStatusColors[status].dot
                          )}
                        />
                        <span className="text-[10px] text-beige-500 capitalize">
                          {status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Layers className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                  <p className="text-[13px] text-beige-400">
                    No milestones defined yet.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ---- SLA TAB ---- */}
        <TabsContent value="sla">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* SLA Overview */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Main SLA Ring */}
              <div className="md:col-span-1 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6 flex flex-col items-center justify-center">
                <MetricRing
                  value={project.slaCompliance}
                  size={120}
                  strokeWidth={10}
                  color={
                    project.slaCompliance >= 95
                      ? "forest"
                      : project.slaCompliance >= 85
                      ? "gold"
                      : "brown"
                  }
                  label="SLA Score"
                />
                <p className="text-[13px] font-semibold text-brown-800 mt-4">
                  Overall SLA Compliance
                </p>
                <p className="text-[11px] text-beige-500 mt-1 text-center max-w-[200px]">
                  {project.slaCompliance >= 95
                    ? "Excellent compliance. All SLA targets are being met."
                    : project.slaCompliance >= 85
                    ? "Moderate compliance. Some SLA targets need attention."
                    : "Below threshold. Immediate action required."}
                </p>
              </div>

              {/* SLA Metrics Grid */}
              <div className="md:col-span-2 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Review Turnaround",
                    target: "48h",
                    actual: project.slaCompliance >= 90 ? "34h" : "52h",
                    status: project.slaCompliance >= 90,
                    icon: Timer,
                  },
                  {
                    label: "Payment Release",
                    target: "72h",
                    actual: project.slaCompliance >= 85 ? "48h" : "78h",
                    status: project.slaCompliance >= 85,
                    icon: CircleDollarSign,
                  },
                  {
                    label: "Escalation Response",
                    target: "4h",
                    actual: project.slaCompliance >= 90 ? "2h" : "6h",
                    status: project.slaCompliance >= 90,
                    icon: Flag,
                  },
                  {
                    label: "Evidence Pack Review",
                    target: "24h",
                    actual: project.slaCompliance >= 90 ? "18h" : "32h",
                    status: project.slaCompliance >= 90,
                    icon: FileCheck,
                  },
                ].map((metric) => (
                  <motion.div
                    key={metric.label}
                    variants={scaleIn}
                    className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <metric.icon className="w-4 h-4 text-beige-400" />
                        <span className="text-[11px] font-semibold text-brown-700">
                          {metric.label}
                        </span>
                      </div>
                      {metric.status ? (
                        <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-gold-500" />
                      )}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-beige-400 uppercase tracking-wider">
                          Target
                        </p>
                        <p className="text-[14px] font-bold text-beige-500">
                          {metric.target}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-beige-400 uppercase tracking-wider">
                          Actual
                        </p>
                        <p
                          className={cn(
                            "text-[14px] font-bold",
                            metric.status
                              ? "text-forest-700"
                              : "text-gold-700"
                          )}
                        >
                          {metric.actual}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* SLA History / Compliance Trend */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-4 h-4 text-forest-500" />
                <span className="text-[13px] font-semibold text-brown-800">
                  Compliance Trend
                </span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {[88, 91, 93, 90, 94, project.slaCompliance].map(
                  (val, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[9px] font-bold text-brown-700">
                        {val}%
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all",
                          val >= 95
                            ? "bg-gradient-to-t from-forest-400 to-forest-300"
                            : val >= 85
                            ? "bg-gradient-to-t from-gold-400 to-gold-300"
                            : "bg-gradient-to-t from-brown-400 to-brown-300"
                        )}
                        style={{ height: `${val}%` }}
                      />
                      <span className="text-[8px] text-beige-400">
                        W{i + 1}
                      </span>
                    </div>
                  )
                )}
              </div>
              {/* Threshold line */}
              <div className="relative mt-2 pt-2 border-t border-dashed border-forest-300/50">
                <span className="text-[9px] text-forest-600 font-medium">
                  95% target threshold
                </span>
              </div>
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* ---- EXCEPTIONS TAB ---- */}
        <TabsContent value="exceptions">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Summary */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-3 gap-3"
            >
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center text-white">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-brown-900 leading-none">
                    {project.escalations}
                  </p>
                  <p className="text-[10px] text-beige-500 mt-0.5">
                    Escalations
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-brown-900 leading-none">
                    {projectExceptions.filter((e) => e.status === "open").length}
                  </p>
                  <p className="text-[10px] text-beige-500 mt-0.5">
                    Open
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[18px] font-bold text-brown-900 leading-none">
                    4.2h
                  </p>
                  <p className="text-[10px] text-beige-500 mt-0.5">
                    Avg Resolution
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Exception list */}
            {projectExceptions.length > 0 ? (
              <div className="space-y-3">
                {projectExceptions.map((exc) => (
                  <motion.div
                    key={exc.id}
                    variants={scaleIn}
                    className={cn(
                      "rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 border-l-[4px]",
                      exc.severity === "critical"
                        ? "border-l-brown-600"
                        : "border-l-gold-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            variant={
                              exc.type === "escalation"
                                ? "danger"
                                : exc.type === "sla_breach"
                                ? "brown"
                                : "gold"
                            }
                            size="sm"
                            dot
                          >
                            {exc.type === "escalation"
                              ? "Escalation"
                              : exc.type === "sla_breach"
                              ? "SLA Breach"
                              : "Quality Issue"}
                          </Badge>
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                              exc.severity === "critical"
                                ? "bg-brown-100 text-brown-700"
                                : "bg-gold-100 text-gold-700"
                            )}
                          >
                            {exc.severity}
                          </span>
                          <Badge
                            variant={
                              resolvedExceptions.has(exc.id)
                                ? "forest"
                                : exc.status === "open"
                                ? "gold"
                                : exc.status === "investigating"
                                ? "teal"
                                : "forest"
                            }
                            size="sm"
                          >
                            {resolvedExceptions.has(exc.id) ? "resolved" : exc.status}
                          </Badge>
                        </div>
                        <p className="text-[12px] text-beige-600 leading-relaxed">
                          {exc.description}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-[10px] text-beige-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {exc.date}
                          </p>
                          <div className="flex items-center gap-2">
                            {!resolvedExceptions.has(exc.id) && (
                              <button
                                onClick={() =>
                                  setResolvedExceptions((prev) => {
                                    const next = new Set(prev);
                                    next.add(exc.id);
                                    return next;
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50 text-[10px] font-semibold text-forest-700 hover:bg-forest-100 border border-forest-200 transition-all"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Resolve
                              </button>
                            )}
                            <Link
                              href="/enterprise/projects/exceptions"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-beige-200 bg-white/80 text-[10px] font-semibold text-brown-700 hover:bg-beige-50 hover:border-brown-300 transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View in Queue
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center"
              >
                <CheckCircle2 className="w-10 h-10 text-forest-400 mx-auto mb-3" />
                <h3 className="text-[16px] font-bold text-brown-900">
                  No Exceptions
                </h3>
                <p className="text-[13px] text-beige-500 mt-1">
                  This project has no active exceptions or escalations.
                </p>
              </motion.div>
            )}
          </motion.div>
        </TabsContent>

        {/* ---- DELIVERABLES TAB ---- */}
        <TabsContent value="deliverables">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Summary */}
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {[
                {
                  label: "Total",
                  value: deliverables.length,
                  icon: Package,
                  color: "from-brown-400 to-brown-600",
                },
                {
                  label: "Pending",
                  value: deliverables.filter((d) => d.status === "pending")
                    .length,
                  icon: Clock,
                  color: "from-gold-400 to-gold-600",
                },
                {
                  label: "Approved",
                  value: deliverables.filter((d) => d.status === "approved")
                    .length,
                  icon: CheckCircle2,
                  color: "from-forest-400 to-forest-600",
                },
                {
                  label: "Rework",
                  value: deliverables.filter((d) => d.status === "rework")
                    .length,
                  icon: XCircle,
                  color: "from-teal-400 to-teal-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                      s.color
                    )}
                  >
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-brown-900 leading-none">
                      {s.value}
                    </p>
                    <p className="text-[10px] text-beige-500 mt-0.5">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Deliverables table */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deliverable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliverables.map((del) => {
                    const ds = deliverableStatusConfig[del.status];
                    return (
                      <TableRow key={del.id}>
                        <TableCell>
                          <p className="text-[13px] font-semibold text-brown-900">
                            {del.title}
                          </p>
                          <p className="text-[10px] text-beige-400 font-mono mt-0.5">
                            {del.taskId} / {del.milestoneId}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ds.variant} size="sm" dot>
                            {ds.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[12px] text-brown-700">
                            {del.submittedBy}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] text-beige-500">
                            {fmtDate(del.submittedAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/enterprise/review/${del.id}`}
                            className="flex items-center gap-1.5 hover:text-teal-700 transition-colors group"
                          >
                            <FileText className="w-3.5 h-3.5 text-beige-400 group-hover:text-teal-500" />
                            <span className="text-[12px] font-semibold text-brown-800 group-hover:text-teal-700 group-hover:underline">
                              {del.evidenceFiles} files
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <p className="text-[11px] text-beige-500 max-w-[200px] truncate">
                            {del.reviewerNotes ?? "--"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {del.status === "pending" ? (
                            <Link
                              href={`/enterprise/review/${del.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white text-[10px] font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
                            >
                              <Eye className="w-3 h-3" />
                              Review
                            </Link>
                          ) : del.status === "rework" ? (
                            <Link
                              href={`/enterprise/review/${del.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-brown-600 hover:text-brown-800 hover:underline transition-colors"
                            >
                              <FileCheck className="w-3 h-3" />
                              View Feedback
                            </Link>
                          ) : (
                            <span className="text-[10px] text-beige-400">
                              {del.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {deliverables.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                  <p className="text-[13px] text-beige-400">
                    No deliverables submitted yet.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
