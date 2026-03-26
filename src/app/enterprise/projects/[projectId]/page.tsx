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
  Wallet,
  TrendingUp,
  Receipt,
  UserCheck,
  ArrowUpRight,
  Lock,
  Pause,
  Play,
  Download,
  MoreVertical,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { OTPConfirmation } from "@/components/enterprise/otp-confirmation";
import {
  mockProjects,
  mockTasks,
  mockTeams,
  mockMilestones,
  mockDeliverables,
} from "@/mocks/data/enterprise-projects";
import { toast } from "@/lib/stores/toast-store";
import type { ProjectHealth, MilestoneStatus, TaskStatus } from "@/types/enterprise";

/* -- Health config -- */
const healthConfig: Record<
  ProjectHealth,
  {
    label: string;
    dot: string;
    variant: "forest" | "gold" | "danger" | "teal" | "brown";
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
  on_hold: {
    label: "On Hold",
    dot: "bg-beige-400",
    variant: "brown",
    ringColor: "brown",
  },
  escalated: {
    label: "Escalated",
    dot: "bg-brown-600",
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

const priorityConfig: Record<string, { label: string; color: string }> = {
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

/* -- Activity Event type -- */
interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  initials: string;
  action: string;
  target: string;
  type: "task" | "review" | "payment" | "escalation" | "milestone" | "sow" | "team";
  color: string;
}

/* -- Mock activity feed -- */
const mockActivityFeed: ActivityEvent[] = [
  { id: "1", timestamp: "2026-03-25T14:30:00Z", actor: "Priya Nair", initials: "PN", action: "approved", target: "Finance Module - General Ledger", type: "review", color: "forest" },
  { id: "2", timestamp: "2026-03-25T12:15:00Z", actor: "System", initials: "SY", action: "released payment for", target: "Auth Service Deployment", type: "payment", color: "gold" },
  { id: "3", timestamp: "2026-03-24T16:45:00Z", actor: "Rahul Mehta", initials: "RM", action: "requested rework on", target: "Database Schema v2", type: "review", color: "gold" },
  { id: "4", timestamp: "2026-03-24T10:00:00Z", actor: "APG", initials: "AI", action: "flagged risk on", target: "Milestone M2 Timeline", type: "escalation", color: "brown" },
  { id: "5", timestamp: "2026-03-23T09:30:00Z", actor: "Anita Sharma", initials: "AS", action: "completed", target: "Frontend Design System", type: "task", color: "teal" },
];

/* -- Mock payment release data -- */
const mockPaymentReleases = [
  { id: "pay-001", taskId: "task-001", taskTitle: "Setup monorepo infrastructure", contributor: "Contributor C-9R", amount: 3200, approvedAt: "2026-03-20T10:00:00Z", daysElapsed: 5 },
  { id: "pay-002", taskId: "task-002", taskTitle: "Auth service with Keycloak", contributor: "Contributor B-3K", amount: 9600, approvedAt: "2026-03-22T14:30:00Z", daysElapsed: 3 },
  { id: "pay-003", taskId: "task-008", taskTitle: "Frontend design system", contributor: "Contributor G-1N", amount: 6400, approvedAt: "2026-03-23T09:00:00Z", daysElapsed: 2 },
];

/* -- Mock commercial/invoicing data -- */
const mockInvoices = [
  { id: "inv-001", number: "INV-2026-001", milestone: "M1: Infrastructure & Auth", amount: 55000, status: "paid", issuedDate: "2026-03-15", paidDate: "2026-03-20" },
  { id: "inv-002", number: "INV-2026-002", milestone: "M2: Finance Module", amount: 85000, status: "pending", issuedDate: "2026-04-01", paidDate: null },
  { id: "inv-003", number: "INV-2026-003", milestone: "M3: HR Module", amount: 75000, status: "draft", issuedDate: null, paidDate: null },
];

/* -- Mock rework requests -- */
const mockReworkRequests = [
  { id: "rw-001", taskId: "task-003", taskTitle: "Database schema design", contributor: "Contributor B-3K", rejectedDate: "2026-03-24T16:45:00Z", reason: "Missing indexes for performance queries; foreign key constraints incomplete", resubmissionDeadline: "2026-03-27T23:59:59Z", status: "in_progress" },
  { id: "rw-002", taskId: "task-004", taskTitle: "Finance module — General Ledger", contributor: "Contributor D-2M", rejectedDate: "2026-03-20T11:30:00Z", reason: "Journal entry validation missing edge cases; trial balance formula error", resubmissionDeadline: "2026-03-23T23:59:59Z", status: "resolved" },
];

/* ================================================================
   PROJECT DETAIL PAGE
   ================================================================ */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const project = mockProjects.find((p) => p.id === projectId) ?? mockProjects[0];
  const milestones = mockMilestones.filter((m) => m.projectId === project.id);
  const team = mockTeams.find((t) => t.id === project.teamId);
  const tasks = mockTasks.filter((t) => t.planId === project.planId);
  const deliverables = mockDeliverables.filter((d) => d.projectId === project.id);
  const hc = healthConfig[project.health];
  const [resolvedExceptions, setResolvedExceptions] = React.useState<Set<string>>(new Set());
  const [otpDialog, setOtpDialog] = React.useState<{
    isOpen: boolean;
    type: "payment" | "uat" | null;
    itemId: string | null;
  }>({ isOpen: false, type: null, itemId: null });
  const [releasedPayments, setReleasedPayments] = React.useState<Set<string>>(new Set());
  const [uatSigned, setUatSigned] = React.useState(false);

  const budgetPct = Math.round((project.spent / project.budget) * 100);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  /* Inline exceptions for this project */
  const projectExceptions = [
    ...(project.escalations > 0
      ? [
          {
            id: "pe-1",
            type: "escalation",
            description: "Client escalation: deliverable review cycle exceeding SLA threshold.",
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
            description: "SLA compliance dropped below 90% target. Evidence packs pending review beyond 48h window.",
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
            description: "Review pass rate dropped to 58% over last 5 submissions. APG quality threshold is 75%.",
            severity: "warning" as const,
            date: "1 day ago",
            status: "open" as const,
          },
        ]
      : []),
  ];

  const handleReleasePayment = (paymentId: string) => {
    setOtpDialog({ isOpen: true, type: "payment", itemId: paymentId });
  };

  const handleUATSignOff = () => {
    setOtpDialog({ isOpen: true, type: "uat", itemId: "m3" });
  };

  const handleOtpConfirm = () => {
    if (otpDialog.type === "payment" && otpDialog.itemId) {
      setReleasedPayments((prev) => new Set(prev).add(otpDialog.itemId!));
      toast.success("Payment Released", "Payment has been released to contributor");
    } else if (otpDialog.type === "uat") {
      setUatSigned(true);
      toast.success("UAT Signed Off", "M3 billing milestone has been triggered");
    }
  };

  const handleDownloadReport = () => {
    toast.success("Report Downloaded", `Project report for "${project.title}" has been downloaded.`);
  };

  const handlePutOnHold = () => {
    toast.info("Project On Hold", `"${project.title}" has been put on hold.`);
  };

  const handleResume = () => {
    toast.success("Project Resumed", `"${project.title}" is now back on track.`);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
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
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Title, client, health */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">{project.title}</h1>
              <Badge variant={hc.variant} size="sm" dot>
                {hc.label}
              </Badge>
            </div>
            <p className="text-[13px] text-beige-500 mt-1">{project.client}</p>
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
              <MetricRing value={project.apgScore} size={64} strokeWidth={5} color={hc.ringColor} label="APG" />
              <div className="text-right">
                <p className="text-[28px] font-bold text-brown-900 tracking-tight leading-none">{project.progress}%</p>
                <p className="text-[10px] text-beige-500 mt-0.5">Complete</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">${(project.budget / 1000).toFixed(0)}k budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">{project.teamSize} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-beige-400" />
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    project.slaCompliance >= 95 ? "text-forest-700" : project.slaCompliance >= 85 ? "text-gold-700" : "text-brown-700"
                  )}
                >
                  {project.slaCompliance}% SLA
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">{daysLeft} days left</span>
              </div>
            </div>

            {/* Quick Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg border border-beige-200 hover:bg-beige-50 transition-colors">
                  <MoreVertical className="w-4 h-4 text-beige-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {project.health === "on_hold" ? (
                  <DropdownMenuItem onClick={handleResume} className="gap-2">
                    <Play className="w-4 h-4 text-forest-500" />
                    <span>Resume Project</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handlePutOnHold} className="gap-2">
                    <Pause className="w-4 h-4 text-beige-500" />
                    <span>Put on Hold</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadReport} className="gap-2">
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>Download Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Tabs - All 8 tabs as per FSD */}
      <Tabs defaultValue="overview">
        <motion.div variants={fadeUp}>
          <TabsList className="bg-beige-100/80 p-1 flex flex-wrap h-auto">
            <TabsTrigger value="overview">Overview & Status</TabsTrigger>
            <TabsTrigger value="timeline">Milestone Timeline</TabsTrigger>
            <TabsTrigger value="evidence">Evidence Packs</TabsTrigger>
            <TabsTrigger value="rework">Rework Requests</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="payment">Payment Release</TabsTrigger>
            <TabsTrigger value="team">Team Summary</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ---- TAB 1: OVERVIEW & STATUS ---- */}
        <TabsContent value="overview">
          <OverviewTab
            project={project}
            milestones={milestones}
            tasks={tasks}
            deliverables={deliverables}
            budgetPct={budgetPct}
            daysLeft={daysLeft}
            hc={hc}
          />
        </TabsContent>

        {/* ---- TAB 2: MILESTONE TIMELINE ---- */}
        <TabsContent value="timeline">
          <TimelineTab project={project} milestones={milestones} />
        </TabsContent>

        {/* ---- TAB 3: EVIDENCE PACKS ---- */}
        <TabsContent value="evidence">
          <EvidencePacksTab milestones={milestones} deliverables={deliverables} />
        </TabsContent>

        {/* ---- TAB 4: REWORK REQUESTS ---- */}
        <TabsContent value="rework">
          <ReworkRequestsTab reworkRequests={mockReworkRequests} />
        </TabsContent>

        {/* ---- TAB 5: EXCEPTIONS ---- */}
        <TabsContent value="exceptions">
          <ExceptionsTab
            project={project}
            projectExceptions={projectExceptions}
            resolvedExceptions={resolvedExceptions}
            setResolvedExceptions={setResolvedExceptions}
          />
        </TabsContent>

        {/* ---- TAB 6: PAYMENT RELEASE ---- */}
        <TabsContent value="payment">
          <PaymentReleaseTab
            paymentReleases={mockPaymentReleases}
            releasedPayments={releasedPayments}
            onReleasePayment={handleReleasePayment}
          />
        </TabsContent>

        {/* ---- TAB 7: TEAM SUMMARY ---- */}
        <TabsContent value="team">
          <TeamSummaryTab team={team} />
        </TabsContent>

        {/* ---- TAB 8: COMMERCIAL ---- */}
        <TabsContent value="commercial">
          <CommercialTab
            project={project}
            budgetPct={budgetPct}
            invoices={mockInvoices}
            uatSigned={uatSigned}
            onUATSignOff={handleUATSignOff}
          />
        </TabsContent>
      </Tabs>

      {/* OTP Confirmation Dialog */}
      <OTPConfirmation
        isOpen={otpDialog.isOpen}
        onClose={() => setOtpDialog({ isOpen: false, type: null, itemId: null })}
        onConfirm={handleOtpConfirm}
        title={otpDialog.type === "payment" ? "Confirm Payment Release" : "Confirm UAT Sign-off"}
        description={
          otpDialog.type === "payment"
            ? "This action will release payment to the contributor. Please verify the OTP sent to your email."
            : "This action will trigger the M3 billing milestone. This cannot be undone."
        }
        actionLabel={otpDialog.type === "payment" ? "Release Payment" : "Sign Off UAT"}
        warningText={
          otpDialog.type === "uat"
            ? "UAT Sign-off is a consequential financial action that will generate an invoice."
            : undefined
        }
      />
    </motion.div>
  );
}

