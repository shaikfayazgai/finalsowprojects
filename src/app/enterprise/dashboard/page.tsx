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
  Clock,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Eye,
  Bot,
  Upload,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Banknote,
  Target,
  GitBranch,
  Timer,
  CircleCheck,
  CircleDot,
  Loader2,
} from "lucide-react";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  mockProjects,
  mockDeliverables,
  mockPlans,
  mockTeams,
  mockAssignments,
} from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import {
  mockInvoices,
  mockEscrowAccounts,
  billingStats,
} from "@/mocks/data/enterprise-billing";
import {
  mockActivityFeed,
  mockAPGRules,
  mockAnalytics,
} from "@/mocks/data/enterprise-analytics";
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
const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);
const overdueInvoices = mockInvoices.filter((i) => i.status === "overdue");
const pendingInvoicesList = mockInvoices.filter((i) => i.status === "pending");
const sowsInApproval = mockSOWs.filter((s) => s.status === "approval");
const avgApgScore = Math.round(
  mockProjects.reduce((sum, p) => sum + p.apgScore, 0) / mockProjects.length
);

/* SOW approval pipeline stage counts */
const sowsByStage = {
  draft: mockSOWs.filter((s) => s.status === "draft").length,
  approval: mockSOWs.filter((s) => s.status === "approval").length,
  approved: mockSOWs.filter((s) => s.status === "approved").length,
};

/* Decomposition plan status counts */
const plansByStatus = {
  draft: mockPlans.filter((p) => p.status === "draft").length,
  in_progress: mockPlans.filter((p) => p.status === "in_progress").length,
  pending_review: mockPlans.filter((p) => p.status === "pending_review").length,
  approved: mockPlans.filter((p) => p.status === "approved").length,
  completed: mockPlans.filter((p) => p.status === "completed").length,
};

/* Team formation stats */
const teamsByStatus = {
  forming: mockTeams.filter((t) => t.status === "forming").length,
  ready: mockTeams.filter((t) => t.status === "ready").length,
  active: mockTeams.filter((t) => t.status === "active").length,
};
const totalContributors = mockTeams.reduce((s, t) => s + t.totalMembers, 0);

/* Assignment response stats */
const assignmentsByStatus = {
  pending: mockAssignments.filter((a) => a.status === "pending_response").length,
  accepted: mockAssignments.filter((a) => a.status === "accepted").length,
  declined: mockAssignments.filter((a) => a.status === "declined").length,
};

/* APG rules */
const apgRulesEnabled = mockAPGRules.filter((r) => r.enabled).length;

