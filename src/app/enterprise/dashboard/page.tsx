"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FolderKanban,
  AlertTriangle,
  ClipboardCheck,
  FileSearch,
  ArrowRight,
  Users,
  CircleDollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Zap,
  BarChart3,
  Eye,
  Bot,
  Upload,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Activity,
} from "lucide-react";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  mockProjects,
  mockDeliverables,
  mockPlans,
} from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import {
  mockInvoices,
  mockEscrowAccounts,
  billingStats,
} from "@/mocks/data/enterprise-billing";
import type { ProjectHealth } from "@/types/enterprise";

/* ══════════════════════════════════════════
   Derived data from mocks
   ══════════════════════════════════════════ */

const activeProjects = mockProjects.filter((p) => p.health !== "completed");
const totalEscalations = mockProjects.reduce(
  (sum, p) => sum + p.escalations,
  0
);
const pendingDeliverables = mockDeliverables.filter(
  (d) => d.status === "pending"
);
const reworkDeliverables = mockDeliverables.filter(
  (d) => d.status === "rework"
);
const draftPlans = mockPlans.filter((p) => p.status === "draft");
const pendingApprovals = pendingDeliverables.length + draftPlans.length;
const avgSla = Math.round(
  mockProjects.reduce((sum, p) => sum + p.slaCompliance, 0) /
    mockProjects.length
);
const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);
const overdueInvoices = mockInvoices.filter((i) => i.status === "overdue");
const pendingInvoicesList = mockInvoices.filter((i) => i.status === "pending");
const sowsInApproval = mockSOWs.filter((s) => s.status === "approval");
const avgApgScore = Math.round(
  mockProjects.reduce((sum, p) => sum + p.apgScore, 0) / mockProjects.length
);

/* ══════════════════════════════════════════
   Health config
   ══════════════════════════════════════════ */

const healthConfig: Record<
  ProjectHealth,
  {
    label: string;
    dot: string;
    fill: string;
    badgeBg: string;
    badgeColor: string;
    badgeBorder: string;
    progressGradient: string;
    progressColor: string;
  }
> = {
  on_track: {
    label: "On Track",
    dot: "#4D5741",
    fill: "#4D5741",
    badgeBg: "rgba(77,87,65,0.10)",
    badgeColor: "#344028",
    badgeBorder: "rgba(77,87,65,0.22)",
    progressGradient: "linear-gradient(90deg, #313829, #4D5741, #707867)",
    progressColor: "#344028",
  },
  at_risk: {
    label: "At Risk",
    dot: "#D0B060",
    fill: "#D0B060",
    badgeBg: "rgba(190,120,50,0.10)",
    badgeColor: "#7A5020",
    badgeBorder: "rgba(190,120,50,0.22)",
    progressGradient: "linear-gradient(90deg, #61522C, #D0B060)",
    progressColor: "#7A5020",
  },
  behind: {
    label: "Behind",
    dot: "#A67763",
    fill: "#C4574A",
    badgeBg: "rgba(160,50,50,0.08)",
    badgeColor: "#7A2020",
    badgeBorder: "rgba(160,50,50,0.18)",
    progressGradient: "linear-gradient(90deg, #6A1818, #A63C3C)",
    progressColor: "#7A2020",
  },
  completed: {
    label: "Completed",
    dot: "#5B9BA2",
    fill: "#5B9BA2",
    badgeBg: "rgba(91,155,162,0.12)",
    badgeColor: "#2A5860",
    badgeBorder: "rgba(91,155,162,0.28)",
    progressGradient: "linear-gradient(90deg, #3A6368, #5B9BA2, #7BAFB4)",
    progressColor: "#2A5860",
  },
};

/* ══════════════════════════════════════════
   Portfolio Health Donut
   ══════════════════════════════════════════ */

function PortfolioDonut() {
  const counts: Record<ProjectHealth, number> = {
    on_track: 0,
    at_risk: 0,
    behind: 0,
    completed: 0,
  };
  mockProjects.forEach((p) => counts[p.health]++);
  const total = mockProjects.length;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const allSegments = [
    { health: "on_track" as ProjectHealth, count: counts.on_track },
    { health: "at_risk" as ProjectHealth, count: counts.at_risk },
    { health: "behind" as ProjectHealth, count: counts.behind },
    { health: "completed" as ProjectHealth, count: counts.completed },
  ];
  const segments = allSegments.filter((s) => s.count > 0);

  let offset = 0;
  const arcs = segments.map((seg) => {
    const len = (seg.count / total) * circ;
    const arc = { ...seg, dasharray: `${len} ${circ - len}`, offset };
    offset += len;
    return arc;
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: 108, height: 108, flexShrink: 0 }}>
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full" style={{
        background: 'radial-gradient(circle, transparent 38%, rgba(208,176,96,0.06) 48%, rgba(166,119,99,0.04) 55%, transparent 65%)',
      }} />
      <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden>
        <circle
          cx="54" cy="54" r={r}
          fill="none" stroke="rgba(166,119,99,0.10)" strokeWidth="9"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.health}
            cx="54" cy="54" r={r}
            fill="none"
            stroke={healthConfig[arc.health].fill}
            strokeWidth="9"
            strokeDasharray={arc.dasharray}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
            transform="rotate(-90 54 54)"
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[1.8rem] font-medium leading-none"
              style={{ color: 'var(--ink)' }}>
          {total}
        </span>
        <span className="label-caps" style={{ fontSize: '7.5px', marginTop: 2 }}>
          Projects
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Mini Sparkline Area Chart
   ══════════════════════════════════════════ */

