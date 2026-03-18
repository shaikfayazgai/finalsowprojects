"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle, ClipboardCheck, ArrowRight, Users, Clock,
  TrendingUp, TrendingDown, CheckCircle2, XCircle, RotateCcw,
  ShieldCheck, Banknote, Target, GitBranch, Timer, CircleCheck, Bot,
} from "lucide-react";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockProjects, mockDeliverables, mockPlans, mockTeams, mockAssignments } from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import { mockInvoices, mockEscrowAccounts, billingStats } from "@/mocks/data/enterprise-billing";
import { mockActivityFeed, mockAPGRules, mockAnalytics } from "@/mocks/data/enterprise-analytics";
import type { ProjectHealth } from "@/types/enterprise";

/* ══════════════════════════════════════════ Derived data ══════════════════════════════════════════ */

const activeProjects = mockProjects.filter((p) => p.health !== "completed");
const totalEscalations = mockProjects.reduce((sum, p) => sum + p.escalations, 0);
const pendingDeliverables = mockDeliverables.filter((d) => d.status === "pending");
const reworkDeliverables = mockDeliverables.filter((d) => d.status === "rework");
const draftPlans = mockPlans.filter((p) => p.status === "draft");
const pendingApprovals = pendingDeliverables.length + draftPlans.length;
const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);
const overdueInvoices = mockInvoices.filter((i) => i.status === "overdue");
const pendingInvoicesList = mockInvoices.filter((i) => i.status === "pending");
const sowsInApproval = mockSOWs.filter((s) => s.status === "approval");
const avgApgScore = Math.round(mockProjects.reduce((sum, p) => sum + p.apgScore, 0) / mockProjects.length);

const sowsByStage = {
  draft: mockSOWs.filter((s) => s.status === "draft").length,
  approval: mockSOWs.filter((s) => s.status === "approval").length,
  approved: mockSOWs.filter((s) => s.status === "approved").length,
};
const plansByStatus = {
  draft: mockPlans.filter((p) => p.status === "draft").length,
  in_progress: mockPlans.filter((p) => p.status === "in_progress").length,
  pending_review: mockPlans.filter((p) => p.status === "pending_review").length,
  approved: mockPlans.filter((p) => p.status === "approved").length,
};
const totalContributors = mockTeams.reduce((s, t) => s + t.totalMembers, 0);
const assignmentsByStatus = { pending: mockAssignments.filter((a) => a.status === "pending_response").length };
const apgRulesEnabled = mockAPGRules.filter((r) => r.enabled).length;
const deliveryPerf = mockAnalytics.find((a) => a.id === "delivery-performance");
const onTimeDelivery = deliveryPerf?.metrics[0]?.value ?? 0;
const firstPassRate = deliveryPerf?.metrics[2]?.value ?? 0;

/* ══════════════════════════════════════════ Style configs ══════════════════════════════════════════ */

const badge: Record<string, { bg: string; color: string }> = {
  forest: { bg: "rgba(77,87,65,0.08)", color: "#3F4735" },
  teal: { bg: "rgba(91,155,162,0.10)", color: "#3A6368" },
  gold: { bg: "rgba(208,176,96,0.10)", color: "#86713D" },
  danger: { bg: "rgba(196,87,74,0.08)", color: "#8B2C2C" },
  beige: { bg: "rgba(0,0,0,0.05)", color: "#706B66" },
  brown: { bg: "rgba(166,119,99,0.08)", color: "#6A4C3F" },
};

const healthCfg: Record<ProjectHealth, { label: string; dot: string; badge: string; progress: string }> = {
  on_track: { label: "On Track", dot: "#4D5741", badge: "forest", progress: "#4D5741" },
  at_risk: { label: "At Risk", dot: "#D0B060", badge: "gold", progress: "#D0B060" },
  behind: { label: "Behind", dot: "#C4574A", badge: "danger", progress: "#C4574A" },
  completed: { label: "Completed", dot: "#5B9BA2", badge: "teal", progress: "#5B9BA2" },
};