/* ================================================================
   TAB 1: OVERVIEW & STATUS
   ================================================================ */
function OverviewTab({
  project,
  milestones,
  tasks,
  deliverables,
  budgetPct,
  daysLeft,
  hc,
}: {
  project: (typeof mockProjects)[0];
  milestones: typeof mockMilestones;
  tasks: typeof mockTasks;
  deliverables: typeof mockDeliverables;
  budgetPct: number;
  daysLeft: number;
  hc: (typeof healthConfig)["on_track"];
}) {
  const pendingReview = deliverables.filter((d) => d.status === "pending").length;
  const needsAttention = tasks.filter((t) => t.status === "rework" || t.status === "in_review").length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Key Metrics */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Budget", value: `$${(project.budget / 1000).toFixed(0)}k`, icon: Wallet, color: "from-brown-400 to-brown-600" },
          { label: "Spent", value: `$${(project.spent / 1000).toFixed(0)}k`, icon: CircleDollarSign, color: "from-gold-400 to-gold-600" },
          { label: "Pending Review", value: pendingReview, icon: Eye, color: "from-teal-400 to-teal-600" },
          { label: "Needs Attention", value: needsAttention, icon: AlertTriangle, color: "from-danger-400 to-danger-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", stat.color)}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[20px] font-bold text-brown-900 tracking-tight leading-none">{stat.value}</p>
              <p className="text-[10px] text-beige-500 mt-0.5 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Budget & Progress */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            Budget Utilization
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">Spent</span>
              <span className="font-semibold text-brown-800">${(project.spent / 1000).toFixed(0)}k</span>
            </div>
            <Progress value={budgetPct} size="md" variant={budgetPct > 85 ? "gold" : "forest"} />
            <div className="flex items-center justify-between text-[11px] text-beige-400">
              <span>{budgetPct}% utilized</span>
              <span>${((project.budget - project.spent) / 1000).toFixed(0)}k remaining</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Timeline Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">Days Remaining</span>
              <span className={cn("font-semibold", daysLeft < 30 ? "text-danger" : "text-brown-800")}>{daysLeft} days</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">End Date</span>
              <span className="font-semibold text-brown-800">{fmtDate(project.endDate)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">Milestones</span>
              <span className="font-semibold text-brown-800">
                {milestones.filter((m) => m.status === "completed").length}/{milestones.length} completed
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
        <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-500" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {mockActivityFeed.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-beige-50/50 transition-colors">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                  activity.color === "forest" && "bg-forest-500",
                  activity.color === "gold" && "bg-gold-500",
                  activity.color === "brown" && "bg-brown-500",
                  activity.color === "teal" && "bg-teal-500"
                )}
              >
                {activity.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-brown-800">
                  <span className="font-semibold">{activity.actor}</span>{" "}
                  <span className="text-beige-500">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-[11px] text-beige-400 mt-0.5">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* AGI Orchestration Status */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
        <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" />
          AGI Orchestration Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "APG Score", value: `${project.apgScore}%`, status: project.apgScore >= 80 ? "Good" : "Needs Attention" },
            { label: "Task Automation", value: "78%", status: "Active" },
            { label: "Review Assist", value: "On", status: "Enabled" },
            { label: "Predictions", value: "92%", status: "Accurate" },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-beige-50/50">
              <p className="text-[18px] font-bold text-brown-900">{item.value}</p>
              <p className="text-[11px] text-beige-500">{item.label}</p>
              <Badge variant={item.status === "Good" || item.status === "Active" || item.status === "Enabled" || item.status === "Accurate" ? "forest" : "gold"} size="sm" className="mt-1">
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
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
  Wallet,
  TrendingUp,
  Receipt,
  UserCheck,
  ArrowUpRight,
  Lock,
  Pause,
  Play,
  Download,
  MoreVertical,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { OTPConfirmation } from "@/components/enterprise/otp-confirmation";