function SpendSparkline() {
  const data = billingStats.monthlySpend;
  const max = Math.max(...data.map((d) => d.amount));
  const h = 72;
  const w = 420;
  const stepX = w / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: h - (d.amount / max) * (h - 8) - 4,
  }));

  /* Build smooth curve path */
  const d = points
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");
  const areaD = `${d} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 65, overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A67763" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#A67763" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#C9ADA1" strokeWidth="1.5" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={i === points.length - 1 ? 3.5 : 2.5}
          fill={i === points.length - 1 ? "#D0B060" : "#C9ADA1"}
          stroke={i === points.length - 1 ? "var(--page-bg)" : undefined}
          strokeWidth={i === points.length - 1 ? 1.5 : undefined}
        />
      ))}
      {data.map((m, i) => (
        <text
          key={m.month}
          x={i * stepX}
          y={h}
          fill={i === data.length - 1 ? "#A67763" : "#C9ADA1"}
          fontSize="8"
          fontFamily="var(--font-mono)"
          fontWeight={i === data.length - 1 ? "500" : undefined}
        >
          {m.month}
        </text>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════
   Attention Item
   ══════════════════════════════════════════ */

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  urgency: "critical" | "high" | "medium";
  type: "approval" | "escalation" | "overdue" | "rework" | "sow";
  href: string;
  time: string;
}

const attentionItems: AttentionItem[] = [
  ...(overdueInvoices.length > 0
    ? [
        {
          id: "att-overdue",
          title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? "s" : ""}`,
          description: `$${overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()} past due — requires immediate attention`,
          urgency: "critical" as const,
          type: "overdue" as const,
          href: "/enterprise/billing/invoices",
          time: "Overdue",
        },
      ]
    : []),
  ...(totalEscalations > 0
    ? [
        {
          id: "att-escalations",
          title: `${totalEscalations} Active Escalation${totalEscalations > 1 ? "s" : ""}`,
          description: `APG flagged issues across ${activeProjects.filter((p) => p.escalations > 0).length} projects`,
          urgency: "critical" as const,
          type: "escalation" as const,
          href: "/enterprise/projects",
          time: "Active",
        },
      ]
    : []),
  ...(reworkDeliverables.length > 0
    ? [
        {
          id: "att-rework",
          title: `${reworkDeliverables.length} Rework Request${reworkDeliverables.length > 1 ? "s" : ""}`,
          description: reworkDeliverables.map((d) => d.title).join(", "),
          urgency: "high" as const,
          type: "rework" as const,
          href: "/enterprise/review",
          time: "In Progress",
        },
      ]
    : []),
  ...(pendingDeliverables.length > 0
    ? [
        {
          id: "att-deliverables",
          title: `${pendingDeliverables.length} Pending Review${pendingDeliverables.length > 1 ? "s" : ""}`,
          description: pendingDeliverables
            .slice(0, 2)
            .map((d) => d.title)
            .join(", "),
          urgency: "high" as const,
          type: "approval" as const,
          href: "/enterprise/review",
          time: "Awaiting",
        },
      ]
    : []),
  ...(sowsInApproval.length > 0
    ? [
        {
          id: "att-sow",
          title: `SOW Approval: ${sowsInApproval[0].title}`,
          description: `Legal review in progress — ${sowsInApproval[0].client}`,
          urgency: "medium" as const,
          type: "sow" as const,
          href: `/enterprise/sow/${sowsInApproval[0].id}/approve`,
          time: "In Review",
        },
      ]
    : []),
  ...(draftPlans.length > 0
    ? [
        {
          id: "att-plans",
          title: `${draftPlans.length} Decomposition Plan${draftPlans.length > 1 ? "s" : ""} Draft`,
          description: draftPlans.map((p) => p.title).join(", "),
          urgency: "medium" as const,
          type: "approval" as const,
          href: "/enterprise/decomposition",
          time: "Draft",
        },
      ]
    : []),
];

