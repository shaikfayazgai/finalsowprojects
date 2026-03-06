"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap,
  Timer,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockTeams, mockTasks, mockProjects } from "@/mocks/data/enterprise-projects";
import type { TeamStatus } from "@/types/enterprise";

/* -- Status config -- */
const teamStatusConfig: Record<
  TeamStatus,
  { variant: "gold" | "teal" | "forest" | "brown" | "beige"; label: string }
> = {
  forming: { variant: "gold", label: "Forming" },
  ready: { variant: "teal", label: "Ready" },
  approved: { variant: "forest", label: "Approved" },
  active: { variant: "brown", label: "Active" },
  disbanded: { variant: "beige", label: "Disbanded" },
};

/* -- Filter to active / approved teams -- */
const monitoredTeams = mockTeams.filter(
  (t) => t.status === "active" || t.status === "approved"
);

/* -- Build assignment rows by mapping team members to tasks -- */
interface AssignmentRow {
  contributor: string;
  avatar: string;
  task: string;
  taskStatus: string;
  slaDeadline: Date;
  teamName: string;
  matchScore: number;
  availability: string;
}

function buildAssignments(): AssignmentRow[] {
  const assignments: AssignmentRow[] = [];
  const activeTasks = mockTasks.filter(
    (t) =>
      t.status === "in_progress" ||
      t.status === "in_review" ||
      t.status === "accepted"
  );

  for (const team of monitoredTeams) {
    for (let i = 0; i < team.members.length; i++) {
      const member = team.members[i];
      const task = activeTasks[i % activeTasks.length];
      if (!task) continue;

      /* Generate SLA deadlines: varying hours from now */
      const hoursFromNow = [6, 14, 28, 52, 72, 96, 120][i % 7];
      const deadline = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);

      assignments.push({
        contributor: member.displayName,
        avatar: member.avatar,
        task: task.title,
        taskStatus: task.status,
        slaDeadline: deadline,
        teamName: team.name,
        matchScore: member.matchScore,
        availability: member.availability,
      });
    }
  }
  return assignments;
}

const assignments = buildAssignments();

/* -- SLA time remaining helpers -- */
function getTimeRemaining(deadline: Date): {
  text: string;
  hours: number;
  urgency: "green" | "gold" | "danger";
} {
  const now = Date.now();
  const remaining = deadline.getTime() - now;
  const hours = Math.max(0, remaining / (1000 * 60 * 60));

  let text: string;
  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    const h = Math.floor(hours % 24);
    text = `${days}d ${h}h`;
  } else if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    text = `${h}h ${m}m`;
  } else {
    const m = Math.floor(hours * 60);
    text = `${m}m`;
  }

  const urgency: "green" | "gold" | "danger" =
    hours > 48 ? "green" : hours > 12 ? "gold" : "danger";

  return { text, hours, urgency };
}

function urgencyStyles(urgency: "green" | "gold" | "danger") {
  switch (urgency) {
    case "green":
      return {
        text: "text-forest-700",
        bg: "bg-forest-50",
        border: "border-forest-200",
        dot: "bg-forest-500",
        pulse: "",
      };
    case "gold":
      return {
        text: "text-gold-700",
        bg: "bg-gold-50",
        border: "border-gold-200",
        dot: "bg-gold-500",
        pulse: "animate-pulse",
      };
    case "danger":
      return {
        text: "text-brown-700",
        bg: "bg-brown-50",
        border: "border-brown-300",
        dot: "bg-[var(--danger)]",
        pulse: "animate-pulse",
      };
  }
}

/* -- Task status badge mapping -- */
const taskStatusBadge: Record<
  string,
  { label: string; variant: "forest" | "teal" | "gold" | "brown" | "beige" }
> = {
  backlog: { label: "Backlog", variant: "beige" },
  in_progress: { label: "In Progress", variant: "teal" },
  in_review: { label: "In Review", variant: "gold" },
  rework: { label: "Rework", variant: "brown" },
  accepted: { label: "Accepted", variant: "forest" },
  rejected: { label: "Rejected", variant: "brown" },
};

/* ================================================================
   ASSIGNMENT MONITOR PAGE
   ================================================================ */