import {
  mockProjects,
  mockTasks,
  mockTeams,
  mockMilestones,
  mockDeliverables,
} from "@/mocks/data/enterprise-projects";
import { toast } from "@/lib/stores/toast-store";
import type { ProjectHealth, MilestoneStatus, TaskStatus } from "@/types/enterprise";

/* -- Health config -- */
const healthConfig: Record<
  ProjectHealth,
  {
    label: string;
    dot: string;
    variant: "forest" | "gold" | "danger" | "teal" | "brown";
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
  on_hold: {
    label: "On Hold",
    dot: "bg-beige-400",
    variant: "brown",
    ringColor: "brown",
  },
  escalated: {
    label: "Escalated",
    dot: "bg-brown-600",
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

const priorityConfig: Record<string, { label: string; color: string }> = {
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

/* -- Activity Event type -- */
interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  initials: string;
  action: string;
  target: string;
  type: "task" | "review" | "payment" | "escalation" | "milestone" | "sow" | "team";
  color: string;
}

/* -- Mock activity feed -- */
const mockActivityFeed: ActivityEvent[] = [
  { id: "1", timestamp: "2026-03-25T14:30:00Z", actor: "Priya Nair", initials: "PN", action: "approved", target: "Finance Module - General Ledger", type: "review", color: "forest" },
  { id: "2", timestamp: "2026-03-25T12:15:00Z", actor: "System", initials: "SY", action: "released payment for", target: "Auth Service Deployment", type: "payment", color: "gold" },
  { id: "3", timestamp: "2026-03-24T16:45:00Z", actor: "Rahul Mehta", initials: "RM", action: "requested rework on", target: "Database Schema v2", type: "review", color: "gold" },
  { id: "4", timestamp: "2026-03-24T10:00:00Z", actor: "APG", initials: "AI", action: "flagged risk on", target: "Milestone M2 Timeline", type: "escalation", color: "brown" },
  { id: "5", timestamp: "2026-03-23T09:30:00Z", actor: "Anita Sharma", initials: "AS", action: "completed", target: "Frontend Design System", type: "task", color: "teal" },
];

/* -- Mock payment release data -- */
const mockPaymentReleases = [
  { id: "pay-001", taskId: "task-001", taskTitle: "Setup monorepo infrastructure", contributor: "Contributor C-9R", amount: 3200, approvedAt: "2026-03-20T10:00:00Z", daysElapsed: 5 },
  { id: "pay-002", taskId: "task-002", taskTitle: "Auth service with Keycloak", contributor: "Contributor B-3K", amount: 9600, approvedAt: "2026-03-22T14:30:00Z", daysElapsed: 3 },
  { id: "pay-003", taskId: "task-008", taskTitle: "Frontend design system", contributor: "Contributor G-1N", amount: 6400, approvedAt: "2026-03-23T09:00:00Z", daysElapsed: 2 },
];

/* -- Mock commercial/invoicing data -- */
const mockInvoices = [
  { id: "inv-001", number: "INV-2026-001", milestone: "M1: Infrastructure & Auth", amount: 55000, status: "paid", issuedDate: "2026-03-15", paidDate: "2026-03-20" },
  { id: "inv-002", number: "INV-2026-002", milestone: "M2: Finance Module", amount: 85000, status: "pending", issuedDate: "2026-04-01", paidDate: null },
  { id: "inv-003", number: "INV-2026-003", milestone: "M3: HR Module", amount: 75000, status: "draft", issuedDate: null, paidDate: null },
];

/* -- Mock rework requests -- */
const mockReworkRequests = [
  { id: "rw-001", taskId: "task-003", taskTitle: "Database schema design", contributor: "Contributor B-3K", rejectedDate: "2026-03-24T16:45:00Z", reason: "Missing indexes for performance queries; foreign key constraints incomplete", resubmissionDeadline: "2026-03-27T23:59:59Z", status: "in_progress" },
  { id: "rw-002", taskId: "task-004", taskTitle: "Finance module — General Ledger", contributor: "Contributor D-2M", rejectedDate: "2026-03-20T11:30:00Z", reason: "Journal entry validation missing edge cases; trial balance formula error", resubmissionDeadline: "2026-03-23T23:59:59Z", status: "resolved" },
];

/* ================================================================
   PROJECT DETAIL PAGE
   ================================================================ */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const project = mockProjects.find((p) => p.id === projectId) ?? mockProjects[0];
  const milestones = mockMilestones.filter((m) => m.projectId === project.id);
  const team = mockTeams.find((t) => t.id === project.teamId);
  const tasks = mockTasks.filter((t) => t.planId === project.planId);
  const deliverables = mockDeliverables.filter((d) => d.projectId === project.id);
  const hc = healthConfig[project.health];
  const [resolvedExceptions, setResolvedExceptions] = React.useState<Set<string>>(new Set());
  const [otpDialog, setOtpDialog] = React.useState<{
    isOpen: boolean;
    type: "payment" | "uat" | null;
    itemId: string | null;
  }>({ isOpen: false, type: null, itemId: null });
  const [releasedPayments, setReleasedPayments] = React.useState<Set<string>>(new Set());
  const [uatSigned, setUatSigned] = React.useState(false);

  const budgetPct = Math.round((project.spent / project.budget) * 100);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  /* Inline exceptions for this project */
  const projectExceptions = [
    ...(project.escalations > 0
      ? [
          {
            id: "pe-1",
            type: "escalation",
            description: "Client escalation: deliverable review cycle exceeding SLA threshold.",
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
            description: "SLA compliance dropped below 90% target. Evidence packs pending review beyond 48h window.",
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
            description: "Review pass rate dropped to 58% over last 5 submissions. APG quality threshold is 75%.",
            severity: "warning" as const,
            date: "1 day ago",
            status: "open" as const,
          },
        ]
      : []),
  ];

  const handleReleasePayment = (paymentId: string) => {
    setOtpDialog({ isOpen: true, type: "payment", itemId: paymentId });
  };

  const handleUATSignOff = () => {
    setOtpDialog({ isOpen: true, type: "uat", itemId: "m3" });
  };

  const handleOtpConfirm = () => {
    if (otpDialog.type === "payment" && otpDialog.itemId) {
      setReleasedPayments((prev) => new Set(prev).add(otpDialog.itemId!));
      toast.success("Payment Released", "Payment has been released to contributor");
    } else if (otpDialog.type === "uat") {
      setUatSigned(true);
      toast.success("UAT Signed Off", "M3 billing milestone has been triggered");
    }
  };

  const handleDownloadReport = () => {
    toast.success("Report Downloaded", `Project report for "${project.title}" has been downloaded.`);
  };

  const handlePutOnHold = () => {
    toast.info("Project On Hold", `"${project.title}" has been put on hold.`);
  };

  const handleResume = () => {
    toast.success("Project Resumed", `"${project.title}" is now back on track.`);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
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
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Title, client, health */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">{project.title}</h1>
              <Badge variant={hc.variant} size="sm" dot>
                {hc.label}
              </Badge>
            </div>
            <p className="text-[13px] text-beige-500 mt-1">{project.client}</p>
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
              <MetricRing value={project.apgScore} size={64} strokeWidth={5} color={hc.ringColor} label="APG" />
              <div className="text-right">
                <p className="text-[28px] font-bold text-brown-900 tracking-tight leading-none">{project.progress}%</p>
                <p className="text-[10px] text-beige-500 mt-0.5">Complete</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">${(project.budget / 1000).toFixed(0)}k budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">{project.teamSize} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-beige-400" />
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    project.slaCompliance >= 95 ? "text-forest-700" : project.slaCompliance >= 85 ? "text-gold-700" : "text-brown-700"
                  )}
                >
                  {project.slaCompliance}% SLA
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">{daysLeft} days left</span>
              </div>
            </div>

            {/* Quick Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg border border-beige-200 hover:bg-beige-50 transition-colors">
                  <MoreVertical className="w-4 h-4 text-beige-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {project.health === "on_hold" ? (
                  <DropdownMenuItem onClick={handleResume} className="gap-2">
                    <Play className="w-4 h-4 text-forest-500" />
                    <span>Resume Project</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handlePutOnHold} className="gap-2">
                    <Pause className="w-4 h-4 text-beige-500" />
                    <span>Put on Hold</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadReport} className="gap-2">
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>Download Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Tabs - All 8 tabs as per FSD */}
      <Tabs defaultValue="overview">
        <motion.div variants={fadeUp}>
          <TabsList className="bg-beige-100/80 p-1 flex flex-wrap h-auto">
            <TabsTrigger value="overview">Overview & Status</TabsTrigger>
            <TabsTrigger value="timeline">Milestone Timeline</TabsTrigger>
            <TabsTrigger value="evidence">Evidence Packs</TabsTrigger>
            <TabsTrigger value="rework">Rework Requests</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="payment">Payment Release</TabsTrigger>
            <TabsTrigger value="team">Team Summary</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ---- TAB 1: OVERVIEW & STATUS ---- */}
        <TabsContent value="overview">
          <OverviewTab
            project={project}
            milestones={milestones}
            tasks={tasks}
            deliverables={deliverables}
            budgetPct={budgetPct}
            daysLeft={daysLeft}
            hc={hc}
          />
        </TabsContent>

        {/* ---- TAB 2: MILESTONE TIMELINE ---- */}
        <TabsContent value="timeline">
          <TimelineTab project={project} milestones={milestones} />
        </TabsContent>

        {/* ---- TAB 3: EVIDENCE PACKS ---- */}
        <TabsContent value="evidence">
          <EvidencePacksTab milestones={milestones} deliverables={deliverables} />
        </TabsContent>

        {/* ---- TAB 4: REWORK REQUESTS ---- */}
        <TabsContent value="rework">
          <ReworkRequestsTab reworkRequests={mockReworkRequests} />
        </TabsContent>

        {/* ---- TAB 5: EXCEPTIONS ---- */}
        <TabsContent value="exceptions">
          <ExceptionsTab
            project={project}
            projectExceptions={projectExceptions}
            resolvedExceptions={resolvedExceptions}
            setResolvedExceptions={setResolvedExceptions}
          />
        </TabsContent>

        {/* ---- TAB 6: PAYMENT RELEASE ---- */}
        <TabsContent value="payment">
          <PaymentReleaseTab
            paymentReleases={mockPaymentReleases}
            releasedPayments={releasedPayments}
            onReleasePayment={handleReleasePayment}
          />
        </TabsContent>

        {/* ---- TAB 7: TEAM SUMMARY ---- */}
        <TabsContent value="team">
          <TeamSummaryTab team={team} />
        </TabsContent>

        {/* ---- TAB 8: COMMERCIAL ---- */}
        <TabsContent value="commercial">
          <CommercialTab
            project={project}
            budgetPct={budgetPct}
            invoices={mockInvoices}
            uatSigned={uatSigned}
            onUATSignOff={handleUATSignOff}
          />
        </TabsContent>
      </Tabs>

      {/* OTP Confirmation Dialog */}
      <OTPConfirmation
        isOpen={otpDialog.isOpen}
        onClose={() => setOtpDialog({ isOpen: false, type: null, itemId: null })}
        onConfirm={handleOtpConfirm}
        title={otpDialog.type === "payment" ? "Confirm Payment Release" : "Confirm UAT Sign-off"}
        description={
          otpDialog.type === "payment"
            ? "This action will release payment to the contributor. Please verify the OTP sent to your email."
            : "This action will trigger the M3 billing milestone. This cannot be undone."
        }
        actionLabel={otpDialog.type === "payment" ? "Release Payment" : "Sign Off UAT"}
        warningText={
          otpDialog.type === "uat"
            ? "UAT Sign-off is a consequential financial action that will generate an invoice."
            : undefined
        }
      />
    </motion.div>
  );
}