/* Attention icon + color config per type */
const typeIcon: Record<string, React.ElementType> = {
  approval: ClipboardCheck,
  escalation: AlertTriangle,
  overdue: XCircle,
  rework: RotateCcw,
  sow: Clock,
};

const typeIconStyle: Record<string, { bg: string; border: string; color: string }> = {
  overdue:    { bg: "rgba(160,50,50,0.07)", border: "rgba(160,50,50,0.14)", color: "#8B2C2C" },
  escalation: { bg: "rgba(208,176,96,0.09)", border: "rgba(208,176,96,0.20)", color: "#86713D" },
  rework:     { bg: "rgba(91,155,162,0.08)", border: "rgba(91,155,162,0.18)", color: "#2A6068" },
  approval:   { bg: "rgba(166,119,99,0.08)", border: "rgba(166,119,99,0.18)", color: "#6A4C3F" },
  sow:        { bg: "rgba(77,87,65,0.08)", border: "rgba(77,87,65,0.18)", color: "#3F4735" },
};

/* Attention badge style per time label */
const attentionBadgeStyle: Record<string, { bg: string; color: string; border: string }> = {
  "Overdue":     { bg: "rgba(180,60,60,0.08)", color: "#8B2C2C", border: "rgba(180,60,60,0.18)" },
  "Active":      { bg: "rgba(208,176,96,0.14)", color: "#7A6030", border: "rgba(208,176,96,0.28)" },
  "In Progress": { bg: "rgba(91,155,162,0.10)", color: "#2A6068", border: "rgba(91,155,162,0.25)" },
  "Awaiting":    { bg: "rgba(166,119,99,0.10)", color: "#6A4C3F", border: "rgba(166,119,99,0.22)" },
  "In Review":   { bg: "rgba(166,119,99,0.10)", color: "#6A4C3F", border: "rgba(166,119,99,0.22)" },
  "Draft":       { bg: "rgba(77,87,65,0.09)", color: "#3F4735", border: "rgba(77,87,65,0.20)" },
};

/* ══════════════════════════════════════════
   Activity events
   ══════════════════════════════════════════ */

const activityEvents = [
  {
    id: "ev-1",
    contributor: "Contributor D-2M",
    action: "submitted evidence for",
    target: mockDeliverables[0].title,
    time: "2h ago",
    iconBg: "rgba(91,155,162,0.09)",
    iconBorder: "rgba(91,155,162,0.18)",
    iconColor: "#3A6368",
    icon: Upload,
  },
  {
    id: "ev-2",
    contributor: "Contributor A-7X",
    action: "submitted deliverable",
    target: mockDeliverables[1].title,
    time: "5h ago",
    iconBg: "rgba(77,87,65,0.09)",
    iconBorder: "rgba(77,87,65,0.18)",
    iconColor: "#3F4735",
    icon: FileText,
  },
  {
    id: "ev-3",
    contributor: "Contributor B-3K",
    action: "submitted for review",
    target: mockDeliverables[5].title,
    time: "1d ago",
    iconBg: "rgba(166,119,99,0.08)",
    iconBorder: "rgba(166,119,99,0.18)",
    iconColor: "#6A4C3F",
    icon: FileSearch,
  },
  {
    id: "ev-4",
    contributor: "APG System",
    action: "flagged escalation on",
    target: "Mobile Banking App",
    time: "1d ago",
    iconBg: "rgba(208,176,96,0.09)",
    iconBorder: "rgba(208,176,96,0.20)",
    iconColor: "#86713D",
    icon: AlertTriangle,
  },
  {
    id: "ev-5",
    contributor: "Contributor C-9R",
    action: "completed milestone",
    target: "Infrastructure & Auth",
    time: "2d ago",
    iconBg: "rgba(91,155,162,0.08)",
    iconBorder: "rgba(91,155,162,0.18)",
    iconColor: "#2A6068",
    icon: CheckCircle2,
  },
];

/* ══════════════════════════════════════════
   KPI card icon/accent config
   ══════════════════════════════════════════ */

