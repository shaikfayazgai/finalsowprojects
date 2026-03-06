"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  Upload,
  FileSearch,
  CheckSquare,
  Eye,
  ArrowRight,
  Users,
  CircleDollarSign,
  Activity,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Progress } from "@/components/ui";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockProjects, mockDeliverables, mockPlans } from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import type { Project, ProjectHealth } from "@/types/enterprise";

/* ══════════════════════════════════════════
   Derived data from mocks
   ══════════════════════════════════════════ */

const activeProjects = mockProjects.filter((p) => p.health !== "completed");
const totalEscalations = mockProjects.reduce((sum, p) => sum + p.escalations, 0);
const pendingDeliverables = mockDeliverables.filter((d) => d.status === "pending");
const draftPlans = mockPlans.filter((p) => p.status === "draft");
const pendingApprovals = pendingDeliverables.length + draftPlans.length;
const avgSla = Math.round(
  mockProjects.reduce((sum, p) => sum + p.slaCompliance, 0) / mockProjects.length
);
const draftSOWs = mockSOWs.filter((s) => s.status === "draft");

/* ══════════════════════════════════════════
   Health color mapping
   ══════════════════════════════════════════ */

const healthConfig: Record<
  ProjectHealth,
  { label: string; dot: string; bg: string; text: string; bar: string; badge: "forest" | "gold" | "danger" | "teal" }
> = {
  on_track: {
    label: "On Track",
    dot: "bg-forest-500",
    bg: "bg-forest-50",
    text: "text-forest-700",
    bar: "forest",
    badge: "forest",
  },
  at_risk: {
    label: "At Risk",
    dot: "bg-gold-500",
    bg: "bg-gold-50",
    text: "text-gold-800",
    bar: "gold",
    badge: "gold",
  },
  behind: {
    label: "Behind",
    dot: "bg-[var(--danger)]",
    bg: "bg-[var(--danger-light)]",
    text: "text-[var(--danger)]",
    bar: "brown",
    badge: "danger",
  },
  completed: {
    label: "Completed",
    dot: "bg-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-700",
    bar: "teal",
    badge: "teal",
  },
};

/* ══════════════════════════════════════════
   Mini Visualizations — each KPI card unique
   ══════════════════════════════════════════ */

/* Sparkline trend for Active Projects */
function MiniSparkline() {
  const points = [2, 2, 3, 3, 3, 4, 3];
  const max = Math.max(...points);
  const h = 32;
  const w = 80;
  const stepX = w / (points.length - 1);

  const d = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - (p / max) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const areaD = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-8" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4D5741" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4D5741" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke="#4D5741" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={w} cy={h - (points[points.length - 1] / max) * (h - 4) - 2} r="2.5" fill="#4D5741" />
    </svg>
  );
}

/* Alert pulse for Exceptions */
function MiniAlertPulse({ count }: { count: number }) {
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <div className="absolute inset-0 rounded-full bg-gold-500/15 animate-ping" />
      <div className="relative w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
        <span className="text-[13px] font-bold text-gold-700">{count}</span>
      </div>
    </div>
  );
}

/* Counter badge for Approvals */
function MiniCounterStack() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-teal-500" />
          <span className="text-[10px] text-beige-500">{pendingDeliverables.length} deliverables</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-brown-400" />
          <span className="text-[10px] text-beige-500">{draftPlans.length} plan</span>
        </div>
      </div>
    </div>
  );
}

