"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Maximize2,
  Pencil,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Timer,
  FileText,
  ChevronRight,
  Upload,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  CircleDollarSign,
  Activity,
  Target,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui";

/* ── Staggered entrance ── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ══════════════════════════════════════════
   Mini Visualizations — each card is unique
   ══════════════════════════════════════════ */

/* Stacked bar chart (like Task Status in reference) */
function StackedBarViz() {
  const data = [
    { segments: [40, 25, 20, 15] },
    { segments: [30, 35, 20, 15] },
    { segments: [35, 20, 30, 15] },
    { segments: [25, 30, 25, 20] },
    { segments: [45, 20, 20, 15] },
    { segments: [20, 25, 35, 20] },
    { segments: [30, 30, 25, 15] },
  ];
  const colors = ["#A67763", "#5B9BA2", "#D0B060", "#E9DFD7"];

  return (
    <div className="flex items-end gap-[3px] h-[44px] mt-3">
      {data.map((d, i) => {
        const total = d.segments.reduce((a, b) => a + b, 0);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col rounded-[3px] overflow-hidden"
            style={{ height: "100%" }}
          >
            {d.segments.map((seg, j) => (
              <div
                key={j}
                style={{
                  flex: seg / total,
                  background: colors[j],
                  opacity: 0.75 + j * 0.05,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* Dot scatter plot (like Comments in reference) */
function ScatterViz() {
  const points = [
    { x: 5, y: 30 },
    { x: 12, y: 45 },
    { x: 20, y: 35 },
    { x: 28, y: 55 },
    { x: 35, y: 40 },
    { x: 42, y: 60 },
    { x: 50, y: 50 },
    { x: 58, y: 65 },
    { x: 65, y: 55 },
    { x: 72, y: 70 },
    { x: 80, y: 62 },
    { x: 88, y: 75 },
    { x: 95, y: 68 },
  ];

  return (
    <svg viewBox="0 0 100 80" className="w-full h-[48px] mt-2">
      <line
        x1="2"
        y1="72"
        x2="98"
        y2="20"
        stroke="#5B9BA2"
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.3"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={80 - p.y}
          r={i === points.length - 1 ? 3 : 2}
          fill={i === points.length - 1 ? "#D0B060" : "#5B9BA2"}
          opacity={0.6 + i * 0.03}
        />
      ))}
    </svg>
  );
}

/* Vertical bar chart (like Commits in reference) */
function BarChartViz() {
  const bars = [35, 55, 45, 70, 60, 50, 75];
  return (
    <div className="flex items-end gap-[4px] h-[44px] mt-3">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${h}%`,
            background: i >= 5 ? "#D0B060" : "#E9DFD7",
          }}
        />
      ))}
    </div>
  );
}

/* Card header with action icons (like reference) */
function CardActions() {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button className="p-1 rounded text-beige-400 hover:text-brown-600 transition-colors">
        <Pencil className="w-3 h-3" />
      </button>
      <button className="p-1 rounded text-beige-400 hover:text-brown-600 transition-colors">
        <Maximize2 className="w-3 h-3" />
      </button>
      <button className="p-1 rounded text-beige-400 hover:text-brown-600 transition-colors">
        <MoreHorizontal className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Project row item
   ══════════════════════════════════════════ */
function ProjectRow({
  name,
  status,
  statusColor,
  date,
  team,
  progress,
}: {
  name: string;
  status: string;
  statusColor: string;
  date: string;
  team: number;
  progress: number;
}) {
  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    teal: { bg: "bg-teal-50", text: "text-teal-700", bar: "bg-teal-500" },
    gold: { bg: "bg-gold-50", text: "text-gold-700", bar: "bg-gold-500" },
    forest: {
      bg: "bg-forest-50",
      text: "text-forest-700",
      bar: "bg-forest-500",
    },
    brown: { bg: "bg-brown-50", text: "text-brown-700", bar: "bg-brown-500" },
    danger: { bg: "bg-[var(--danger-light)]", text: "text-[var(--danger)]", bar: "bg-[var(--danger)]" },
  };
  const c = colorMap[statusColor] || colorMap.teal;

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-beige-50/60 transition-colors group cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-brown-800 truncate group-hover:text-brown-900">
          {name}
        </p>
        <p className="text-[11px] text-beige-500 mt-0.5">Due {date}</p>
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}
      >
        {status}
      </span>
      {/* Team avatars */}
      <div className="flex -space-x-1.5 hidden sm:flex">
        {Array.from({ length: Math.min(team, 3) }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full bg-beige-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-beige-600"
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        {team > 3 && (
          <div className="w-5 h-5 rounded-full bg-beige-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-beige-500">
            +{team - 3}
          </div>
        )}
      </div>
      {/* Progress bar */}
      <div className="w-20 hidden md:block">
        <div className="h-1.5 rounded-full bg-beige-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-beige-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

/* ══════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════ */
export default function EnterpriseDashboardPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-5"
    >
      {/* Page header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
            Tasks report
          </h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Stay on top of your tasks, monitor progress, and track status.
            Streamline your workflow and transform how you deliver results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/enterprise/sow"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload SOW
          </Link>
        </div>
      </motion.div>

      {/* ── KPI Cards — each with unique visualization ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Task Status — wide card with stacked bar */}
        <motion.div
          variants={fadeUp}
          className="group col-span-1 md:col-span-2 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-beige-400" />
              <span className="text-[13px] font-semibold text-brown-800">
                Task status
              </span>
            </div>
            <CardActions />
          </div>

          <div className="flex items-baseline gap-8 mt-4">
            <div>
              <p className="text-[28px] font-bold text-brown-900 tracking-tight">
                24
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-beige-500">Backlog</span>
                <FolderKanban className="w-3 h-3 text-beige-300" />
              </div>
            </div>
            <div>
              <p className="text-[28px] font-bold text-brown-900 tracking-tight">
                4
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-beige-500">In progress</span>
                <Zap className="w-3 h-3 text-gold-500" />
              </div>
            </div>
            <div>
              <p className="text-[28px] font-bold text-brown-900 tracking-tight">
                7
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-beige-500">Validation</span>
                <Timer className="w-3 h-3 text-teal-500" />
              </div>
            </div>
          </div>

          <StackedBarViz />
        </motion.div>

        {/* Card 2: Deliveries — scatter dot */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-teal-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span className="text-[13px] font-semibold text-brown-800">
                Deliveries
              </span>
            </div>
            <CardActions />
          </div>
          <p className="text-[28px] font-bold text-brown-900 tracking-tight mt-3">
            109
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ArrowDownRight className="w-3 h-3 text-[var(--danger)]" />
            <span className="text-[11px] font-medium text-[var(--danger)]">
              10.2%
            </span>
            <span className="text-[10px] text-beige-400">(7d)</span>
          </div>
          <ScatterViz />
        </motion.div>

        {/* Card 3: SOW Submissions — bar chart */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-gold-100/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold-500" />
              <span className="text-[13px] font-semibold text-brown-800">
                SOW Submissions
              </span>
            </div>
            <CardActions />
          </div>
          <p className="text-[28px] font-bold text-brown-900 tracking-tight mt-3">
            27
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3 text-forest-600" />
            <span className="text-[11px] font-medium text-forest-600">
              2.9%
            </span>
            <span className="text-[10px] text-beige-400">(7d)</span>
          </div>
          <BarChartViz />
        </motion.div>
      </div>

      {/* ── Tabs row ── */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-0 border-b border-beige-200/60"
      >
        {["Spreadsheet", "Board", "Calendar", "Timeline"].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 ${
              i === 0
                ? "text-brown-800 border-brown-500"
                : "text-beige-500 border-transparent hover:text-brown-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* ── Project List ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/60 backdrop-blur-sm overflow-hidden"
      >
        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-beige-100 text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
          <div className="flex-1">Project</div>
          <div className="w-20 text-center">Status</div>
          <div className="w-16 text-center hidden sm:block">Team</div>
          <div className="w-20 text-center hidden md:block">Progress</div>
          <div className="w-4" />
        </div>

        <ProjectRow
          name="New microservice website"
          status="Urgent"
          statusColor="danger"
          date="Jul 29, 24"
          team={4}
          progress={72}
        />
        <ProjectRow
          name="Sales deck - Iteration v1"
          status="In progress"
          statusColor="teal"
          date="Sep 15, 24"
          team={3}
          progress={45}
        />
        <ProjectRow
          name="Case studies compilation"
          status="In progress"
          statusColor="teal"
          date="Sep 21, 24"
          team={2}
          progress={58}
        />
        <ProjectRow
          name="Input Styleguide"
          status="Validation"
          statusColor="gold"
          date="Jun 8, 24"
          team={5}
          progress={90}
        />
        <ProjectRow
          name="Spine animated logo"
          status="Done"
          statusColor="forest"
          date="Jul 13, 24"
          team={2}
          progress={100}
        />
        <ProjectRow
          name="Demo reel production"
          status="In progress"
          statusColor="teal"
          date="Apr 27, 24"
          team={6}
          progress={33}
        />
      </motion.div>

      {/* ── Bottom: Burndown + Team Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Burndown chart */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-forest-100/15 transition-all"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-400" />
              <span className="text-[13px] font-semibold text-brown-800">
                Burndown chart
              </span>
              <span className="text-[10px] text-beige-400">
                (complete sprint)
              </span>
            </div>
            <CardActions />
          </div>

          <svg viewBox="0 0 400 120" className="w-full h-[130px] mt-3">
            {[0, 30, 60, 90, 120].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="400"
                y2={y}
                stroke="#E9DFD7"
                strokeWidth="0.5"
              />
            ))}
            <line
              x1="0"
              y1="10"
              x2="390"
              y2="110"
              stroke="#E9DFD7"
              strokeWidth="1"
              strokeDasharray="4,3"
            />
            <path
              d="M0,10 Q40,12 80,25 T140,38 T200,52 T260,68 T320,82 L360,92"
              stroke="#4D5741"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M0,10 Q40,12 80,25 T140,38 T200,52 T260,68 T320,82 L360,92 L360,120 L0,120Z"
              fill="#4D5741"
              opacity="0.05"
            />
            <circle cx="360" cy="92" r="4" fill="#4D5741" />
            <circle cx="360" cy="92" r="7" fill="#4D5741" opacity="0.12" />
          </svg>

          <div className="flex items-center justify-between mt-2 text-[10px] text-beige-400">
            <span>Sprint start</span>
            <span>Today</span>
            <span>Sprint end</span>
          </div>
        </motion.div>

        {/* Team activity */}
        <motion.div
          variants={fadeUp}
          className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/15 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brown-400" />
              <span className="text-[13px] font-semibold text-brown-800">
                Team activity
              </span>
            </div>
            <CardActions />
          </div>

          <div className="space-y-3">
            {[
              {
                initials: "AN",
                name: "Aisha N.",
                action: "completed task",
                target: "API Integration",
                time: "2m ago",
                color: "from-teal-400 to-teal-600",
              },
              {
                initials: "RK",
                name: "Rahul K.",
                action: "submitted evidence for",
                target: "Data Pipeline",
                time: "15m ago",
                color: "from-forest-400 to-forest-600",
              },
              {
                initials: "SM",
                name: "Sara M.",
                action: "started review on",
                target: "UI Components",
                time: "1h ago",
                color: "from-gold-400 to-gold-600",
              },
              {
                initials: "VT",
                name: "Vikram T.",
                action: "escalated",
                target: "Auth Service",
                time: "2h ago",
                color: "from-brown-400 to-brown-600",
              },
              {
                initials: "LP",
                name: "Lina P.",
                action: "delivered milestone",
                target: "Phase 2",
                time: "3h ago",
                color: "from-teal-500 to-forest-500",
              },
            ].map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${event.color} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}
                >
                  {event.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-brown-700">
                    <span className="font-semibold">{event.name}</span>{" "}
                    {event.action}{" "}
                    <span className="font-semibold">{event.target}</span>
                  </p>
                  <p className="text-[10px] text-beige-400 mt-0.5">
                    {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