const sowBadge: Record<string, string> = { draft: "beige", parsing: "teal", review: "gold", approval: "gold", approved: "forest", archived: "beige" };
const teamBadge: Record<string, string> = { forming: "gold", ready: "teal", active: "forest", disbanded: "beige" };
const planBadge: Record<string, string> = { draft: "beige", in_progress: "gold", pending_review: "teal", approved: "forest", completed: "teal" };
const planLabel: Record<string, string> = { draft: "Draft", in_progress: "Progress", pending_review: "Review", approved: "Approved", completed: "Done" };
const typeBadge: Record<string, string> = { overdue: "danger", escalation: "gold", rework: "teal", approval: "brown", sow: "forest" };
const typeIcon: Record<string, React.ElementType> = { approval: ClipboardCheck, escalation: AlertTriangle, overdue: XCircle, rework: RotateCcw, sow: Clock };

/* ══════════════════════════════════════════ Inline badge helper ══════════════════════════════════════════ */

function Pill({ variant, dot, children, className }: { variant: string; dot?: boolean; children: React.ReactNode; className?: string }) {
  const s = badge[variant] || badge.beige;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full ${className || ""}`}
      style={{ background: s.bg, color: s.color }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />}
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════ ProgressRing ══════════════════════════════════════════ */

function ProgressRing({ value, size = 56, stroke = 5, color = "#5B9BA2" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="num-display text-[15px]" style={{ color: "var(--ink)" }}>{value}%</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ Sparkline ══════════════════════════════════════════ */

function SpendSparkline({ compact }: { compact?: boolean }) {
  const data = billingStats.monthlySpend;
  const max = Math.max(...data.map((d) => d.amount));
  const h = compact ? 50 : 65, w = 420, stepX = w / (data.length - 1);
  const pts = data.map((d, i) => ({ x: i * stepX, y: h - (d.amount / max) * (h - 8) - 4 }));
  const d = pts.map((p, i) => { if (i === 0) return `M${p.x},${p.y}`; const prev = pts[i - 1]; const cx = (prev.x + p.x) / 2; return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: compact ? 45 : 60, overflow: "visible" }} aria-hidden>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A67763" stopOpacity="0.15" /><stop offset="100%" stopColor="#A67763" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#A67763" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 3 : 2} fill={i === pts.length - 1 ? "#A67763" : "rgba(166,119,99,0.4)"} stroke={i === pts.length - 1 ? "#FFF" : undefined} strokeWidth={i === pts.length - 1 ? 1.5 : undefined} />)}
      {!compact && data.map((m, i) => <text key={m.month} x={i * stepX} y={h} fill="var(--ink-faint)" fontSize="8" fontFamily="var(--font-mono)">{m.month}</text>)}
    </svg>
  );
}

/* ══════════════════════════════════════════ Attention Items ══════════════════════════════════════════ */

const attentionItems = [
  ...(overdueInvoices.length > 0 ? [{ id: "att-overdue", title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? "s" : ""}`, desc: `$${overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()} past due`, type: "overdue", href: "/enterprise/billing/invoices", time: "Overdue" }] : []),
  ...(totalEscalations > 0 ? [{ id: "att-esc", title: `${totalEscalations} Active Escalation${totalEscalations > 1 ? "s" : ""}`, desc: `APG flagged across ${activeProjects.filter((p) => p.escalations > 0).length} projects`, type: "escalation", href: "/enterprise/projects", time: "Active" }] : []),
  ...(reworkDeliverables.length > 0 ? [{ id: "att-rework", title: `${reworkDeliverables.length} Rework Request${reworkDeliverables.length > 1 ? "s" : ""}`, desc: reworkDeliverables.map((d) => d.title).join(", "), type: "rework", href: "/enterprise/review", time: "In Progress" }] : []),
  ...(pendingDeliverables.length > 0 ? [{ id: "att-del", title: `${pendingDeliverables.length} Pending Review${pendingDeliverables.length > 1 ? "s" : ""}`, desc: pendingDeliverables.slice(0, 2).map((d) => d.title).join(", "), type: "approval", href: "/enterprise/review", time: "Awaiting" }] : []),
  ...(sowsInApproval.length > 0 ? [{ id: "att-sow", title: `SOW: ${sowsInApproval[0].title}`, desc: `Legal review — ${sowsInApproval[0].client}`, type: "sow", href: `/enterprise/sow/${sowsInApproval[0].id}/approve`, time: "In Review" }] : []),
  ...(draftPlans.length > 0 ? [{ id: "att-plans", title: `${draftPlans.length} Plan${draftPlans.length > 1 ? "s" : ""} Draft`, desc: draftPlans.map((p) => p.title).join(", "), type: "approval", href: "/enterprise/decomposition", time: "Draft" }] : []),
];

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function getGreeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }
function getTimeAgo(ts: string) { const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3600000); return h < 1 ? "Just now" : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`; }

/* ══════════════════════════════════════════ DASHBOARD ══════════════════════════════════════════ */

export default function EnterpriseDashboardPage() {
  const greeting = getGreeting();
  const dateString = new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO ═══ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-8">
        <div>
          <div className="label-caps mb-2">Enterprise Console</div>
          <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {greeting}, <span className="text-brown-500">Priya.</span>
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            {attentionItems.length > 0 ? <>{attentionItems.length} item{attentionItems.length > 1 ? "s" : ""} requiring attention.</> : "All systems operational."}
          </p>
        </div>
        <div className="mono-label hidden md:block text-gray-400">{dateString}</div>
      </motion.div>

      {/* ═══ KPI CARDS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
        {[
          { label: "Active SOWs", value: mockSOWs.length, sub: `${sowsByStage.approval} in approval`, accent: 0, bar: true },
          { label: "Active Projects", value: activeProjects.length, sub: "+1 this month", accent: 1, trend: true },
          { label: "APG Escalations", value: totalEscalations, sub: `Across ${activeProjects.filter(p => p.escalations > 0).length} projects`, accent: 2 },
          { label: "Pending Reviews", value: pendingApprovals, link: "/enterprise/review", linkText: "Review now", accent: 3 },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={scaleIn} className="card-parchment p-6">
            <div className="label-caps mb-3">{kpi.label}</div>
            <div className="num-display text-[34px] text-gray-900">{kpi.value}</div>
            {kpi.sub && <div className="text-xs mt-2 text-gray-500">{kpi.trend && <TrendingUp className="w-3 h-3 inline mr-1 text-forest-600" />}{kpi.sub}</div>}
            {kpi.link && <Link href={kpi.link} className="flex items-center gap-1 mt-2 text-xs font-medium text-teal-600 hover:text-teal-700">{kpi.linkText} <ArrowRight className="w-3 h-3" /></Link>}
            {kpi.bar && (
              <div className="flex rounded-full overflow-hidden mt-3 h-[3px]">
                <div style={{ width: `${(sowsByStage.draft / mockSOWs.length) * 100}%`, background: "#A67763", opacity: 0.5 }} />
                <div style={{ width: `${(sowsByStage.approval / mockSOWs.length) * 100}%`, background: "#D0B060", opacity: 0.5 }} />
                <div style={{ width: `${(sowsByStage.approved / mockSOWs.length) * 100}%`, background: "#4D5741", opacity: 0.5 }} />
              </div>
            )}
          </motion.div>
        ))}
        {/* Budget — progress ring */}
        <motion.div variants={scaleIn} className="card-parchment p-6 flex items-center gap-4">
          <ProgressRing value={budgetUtilization} />
          <div>
            <div className="label-caps mb-1">Budget</div>
            <div className="num-display text-[22px] text-gray-900">${Math.round(totalSpent / 1000)}k</div>
            <div className="text-[10px] text-gray-400 mt-0.5">of ${Math.round(totalBudget / 1000)}k</div>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══ SOW PIPELINE + ATTENTION ═══ */}
      <motion.div variants={fadeUp} className="grid gap-5 mb-7" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card-parchment">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span className="text-sm font-semibold text-gray-800">SOW Pipeline</span>
            <Link href="/enterprise/sow" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="px-6 py-5">
            <div className="flex rounded-full overflow-hidden h-1.5 bg-black/[0.04]">
              <div style={{ width: `${(sowsByStage.draft / mockSOWs.length) * 100}%` }} className="bg-gradient-to-r from-brown-400 to-brown-300" />
              <div style={{ width: `${(sowsByStage.approval / mockSOWs.length) * 100}%` }} className="bg-gradient-to-r from-gold-500 to-gold-400" />
              <div style={{ width: `${(sowsByStage.approved / mockSOWs.length) * 100}%` }} className="bg-gradient-to-r from-forest-500 to-forest-400" />
            </div>
            <div className="flex gap-5 mt-2.5 mb-5">
              {[{ l: "Draft", c: sowsByStage.draft, cls: "bg-brown-400" }, { l: "Approval", c: sowsByStage.approval, cls: "bg-gold-500" }, { l: "Approved", c: sowsByStage.approved, cls: "bg-forest-500" }].map((s) => (
                <span key={s.l} className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className={`w-1.5 h-1.5 rounded-full ${s.cls}`} /> {s.l} ({s.c})</span>
              ))}
            </div>
            {mockSOWs.slice(0, 5).map((sow, i) => (
              <Link key={sow.id} href={`/enterprise/sow/${sow.id}`}>
                <div className="flex items-center justify-between py-3 -mx-2 px-2 rounded-xl transition-all hover:bg-white/50"
                  style={{ borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate text-gray-700">{sow.title}</div>
                    <div className="text-[11px] mt-0.5 text-gray-400">{sow.client}</div>
                  </div>
                  <Pill variant={sowBadge[sow.status] || "beige"} className="ml-3 shrink-0">{sow.status}</Pill>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-parchment">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span className="text-sm font-semibold text-gray-800">Needs Attention</span>
            <Pill variant="danger">{attentionItems.length}</Pill>
          </div>
          <div className="py-1">
            {attentionItems.map((item, i) => {
              const Icon = typeIcon[item.type] || ClipboardCheck;
              return (
                <Link key={item.id} href={item.href}>
                  <div className="flex items-start gap-3 py-3 px-6 rounded-xl transition-all hover:bg-white/50"
                    style={{ borderBottom: i < attentionItems.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700">{item.title}</div>
                      <div className="text-[11px] mt-0.5 text-gray-400 truncate">{item.desc}</div>
                    </div>
                    <Pill variant={typeBadge[item.type] || "beige"} className="shrink-0">{item.time}</Pill>
                  </div>
                </Link>
              );
            })}
            {attentionItems.length === 0 && (
              <div className="text-center py-10"><CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-forest-500" /><p className="text-[13px] font-medium text-gray-600">All clear</p></div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ ACTIVE PROJECTS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-7">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <span className="text-sm font-semibold text-gray-800">Active Projects</span>
          <Link href="/enterprise/projects" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="hidden lg:grid items-center px-6 py-2.5" style={{ gridTemplateColumns: "1fr 140px 110px 200px 80px", borderBottom: "1px solid rgba(0,0,0,0.03)", fontSize: 10, color: "var(--ink-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span>Project</span><span>Client</span><span>Health</span><span>Progress</span><span className="text-right">Spend</span>
        </div>
        {mockProjects.map((project, i) => {
          const h = healthCfg[project.health];
          return (
            <Link key={project.id} href={`/enterprise/projects/${project.id}`}>
              <div className="flex lg:grid items-center px-6 py-3.5 rounded-xl transition-all hover:bg-white/50"
                style={{ gridTemplateColumns: "1fr 140px 110px 200px 80px", borderBottom: i < mockProjects.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-700">{project.title}</div>
                  <div className="lg:hidden text-[11px] mt-0.5 text-gray-400">{project.client}</div>
                </div>
                <div className="hidden lg:block text-[12px] text-gray-400">{project.client}</div>
                <div className="hidden lg:block"><Pill variant={h.badge} dot>{h.label}</Pill></div>
                <div className="hidden lg:flex items-center gap-3">
                  <div className="flex-1 prog-track"><div className="prog-fill" style={{ width: `${project.progress}%`, background: h.progress }} /></div>
                  <span className="text-[11px] font-mono font-medium w-8 text-right text-gray-600">{project.progress}%</span>
                </div>
                <div className="text-right ml-4 lg:ml-0 shrink-0">
                  <div className="text-[12px] font-medium text-gray-700">${Math.round(project.spent / 1000)}k</div>
                  <div className="text-[10px] text-gray-400">/{Math.round(project.budget / 1000)}k</div>
                </div>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* ═══ DECOMP + TEAMS + FINANCIAL ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
        {/* Decomposition */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span className="text-sm font-semibold text-gray-800">Decomposition</span>
            <Link href="/enterprise/decomposition" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="py-3">
            <div className="flex flex-wrap gap-1.5 px-6 mb-3">
              {[{ l: "Draft", c: plansByStatus.draft, v: "beige" }, { l: "Progress", c: plansByStatus.in_progress, v: "gold" }, { l: "Review", c: plansByStatus.pending_review, v: "teal" }, { l: "OK", c: plansByStatus.approved, v: "forest" }].map((s) => (
                <Pill key={s.l} variant={s.v}>{s.c} {s.l}</Pill>
              ))}
            </div>
            {mockPlans.slice(0, 4).map((plan, i) => (
              <Link key={plan.id} href={`/enterprise/decomposition/${plan.id}`}>
                <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all hover:bg-white/50"
                  style={{ borderBottom: i < 3 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                  <GitBranch className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate text-gray-700">{plan.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{plan.totalTasks} tasks</span>
                      <span className="font-mono text-[9px] text-teal-600">{plan.aiConfidence}% AI</span>
                    </div>
                  </div>
                  <Pill variant={planBadge[plan.status] || "beige"}>{planLabel[plan.status] || plan.status}</Pill>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span className="text-sm font-semibold text-gray-800">Teams</span>
            <Link href="/enterprise/team" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="py-3">
            <div className="grid grid-cols-3 gap-2 px-6 mb-3">
              {[{ v: totalContributors, l: "People", cls: "text-teal-600" }, { v: mockTeams.length, l: "Teams", cls: "text-forest-600" }, { v: assignmentsByStatus.pending, l: "Pending", cls: "text-gold-600" }].map((m) => (
                <div key={m.l} className="text-center rounded-xl py-2.5 bg-white/50 border border-white/30">
                  <div className={`num-display text-[18px] ${m.cls}`}>{m.v}</div>
                  <div className="text-[9px] mt-0.5 text-gray-400">{m.l}</div>
                </div>
              ))}
            </div>
            {mockTeams.map((team, i) => (
              <div key={team.id} className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all hover:bg-white/50"
                style={{ borderBottom: i < mockTeams.length - 1 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                <Users className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate text-gray-700">{team.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">{team.totalMembers} members</span>
                    <span className="font-mono text-[9px] text-teal-600">{team.matchScore}%</span>
                  </div>
                </div>
                <Pill variant={teamBadge[team.status] || "beige"} className="capitalize">{team.status}</Pill>
              </div>
            ))}
          </div>
        </div>

        {/* Financial */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <span className="text-sm font-semibold text-gray-800">Financial</span>
            <Link href="/enterprise/billing" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">Details <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-gray-400">Monthly Spend</span>
              <span className="flex items-center gap-1 text-[11px] text-brown-500"><TrendingDown className="w-2.5 h-2.5" /> −48%</span>
            </div>
            <SpendSparkline compact />
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {[
                { label: "Escrow", value: `$${Math.round(mockEscrowAccounts.reduce((s, e) => s + e.totalHeld, 0) / 1000)}k`, icon: ShieldCheck, cls: "text-teal-500" },
                { label: "Pending", value: `$${Math.round(pendingInvoicesList.reduce((s, inv) => s + inv.amount, 0) / 1000)}k`, icon: Clock, cls: "text-gold-500" },
                { label: "Paid", value: `$${Math.round(billingStats.totalSpent / 1000)}k`, icon: Banknote, cls: "text-forest-500" },
                { label: "Overdue", value: overdueInvoices.length > 0 ? `$${Math.round(overdueInvoices.reduce((s, inv) => s + inv.amount, 0) / 1000)}k` : "$0", icon: XCircle, cls: overdueInvoices.length > 0 ? "text-red-500" : "text-gray-300" },
              ].map((m) => { const MI = m.icon; return (
                <div key={m.label} className="rounded-xl py-3 px-3 bg-white/50 border border-white/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="label-caps">{m.label}</span>
                    <MI className={`w-3 h-3 ${m.cls} opacity-50`} />
                  </div>
                  <div className="num-display text-[18px] text-gray-900">{m.value}</div>
                </div>
              ); })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ AI & GOVERNANCE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-800">AI & Governance</span>
            <Pill variant="forest"><ShieldCheck className="w-2.5 h-2.5" /> {apgRulesEnabled}/{mockAPGRules.length} rules</Pill>
          </div>
          <Link href="/enterprise/audit" className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700">Audit log <ArrowRight className="w-3 h-3" /></Link>
        </div>

        <div className="flex items-center gap-6 px-6 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          {[
            { icon: Timer, label: "On-Time", value: `${onTimeDelivery}%`, cls: "text-teal-600" },
            { icon: CircleCheck, label: "First-Pass", value: `${firstPassRate}%`, cls: "text-forest-600" },
            { icon: Target, label: "APG Score", value: `${avgApgScore}`, cls: "text-gold-600" },
          ].map((m, i, arr) => (
            <React.Fragment key={m.label}>
              <div className="flex items-center gap-2">
                <m.icon className={`w-3.5 h-3.5 ${m.cls}`} />
                <span className="text-[11px] text-gray-400">{m.label}</span>
                <span className={`font-mono text-[12px] font-semibold ${m.cls}`}>{m.value}</span>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, height: 16, background: "rgba(0,0,0,0.06)" }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {[mockActivityFeed.slice(0, 3), mockActivityFeed.slice(3, 6)].map((events, colIdx) => (
            <div key={colIdx} className="py-1" style={{ borderRight: colIdx === 0 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
              {events.map((event, i) => {
                const isAI = event.actor === "APG System" || event.actor === "Finance Team";
                return (
                  <div key={event.id} className="flex items-start gap-3 px-6 py-3 rounded-xl transition-all hover:bg-white/50"
                    style={{ borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.04)" : undefined }}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isAI ? "bg-teal-500" : "bg-gray-300"}`} />
                    <div className="flex-1">
                      <div className="text-[12px] text-gray-500 leading-relaxed">
                        <span className={`font-medium ${isAI ? "text-teal-600" : "text-gray-700"}`}>
                          {isAI && <Bot className="w-2.5 h-2.5 inline mr-1" style={{ verticalAlign: "-1px" }} />}{event.actor}
                        </span>{" "}{event.action}{" "}
                        <span className="font-medium text-gray-800">{event.target}</span>
                      </div>
                      <div className="text-[10px] mt-0.5 text-gray-400">{getTimeAgo(event.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