/* Mini ring chart for SLA */
function MiniRingChart({ value }: { value: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="#E9DFD7" strokeWidth="3.5" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={value >= 90 ? "#4D5741" : value >= 80 ? "#D0B060" : "#C4574A"}
        strokeWidth="3.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="middle" className="text-[9px] font-bold" fill="#6B5A4E">
        {value}%
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════
   Project Summary Card
   ══════════════════════════════════════════ */

function ProjectSummaryCard({ project }: { project: Project }) {
  const h = healthConfig[project.health];
  return (
    <Link href={`/enterprise/projects/${project.id}`}>
      <motion.div
        variants={scaleIn}
        className="group relative rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Decorative gradient bar at top */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1 rounded-t-2xl",
            project.health === "on_track" && "bg-gradient-to-r from-forest-400 to-forest-600",
            project.health === "at_risk" && "bg-gradient-to-r from-gold-400 to-gold-600",
            project.health === "behind" && "bg-gradient-to-r from-[var(--danger)] to-[var(--danger-hover)]",
            project.health === "completed" && "bg-gradient-to-r from-teal-400 to-teal-600"
          )}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mt-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-brown-900 truncate group-hover:text-brown-950 transition-colors">
              {project.title}
            </h3>
            <p className="text-[11px] text-beige-500 mt-0.5">{project.client}</p>
          </div>
          <Badge variant={h.badge} size="sm" dot>
            {h.label}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-[11px] font-bold text-brown-800 font-mono">
              {project.progress}%
            </span>
          </div>
          <Progress value={project.progress} size="sm" variant={h.bar as "brown" | "forest" | "teal" | "gold"} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-beige-100/80">
          <div>
            <p className="text-[10px] text-beige-500">Team</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-beige-400" />
              <span className="text-[12px] font-semibold text-brown-800">{project.teamSize}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-beige-500">Budget</p>
            <div className="flex items-center gap-1 mt-0.5">
              <CircleDollarSign className="w-3 h-3 text-beige-400" />
              <span className="text-[12px] font-semibold text-brown-800">
                ${Math.round(project.budget / 1000)}k
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-beige-500">SLA</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-beige-400" />
              <span
                className={cn(
                  "text-[12px] font-semibold",
                  project.slaCompliance >= 90 ? "text-forest-700" : project.slaCompliance >= 80 ? "text-gold-700" : "text-[var(--danger)]"
                )}
              >
                {project.slaCompliance}%
              </span>
            </div>
          </div>
        </div>

        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-brown-400" />
        </div>
      </motion.div>
    </Link>
  );
}

/* ══════════════════════════════════════════
   Quick Action Card
   ══════════════════════════════════════════ */

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  count,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  count?: number;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        variants={scaleIn}
        className="group relative rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
              gradient
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-brown-900 group-hover:text-brown-950 transition-colors">
                {title}
              </h3>
              {count !== undefined && count > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brown-500 text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </div>
            <p className="text-[11px] text-beige-500 mt-0.5 leading-relaxed">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-beige-300 group-hover:text-brown-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>
      </motion.div>
    </Link>
  );
}

/* ══════════════════════════════════════════
   Activity Feed (anonymized)
   ══════════════════════════════════════════ */

const activityEvents = [
  {
    id: "ev-1",
    contributor: "Contributor D-2M",
    initials: "D2",
    action: "submitted evidence for",
    target: mockDeliverables[0].title,
    time: "2h ago",
    gradient: "from-teal-400 to-teal-600",
    type: "deliverable" as const,
  },
  {
    id: "ev-2",
    contributor: "Contributor A-7X",
    initials: "A7",
    action: "submitted deliverable",
    target: mockDeliverables[1].title,
    time: "5h ago",
    gradient: "from-forest-400 to-forest-600",
    type: "deliverable" as const,
  },
  {
    id: "ev-3",
    contributor: "Contributor B-3K",
    initials: "B3",
    action: "submitted for review",
    target: mockDeliverables[5].title,
    time: "1d ago",
    gradient: "from-brown-400 to-brown-600",
    type: "review" as const,
  },
  {
    id: "ev-4",
    contributor: "APG System",
    initials: "AG",
    action: "flagged escalation on",
    target: "Mobile Banking App",
    time: "1d ago",
    gradient: "from-gold-400 to-gold-600",
    type: "escalation" as const,
  },
  {
    id: "ev-5",
    contributor: "Contributor C-9R",
    initials: "C9",
    action: "completed milestone",
    target: "Infrastructure & Auth",
    time: "2d ago",
    gradient: "from-teal-500 to-forest-500",
    type: "milestone" as const,
  },
];

/* ══════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════ */