/* Key analytics */
const deliveryPerf = mockAnalytics.find((a) => a.id === "delivery-performance");
const onTimeDelivery = deliveryPerf?.metrics[0]?.value ?? 0;
const firstPassRate = deliveryPerf?.metrics[2]?.value ?? 0;

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
  sows: {
    label: "SOWs Active",
    iconBg: "rgba(166,119,99,0.10)",
    iconBorder: "rgba(166,119,99,0.20)",
    iconColor: "#6A4C3F",
    cornerColor: "rgba(166,119,99,0.12)",
    accentGradient: "linear-gradient(90deg, transparent, #A67763, transparent)",
    icon: FileText,
  },
  active: {
    label: "Active Projects",
    iconBg: "rgba(208,176,96,0.12)",
    iconBorder: "rgba(208,176,96,0.22)",
    iconColor: "#86713D",
    cornerColor: "rgba(208,176,96,0.15)",
    accentGradient: "linear-gradient(90deg, transparent, #D0B060, transparent)",
    icon: FolderKanban,
  },
  escalations: {
    label: "APG Escalations",
    iconBg: "rgba(190,120,50,0.1)",
    iconBorder: "rgba(190,120,50,0.2)",
    iconColor: "#7A5020",
    cornerColor: "rgba(190,120,50,0.12)",
    accentGradient: "linear-gradient(90deg, transparent, #BE7832, transparent)",
    icon: AlertTriangle,
  },
  approvals: {
    label: "Pending Reviews",
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

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
  archived: { iconBg: "rgba(166,119,99,0.06)", iconBorder: "rgba(166,119,99,0.14)", iconColor: "#706B66", badgeBg: "rgba(166,119,99,0.08)", badgeColor: "#706B66", badgeBorder: "rgba(166,119,99,0.18)", badgeLabel: "Archived", icon: FileText },
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
      <motion.div variants={fadeUp} className="relative mb-10">
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
            style={{ fontSize: '2.75rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            {greeting}, <em className="italic" style={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #A67763 0%, #D0B060 100%)',
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
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          KPI ROW — 5 stat cards
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
        {/* SOWs Active */}
        <KpiCard config={kpiConfig.sows}>
          <div className="num-display" style={{ fontSize: '3rem', color: '#000000' }}>
            {mockSOWs.length}
          </div>
          <div className="mt-2.5" style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
            {sowsByStage.approval} in approval
          </div>
        </KpiCard>

        {/* Active Projects */}
        <KpiCard config={kpiConfig.active}>
          <div className="num-display" style={{ fontSize: '3rem', color: '#000000' }}>
            {activeProjects.length}
          </div>
          <div className="flex items-center gap-1 mt-2.5" style={{ fontSize: '11.5px', color: '#5B9BA2' }}>
            <TrendingUp className="w-2.5 h-2.5" />
            +1 this month
          </div>
        </KpiCard>

        {/* APG Escalations */}
        <KpiCard config={kpiConfig.escalations}>
          <div className="num-display" style={{ fontSize: '3rem', color: '#000000' }}>
            {totalEscalations}
          </div>
          <div className="mt-2.5" style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>
            Across {activeProjects.filter((p) => p.escalations > 0).length} projects
          </div>
        </KpiCard>

        {/* Pending Reviews */}
        <KpiCard config={kpiConfig.approvals}>
          <div className="num-display" style={{ fontSize: '3rem', color: '#000000' }}>
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

        {/* Budget Used */}
        <KpiCard config={kpiConfig.budget}>
          <div className="num-display" style={{ fontSize: '2.4rem', color: '#000000' }}>
            ${Math.round(totalSpent / 1000)}k
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>
                of ${Math.round(totalBudget / 1000)}k total
              </span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#000000' }}>
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
          SOW APPROVAL PIPELINE
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              SOW Approval Pipeline
            </div>
            <Link href="/enterprise/sow" className="link-gold">
              Manage SOWs <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div style={{ padding: '24px 26px 20px' }}>
            {/* Pipeline stages visualization */}
            <div className="flex items-center gap-0 mb-6">
              {([
                { key: 'draft', label: 'Draft', icon: FileText, color: '#A67763', bg: 'rgba(166,119,99,0.08)', border: 'rgba(166,119,99,0.18)' },
                { key: 'approval', label: 'In Approval', icon: ClipboardCheck, color: '#D0B060', bg: 'rgba(208,176,96,0.10)', border: 'rgba(208,176,96,0.22)' },
                { key: 'approved', label: 'Approved', icon: CheckCircle2, color: '#4D5741', bg: 'rgba(77,87,65,0.08)', border: 'rgba(77,87,65,0.18)' },
              ] as const).map((stage, i, arr) => {
                const count = sowsByStage[stage.key];
                const StageIcon = stage.icon;
                return (
                  <React.Fragment key={stage.key}>
                    <div className="flex-1 relative">
                      <div
                        className="flex items-center gap-4 rounded-xl transition-all"
                        style={{
                          padding: '16px 20px',
                          background: count > 0 ? stage.bg : 'rgba(166,119,99,0.03)',
                          border: `1px solid ${count > 0 ? stage.border : 'var(--border-hair)'}`,
                        }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: count > 0 ? stage.bg : 'rgba(166,119,99,0.05)',
                            border: `1px solid ${count > 0 ? stage.border : 'rgba(166,119,99,0.10)'}`,
                          }}
                        >
                          <StageIcon className="w-4 h-4" style={{ color: count > 0 ? stage.color : 'var(--ink-faint)' }} />
                        </div>
                        <div>
                          <div className="num-display" style={{ fontSize: '1.6rem', color: count > 0 ? '#000000' : 'var(--ink-faint)' }}>
                            {count}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginTop: 1, fontWeight: 500 }}>
                            {stage.label}
                          </div>
                        </div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center shrink-0 px-2">
                        <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--ink-faint)', opacity: 0.4 }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* SOW cards horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {mockSOWs.slice(0, 5).map((sow) => {
                const sc = sowStatusConfig[sow.status] || sowStatusConfig.draft;
                const StatusIcon = sc.icon;
                /* Current approval stage */
                const currentStage = sow.approvalStages?.find((s) => s.status === 'in_review');
                const completedStages = sow.approvalStages?.filter((s) => s.status === 'approved').length ?? 0;
                const totalStages = sow.approvalStages?.length ?? 4;

                return (
                  <Link key={sow.id} href={`/enterprise/sow/${sow.id}`}>
                    <div
                      className="relative overflow-hidden shrink-0 cursor-pointer transition-all duration-300 flex flex-col"
                      style={{
                        background: 'linear-gradient(155deg, rgba(253,250,247,0.95), rgba(255,255,255,0.7) 50%, rgba(249,245,241,0.6))',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 16,
                        padding: '18px 20px',
                        minWidth: 220,
                        height: 148,
                        boxShadow: '0 1px 3px rgba(77,55,46,0.05), inset 0 1px 0 rgba(255,255,255,0.7)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(208,176,96,0.30)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(77,55,46,0.08), inset 0 1px 0 rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-soft)';
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(77,55,46,0.05), inset 0 1px 0 rgba(255,255,255,0.7)';
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: sc.iconBg,
                            border: `1px solid ${sc.iconBorder}`,
                          }}
                        >
                          <StatusIcon className="w-3 h-3" style={{ color: sc.iconColor }} />
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
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-mid)', lineHeight: 1.4, marginBottom: 2 }}>
                        {sow.title.length > 32 ? sow.title.substring(0, 32) + "…" : sow.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>
                        {sow.client}
                      </div>
                      {/* Approval stage progress dots */}
                      <div className="flex items-center gap-1.5 mt-auto">
                        {Array.from({ length: totalStages }).map((_, si) => (
                          <div
                            key={si}
                            className="rounded-full"
                            style={{
                              width: si < completedStages ? 14 : 8,
                              height: 4,
                              borderRadius: 100,
                              background: si < completedStages
                                ? '#4D5741'
                                : si === completedStages && currentStage
                                  ? '#D0B060'
                                  : 'rgba(166,119,99,0.15)',
                              transition: 'all 0.3s',
                            }}
                          />
                        ))}
                        <span style={{ fontSize: 9, color: 'var(--ink-faint)', marginLeft: 4 }}>
                          {completedStages}/{totalStages}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          MID ROW: Attention + Project Pipeline
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid gap-5 mb-7" style={{ gridTemplateColumns: '1fr 1.15fr' }}>
        {/* Needs Attention */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
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
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
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
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#000000' }}>
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
          DELIVERY STATUS: Decomposition + Teams
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {/* Decomposition Plans */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              Decomposition Plans
            </div>
            <Link href="/enterprise/decomposition" className="link-gold">
              View all <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
            {/* Status summary row */}
            <div className="flex items-center gap-3 mb-5">
              {([
                { label: 'Draft', count: plansByStatus.draft, color: '#A67763', bg: 'rgba(166,119,99,0.08)' },
                { label: 'In Progress', count: plansByStatus.in_progress, color: '#D0B060', bg: 'rgba(208,176,96,0.10)' },
                { label: 'Review', count: plansByStatus.pending_review, color: '#5B9BA2', bg: 'rgba(91,155,162,0.10)' },
                { label: 'Approved', count: plansByStatus.approved, color: '#4D5741', bg: 'rgba(77,87,65,0.08)' },
              ]).map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-lg" style={{ padding: '6px 12px', background: s.bg }}>
                  <div className="rounded-full" style={{ width: 6, height: 6, background: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: s.color }}>{s.count}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Plan list */}
            {mockPlans.slice(0, 4).map((plan, i) => {
              const statusColors: Record<string, { color: string; bg: string; border: string; label: string }> = {
                draft: { color: '#6A4C3F', bg: 'rgba(166,119,99,0.08)', border: 'rgba(166,119,99,0.18)', label: 'Draft' },
                in_progress: { color: '#86713D', bg: 'rgba(208,176,96,0.10)', border: 'rgba(208,176,96,0.22)', label: 'In Progress' },
                pending_review: { color: '#2A6068', bg: 'rgba(91,155,162,0.10)', border: 'rgba(91,155,162,0.22)', label: 'Review' },
                approved: { color: '#344028', bg: 'rgba(77,87,65,0.08)', border: 'rgba(77,87,65,0.18)', label: 'Approved' },
                completed: { color: '#3A6368', bg: 'rgba(91,155,162,0.08)', border: 'rgba(91,155,162,0.18)', label: 'Completed' },
              };
              const ps = statusColors[plan.status] || statusColors.draft;

              return (
                <React.Fragment key={plan.id}>
                  <Link href={`/enterprise/decomposition/${plan.id}`}>
                    <div
                      className="flex items-center gap-3 rounded-xl cursor-pointer transition-all"
                      style={{ padding: '12px 14px', border: '1px solid transparent' }}
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
                          width: 34, height: 34, borderRadius: 9,
                          background: ps.bg,
                          border: `1px solid ${ps.border}`,
                        }}
                      >
                        <GitBranch className="w-3 h-3" style={{ color: ps.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {plan.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{plan.totalTasks} tasks</span>
                          <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{plan.totalMilestones} milestones</span>
                          <span className="font-mono" style={{ fontSize: 9, color: ps.color, fontWeight: 500 }}>
                            {plan.aiConfidence}% AI conf.
                          </span>
                        </div>
                      </div>
                      <span
                        className="badge-parchment shrink-0"
                        style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}
                      >
                        {ps.label}
                      </span>
                    </div>
                  </Link>
                  {i < Math.min(mockPlans.length, 4) - 1 && (
                    <div style={{ height: 1, background: 'var(--border-hair)', margin: '1px 8px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Team Formation */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              Team Formation
            </div>
            <Link href="/enterprise/teams" className="link-gold">
              View all <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div style={{ padding: '16px 20px 20px' }}>
            {/* Summary metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center rounded-xl" style={{ padding: '14px 8px', background: 'rgba(77,87,65,0.05)', border: '1px solid rgba(77,87,65,0.12)' }}>
                <div className="num-display" style={{ fontSize: '1.4rem', color: '#000000' }}>{totalContributors}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-faint)', marginTop: 2, fontWeight: 500 }}>Contributors</div>
              </div>
              <div className="text-center rounded-xl" style={{ padding: '14px 8px', background: 'rgba(91,155,162,0.05)', border: '1px solid rgba(91,155,162,0.12)' }}>
                <div className="num-display" style={{ fontSize: '1.4rem', color: '#000000' }}>{mockTeams.length}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-faint)', marginTop: 2, fontWeight: 500 }}>Teams</div>
              </div>
              <div className="text-center rounded-xl" style={{ padding: '14px 8px', background: 'rgba(208,176,96,0.06)', border: '1px solid rgba(208,176,96,0.14)' }}>
                <div className="num-display" style={{ fontSize: '1.4rem', color: '#000000' }}>{assignmentsByStatus.pending}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-faint)', marginTop: 2, fontWeight: 500 }}>Pending</div>
              </div>
            </div>

            {/* Team list */}
            {mockTeams.map((team, i) => {
              const statusStyle: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
                forming: { color: '#86713D', bg: 'rgba(208,176,96,0.10)', border: 'rgba(208,176,96,0.22)', icon: Loader2 },
                ready: { color: '#3A6368', bg: 'rgba(91,155,162,0.10)', border: 'rgba(91,155,162,0.22)', icon: CircleCheck },
                active: { color: '#344028', bg: 'rgba(77,87,65,0.08)', border: 'rgba(77,87,65,0.18)', icon: CircleDot },
                disbanded: { color: '#706B66', bg: 'rgba(166,119,99,0.06)', border: 'rgba(166,119,99,0.14)', icon: XCircle },
              };
              const ts = statusStyle[team.status] || statusStyle.active;
              const TeamStatusIcon = ts.icon;

              return (
                <React.Fragment key={team.id}>
                  <div
                    className="flex items-center gap-3 rounded-xl cursor-pointer transition-all"
                    style={{ padding: '12px 14px', border: '1px solid transparent' }}
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
                        width: 34, height: 34, borderRadius: 9,
                        background: ts.bg,
                        border: `1px solid ${ts.border}`,
                      }}
                    >
                      <TeamStatusIcon className="w-3 h-3" style={{ color: ts.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink-mid)' }}>
                        {team.name}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                          <Users className="w-[9px] h-[9px]" />{team.totalMembers} members
                        </span>
                        <span className="font-mono" style={{ fontSize: 9, color: '#5B9BA2', fontWeight: 500 }}>
                          {team.matchScore}% match
                        </span>
                      </div>
                    </div>
                    <span
                      className="badge-parchment shrink-0 capitalize"
                      style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}
                    >
                      {team.status}
                    </span>
                  </div>
                  {i < mockTeams.length - 1 && (
                    <div style={{ height: 1, background: 'var(--border-hair)', margin: '1px 8px' }} />
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
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="label-caps">Escrow Held</div>
                  <ShieldCheck className="w-3 h-3" style={{ color: '#D0B060', opacity: 0.6 }} />
                </div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: '#000000' }}>
                  ${Math.round(mockEscrowAccounts.reduce((s, e) => s + e.totalHeld, 0) / 1000)}k
                </div>
              </div>
              <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(91,155,162,0.04), rgba(91,155,162,0.02))', border: '1px solid var(--border-hair)', borderRadius: 14 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="label-caps">Pending Pay</div>
                  <Clock className="w-3 h-3" style={{ color: '#5B9BA2', opacity: 0.6 }} />
                </div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: '#000000' }}>
                  ${Math.round(pendingInvoicesList.reduce((s, i) => s + i.amount, 0) / 1000)}k
                </div>
              </div>
              <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(77,87,65,0.05), rgba(77,87,65,0.02))', border: '1px solid var(--border-hair)', borderRadius: 14 }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="label-caps">Total Paid</div>
                  <Banknote className="w-3 h-3" style={{ color: '#4D5741', opacity: 0.6 }} />
                </div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: '#000000' }}>
                  ${Math.round(billingStats.totalSpent / 1000)}k
                </div>
              </div>
              <div style={{
                padding: 16,
                background: overdueInvoices.length > 0 ? 'linear-gradient(135deg, rgba(160,50,50,0.05), rgba(160,50,50,0.02))' : 'rgba(77,87,65,0.04)',
                border: overdueInvoices.length > 0 ? '1px solid rgba(160,50,50,0.14)' : '1px solid var(--border-hair)',
                borderRadius: 14,
              }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="label-caps" style={{ color: overdueInvoices.length > 0 ? '#8B2C2C' : 'var(--ink-faint)' }}>Overdue</div>
                  <XCircle className="w-3 h-3" style={{ color: overdueInvoices.length > 0 ? '#8B2C2C' : 'var(--ink-faint)', opacity: 0.6 }} />
                </div>
                <div className="num-display" style={{ fontSize: '1.5rem', color: overdueInvoices.length > 0 ? '#8B2C2C' : '#000000' }}>
                  {overdueInvoices.length > 0
                    ? `$${Math.round(overdueInvoices.reduce((s, i) => s + i.amount, 0) / 1000)}k`
                    : "$0"
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI & Governance Activity */}
        <div className="card-parchment">
          <div className="section-header-parchment">
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              AI & Governance
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full" style={{
                padding: '3px 10px',
                background: 'rgba(77,87,65,0.06)',
                border: '1px solid rgba(77,87,65,0.14)',
              }}>
                <ShieldCheck className="w-2.5 h-2.5" style={{ color: '#4D5741' }} />
                <span style={{ fontSize: 10, fontWeight: 500, color: '#4D5741' }}>
                  {apgRulesEnabled}/{mockAPGRules.length} rules
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full"
                  style={{ width: 6, height: 6, background: '#5B9BA2', animation: 'blink 2.2s ease-in-out infinite', boxShadow: '0 0 8px rgba(91,155,162,0.5)' }}
                />
                <span style={{ fontSize: '10.5px', color: 'var(--ink-faint)' }}>Live</span>
              </div>
            </div>
          </div>

          {/* Key metrics strip */}
          <div className="flex items-center gap-4 mx-6 mb-2 mt-1 rounded-xl" style={{
            padding: '10px 16px',
            background: 'rgba(91,155,162,0.04)',
            border: '1px solid rgba(91,155,162,0.10)',
          }}>
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3" style={{ color: '#5B9BA2' }} />
              <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>On-Time</span>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: '#3A6368' }}>{onTimeDelivery}%</span>
            </div>
            <div style={{ width: 1, height: 14, background: 'rgba(91,155,162,0.15)' }} />
            <div className="flex items-center gap-2">
              <CircleCheck className="w-3 h-3" style={{ color: '#4D5741' }} />
              <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>First-Pass</span>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: '#344028' }}>{firstPassRate}%</span>
            </div>
            <div style={{ width: 1, height: 14, background: 'rgba(91,155,162,0.15)' }} />
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3" style={{ color: '#D0B060' }} />
              <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>APG</span>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: '#86713D' }}>{avgApgScore}</span>
            </div>
          </div>

          <div style={{ padding: '8px 16px' }}>
            {mockActivityFeed.slice(0, 6).map((event) => {
              const isAI = event.actor === 'APG System' || event.actor === 'Finance Team';
              const typeColors: Record<string, { bg: string; border: string; color: string; icon: React.ElementType }> = {
                milestone: { bg: 'rgba(166,119,99,0.08)', border: 'rgba(166,119,99,0.18)', color: '#6A4C3F', icon: CheckCircle2 },
                task: { bg: 'rgba(91,155,162,0.08)', border: 'rgba(91,155,162,0.18)', color: '#3A6368', icon: FileText },
                escalation: { bg: 'rgba(208,176,96,0.10)', border: 'rgba(208,176,96,0.22)', color: '#86713D', icon: AlertTriangle },
                payment: { bg: 'rgba(77,87,65,0.08)', border: 'rgba(77,87,65,0.18)', color: '#344028', icon: Banknote },
                review: { bg: 'rgba(77,87,65,0.08)', border: 'rgba(77,87,65,0.18)', color: '#3F4735', icon: Eye },
                sow: { bg: 'rgba(166,119,99,0.08)', border: 'rgba(166,119,99,0.18)', color: '#6A4C3F', icon: Upload },
              };
              const tc = typeColors[event.type] || typeColors.task;
              const EventIcon = tc.icon;
              const timeAgo = getTimeAgo(event.timestamp);

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl cursor-pointer transition-colors"
                  style={{ padding: '11px 10px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: tc.bg,
                      border: `1px solid ${tc.border}`,
                    }}
                  >
                    <EventIcon className="w-[12px] h-[12px]" style={{ color: tc.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                      <span style={{
                        color: isAI ? '#5B9BA2' : 'var(--ink-mid)',
                        fontWeight: 500,
                      }}>
                        {isAI && <Bot className="w-2.5 h-2.5 inline mr-1" style={{ verticalAlign: '-1px' }} />}
                        {event.actor}
                      </span>
                      {" "}{event.action}{" "}
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{event.target}</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                      <Clock className="w-[9px] h-[9px]" />
                      {timeAgo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 26px 20px', borderTop: '1px solid var(--border-hair)', marginTop: 4 }}>
            <Link href="/enterprise/audit" className="link-gold">
              View full audit log <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
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