const kpiConfig = {
  active: {
    label: "Active",
    iconBg: "rgba(208,176,96,0.12)",
    iconBorder: "rgba(208,176,96,0.22)",
    iconColor: "#86713D",
    cornerColor: "rgba(208,176,96,0.15)",
    accentGradient: "linear-gradient(90deg, transparent, #D0B060, transparent)",
    icon: FolderKanban,
  },
  exceptions: {
    label: "Exceptions",
    iconBg: "rgba(190,120,50,0.1)",
    iconBorder: "rgba(190,120,50,0.2)",
    iconColor: "#7A5020",
    cornerColor: "rgba(190,120,50,0.12)",
    accentGradient: "linear-gradient(90deg, transparent, #BE7832, transparent)",
    icon: AlertTriangle,
  },
  approvals: {
    label: "Approvals",
    iconBg: "rgba(91,155,162,0.10)",
    iconBorder: "rgba(91,155,162,0.22)",
    iconColor: "#2A6068",
    cornerColor: "rgba(91,155,162,0.10)",
    accentGradient: "linear-gradient(90deg, transparent, #5B9BA2, transparent)",
    icon: ClipboardCheck,
  },
  budget: {
    label: "Budget Used",
    iconBg: "rgba(77,87,65,0.10)",
    iconBorder: "rgba(77,87,65,0.20)",
    iconColor: "#3F4735",
    cornerColor: "rgba(77,87,65,0.10)",
    accentGradient: "linear-gradient(90deg, transparent, #4D5741, transparent)",
    icon: Wallet,
  },
};

/* ══════════════════════════════════════════
   Greeting
   ══════════════════════════════════════════ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ══════════════════════════════════════════
   SOW status config
   ══════════════════════════════════════════ */

const sowStatusConfig: Record<string, { iconBg: string; iconBorder: string; iconColor: string; badgeBg: string; badgeColor: string; badgeBorder: string; badgeLabel: string; icon: React.ElementType }> = {
  draft:    { iconBg: "rgba(166,119,99,0.08)", iconBorder: "rgba(166,119,99,0.18)", iconColor: "#6A4C3F", badgeBg: "rgba(77,87,65,0.09)", badgeColor: "#3F4735", badgeBorder: "rgba(77,87,65,0.20)", badgeLabel: "Draft", icon: FileText },
  parsing:  { iconBg: "rgba(91,155,162,0.10)", iconBorder: "rgba(91,155,162,0.22)", iconColor: "#3A6368", badgeBg: "rgba(91,155,162,0.10)", badgeColor: "#2A6068", badgeBorder: "rgba(91,155,162,0.25)", badgeLabel: "Parsing", icon: Bot },
  review:   { iconBg: "rgba(208,176,96,0.10)", iconBorder: "rgba(208,176,96,0.22)", iconColor: "#86713D", badgeBg: "rgba(208,176,96,0.14)", badgeColor: "#7A6030", badgeBorder: "rgba(208,176,96,0.28)", badgeLabel: "Review", icon: Eye },
  approval: { iconBg: "rgba(208,176,96,0.10)", iconBorder: "rgba(208,176,96,0.22)", iconColor: "#86713D", badgeBg: "rgba(166,119,99,0.10)", badgeColor: "#6A4C3F", badgeBorder: "rgba(166,119,99,0.22)", badgeLabel: "Approval", icon: ClipboardCheck },
  approved: { iconBg: "rgba(91,155,162,0.10)", iconBorder: "rgba(91,155,162,0.22)", iconColor: "#3A6368", badgeBg: "rgba(77,87,65,0.10)", badgeColor: "#344028", badgeBorder: "rgba(77,87,65,0.22)", badgeLabel: "Approved", icon: CheckCircle2 },
  archived: { iconBg: "rgba(166,119,99,0.06)", iconBorder: "rgba(166,119,99,0.14)", iconColor: "#817165", badgeBg: "rgba(166,119,99,0.08)", badgeColor: "#817165", badgeBorder: "rgba(166,119,99,0.18)", badgeLabel: "Archived", icon: FileText },
};

/* ══════════════════════════════════════════
   DASHBOARD PAGE
   ══════════════════════════════════════════ */