export default function EnterpriseDashboardPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1280px] mx-auto space-y-6"
    >
      {/* ── Page Header ── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-[26px] font-heading font-bold text-brown-950 tracking-[-0.02em]">
            Dashboard
          </h1>
          <p className="text-[14px] text-beige-500 mt-1">
            Good morning, Priya. Here is your project overview.
          </p>
        </div>
        <Link
          href="/enterprise/sow/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brown-500 to-brown-600 text-white text-[13px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload SOW
        </Link>
      </motion.div>

      {/* ── KPI Row — 4 visually unique cards, bento style ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active Projects */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-forest-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-forest-600" />
              </div>
              <span className="text-[12px] font-semibold text-beige-500 uppercase tracking-wider">
                Active Projects
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[32px] font-heading font-bold text-brown-950 tracking-tight leading-none">
                {activeProjects.length}
              </p>
              <p className="text-[11px] text-beige-500 mt-1">
                {mockProjects.length} total
              </p>
            </div>
            <MiniSparkline />
          </div>
        </motion.div>

        {/* Active Exceptions */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-gold-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-gold-600" />
              </div>
              <span className="text-[12px] font-semibold text-beige-500 uppercase tracking-wider">
                Active Exceptions
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[32px] font-heading font-bold text-brown-950 tracking-tight leading-none">
                {totalEscalations}
              </p>
              <p className="text-[11px] text-gold-600 font-medium mt-1">
                Across {activeProjects.filter((p) => p.escalations > 0).length} projects
              </p>
            </div>
            <MiniAlertPulse count={totalEscalations} />
          </div>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-teal-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-[12px] font-semibold text-beige-500 uppercase tracking-wider">
                Pending Approvals
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[32px] font-heading font-bold text-brown-950 tracking-tight leading-none">
                {pendingApprovals}
              </p>
              <MiniCounterStack />
            </div>
            <Link
              href="/enterprise/review"
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
            >
              Review
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* SLA Compliance */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brown-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-brown-600" />
              </div>
              <span className="text-[12px] font-semibold text-beige-500 uppercase tracking-wider">
                SLA Compliance
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[32px] font-heading font-bold text-brown-950 tracking-tight leading-none">
                {avgSla}%
              </p>
              <p className="text-[11px] text-beige-500 mt-1">
                Avg. across all projects
              </p>
            </div>
            <MiniRingChart value={avgSla} />
          </div>
        </motion.div>
      </div>

      {/* ── Project Summary Cards ── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-heading font-semibold text-brown-900">
              Project Summary
            </h2>
            <Badge variant="beige" size="sm">
              {mockProjects.length} projects
            </Badge>
          </div>
          <Link
            href="/enterprise/projects"
            className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {mockProjects.map((project) => (
            <ProjectSummaryCard key={project.id} project={project} />
          ))}
        </motion.div>
      </motion.div>

      {/* ── Bottom: Quick Actions + Activity Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Quick Actions — 2/5 width */}
        <motion.div variants={fadeUp} className="lg:col-span-2 space-y-3">
          <h2 className="text-[16px] font-heading font-semibold text-brown-900 mb-1">
            Quick Actions
          </h2>

          <QuickActionCard
            icon={Upload}
            title="Upload SOW"
            description="Submit a new statement of work for AI analysis"
            href="/enterprise/sow/upload"
            count={draftSOWs.length}
            gradient="bg-gradient-to-br from-brown-500 to-brown-600"
          />
          <QuickActionCard
            icon={FileSearch}
            title="Review Deliverables"
            description="Examine pending evidence submissions"
            href="/enterprise/review"
            count={pendingDeliverables.length}
            gradient="bg-gradient-to-br from-teal-500 to-teal-600"
          />
          <QuickActionCard
            icon={CheckSquare}
            title="Approve Plans"
            description="Review decomposition plans awaiting approval"
            href="/enterprise/decomposition/approval"
            count={draftPlans.length}
            gradient="bg-gradient-to-br from-forest-500 to-forest-600"
          />
          <QuickActionCard
            icon={Eye}
            title="View Exceptions"
            description="Monitor escalations and project anomalies"
            href="/enterprise/projects/exceptions"
            count={totalEscalations}
            gradient="bg-gradient-to-br from-gold-500 to-gold-600"
          />
        </motion.div>

        {/* Activity Feed — 3/5 width */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-3 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brown-400" />
              <h2 className="text-[16px] font-heading font-semibold text-brown-900">
                Recent Activity
              </h2>
            </div>
            <Badge variant="beige" size="sm">
              Live
            </Badge>
          </div>

          <div className="space-y-4">
            {activityEvents.map((event, i) => (
              <motion.div
                key={event.id}
                variants={fadeUp}
                className="flex items-start gap-3.5 group"
              >
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                      event.gradient
                    )}
                  >
                    {event.initials}
                  </div>
                  {i < activityEvents.length - 1 && (
                    <div className="w-px h-6 bg-beige-200/60 mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-[13px] text-brown-700 leading-relaxed">
                    <span className="font-semibold text-brown-800">
                      {event.contributor}
                    </span>{" "}
                    {event.action}{" "}
                    <span className="font-semibold text-brown-800">
                      {event.target}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-beige-400" />
                    <span className="text-[11px] text-beige-400">{event.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View all link */}
          <div className="mt-5 pt-4 border-t border-beige-100/80">
            <Link
              href="/enterprise/audit"
              className="text-[12px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
            >
              View full audit log
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
