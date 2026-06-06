"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Briefcase,
  CircleDollarSign,
  Calendar,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  LayoutGrid,
  LayoutList,
  Search,
  ListChecks,
  ArrowUpDown,
  FolderOpen,
  MoreVertical,
  Pause,
  Play,
  Download,
  ShieldAlert,
  FileDown,
  X,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fadeUp, stagger } from "@/lib/utils/motion-variants";
import {
  Badge,
  Progress,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { Skeleton } from "@/components/ui";
import { ActionValidationModal } from "@/components/enterprise/action-validation-modal";
import { mockProjects as fallbackProjects, mockMilestones, mockDeliverables } from "@/mocks/data/enterprise-projects";
import { toast } from "@/lib/stores/toast-store";
import type { Project, ProjectHealth, PortfolioProject } from "@/types/enterprise";
import { usePortfolioProjects, usePortfolioSummaryMetrics, useHoldProject, useResumeProject, useUpdateProjectStatus } from "@/lib/hooks/use-portfolio";
import {
  useRazorpayScript,
} from "@/components/enterprise/decomposition/PaymentReleaseTab";
import { useProjectHoldStore } from "@/lib/stores/project-hold-store";
import { MilestonePaymentModal } from "@/components/enterprise/decomposition/MilestonePaymentModal";

/* -- Health config -- */
const healthConfig: Record<
  ProjectHealth,
  {
    label: string;
    dot: string;
    badge: "forest" | "gold" | "danger" | "teal" | "brown";
    progress: "forest" | "gold" | "brown" | "teal";
    ring: "forest" | "gold" | "brown" | "teal";
    severity: number;
  }
> = {
  on_track: {
    label: "On Track",
    dot: "bg-forest-500",
    badge: "forest",
    progress: "forest",
    ring: "forest",
    severity: 4,
  },
  at_risk: {
    label: "At Risk",
    dot: "bg-gold-500",
    badge: "gold",
    progress: "gold",
    ring: "gold",
    severity: 2,
  },
  behind: {
    label: "Behind",
    dot: "bg-[var(--danger)]",
    badge: "danger",
    progress: "brown",
    ring: "brown",
    severity: 1,
  },
  on_hold: {
    label: "On Hold",
    dot: "bg-beige-400",
    badge: "brown",
    progress: "brown",
    ring: "brown",
    severity: 3,
  },
  escalated: {
    label: "Escalated",
    dot: "bg-brown-600",
    badge: "danger",
    progress: "brown",
    ring: "brown",
    severity: 0,
  },
  completed: {
    label: "Completed",
    dot: "bg-teal-500",
    badge: "teal",
    progress: "teal",
    ring: "teal",
    severity: 5,
  },
};

/* -- Filter tabs -- */
const filterTabs: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "escalated", label: "Escalated" },
  { key: "behind", label: "Behind" },
  { key: "at_risk", label: "At Risk" },
  { key: "on_hold", label: "On Hold" },
  { key: "on_track", label: "On Track" },
  { key: "completed", label: "Completed" },
];

/* -- SLA color helper -- */
function slaColor(sla: number) {
  if (sla >= 95) return "text-forest-700 bg-forest-50";
  if (sla >= 85) return "text-gold-700 bg-gold-50";
  return "text-brown-700 bg-brown-50";
}

/* -- Format date helper -- */
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

/* -- Quick Actions Menu -- */
function QuickActionsMenu({
  project,
  onStatusChange,
  onEscalate,
  onValidationModalOpen,
  onResume,
}: {
  project: Project;
  onStatusChange: (id: string, status: ProjectHealth) => void;
  onEscalate: (id: string, reason: string) => void;
  onValidationModalOpen: (type: "hold" | "escalate", projectId: string) => void;
  onResume?: (project: Project) => void;
}) {
  const handleDownloadReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toast.success("Report Downloaded", `Project report for "${project.title}" has been downloaded.`);
  };

  const handlePutOnHold = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onValidationModalOpen("hold", project.id);
  };

  const handleResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onResume) { onResume(project); } else {
      onStatusChange(project.id, "on_track");
      toast.success("Project Resumed", `"${project.title}" is now back on track.`);
    }
  };

  const handleEscalate = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onValidationModalOpen("escalate", project.id);
  };

  const isOnHold = project.health === "on_hold";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg hover:bg-beige-100 transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-beige-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isOnHold ? (
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
        <DropdownMenuItem onClick={handleEscalate} className="gap-2">
          <ShieldAlert className="w-4 h-4 text-danger" />
          <span className="text-danger">Raise Escalation</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDownloadReport} className="gap-2">
          <Download className="w-4 h-4 text-teal-600" />
          <span>Download Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Resume Confirm Modal (for manual holds) ── */