export default function EnterpriseDashboardPage() {
  const greeting = getGreeting();

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ═══════════════════════════════════
          HERO HEADER
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between mb-10">
        {/* Decorative gradient mesh aurora behind hero */}
        <div className="absolute pointer-events-none" style={{
          top: -60, left: -80, width: 500, height: 300,
          background: 'radial-gradient(ellipse at 20% 40%, rgba(208,176,96,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(91,155,162,0.06) 0%, transparent 45%), radial-gradient(ellipse at 50% 80%, rgba(166,119,99,0.05) 0%, transparent 50%)',
          filter: 'blur(40px)',
        }} />

        <div className="relative">
          <div className="mono-label mb-3" style={{ color: 'var(--ink-faint)' }}>
            Enterprise Console
          </div>

          <h1
            className="font-heading leading-[1.1]"
            style={{ fontSize: '2.75rem', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.025em' }}
          >
            {greeting}, <em className="italic" style={{
              background: 'linear-gradient(135deg, #A67763, #886151)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Priya.</em>
          </h1>

          <p style={{ marginTop: 11, fontSize: 14, color: 'var(--ink-muted)', fontWeight: 300, lineHeight: 1.65, maxWidth: 460 }}>
            {attentionItems.length > 0 ? (
              <>
                You have{" "}
                <span style={{ color: 'var(--ink-mid)', fontWeight: 500 }}>
                  {attentionItems.length} item{attentionItems.length > 1 ? "s" : ""}
                </span>{" "}
                requiring attention across your portfolio today.
              </>
            ) : (
              "All systems operational. Your portfolio is in good shape."
            )}
          </p>

          {/* Status markers */}
          <div className="flex items-center gap-5 mt-5">
            {(["on_track", "at_risk", "behind", "completed"] as ProjectHealth[]).map((health) => {
              const count = mockProjects.filter((p) => p.health === health).length;
              if (count === 0) return null;
              const cfg = healthConfig[health];
              return (
                <div key={health} className="flex items-center gap-2">
                  <div className="rounded-full" style={{ width: 8, height: 8, background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}40` }} />
                  <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                    {count} {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio ring + KPI pair */}
        <div className="flex items-center gap-5 mt-6 lg:mt-0">
          <PortfolioDonut />

          <div className="flex flex-col gap-3">
            {/* Avg SLA mini card */}
            <div
              className="relative overflow-hidden transition-all duration-300"
              style={{
                padding: '16px 22px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.7), rgba(253,250,247,0.5))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(208,176,96,0.16)',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(77,55,46,0.04), 0 4px 20px rgba(208,176,96,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                minWidth: 140,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(208,176,96,0.30)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(208,176,96,0.10), 0 8px 32px rgba(77,55,46,0.06), inset 0 1px 0 rgba(255,255,255,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(208,176,96,0.16)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(77,55,46,0.04), 0 4px 20px rgba(208,176,96,0.04), inset 0 1px 0 rgba(255,255,255,0.6)';
              }}
            >
              <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: 'linear-gradient(90deg, transparent 10%, #D0B060 50%, transparent 90%)', opacity: 0.6 }} />
              <div className="label-caps mb-2">Avg SLA</div>
              <div className="num-display" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
                {avgSla}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)' }}>%</span>
              </div>
            </div>

            {/* APG Score mini card */}
            <div
              className="relative overflow-hidden transition-all duration-300"
              style={{
                padding: '16px 22px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.7), rgba(238,245,245,0.4))',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(91,155,162,0.16)',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(77,55,46,0.04), 0 4px 20px rgba(91,155,162,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                minWidth: 140,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(91,155,162,0.30)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,155,162,0.10), 0 8px 32px rgba(77,55,46,0.06), inset 0 1px 0 rgba(255,255,255,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(91,155,162,0.16)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(77,55,46,0.04), 0 4px 20px rgba(91,155,162,0.04), inset 0 1px 0 rgba(255,255,255,0.6)';
              }}
            >
              <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: 'linear-gradient(90deg, transparent 10%, #5B9BA2 50%, transparent 90%)', opacity: 0.5 }} />
              <div className="label-caps mb-2" style={{ color: '#5B9BA2' }}>APG Score</div>
              <div className="num-display" style={{ fontSize: '2rem', color: '#3A6368' }}>
                {avgApgScore}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          KPI ROW — 4 stat cards
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {/* Active */}
        <KpiCard config={kpiConfig.active}>
          <div className="num-display" style={{ fontSize: '3rem', color: 'var(--ink)' }}>
            {activeProjects.length}
          </div>
          <div className="flex items-center gap-1 mt-2.5" style={{ fontSize: '11.5px', color: '#5B9BA2' }}>
            <TrendingUp className="w-2.5 h-2.5" />
            +1 this month
          </div>
        </KpiCard>

        {/* Exceptions */}
        <KpiCard config={kpiConfig.exceptions}>
          <div className="num-display" style={{ fontSize: '3rem', color: '#86713D' }}>
            {totalEscalations}
          </div>
          <div className="mt-2.5" style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
            Across {activeProjects.filter((p) => p.escalations > 0).length} projects
          </div>
        </KpiCard>

        {/* Approvals */}
        <KpiCard config={kpiConfig.approvals}>
          <div className="num-display" style={{ fontSize: '3rem', color: '#3A6368' }}>
            {pendingApprovals}
          </div>
          <Link
            href="/enterprise/review"
            className="flex items-center gap-1 mt-2.5"
            style={{ fontSize: '11.5px', color: '#4A7F85', fontWeight: 500, textDecoration: 'none' }}
          >
            Review now
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </KpiCard>

        {/* Budget */}
        <KpiCard config={kpiConfig.budget}>
          <div className="num-display" style={{ fontSize: '2.2rem', color: 'var(--ink)' }}>
            ${Math.round(totalSpent / 1000)}k
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
                of ${Math.round(totalBudget / 1000)}k total
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#4D5741' }}>
                {budgetUtilization}%
              </span>
            </div>
            <div className="prog-track">
              <div
                className="prog-fill"
                style={{ width: `${budgetUtilization}%`, background: 'linear-gradient(90deg, #4D5741, #949A8D)' }}
              />
            </div>
          </div>
        </KpiCard>
      </motion.div>

      {/* ═══════════════════════════════════
          MID ROW: Attention + Project Pipeline
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid gap-5 mb-7" style={{ gridTemplateColumns: '1fr 1.15fr' }}>
        {/* Needs Attention */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div className="flex items-center gap-[9px]" style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: '#D0B060' }} />
              Needs Your Attention
            </div>
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 24, height: 24,
                background: 'linear-gradient(135deg, rgba(208,176,96,0.18), rgba(208,176,96,0.10))',
                border: '1px solid rgba(208,176,96,0.30)',
                fontSize: 10, fontWeight: 600, color: '#7A6030',
                boxShadow: '0 1px 4px rgba(208,176,96,0.10)',
              }}
            >
              {attentionItems.length}
            </div>
          </div>

          <div style={{ padding: '8px 10px 10px' }}>
            {attentionItems.map((item) => {
              const TypeIcon = typeIcon[item.type] || ClipboardCheck;
              const iconStyle = typeIconStyle[item.type] || typeIconStyle.approval;
              const badgeStyle = attentionBadgeStyle[item.time] || attentionBadgeStyle["Draft"];

              return (
                <Link key={item.id} href={item.href}>
                  <div
                    className="flex items-center gap-[14px] rounded-xl cursor-pointer transition-all"
                    style={{ padding: '13px 18px', border: '1px solid transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(166,119,99,0.04)';
                      e.currentTarget.style.borderColor = 'var(--border-hair)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: iconStyle.bg,
                        border: `1px solid ${iconStyle.border}`,
                      }}
                    >
                      <TypeIcon className="w-3.5 h-3.5" style={{ color: iconStyle.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{item.description}</div>
                    </div>
                    <span
                      className="badge-parchment"
                      style={{
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                      }}
                    >
                      {item.time}
                    </span>
                  </div>
                </Link>
              );
            })}

            {attentionItems.length === 0 && (
              <div className="text-center" style={{ padding: '40px 20px' }}>
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#4D5741' }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)' }}>All clear</p>
                <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>No items require your immediate attention</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Pipeline */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div className="flex items-center gap-[9px]" style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              <Activity className="w-3.5 h-3.5" style={{ color: '#5B9BA2' }} />
              Project Pipeline
            </div>
            <Link href="/enterprise/projects" className="link-gold">
              View all <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div style={{ padding: '10px 14px 12px' }}>
            {mockProjects.map((project, i) => {
              const h = healthConfig[project.health];
              return (
                <React.Fragment key={project.id}>
                  <Link href={`/enterprise/projects/${project.id}`}>
                    <div
                      className="rounded-xl cursor-pointer transition-all"
                      style={{ padding: '16px 18px', border: '1px solid transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(166,119,99,0.04)';
                        e.currentTarget.style.borderColor = 'var(--border-hair)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)', lineHeight: 1.3 }}>
                            {project.title}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginTop: 2 }}>
                            {project.client}
                          </div>
                        </div>
                        <span
                          className="badge-parchment ml-3"
                          style={{
                            background: h.badgeBg,
                            color: h.badgeColor,
                            border: `1px solid ${h.badgeBorder}`,
                          }}
                        >
                          {h.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-5">
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>Progress</span>
                            <span style={{ fontSize: '10.5px', fontWeight: 600, color: h.progressColor }}>
                              {project.progress}%
                            </span>
                          </div>
                          <div className="prog-track">
                            <div
                              className="prog-fill"
                              style={{ width: `${project.progress}%`, background: h.progressGradient }}
                            />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 72 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-mid)' }}>
                            ${Math.round(project.spent / 1000)}k
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                            of ${Math.round(project.budget / 1000)}k
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                          <Users className="w-[9px] h-[9px]" />{project.teamSize}
                        </span>
                        {project.escalations > 0 && (
                          <span className="flex items-center gap-1" style={{ fontSize: 10, color: '#86713D' }}>
                            <AlertTriangle className="w-[9px] h-[9px]" />{project.escalations}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  {i < mockProjects.length - 1 && (
                    <div style={{ height: 1, background: 'var(--border-hair)', margin: '2px 8px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          BOTTOM ROW: Financial + Activity
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {/* Financial Snapshot */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div className="flex items-center gap-[9px]" style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              <BarChart3 className="w-3.5 h-3.5" style={{ color: '#D0B060' }} />
              Financial Snapshot
            </div>
            <Link href="/enterprise/billing" className="link-gold">
              Details <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div style={{ padding: '24px 26px' }}>
            <div className="flex items-center justify-between mb-5">
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Monthly Spend Trend</span>
              <div className="flex items-center gap-1" style={{ fontSize: 11, color: '#A67763', fontWeight: 500 }}>
                <TrendingDown className="w-2.5 h-2.5" />
                −48% this month
              </div>
            </div>

            <SpendSparkline />

            {/* Financial metrics 2×2 */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(166,119,99,0.05), rgba(208,176,96,0.03))', border: '1px solid var(--border-hair)', borderRadius: 14 }}>
                <div className="label-caps mb-2">Escrow Held</div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>
                  ${Math.round(mockEscrowAccounts.reduce((s, e) => s + e.totalHeld, 0) / 1000)}k
                </div>
              </div>
              <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(91,155,162,0.04), rgba(91,155,162,0.02))', border: '1px solid var(--border-hair)', borderRadius: 14 }}>
                <div className="label-caps mb-2">Pending Pay</div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>
                  ${Math.round(pendingInvoicesList.reduce((s, i) => s + i.amount, 0) / 1000)}k
                </div>
              </div>
              <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(77,87,65,0.05), rgba(77,87,65,0.02))', border: '1px solid var(--border-hair)', borderRadius: 14 }}>
                <div className="label-caps mb-2">Total Paid</div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: 'var(--ink)' }}>
                  ${Math.round(billingStats.totalSpent / 1000)}k
                </div>
              </div>
              <div style={{
                padding: 16,
                background: overdueInvoices.length > 0 ? 'linear-gradient(135deg, rgba(160,50,50,0.05), rgba(160,50,50,0.02))' : 'rgba(77,87,65,0.04)',
                border: overdueInvoices.length > 0 ? '1px solid rgba(160,50,50,0.14)' : '1px solid var(--border-hair)',
                borderRadius: 14,
              }}>
                <div className="label-caps mb-2" style={{ color: overdueInvoices.length > 0 ? '#8B2C2C' : '#3F4735' }}>Overdue</div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: overdueInvoices.length > 0 ? '#8B2C2C' : '#3F4735' }}>
                  {overdueInvoices.length > 0
                    ? `$${Math.round(overdueInvoices.reduce((s, i) => s + i.amount, 0) / 1000)}k`
                    : "$0"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div className="flex items-center gap-[9px]" style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: '#5B9BA2' }} />
              Recent Activity
            </div>
            <div className="flex items-center gap-2">
              <div
                className="rounded-full"
                style={{ width: 6, height: 6, background: '#5B9BA2', animation: 'blink 2.2s ease-in-out infinite', boxShadow: '0 0 8px rgba(91,155,162,0.5)' }}
              />
              <span style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>Live</span>
            </div>
          </div>

          <div style={{ padding: '8px 16px' }}>
            {activityEvents.map((event) => {
              const EventIcon = event.icon;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl cursor-pointer transition-colors"
                  style={{ padding: '13px 10px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: event.iconBg,
                      border: `1px solid ${event.iconBorder}`,
                    }}
                  >
                    <EventIcon className="w-[13px] h-[13px]" style={{ color: event.iconColor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--ink-mid)', fontWeight: 500 }}>{event.contributor}</span>
                      {" "}{event.action}{" "}
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{event.target}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 3 }}>
                      <Clock className="w-[9px] h-[9px]" />
                      {event.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 26px 20px', borderTop: '1px solid var(--border-hair)', marginTop: 6 }}>
            <Link href="/enterprise/audit" className="link-gold">
              View full audit log <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          SOW PIPELINE — horizontal scroll
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <FileText className="w-3.5 h-3.5" style={{ color: '#D0B060' }} />
            <span className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--ink)' }}>
              SOW Pipeline
            </span>
          </div>
          <Link href="/enterprise/sow" className="link-gold">
            Manage SOWs <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="flex gap-3.5 overflow-x-auto pb-1.5" style={{ scrollbarWidth: 'none' }}>
          {mockSOWs.slice(0, 5).map((sow) => {
            const sc = sowStatusConfig[sow.status] || sowStatusConfig.draft;
            const StatusIcon = sc.icon;
            const riskScore = sow.riskScore.overall;

            /* Risk bar color */
            let riskGradient = "linear-gradient(90deg, #C9ADA1, #C9ADA1)";
            let riskColor = "var(--ink-faint)";
            if (riskScore > 0 && riskScore <= 30) {
              riskGradient = "linear-gradient(90deg, #2A484B, #5B9BA2)";
              riskColor = "var(--ink-faint)";
            } else if (riskScore > 30 && riskScore <= 60) {
              riskGradient = "linear-gradient(90deg, #61522C, #D0B060)";
              riskColor = "#86713D";
            } else if (riskScore > 60) {
              riskGradient = "linear-gradient(90deg, #6A1818, #A63C3C)";
              riskColor = "#8B2C2C";
            }

            return (
              <Link key={sow.id} href={`/enterprise/sow/${sow.id}`}>
                <div
                  className="relative overflow-hidden shrink-0 cursor-pointer transition-all duration-300"
                  style={{
                    background: 'linear-gradient(155deg, rgba(253,250,247,0.95), rgba(255,255,255,0.7) 50%, rgba(249,245,241,0.6))',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 16,
                    padding: '22px 20px',
                    minWidth: 210,
                    boxShadow: '0 1px 3px rgba(77,55,46,0.05), 0 4px 16px rgba(77,55,46,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(77,55,46,0.08), 0 12px 40px rgba(77,55,46,0.08), inset 0 1px 0 rgba(255,255,255,0.8)';
                    e.currentTarget.style.borderColor = 'rgba(208,176,96,0.30)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(77,55,46,0.05), 0 4px 16px rgba(77,55,46,0.04), inset 0 1px 0 rgba(255,255,255,0.7)';
                    e.currentTarget.style.borderColor = 'var(--border-soft)';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {/* Top white highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.98) 40%, rgba(255,255,255,0.98) 60%, transparent)' }}
                  />

                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 30, height: 30, borderRadius: 9,
                        background: sc.iconBg,
                        border: `1px solid ${sc.iconBorder}`,
                      }}
                    >
                      <StatusIcon className="w-[13px] h-[13px]" style={{ color: sc.iconColor }} />
                    </div>
                    <span
                      className="badge-parchment"
                      style={{
                        background: sc.badgeBg,
                        color: sc.badgeColor,
                        border: `1px solid ${sc.badgeBorder}`,
                      }}
                    >
                      {sc.badgeLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--ink-mid)', lineHeight: 1.4, marginBottom: 3 }}>
                    {sow.title.length > 30 ? sow.title.substring(0, 30) + "…" : sow.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginBottom: 16 }}>
                    {sow.client}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="label-caps">Risk</span>
                      <span className="mono-label" style={{
                        color: riskColor,
                        fontWeight: riskScore > 30 ? 600 : undefined,
                      }}>
                        {riskScore > 0 ? riskScore : "—"}
                      </span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(166,119,99,0.12)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        width: `${Math.max(riskScore, 4)}%`,
                        background: riskGradient,
                      }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   KPI Card Component
   ══════════════════════════════════════════ */

function KpiCard({ config, children }: {
  config: { label: string; iconBg: string; iconBorder: string; iconColor: string; cornerColor: string; accentGradient: string; icon: React.ElementType };
  children: React.ReactNode;
}) {
  const Icon = config.icon;

  return (
    <motion.div
      variants={scaleIn}
      className="relative overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(155deg, rgba(253,250,247,0.95), rgba(255,255,255,0.7) 40%, rgba(249,245,241,0.6))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-soft)',
        borderRadius: 18,
        padding: '28px 28px 24px',
        boxShadow: '0 1px 3px rgba(77,55,46,0.05), 0 4px 16px rgba(77,55,46,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(77,55,46,0.08), 0 12px 40px rgba(77,55,46,0.08), inset 0 1px 0 rgba(255,255,255,0.8)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(77,55,46,0.05), 0 4px 16px rgba(77,55,46,0.04), inset 0 1px 0 rgba(255,255,255,0.7)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-soft)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Top white highlight */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.98) 40%, rgba(255,255,255,0.98) 60%, transparent)' }}
      />

      {/* Corner ornament — enhanced radial */}
      <div
        className="absolute -top-px -right-px"
        style={{
          width: 80, height: 80,
          borderRadius: '0 18px 0 80px',
          background: `radial-gradient(circle at top right, ${config.cornerColor}, transparent 70%)`,
          opacity: 0.6,
        }}
      />

      {/* Gold accent line — bolder */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: config.accentGradient, opacity: 0.6 }} />
      {/* Secondary glow under accent */}
      <div className="absolute top-0 left-[15%] right-[15%]" style={{ height: 6, background: config.accentGradient, opacity: 0.08, filter: 'blur(4px)' }} />

      <div className="flex items-center justify-between mb-5">
        <div className="label-caps">{config.label}</div>
        <div
          className="flex items-center justify-center transition-shadow duration-200"
          style={{
            width: 30, height: 30, borderRadius: 9,
            background: config.iconBg,
            border: `1px solid ${config.iconBorder}`,
            boxShadow: `0 2px 8px ${config.iconBg}`,
          }}
        >
          <Icon className="w-3 h-3" style={{ color: config.iconColor }} />
        </div>
      </div>

      {children}
    </motion.div>
  );
}