/* ================================================================
   TAB COMPONENTS
   ================================================================ */

/* ---- TAB 1: OVERVIEW & STATUS ---- */
function OverviewTab({
  project,
  milestones,
  tasks,
  deliverables,
  budgetPct,
  daysLeft,
  hc,
}: {
  project: (typeof mockProjects)[0];
  milestones: typeof mockMilestones;
  tasks: typeof mockTasks;
  deliverables: typeof mockDeliverables;
  budgetPct: number;
  daysLeft: number;
  hc: (typeof healthConfig)["on_track"];
}) {
  const pendingReview = deliverables.filter((d) => d.status === "pending").length;
  const needsAttention = tasks.filter((t) => t.status === "rework" || t.status === "in_review").length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Budget", value: `$${(project.budget / 1000).toFixed(0)}k`, icon: Wallet, color: "from-brown-400 to-brown-600" },
          { label: "Spent", value: `$${(project.spent / 1000).toFixed(0)}k`, icon: CircleDollarSign, color: "from-gold-400 to-gold-600" },
          { label: "Pending Review", value: pendingReview, icon: Eye, color: "from-teal-400 to-teal-600" },
          { label: "Needs Attention", value: needsAttention, icon: AlertTriangle, color: "from-danger-400 to-danger-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", stat.color)}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[20px] font-bold text-brown-900 tracking-tight leading-none">{stat.value}</p>
              <p className="text-[10px] text-beige-500 mt-0.5 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            Budget Utilization
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">Spent</span>
              <span className="font-semibold text-brown-800">${(project.spent / 1000).toFixed(0)}k</span>
            </div>
            <Progress value={budgetPct} size="md" variant={budgetPct > 85 ? "gold" : "forest"} />
            <div className="flex items-center justify-between text-[11px] text-beige-400">
              <span>{budgetPct}% utilized</span>
              <span>${((project.budget - project.spent) / 1000).toFixed(0)}k remaining</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Timeline Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">Days Remaining</span>
              <span className={cn("font-semibold", daysLeft < 30 ? "text-danger" : "text-brown-800")}>{daysLeft} days</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">End Date</span>
              <span className="font-semibold text-brown-800">{fmtDate(project.endDate)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-beige-500">Milestones</span>
              <span className="font-semibold text-brown-800">
                {milestones.filter((m) => m.status === "completed").length}/{milestones.length} completed
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
        <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-500" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {mockActivityFeed.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-beige-50/50 transition-colors">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                  activity.color === "forest" && "bg-forest-500",
                  activity.color === "gold" && "bg-gold-500",
                  activity.color === "brown" && "bg-brown-500",
                  activity.color === "teal" && "bg-teal-500"
                )}
              >
                {activity.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-brown-800">
                  <span className="font-semibold">{activity.actor}</span>{" "}
                  <span className="text-beige-500">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-[11px] text-beige-400 mt-0.5">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
        <h3 className="text-[14px] font-semibold text-brown-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" />
          AGI Orchestration Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "APG Score", value: `${project.apgScore}%`, status: project.apgScore >= 80 ? "Good" : "Needs Attention" },
            { label: "Task Automation", value: "78%", status: "Active" },
            { label: "Review Assist", value: "On", status: "Enabled" },
            { label: "Predictions", value: "92%", status: "Accurate" },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 rounded-xl bg-beige-50/50">
              <p className="text-[18px] font-bold text-brown-900">{item.value}</p>
              <p className="text-[11px] text-beige-500">{item.label}</p>
              <Badge variant={item.status === "Good" || item.status === "Active" || item.status === "Enabled" || item.status === "Accurate" ? "forest" : "gold"} size="sm" className="mt-1">
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---- TAB 2: MILESTONE TIMELINE ---- */
function TimelineTab({ project, milestones }: { project: (typeof mockProjects)[0]; milestones: typeof mockMilestones }) {
  const [viewMode, setViewMode] = React.useState<"gantt" | "list">("gantt");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("gantt")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
              viewMode === "gantt" ? "bg-brown-100 text-brown-700" : "text-beige-500 hover:text-brown-600"
            )}
          >
            Gantt View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
              viewMode === "list" ? "bg-brown-100 text-brown-700" : "text-beige-500 hover:text-brown-600"
            )}
          >
            List View
          </button>
        </div>
        <span className="text-[12px] text-beige-400">
          {fmtDate(project.startDate)} - {fmtDate(project.endDate)}
        </span>
      </motion.div>

      {viewMode === "gantt" ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
        >
          <div className="space-y-1">
            <div className="flex items-center mb-4">
              <div className="w-[200px] shrink-0" />
              <div className="flex-1 flex items-center justify-between px-2">
                {(() => {
                  const start = new Date(project.startDate);
                  const end = new Date(project.endDate);
                  const months: string[] = [];
                  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
                  while (cursor <= end) {
                    months.push(cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
                    cursor.setMonth(cursor.getMonth() + 1);
                  }
                  return months.map((m) => (
                    <span key={m} className="text-[9px] text-beige-400 font-medium uppercase tracking-wider">
                      {m}
                    </span>
                  ));
                })()}
              </div>
            </div>

            {milestones.map((ms) => {
              const msC = msStatusColors[ms.status];
              const projectStart = new Date(project.startDate).getTime();
              const projectEnd = new Date(project.endDate).getTime();
              const totalDuration = projectEnd - projectStart;
              const msIndex = milestones.indexOf(ms);
              const barStart = msIndex === 0 ? projectStart : new Date(milestones[msIndex - 1].dueDate).getTime();
              const barEnd = new Date(ms.dueDate).getTime();
              const leftPct = Math.max(0, ((barStart - projectStart) / totalDuration) * 100);
              const widthPct = Math.max(5, ((barEnd - barStart) / totalDuration) * 100);

              return (
                <motion.div key={ms.id} variants={scaleIn} className="flex items-center group cursor-pointer hover:bg-beige-50/50 rounded-lg transition-colors">
                  <div className="w-[200px] shrink-0 pr-4">
                    <p className="text-[12px] font-semibold text-brown-800 truncate">{ms.title}</p>
                    <p className="text-[10px] text-beige-400">Due {fmtShortDate(ms.dueDate)}</p>
                  </div>
                  <div className="flex-1 h-10 relative">
                    <div className="absolute inset-0 border-l border-beige-100" />
                    <div
                      className="absolute top-1.5 h-7 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    >
                      <div className={cn("absolute inset-0 opacity-20", msC.bg)} />
                      <div className={cn("absolute inset-y-0 left-0 rounded-lg opacity-40", msC.dot)} style={{ width: `${ms.progress}%` }} />
                      <div
                        className={cn(
                          "absolute inset-0 rounded-lg border",
                          ms.status === "completed" ? "border-forest-300" : ms.status === "in_progress" ? "border-teal-300" : ms.status === "overdue" ? "border-brown-300" : "border-beige-200"
                        )}
                      />
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className={cn("text-[10px] font-bold", msC.text)}>{ms.progress}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-beige-100/80">
              {(["completed", "in_progress", "upcoming", "overdue"] as MilestoneStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-sm", msStatusColors[status].dot)} />
                  <span className="text-[10px] text-beige-500 capitalize">{status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((ms) => {
                const msC = msStatusColors[ms.status];
                return (
                  <TableRow key={ms.id} className="cursor-pointer hover:bg-beige-50/50 transition-colors">
                    <TableCell>
                      <p className="text-[13px] font-semibold text-brown-900">{ms.title}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", msC.dot)} />
                        <span className={cn("text-[12px] capitalize", msC.text)}>{ms.status.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={ms.progress} size="sm" variant={ms.status === "completed" ? "forest" : ms.status === "in_progress" ? "teal" : "beige"} className="w-20" />
                        <span className="text-[11px] font-mono">{ms.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-brown-700">{fmtDate(ms.dueDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px]">
                        <span className="font-semibold">{ms.tasksCompleted}</span>
                        <span className="text-beige-400">/{ms.tasksTotal}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-brown-700">${(ms.budget / 1000).toFixed(0)}k</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ---- TAB 3: EVIDENCE PACKS ---- */
function EvidencePacksTab({
  milestones,
  deliverables,
}: {
  milestones: typeof mockMilestones;
  deliverables: typeof mockDeliverables;
}) {
  const handleDownloadAllZIP = () => {
    toast.success("Download Started", "All evidence packs are being zipped. Download will begin shortly.");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Bulk Actions */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-brown-800">
          {deliverables.length} Evidence Pack{deliverables.length !== 1 ? "s" : ""} across {milestones.length} Milestone{milestones.length !== 1 ? "s" : ""}
        </h3>
        <button
          onClick={handleDownloadAllZIP}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-beige-200 bg-white/60 hover:bg-white/80 text-brown-700 text-[12px] font-semibold transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Download All (ZIP)
        </button>
      </motion.div>

      {milestones.map((milestone) => {
        const milestoneDeliverables = deliverables.filter((d) => d.milestoneId === milestone.id);
        if (milestoneDeliverables.length === 0) return null;

        return (
          <motion.div
            key={milestone.id}
            variants={fadeUp}
            className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-4 border-b border-beige-100/80 bg-beige-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-semibold text-brown-800">{milestone.title}</h3>
                  <p className="text-[11px] text-beige-500">
                    Due {fmtDate(milestone.dueDate)} · {milestoneDeliverables.length} evidence pack
                    {milestoneDeliverables.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge
                  variant={milestone.status === "completed" ? "forest" : milestone.status === "in_progress" ? "teal" : "beige"}
                  size="sm"
                >
                  {milestone.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestoneDeliverables.map((del) => {
                  const ds = deliverableStatusConfig[del.status];
                  return (
                    <TableRow key={del.id}>
                      <TableCell>
                        <p className="text-[13px] font-semibold text-brown-900">{del.title}</p>
                        <p className="text-[10px] text-beige-400 font-mono mt-0.5">{del.taskId}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ds.variant} size="sm" dot>
                          {ds.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12px] text-brown-700">{del.submittedBy}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-beige-500">{fmtDate(del.submittedAt)}</span>
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
                          <span className="text-[10px] text-beige-400">{del.status === "approved" ? "Approved" : "Rejected"}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </motion.div>
        );
      })}

      {deliverables.length === 0 && (
        <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
          <Package className="w-10 h-10 text-beige-300 mx-auto mb-3" />
          <h3 className="text-[16px] font-bold text-brown-900">No Evidence Packs</h3>
          <p className="text-[13px] text-beige-500 mt-1">No deliverables have been submitted for this project yet.</p>
        </motion.div>
      )}
    </motion.div>
  );
}


/* ---- TAB 4: REWORK REQUESTS ---- */
function ReworkRequestsTab({
  reworkRequests,
}: {
  reworkRequests: typeof mockReworkRequests;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center text-white">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">{reworkRequests.length}</p>
            <p className="text-[10px] text-beige-500 mt-0.5">Total Rework</p>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">
              {reworkRequests.filter((r) => r.status === "in_progress").length}
            </p>
            <p className="text-[10px] text-beige-500 mt-0.5">Pending</p>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">
              {reworkRequests.filter((r) => r.status === "resolved").length}
            </p>
            <p className="text-[10px] text-beige-500 mt-0.5">Resolved</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {reworkRequests.map((request) => {
          const isOverdue = new Date(request.resubmissionDeadline) < new Date();
          return (
            <motion.div
              key={request.id}
              variants={scaleIn}
              className={cn(
                "rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 border-l-[4px]",
                request.status === "resolved" ? "border-l-forest-500" : isOverdue ? "border-l-danger" : "border-l-gold-500"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[14px] font-semibold text-brown-900">{request.taskTitle}</h3>
                    <Badge
                      variant={request.status === "resolved" ? "forest" : "gold"}
                      size="sm"
                    >
                      {request.status === "resolved" ? "Resolved" : "In Progress"}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-beige-600 mb-3">{request.reason}</p>
                  <div className="flex items-center gap-4 text-[11px] text-beige-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {request.contributor}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Rejected {fmtDate(request.rejectedDate)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-beige-500 mb-1">Resubmission Deadline</p>
                  <p className={cn("text-[13px] font-semibold", isOverdue ? "text-danger" : "text-brown-800")}>
                    {fmtDate(request.resubmissionDeadline)}
                  </p>
                  {isOverdue && (
                    <Badge variant="danger" size="sm" className="mt-1">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {reworkRequests.length === 0 && (
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-forest-400 mx-auto mb-3" />
            <h3 className="text-[16px] font-bold text-brown-900">No Rework Requests</h3>
            <p className="text-[13px] text-beige-500 mt-1">All deliverables have been accepted without rework.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---- TAB 5: EXCEPTIONS ---- */
function ExceptionsTab({
  project,
  projectExceptions,
  resolvedExceptions,
  setResolvedExceptions,
}: {
  project: (typeof mockProjects)[0];
  projectExceptions: Array<{ id: string; type: string; description: string; severity: string; date: string; status: string }>;
  resolvedExceptions: Set<string>;
  setResolvedExceptions: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center text-white">
            <Flag className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">{project.escalations}</p>
            <p className="text-[10px] text-beige-500 mt-0.5">Escalations</p>
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
            <p className="text-[10px] text-beige-500 mt-0.5">Open</p>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">4.2h</p>
            <p className="text-[10px] text-beige-500 mt-0.5">Avg Resolution</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {projectExceptions.map((exc) => (
          <motion.div
            key={exc.id}
            variants={scaleIn}
            className={cn(
              "rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 border-l-[4px]",
              exc.severity === "critical" ? "border-l-brown-600" : "border-l-gold-500"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    variant={exc.type === "escalation" ? "danger" : exc.type === "sla_breach" ? "brown" : "gold"}
                    size="sm"
                    dot
                  >
                    {exc.type === "escalation" ? "Escalation" : exc.type === "sla_breach" ? "SLA Breach" : "Quality Issue"}
                  </Badge>
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                      exc.severity === "critical" ? "bg-brown-100 text-brown-700" : "bg-gold-100 text-gold-700"
                    )}
                  >
                    {exc.severity}
                  </span>
                  <Badge
                    variant={resolvedExceptions.has(exc.id) ? "forest" : exc.status === "open" ? "gold" : "teal"}
                    size="sm"
                  >
                    {resolvedExceptions.has(exc.id) ? "resolved" : exc.status}
                  </Badge>
                </div>
                <p className="text-[12px] text-beige-600 leading-relaxed">{exc.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-beige-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {exc.date}
                  </p>
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
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {projectExceptions.length === 0 && (
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-forest-400 mx-auto mb-3" />
            <h3 className="text-[16px] font-bold text-brown-900">No Exceptions</h3>
            <p className="text-[13px] text-beige-500 mt-1">This project has no active exceptions or escalations.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---- TAB 6: PAYMENT RELEASE ---- */
function PaymentReleaseTab({
  paymentReleases,
  releasedPayments,
  onReleasePayment,
}: {
  paymentReleases: typeof mockPaymentReleases;
  releasedPayments: Set<string>;
  onReleasePayment: (id: string) => void;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* APG Auto-release Notice */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-gold-200/50 bg-gold-50/50 backdrop-blur-sm p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[13px] font-semibold text-gold-800">APG Auto-Release Policy</h4>
          <p className="text-[11px] text-gold-600 mt-1">
            Payments not released within 14 days of evidence approval will be automatically released by APG.
            This is a hard governance rule that cannot be disabled.
          </p>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center text-white">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">{paymentReleases.length}</p>
            <p className="text-[10px] text-beige-500 mt-0.5">Pending</p>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">{releasedPayments.size}</p>
            <p className="text-[10px] text-beige-500 mt-0.5">Released</p>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[18px] font-bold text-brown-900 leading-none">
              ${(paymentReleases.reduce((sum, p) => sum + p.amount, 0) / 1000).toFixed(1)}k
            </p>
            <p className="text-[10px] text-beige-500 mt-0.5">Total Pending</p>
          </div>
        </div>
      </motion.div>

      {/* Payment Release Table */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Contributor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Days Elapsed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentReleases.map((payment) => {
              const isReleased = releasedPayments.has(payment.id);
              const daysUntilAuto = 14 - payment.daysElapsed;
              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <p className="text-[13px] font-semibold text-brown-900">{payment.taskTitle}</p>
                    <p className="text-[10px] text-beige-400 font-mono">{payment.taskId}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] text-brown-700">{payment.contributor}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] font-bold text-brown-800">${payment.amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] text-beige-500">{fmtDate(payment.approvedAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[12px] text-brown-700">{payment.daysElapsed} days</span>
                      {!isReleased && daysUntilAuto <= 3 && daysUntilAuto > 0 && (
                        <span className="text-[10px] text-gold-600">Auto in {daysUntilAuto}d</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isReleased ? "forest" : "gold"} size="sm" dot>
                      {isReleased ? "Released" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!isReleased ? (
                      <button
                        onClick={() => onReleasePayment(payment.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white text-[10px] font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
                      >
                        <Lock className="w-3 h-3" />
                        Release (OTP)
                      </button>
                    ) : (
                      <span className="text-[10px] text-beige-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-forest-500" />
                        Completed
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  );
}

/* ---- TAB 7: TEAM SUMMARY ---- */
function TeamSummaryTab({ team }: { team: (typeof mockTeams)[0] | undefined }) {
  if (!team) {
    return (
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center">
        <Users className="w-10 h-10 text-beige-300 mx-auto mb-3" />
        <h3 className="text-[16px] font-bold text-brown-900">No Team Assigned</h3>
        <p className="text-[13px] text-beige-500 mt-1">A team will be formed once the plan is approved.</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Team Header */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MetricRing
            value={team.matchScore}
            size={64}
            strokeWidth={5}
            color={team.matchScore >= 90 ? "forest" : team.matchScore >= 80 ? "teal" : "gold"}
            label="Match"
          />
          <div>
            <h3 className="text-[16px] font-bold text-brown-900">{team.name}</h3>
            <p className="text-[11px] text-beige-500 mt-0.5">{team.totalMembers} members · Plan: {team.planId}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {team.requiredSkills.map((skill) => (
            <span key={skill} className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
              {skill}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brown-50/60 via-beige-50/60 to-forest-50/60 border border-beige-200/40 px-4 py-3"
      >
        <ShieldCheck className="w-4 h-4 text-forest-500 shrink-0" />
        <p className="text-[11px] text-beige-600">
          All contributor identities are anonymized. No real names, resumes, or public profiles are exposed. Privacy by architecture.
        </p>
      </motion.div>

      {/* Members Table */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-brown-900">{member.displayName}</p>
                        <p className="text-[10px] text-beige-400 font-mono">{member.anonymousId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill) => (
                        <span key={skill} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-beige-100 text-beige-600">
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
                            member.matchScore >= 90 ? "bg-forest-500" : member.matchScore >= 80 ? "bg-teal-500" : "bg-gold-500"
                          )}
                          style={{ width: `${member.matchScore}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-brown-800">{member.matchScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.availability === "full_time" ? "forest" : member.availability === "part_time" ? "gold" : "beige"}
                      size="sm"
                    >
                      {member.availability === "full_time" ? "Full-time" : member.availability === "part_time" ? "Part-time" : "Limited"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", tl.color)}>{tl.label}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] font-bold text-brown-800">{member.tasksCompleted}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gold-500" />
                      <span className="text-[12px] font-bold text-brown-800">{member.rating}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  );
}

/* ---- TAB 8: COMMERCIAL ---- */
function CommercialTab({
  project,
  budgetPct,
  invoices,
  uatSigned,
  onUATSignOff,
}: {
  project: (typeof mockProjects)[0];
  budgetPct: number;
  invoices: typeof mockInvoices;
  uatSigned: boolean;
  onUATSignOff: () => void;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Budget Overview */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <p className="text-[11px] text-beige-500 uppercase tracking-wider font-medium">Total Budget</p>
          <p className="text-[24px] font-bold text-brown-900 mt-1">${(project.budget / 1000).toFixed(0)}k</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <p className="text-[11px] text-beige-500 uppercase tracking-wider font-medium">Spent to Date</p>
          <p className="text-[24px] font-bold text-brown-900 mt-1">${(project.spent / 1000).toFixed(0)}k</p>
          <p className="text-[11px] text-beige-400 mt-1">{budgetPct}% of budget</p>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
          <p className="text-[11px] text-beige-500 uppercase tracking-wider font-medium">Remaining</p>
          <p className="text-[24px] font-bold text-brown-900 mt-1">
            ${((project.budget - project.spent) / 1000).toFixed(0)}k
          </p>
        </div>
      </motion.div>

      {/* Invoices */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-beige-100/80">
          <h3 className="text-[14px] font-semibold text-brown-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-500" />
            Milestone Invoices
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Milestone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>
                  <p className="text-[13px] font-semibold text-brown-900">{inv.number}</p>
                </TableCell>
                <TableCell>
                  <span className="text-[12px] text-brown-700">{inv.milestone}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[13px] font-bold text-brown-800">${(inv.amount / 1000).toFixed(0)}k</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={inv.status === "paid" ? "forest" : inv.status === "pending" ? "gold" : "beige"}
                    size="sm"
                    dot
                  >
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-beige-500">{inv.issuedDate ? fmtDate(inv.issuedDate) : "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-beige-500">{inv.paidDate ? fmtDate(inv.paidDate) : "—"}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      {/* UAT Sign-off */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-brown-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-500" />
              UAT Sign-off
            </h3>
            <p className="text-[12px] text-beige-600 mt-2 max-w-xl">
              Trigger the M3 billing milestone by signing off on User Acceptance Testing.
              This is a consequential financial action that will generate an invoice.
            </p>
            {uatSigned && (
              <div className="flex items-center gap-2 mt-3">
                <CheckCircle2 className="w-4 h-4 text-forest-500" />
                <span className="text-[12px] text-forest-700 font-medium">UAT signed off on {fmtDate(new Date().toISOString())}</span>
              </div>
            )}
          </div>
          <button
            onClick={onUATSignOff}
            disabled={uatSigned}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all",
              uatSigned
                ? "bg-beige-100 text-beige-500 cursor-not-allowed"
                : "bg-gradient-to-r from-brown-500 to-brown-600 text-white hover:from-brown-600 hover:to-brown-700 shadow-md hover:shadow-lg"
            )}
          >
            <Lock className="w-4 h-4" />
            {uatSigned ? "UAT Signed" : "Sign Off UAT (OTP)"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