function ResumeConfirmModal({
  project,
  holdNote,
  onConfirm,
  onClose,
}: {
  project: Project;
  holdNote?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,15,0.50)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-3xl overflow-hidden bg-white"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)" }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-forest-400 to-forest-600" />

        <div className="px-6 pt-5 pb-4 flex items-start justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-forest-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-900">Resume Project</p>
              <p className="text-[11.5px] text-gray-400 mt-0.5 truncate max-w-[260px]">{project.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            Resuming this project will reactivate all contributor tasks and restore normal project operations.
          </p>
          {holdNote && (
            <div className="rounded-xl bg-beige-50 border border-beige-200 px-4 py-3">
              <p className="text-[10px] font-semibold text-beige-500 uppercase tracking-widest mb-1">Hold Reason</p>
              <p className="text-[12px] text-beige-700 leading-relaxed">{holdNote}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[12.5px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-forest-500 to-forest-700 hover:from-forest-600 hover:to-forest-800 text-white text-[12.5px] font-semibold transition-all shadow-sm"
          >
            Confirm Resume
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* -- Hold Overlay component (reads hold reason from store) -- */
function HoldOverlay({
  project,
  onResume,
  onStatusChange,
}: {
  project: Project;
  onResume?: (project: Project) => void;
  onStatusChange: (id: string, status: ProjectHealth) => void;
}) {
  const { heldProjects } = useProjectHoldStore();
  const holdInfo = heldProjects[project.id];
  const isPaymentHold = holdInfo?.reason === "payment_overdue";

  return (
    <div className="absolute inset-0 rounded-2xl bg-white/75 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full border-2 flex items-center justify-center",
        isPaymentHold ? "border-gold-300 bg-gold-50" : "border-beige-300 bg-beige-50",
      )}>
        {isPaymentHold
          ? <CreditCard className="w-4 h-4 text-gold-500" strokeWidth={1.5} />
          : <Pause className="w-4 h-4 text-beige-400" strokeWidth={1.5} />}
      </div>

      {/* Label */}
      <div>
        <h4 className="text-[12px] font-bold text-brown-900 uppercase tracking-widest">
          Project On Hold
        </h4>
        <p className="text-[10.5px] text-beige-500 mt-1 leading-relaxed max-w-[200px]">
          {isPaymentHold
            ? "M2 payment overdue. Activities suspended until payment is released."
            : "Paused pending stakeholder decision."}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onResume?.(project); }}
        className={cn(
          "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-colors mt-1",
          isPaymentHold
            ? "bg-gold-500 hover:bg-gold-600"
            : "bg-forest-500 hover:bg-forest-600",
        )}
      >
        {isPaymentHold
          ? <><CreditCard className="w-3 h-3" /> Release Payment</>
          : <><Play className="w-3 h-3" /> Resume Project</>}
      </button>
    </div>
  );
}

/* -- Days remaining color logic -- */
function getDaysRemainingColor(days: number): string {
  if (days < 7) return "text-danger bg-danger/10";
  if (days < 30) return "text-gold-700 bg-gold-50";
  return "text-forest-700 bg-forest-50";
}