export default function AssignmentMonitorPage() {
  const activeAssignments = assignments.length;
  const greenCount = assignments.filter(
    (a) => getTimeRemaining(a.slaDeadline).urgency === "green"
  ).length;
  const goldCount = assignments.filter(
    (a) => getTimeRemaining(a.slaDeadline).urgency === "gold"
  ).length;
  const dangerCount = assignments.filter(
    (a) => getTimeRemaining(a.slaDeadline).urgency === "danger"
  ).length;

  const onTrackTeams = monitoredTeams.filter((t) => {
    const project = mockProjects.find((p) => p.teamId === t.id);
    return project && project.health === "on_track";
  }).length;

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
          href="/enterprise/team"
          className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Teams
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-500 to-gold-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Assignment Monitor
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1 max-w-lg">
            Real-time SLA tracking for all active contributor assignments.
            Color-coded urgency indicators show time remaining until SLA
            deadlines.
          </p>
        </div>
        <Link
          href="/enterprise/team"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-beige-200 text-beige-600 text-[12px] font-semibold hover:border-brown-300 hover:text-brown-600 transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          All Teams
        </Link>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-brown-100 text-brown-600 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <p className="text-[24px] font-bold text-brown-900 tracking-tight leading-none">
            {activeAssignments}
          </p>
          <p className="text-[11px] text-beige-500 font-medium mt-1.5">
            Active Assignments
          </p>
          <p className="text-[10px] text-beige-400 mt-0.5">
            {monitoredTeams.reduce((s, t) => s + t.totalMembers, 0)}{" "}
            contributors
          </p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-[24px] font-bold text-forest-700 tracking-tight leading-none">
            {greenCount}
          </p>
          <p className="text-[11px] text-beige-500 font-medium mt-1.5">
            On Schedule ({">"}48h)
          </p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-[24px] font-bold text-gold-700 tracking-tight leading-none">
            {goldCount}
          </p>
          <p className="text-[11px] text-beige-500 font-medium mt-1.5">
            Approaching ({"<"}48h)
          </p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="relative overflow-hidden rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-brown-100 text-brown-700 flex items-center justify-center mb-3">
            <Timer className="w-5 h-5" />
          </div>
          <p className="text-[24px] font-bold text-brown-700 tracking-tight leading-none">
            {dangerCount}
          </p>
          <p className="text-[11px] text-beige-500 font-medium mt-1.5">
            Critical ({"<"}12h)
          </p>
        </motion.div>
      </div>

      {/* SLA Legend */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-6 rounded-xl bg-gradient-to-r from-brown-50/60 via-beige-50/60 to-forest-50/60 border border-beige-200/40 px-5 py-3"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-500" />
          <span className="text-[11px] font-semibold text-brown-700">
            SLA Color Key:
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest-500" />
          <span className="text-[10px] text-beige-600">
            {">"}48h remaining
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
          <span className="text-[10px] text-beige-600">{"<"}48h remaining</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]" />
          <span className="text-[10px] text-beige-600">{"<"}12h remaining</span>
        </div>
      </motion.div>

      {/* Assignment Table */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contributor</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>SLA Deadline</TableHead>
              <TableHead>Time Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments
              .sort(
                (a, b) =>
                  a.slaDeadline.getTime() - b.slaDeadline.getTime()
              )
              .map((assignment, idx) => {
                const remaining = getTimeRemaining(assignment.slaDeadline);
                const uStyles = urgencyStyles(remaining.urgency);
                const tsb =
                  taskStatusBadge[assignment.taskStatus] ??
                  taskStatusBadge.in_progress;

                return (
                  <TableRow key={idx}>
                    {/* Contributor */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {assignment.avatar}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-brown-900">
                            {assignment.contributor}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-medium text-beige-500">
                              Match: {assignment.matchScore}%
                            </span>
                            <span className="text-beige-300">|</span>
                            <Badge
                              variant={
                                assignment.availability === "full_time"
                                  ? "forest"
                                  : assignment.availability === "part_time"
                                  ? "gold"
                                  : "beige"
                              }
                              size="sm"
                            >
                              {assignment.availability === "full_time"
                                ? "Full"
                                : assignment.availability === "part_time"
                                ? "Part"
                                : "Limited"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Task */}
                    <TableCell>
                      <p className="text-[12px] font-medium text-brown-800 max-w-[200px] truncate">
                        {assignment.task}
                      </p>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant={tsb.variant} size="sm" dot>
                        {tsb.label}
                      </Badge>
                    </TableCell>

                    {/* Team */}
                    <TableCell>
                      <span className="text-[11px] text-beige-600">
                        {assignment.teamName}
                      </span>
                    </TableCell>

                    {/* SLA Deadline */}
                    <TableCell>
                      <span className="text-[11px] text-beige-500">
                        {assignment.slaDeadline.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {assignment.slaDeadline.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </TableCell>

                    {/* Time Remaining with color-coded SLA timer */}
                    <TableCell>
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                          uStyles.bg,
                          uStyles.border
                        )}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            uStyles.dot,
                            uStyles.pulse
                          )}
                        />
                        <Timer
                          className={cn("w-3.5 h-3.5", uStyles.text)}
                        />
                        <span
                          className={cn(
                            "text-[12px] font-bold font-mono",
                            uStyles.text
                          )}
                        >
                          {remaining.text}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </motion.div>

      {/* Empty state */}
      {assignments.length === 0 && (
        <motion.div
          variants={fadeUp}
          className="text-center py-16 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm"
        >
          <Activity className="w-10 h-10 text-beige-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-brown-800">
            No Active Assignments
          </p>
          <p className="text-[12px] text-beige-500 mt-1 max-w-sm mx-auto">
            Once teams are approved and assigned to projects, their progress
            will appear here for monitoring.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