/* -- Commercial badge logic: OVERDUE > DUE > PAID -- */
function getCommercialBadge(project: Project): { label: string; variant: "danger" | "gold" | "forest" | null } {
  const milestones = mockMilestones.filter((m) => m.projectId === project.id);
  const hasOverdue = milestones.some((m) => m.status === "overdue");
  const hasDueSoon = milestones.some((m) => {
    if (m.status !== "in_progress") return false;
    const dueDate = new Date(m.dueDate);
    const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });
  
  if (hasOverdue) return { label: "OVERDUE", variant: "danger" };
  if (hasDueSoon) return { label: "DUE", variant: "gold" };
  // Check if all invoices paid
  const invoices = mockDeliverables.filter((d) => d.projectId === project.id && d.status === "approved");
  if (invoices.length > 0 && project.progress === 100) return { label: "PAID", variant: "forest" };
  return { label: "", variant: null };
}

/* -- Project Card (Grid View) -- */
function ProjectCard({
  project,
  index,
  onStatusChange,
  onEscalate,
  onValidationModalOpen,
  onResume,
}: {
  project: Project;
  index: number;
  onStatusChange: (id: string, status: ProjectHealth) => void;
  onEscalate: (id: string, reason: string) => void;
  onValidationModalOpen: (type: "hold" | "escalate", projectId: string) => void;
  onResume?: (project: Project) => void;
}) {
  const router = useRouter();
  const { heldProjects } = useProjectHoldStore();
  const hc = healthConfig[project.health];
  const budgetPct = Math.round((project.spent / project.budget) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const commercialBadge = getCommercialBadge(project);
  const isManualHold = project.health === "on_hold" && heldProjects[project.id]?.reason === "manual";

  const projectMilestones = mockMilestones.filter((m) => m.projectId === project.id);
  const currentMilestone = projectMilestones.find((m) => m.status === "in_progress") || projectMilestones[0];
  const milestoneProgress = currentMilestone?.progress ?? 0;
  const milestoneTasks = currentMilestone
    ? `${currentMilestone.tasksCompleted}/${currentMilestone.tasksTotal}`
    : "0/0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
    >
      <TooltipProvider delayDuration={200}>
        <div
          className="group relative rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl hover:shadow-brown-100/25 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden"
          onClick={() => router.push(`/enterprise/projects/${project.id}`)}
        >
          {/* On Hold Overlay */}
          {project.health === "on_hold" && (
            <HoldOverlay project={project} onResume={onResume} onStatusChange={onStatusChange} />
          )}

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="text-[14px] font-bold text-brown-900 truncate group-hover:text-brown-700 transition-colors">
                      {project.title}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>{project.title}</p>
                  </TooltipContent>
                </Tooltip>
                <p className="text-[11px] text-beige-500 mt-0.5">{project.client}</p>
              </div>
              <div
                className={cn("flex items-center gap-2 shrink-0", isManualHold ? "relative z-20" : "")}
                onClick={(e) => e.stopPropagation()}
              >
                <MetricRing value={project.apgScore} size={48} strokeWidth={4.5} color={hc.ring} label="APG" />
                <QuickActionsMenu
                  project={project}
                  onStatusChange={onStatusChange}
                  onEscalate={onEscalate}
                  onValidationModalOpen={onValidationModalOpen}
                  onResume={onResume}
                />
              </div>
            </div>

            {/* Health + Overall Progress */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", hc.dot)} />
                  <span className="text-[11px] font-semibold text-brown-700">{hc.label}</span>
                  {currentMilestone && (
                    <Badge
                      variant={currentMilestone.status === "completed" ? "forest" : currentMilestone.status === "in_progress" ? "teal" : "beige"}
                      size="sm"
                    >
                      {currentMilestone.title}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] font-mono font-bold text-brown-800">{project.progress}%</span>
              </div>
              <Progress value={project.progress} size="sm" variant={hc.progress} />
            </div>

            {/* Milestone Progress */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-beige-500">Milestone Progress</span>
                <span className="font-mono text-brown-700">{milestoneProgress}%</span>
              </div>
              <Progress value={milestoneProgress} size="sm" variant="teal" />
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="space-y-0.5">
                <p className="text-[9px] text-beige-400 uppercase tracking-wider font-medium">SLA</p>
                <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-md inline-block", slaColor(project.slaCompliance))}>
                  {project.slaCompliance}%
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-beige-400 uppercase tracking-wider font-medium">Days Left</p>
                <span className={cn("text-[11px] font-bold px-1.5 py-0.5 rounded-md inline-block", getDaysRemainingColor(daysLeft))}>
                  {daysLeft}d
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-beige-400 uppercase tracking-wider font-medium">Tasks</p>
                <span className="text-[11px] font-bold text-brown-800">
                  {project.tasksCompleted}
                  <span className="text-beige-400 font-normal">/{project.tasksTotal}</span>
                </span>
              </div>
            </div>

            {/* Budget */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CircleDollarSign className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-600">
                  ${(project.spent / 1000).toFixed(0)}k
                  <span className="text-beige-400"> / ${(project.budget / 1000).toFixed(0)}k</span>
                </span>
              </div>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md", budgetPct > 85 ? "bg-gold-50 text-gold-700" : "bg-beige-100 text-beige-600")}>
                {budgetPct}%
              </span>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-beige-100/80 flex items-center justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/enterprise/sow/${project.sowId}`); }}
                className="text-[10px] text-teal-600 font-medium flex items-center gap-1 truncate max-w-[60%] hover:text-teal-700 hover:underline transition-colors"
              >
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{project.sowTitle}</span>
              </button>
              <div className="flex items-center gap-2">
                {project.escalations > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-gold-600" />
                    <span className="text-[10px] font-semibold text-gold-700">{project.escalations}</span>
                  </span>
                )}
                {commercialBadge.variant && (
                  <Badge variant={commercialBadge.variant} size="sm">{commercialBadge.label}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}

/* ================================================================
   PROJECTS LIST PAGE
   ================================================================ */
type SortKey = "severity" | "title" | "progress" | "tasks" | "team" | "budget" | "sla" | "startDate";

const healthFilterOptions: { key: ProjectHealth | "all"; label: string; color: string }[] = [
  { key: "on_track",  label: "On Track",  color: "bg-forest-500" },
  { key: "at_risk",   label: "At Risk",   color: "bg-gold-500" },
  { key: "behind",    label: "Behind",    color: "bg-danger" },
  { key: "on_hold",   label: "On Hold",   color: "bg-beige-400" },
  { key: "escalated", label: "Escalated", color: "bg-brown-600" },
  { key: "completed", label: "Completed", color: "bg-teal-500" },
];

/* -- Map API portfolio project to local Project shape -- */
function mapApiToProject(api: PortfolioProject): Project {
  // Try to find enrichment from fallback mock data
  const mock = fallbackProjects.find((m) => m.id === api.id);

  // Map API health string to ProjectHealth type
  const healthMap: Record<string, ProjectHealth> = {
    OK: "on_track",
    ON_TRACK: "on_track",
    AT_RISK: "at_risk",
    BEHIND: "behind",
    ON_HOLD: "on_hold",
    ESCALATED: "escalated",
    COMPLETED: "completed",
  };
  const health: ProjectHealth =
    healthMap[api.health?.toUpperCase()] ??
    (api.status === "completed" ? "completed" : "on_track");

  return {
    id: api.id,
    planId: mock?.planId ?? "",
    sowId: mock?.sowId ?? "",
    teamId: mock?.teamId ?? "",
    title: api.name,
    client: mock?.client ?? api.summary ?? "—",
    health,
    progress: api.completion_pct,
    startDate: mock?.startDate ?? api.updated_at,
    endDate: mock?.endDate ?? api.updated_at,
    budget: mock?.budget ?? 0,
    spent: mock?.spent ?? 0,
    teamSize: mock?.teamSize ?? 0,
    milestones: mock?.milestones ?? [],
    tasksTotal: mock?.tasksTotal ?? 0,
    tasksCompleted: mock?.tasksCompleted ?? 0,
    apgScore: mock?.apgScore ?? 0,
    escalations: mock?.escalations ?? 0,
    slaCompliance: mock?.slaCompliance ?? 100,
    sowTitle: mock?.sowTitle ?? api.name,
  };
}

export default function ProjectsPage() {
  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchError, setSearchError] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("severity");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null);

  /* Fetch from real API via TanStack Query */
  const { data: portfolioData, isLoading, isError } = usePortfolioProjects();
  const { data: metricsData } = usePortfolioSummaryMetrics();

  /* Mutations for project actions */
  const holdMutation = useHoldProject();
  const resumeMutation = useResumeProject();
  const statusMutation = useUpdateProjectStatus();

  /* Map API data → Project[], fallback to mock if API fails */
  const apiProjects = React.useMemo(() => {
    if (portfolioData?.projects) {
      return portfolioData.projects.map(mapApiToProject);
    }
    return fallbackProjects;
  }, [portfolioData]);

  const [projects, setProjects] = React.useState<Project[]>(fallbackProjects);

  /* Sync API data into local state when it arrives */
  React.useEffect(() => {
    if (apiProjects.length > 0) {
      setProjects(apiProjects);
    }
  }, [apiProjects]);
  const [validationModal, setValidationModal] = React.useState<{
    isOpen: boolean;
    type: "hold" | "escalate";
    projectId: string | null;
  }>({ isOpen: false, type: "hold", projectId: null });

  /* Payment + Hold store */
  const { heldProjects, holdProject: storeHoldProject, resumeProject: storeResumeProject } = useProjectHoldStore();
  const [resumePaymentProject, setResumePaymentProject]   = React.useState<Project | null>(null);
  const [resumeConfirmProject, setResumeConfirmProject]   = React.useState<Project | null>(null);

  const handleResumeClick = React.useCallback((project: Project) => {
    const reason = heldProjects[project.id]?.reason;
    if (reason === "payment_overdue") {
      setResumePaymentProject(project);
    } else {
      setResumeConfirmProject(project);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldProjects]);

  /* Seed demo holds on first load: proj-006 = automatic payment hold, proj-004 = manual hold */
  React.useEffect(() => {
    if (!heldProjects["proj-006"]) storeHoldProject("proj-006", "payment_overdue");
    if (!heldProjects["proj-004"]) storeHoldProject("proj-004", "manual", "Pending stakeholder approval on scope change.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sync hold store → local project health (e.g. auto-hold from decomposition page) */
  React.useEffect(() => {
    setProjects((prev) =>
      prev.map((p) => {
        if (heldProjects[p.id] && p.health !== "on_hold") return { ...p, health: "on_hold" };
        return p;
      })
    );
  }, [heldProjects]);

  /* Rehydrate persisted store after mount to avoid SSR/client mismatch */
  React.useEffect(() => {
    useProjectHoldStore.persist.rehydrate();
  }, []);

  /* Auto-refresh every 60 seconds */
  React.useEffect(() => {
    setLastRefreshed(new Date());
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  /* Handle status change from quick actions */
  const handleStatusChange = React.useCallback((id: string, status: ProjectHealth) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, health: status } : p))
    );
  }, []);

  /* Handle escalation with reason */
  const handleEscalate = React.useCallback((id: string, reason: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, health: "escalated", escalations: p.escalations + 1 } : p
      )
    );
    toast.error("Project Escalated", `"${projects.find((p) => p.id === id)?.title}" has been escalated. Reason: ${reason.substring(0, 50)}...`);
  }, [projects]);

  /* Handle put on hold with reason */
  const handlePutOnHold = React.useCallback((id: string, reason: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, health: "on_hold" } : p))
    );
    storeHoldProject(id, "manual", reason);
    // Call real API (fire-and-forget, UI already updated optimistically)
    holdMutation.mutate(id);
    const title = projects.find((p) => p.id === id)?.title ?? "";
    toast.info("Project On Hold", `"${title}" has been put on hold. All contributor tasks for this project are now paused.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  /* Toggle health filter (multi-select) */
  const toggleHealthFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /* Handle search with min 3 chars validation */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0 && value.length < 3) {
      setSearchError("Enter at least 3 characters");
    } else {
      setSearchError("");
    }
  };

  /* Export functionality */
  const handleExport = (format: "pdf" | "csv") => {
    toast.success(`Export Started`, `Projects are being exported as ${format.toUpperCase()}. Download will begin shortly.`);
    // In a real app, this would trigger the actual export
  };

  /* Filter by status + search */
  const filtered = React.useMemo(() => {
    let results = projects;

    // Apply health filters (multi-select)
    if (activeFilters.size > 0) {
      results = results.filter((p) => activeFilters.has(p.health));
    }

    // Apply search (min 3 chars)
    if (searchQuery.trim().length >= 3) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.sowTitle.toLowerCase().includes(q)
      );
    }

    return results;
  }, [activeFilters, searchQuery, projects]);

  /* Sort - by default sort by health severity (most critical first) */
  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "severity":
          return dir * (healthConfig[a.health].severity - healthConfig[b.health].severity);
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "progress":
          return dir * (a.progress - b.progress);
        case "tasks":
          return dir * (a.tasksCompleted - b.tasksCompleted);
        case "team":
          return dir * (a.teamSize - b.teamSize);
        case "budget":
          return dir * (a.budget - b.budget);
        case "sla":
          return dir * (a.slaCompliance - b.slaCompliance);
        case "startDate":
          return dir * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  /* Summary stats - clickable to apply filters */
  const summaryStats = [
    {
      key: "on_track",
      label: "On Track",
      value: projects.filter((p) => p.health === "on_track").length,
      color: "bg-forest-500",
      textColor: "text-forest-700",
      bgColor: "bg-forest-50",
    },
    {
      key: "at_risk",
      label: "At Risk",
      value: projects.filter((p) => p.health === "at_risk").length,
      color: "bg-gold-500",
      textColor: "text-gold-700",
      bgColor: "bg-gold-50",
    },
    {
      key: "behind",
      label: "Behind",
      value: projects.filter((p) => p.health === "behind").length,
      color: "bg-danger",
      textColor: "text-danger",
      bgColor: "bg-danger/10",
    },
    {
      key: "on_hold",
      label: "On Hold",
      value: projects.filter((p) => p.health === "on_hold").length,
      color: "bg-beige-400",
      textColor: "text-beige-600",
      bgColor: "bg-beige-100",
    },
    {
      key: "escalated",
      label: "Escalated",
      value: projects.filter((p) => p.health === "escalated").length,
      color: "bg-brown-600",
      textColor: "text-brown-700",
      bgColor: "bg-brown-50",
    },
    {
      key: "completed",
      label: "Completed",
      value: projects.filter((p) => p.health === "completed").length,
      color: "bg-teal-500",
      textColor: "text-teal-700",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">Project Portfolio</h1>
            <p className="text-[13px] text-beige-500 mt-1">
              Monitor active projects, track milestones, and manage delivery outcomes.
              {lastRefreshed && (
                <span className="ml-2 text-[11px] text-beige-400">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </p>
            {metricsData && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] font-medium text-brown-700 bg-brown-50 px-2 py-0.5 rounded-md">
                  {metricsData.total_projects} Total
                </span>
                <span className="text-[11px] font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
                  {metricsData.active} Active
                </span>
                <span className="text-[11px] font-medium text-beige-600 bg-beige-100 px-2 py-0.5 rounded-md">
                  {metricsData.draft} Draft
                </span>
                <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  {metricsData.archived} Archived
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-beige-200 bg-white/60 hover:bg-white/80 text-brown-700 text-[12px] font-semibold transition-all">
                  <FileDown className="w-3.5 h-3.5" />
                  Export
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2">
                  <FileText className="w-4 h-4 text-danger" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
                  <FileDown className="w-4 h-4 text-forest-500" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-beige-200/60 bg-white/60 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-brown-100 text-brown-700" : "text-beige-400 hover:text-brown-600"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "table" ? "bg-brown-100 text-brown-700" : "text-beige-400 hover:text-brown-600"
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>
            <Link
              href="/enterprise/sow/intake"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg hover:shadow-brown-500/25 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New SOW
            </Link>
          </div>
        </motion.div>

        {/* Summary Stats - Clickable to apply filters */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {summaryStats.map((stat) => (
            <button
              key={stat.key}
              onClick={() => toggleHealthFilter(stat.key)}
              className={cn(
                "rounded-2xl border p-4 flex items-center gap-3 text-left transition-all",
                activeFilters.has(stat.key)
                  ? `border-transparent ring-2 ring-offset-1 ring-${stat.color.split("-")[1]}-500 ${stat.bgColor}`
                  : "border-beige-200/50 bg-white/70 backdrop-blur-sm hover:bg-white/90"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full shrink-0", stat.color)} />
              <div>
                <p className="text-[20px] font-bold text-brown-900 tracking-tight leading-none">{stat.value}</p>
                <p className={cn("text-[10px] mt-0.5 font-medium", stat.textColor)}>{stat.label}</p>
              </div>
              {activeFilters.has(stat.key) && (
                <X className="w-4 h-4 text-beige-400 ml-auto" />
              )}
            </button>
          ))}
        </motion.div>

        {/* Search + Multi-Select Health Filters */}
        <motion.div variants={fadeUp} className="space-y-3">
          {/* Search bar with validation */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects by name, client, or SOW (min 3 chars)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={cn(
                "w-full h-10 rounded-xl bg-white/60 border pl-10 pr-4 text-[13px] text-brown-800 placeholder:text-beige-400 transition-all focus:outline-none focus:ring-2 focus:bg-white/80",
                searchError
                  ? "border-danger focus:ring-danger/20"
                  : "border-beige-200/60 focus:ring-brown-200/40 focus:border-brown-200/60"
              )}
            />
            {searchError && (
              <p className="absolute left-10 -bottom-5 text-[11px] text-danger">{searchError}</p>
            )}
          </div>

          {/* Multi-Select Health Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-beige-500 mr-1">Filter by health:</span>
            {healthFilterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => toggleHealthFilter(option.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                  activeFilters.has(option.key)
                    ? `bg-white border-transparent shadow-sm ring-1 ring-${option.color.split("-")[1]}-500`
                    : "bg-white/60 border-beige-200 text-beige-600 hover:bg-white"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", option.color)} />
                {option.label}
                {activeFilters.has(option.key) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </button>
            ))}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="text-[11px] text-teal-600 hover:text-teal-700 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </motion.div>

      {/* Loading Skeleton */}
      {isLoading && (
        <>
          {/* Summary stats skeleton — 6 cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-4 flex items-center gap-3">
                <Skeleton className="w-3 h-3 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
            ))}
          </div>

          {/* Search bar skeleton */}
          <Skeleton className="h-10 w-full rounded-xl" />

          {/* Project cards grid skeleton — 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-5 space-y-4">
                {/* Header: title + ring */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                </div>
                {/* Health + progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                {/* Milestone progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-2.5 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-2 w-8" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
                {/* Budget */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-10 rounded-md" />
                </div>
                {/* Footer */}
                <div className="pt-3 border-t border-beige-100/80 flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* API Error State */}
      {isError && !isLoading && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-gold-200/60 bg-gold-50/50 backdrop-blur-sm p-6 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-gold-600 shrink-0" />
          <p className="text-[13px] text-gold-800">
            Could not load projects from the server. Showing cached data.
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mb-4">
            <FolderOpen className="w-7 h-7 text-beige-400" />
          </div>
          <h3 className="text-[15px] font-bold text-brown-800">No projects found</h3>
          <p className="text-[13px] text-beige-500 mt-1 max-w-sm">
            {searchQuery.trim()
              ? `No projects match "${searchQuery}". Try adjusting your search or filters.`
              : "No projects in this category. Start by uploading a SOW to create your first project."}
          </p>
          {!searchQuery.trim() && (
            <Link
              href="/enterprise/sow/intake"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New SOW
            </Link>
          )}
        </motion.div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {sorted.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onStatusChange={handleStatusChange}
              onEscalate={handleEscalate}
              onValidationModalOpen={(type, projectId) => setValidationModal({ isOpen: true, type, projectId })}
              onResume={handleResumeClick}
            />
          ))}
        </div>
      )}

      {/* Table View */}
      {!isLoading && viewMode === "table" && filtered.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                {(
                  [
                    ["title", "Project"],
                    ["severity", "Health"],
                    ["progress", "Progress"],
                    ["tasks", "Tasks"],
                    ["team", "Team"],
                    ["budget", "Budget"],
                    ["sla", "SLA"],
                    ["startDate", "Dates"],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <TableHead key={key}>
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1 hover:text-brown-700 transition-colors group"
                    >
                      {label}
                      <ArrowUpDown
                        className={cn(
                          "w-3 h-3 transition-colors",
                          sortKey === key ? "text-brown-600" : "text-beige-300 group-hover:text-beige-500"
                        )}
                      />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((project) => {
                const hc = healthConfig[project.health];
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link href={`/enterprise/projects/${project.id}`} className="group">
                        <p className="text-[13px] font-bold text-brown-900 group-hover:text-teal-700 transition-colors">
                          {project.title}
                        </p>
                        <p className="text-[11px] text-beige-500">{project.client}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hc.badge} size="sm" dot>
                        {hc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Progress value={project.progress} size="sm" variant={hc.progress} className="flex-1" />
                        <span className="text-[11px] font-mono font-bold text-brown-800 w-8 text-right">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-brown-800">
                        <span className="font-bold">{project.tasksCompleted}</span>
                        <span className="text-beige-400">/{project.tasksTotal}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-beige-400" />
                        <span className="text-[12px] font-semibold text-brown-800">{project.teamSize}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[12px] text-brown-800">${(project.budget / 1000).toFixed(0)}k</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-md inline-block",
                          slaColor(project.slaCompliance)
                        )}
                      >
                        {project.slaCompliance}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] text-beige-600 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-beige-400" />
                          {fmtDate(project.startDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-beige-400" />
                          {fmtDate(project.endDate)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <QuickActionsMenu
                        project={project}
                        onStatusChange={handleStatusChange}
                        onEscalate={handleEscalate}
                        onValidationModalOpen={(type, projectId) => setValidationModal({ isOpen: true, type, projectId })}
                        onResume={handleResumeClick}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}
      </motion.div>

      {/* Validation Modal */}
      <ActionValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, type: "hold", projectId: null })}
        onConfirm={(reason) => {
          if (validationModal.projectId) {
            if (validationModal.type === "hold") {
              handlePutOnHold(validationModal.projectId, reason);
            } else {
              handleEscalate(validationModal.projectId, reason);
            }
          }
        }}
        type={validationModal.type}
        projectTitle={projects.find((p) => p.id === validationModal.projectId)?.title || ""}
      />

      {/* Resume Confirm Modal (manual hold) */}
      {resumeConfirmProject && (
        <ResumeConfirmModal
          project={resumeConfirmProject}
          holdNote={heldProjects[resumeConfirmProject.id]?.note}
          onConfirm={() => {
            handleStatusChange(resumeConfirmProject.id, "on_track");
            storeResumeProject(resumeConfirmProject.id);
            resumeMutation.mutate(resumeConfirmProject.id);
            toast.success("Project Resumed", `"${resumeConfirmProject.title}" is now back on track.`);
            setResumeConfirmProject(null);
          }}
          onClose={() => setResumeConfirmProject(null)}
        />
      )}

      {/* Milestone Payment Modal (payment overdue hold) */}
      {resumePaymentProject && (
        <MilestonePaymentModal
          title={resumePaymentProject.title}
          budget={resumePaymentProject.budget}
          pendingId="m2"
          entityId={resumePaymentProject.id}
          onSuccess={() => {
            handleStatusChange(resumePaymentProject.id, "on_track");
            storeResumeProject(resumePaymentProject.id);
            resumeMutation.mutate(resumePaymentProject.id);
            toast.success("Payment Confirmed & Project Resumed", `"${resumePaymentProject.title}" is back on track. M2 released.`);
            setResumePaymentProject(null);
          }}
          onClose={() => setResumePaymentProject(null)}
        />
      )}

    </>
  );
}
