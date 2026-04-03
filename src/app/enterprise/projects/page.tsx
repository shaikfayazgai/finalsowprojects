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
import { ActionValidationModal } from "@/components/enterprise/action-validation-modal";
import { mockProjects, mockMilestones, mockDeliverables } from "@/mocks/data/enterprise-projects";
import { toast } from "@/lib/stores/toast-store";
import type { Project, ProjectHealth } from "@/types/enterprise";

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
}: {
  project: Project;
  onStatusChange: (id: string, status: ProjectHealth) => void;
  onEscalate: (id: string, reason: string) => void;
  onValidationModalOpen: (type: "hold" | "escalate", projectId: string) => void;
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
    onStatusChange(project.id, "on_track");
    toast.success("Project Resumed", `"${project.title}" is now back on track.`);
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
  onStatusChange,
  onEscalate,
  onValidationModalOpen,
}: {
  project: Project;
  onStatusChange: (id: string, status: ProjectHealth) => void;
  onEscalate: (id: string, reason: string) => void;
  onValidationModalOpen: (type: "hold" | "escalate", projectId: string) => void;
}) {
  const router = useRouter();
  const hc = healthConfig[project.health];
  const budgetPct = Math.round((project.spent / project.budget) * 100);
  const daysLeft = Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const commercialBadge = getCommercialBadge(project);
  
  // Get current milestone info
  const projectMilestones = mockMilestones.filter((m) => m.projectId === project.id);
  const currentMilestone = projectMilestones.find((m) => m.status === "in_progress") || projectMilestones[0];
  const milestoneProgress = currentMilestone?.progress || 0;
  const milestoneTasks = currentMilestone 
    ? `${currentMilestone.tasksCompleted}/${currentMilestone.tasksTotal}`
    : "0/0";

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div variants={scaleIn}>
        <div className="group relative rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-xl hover:shadow-brown-100/25 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden">
          {/* On Hold Overlay - Blurred background with centered content */}
          {project.health === "on_hold" && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-11 h-11 rounded-full border border-beige-300 flex items-center justify-center mb-3">
                <Pause className="w-4 h-4 text-beige-400" strokeWidth={1.5} />
              </div>
              <h4 className="text-[13px] font-bold text-brown-900 uppercase tracking-wide mb-1.5">
                Project On Hold
              </h4>
              <p className="text-[11px] text-beige-400 max-w-[220px] mb-4 leading-relaxed">
                Project paused pending stakeholder decision.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onStatusChange(project.id, "on_track");
                }}
                className="px-4 py-1.5 rounded-md bg-brown-600 hover:bg-brown-700 text-white text-[11px] font-medium transition-colors"
              >
                Resume Project
              </button>
            </div>
          )}
          
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <Link href={`/enterprise/projects/${project.id}`} className="flex-1 min-w-0">
              <div>
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
            </Link>
            <div className="flex items-center gap-2">
              <MetricRing
                value={project.apgScore}
                size={56}
                strokeWidth={5}
                color={hc.ring}
                label="APG"
              />
              <QuickActionsMenu
                project={project}
                onStatusChange={onStatusChange}
                onEscalate={onEscalate}
                onValidationModalOpen={onValidationModalOpen}
              />
            </div>
          </div>

          <Link href={`/enterprise/projects/${project.id}`}>
            {/* Health + Milestone Progress */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", hc.dot)} />
                  <span className="text-[11px] font-semibold text-brown-700">{hc.label}</span>
                  {/* Current Milestone Badge */}
                  {currentMilestone && (
                    <Badge variant={currentMilestone.status === "completed" ? "forest" : currentMilestone.status === "in_progress" ? "teal" : "beige"} size="sm">
                      {currentMilestone.title}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] font-mono font-bold text-brown-800">
                  {project.progress}%
                </span>
              </div>
              
              {/* Overall Progress */}
              <Progress value={project.progress} size="sm" variant={hc.progress} />
              
              {/* Milestone Progress */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-beige-500">Current Milestone Progress</span>
                <span className="font-mono text-brown-700">{milestoneProgress}%</span>
              </div>
              <Progress value={milestoneProgress} size="sm" variant="teal" />
            </div>

            {/* Task Progress (Current Milestone) */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-beige-500">Milestone Tasks</span>
              <span className="text-[11px] font-semibold text-brown-800">{milestoneTasks}</span>
            </div>

            {/* SLA + Days Remaining + Commercial Badge Row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="space-y-0.5">
                <p className="text-[9px] text-beige-400 uppercase tracking-wider font-medium">SLA</p>
                <span
                  className={cn(
                    "text-[11px] font-bold px-1.5 py-0.5 rounded-md inline-block",
                    slaColor(project.slaCompliance)
                  )}
                >
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
                <p className="text-[9px] text-beige-400 uppercase tracking-wider font-medium">Status</p>
                {commercialBadge.variant ? (
                  <Badge variant={commercialBadge.variant} size="sm">
                    {commercialBadge.label}
                  </Badge>
                ) : (
                  <span className="text-[11px] text-beige-500">—</span>
                )}
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
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                  budgetPct > 85 ? "bg-gold-50 text-gold-700" : "bg-beige-100 text-beige-600"
                )}
              >
                {budgetPct}%
              </span>
            </div>

            {/* Bottom row: Team + Tasks + SOW link */}
            <div className="mt-4 pt-3 border-t border-beige-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(project.teamSize, 4) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                      style={{
                        background: ["#A67763", "#5B9BA2", "#4D5741", "#D0B060"][i % 4],
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  {project.teamSize > 4 && (
                    <div className="w-6 h-6 rounded-full bg-beige-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-beige-600">
                      +{project.teamSize - 4}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-beige-500">{project.teamSize}</span>
              </div>

              <div className="text-[11px] text-beige-600">
                <span className="font-bold text-brown-800">{project.tasksCompleted}</span>
                <span className="text-beige-400">/{project.tasksTotal}</span>
                <span className="text-beige-400 ml-0.5">tasks</span>
              </div>
            </div>

            {/* SOW Link + Escalations */}
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  router.push(`/enterprise/sow/${project.sowId}`);
                }}
                className="text-[10px] text-teal-600 font-medium flex items-center gap-1 truncate max-w-[60%] hover:text-teal-700 hover:underline transition-colors"
              >
                <FileText className="w-3 h-3 shrink-0" />
                {project.sowTitle}
              </button>
              {project.escalations > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-gold-600" />
                  <span className="text-[10px] font-semibold text-gold-700">{project.escalations}</span>
                </span>
              )}
            </div>

            {/* Hover arrow */}
            <div className="mt-3 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
                View Details <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

/* ================================================================
   PROJECTS LIST PAGE
   ================================================================ */
type SortKey = "severity" | "title" | "progress" | "tasks" | "team" | "budget" | "sla" | "startDate";

const healthFilterOptions: { key: ProjectHealth | "all"; label: string; color: string }[] = [
  { key: "on_track", label: "On Track", color: "bg-forest-500" },
  { key: "at_risk", label: "At Risk", color: "bg-gold-500" },
  { key: "behind", label: "Behind", color: "bg-danger" },
  { key: "on_hold", label: "On Hold", color: "bg-beige-400" },
];

export default function ProjectsPage() {
  const [activeFilters, setActiveFilters] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchError, setSearchError] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("severity");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [projects, setProjects] = React.useState<Project[]>(mockProjects);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null);
  const [validationModal, setValidationModal] = React.useState<{
    isOpen: boolean;
    type: "hold" | "escalate";
    projectId: string | null;
  }>({ isOpen: false, type: "hold", projectId: null });

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
    toast.info("Project On Hold", `"${projects.find((p) => p.id === id)?.title}" has been put on hold. Reason: ${reason.substring(0, 50)}...`);
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
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Empty State */}
      {filtered.length === 0 && (
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
      {viewMode === "grid" && filtered.length > 0 && (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onStatusChange={handleStatusChange}
              onEscalate={handleEscalate}
              onValidationModalOpen={(type, projectId) => setValidationModal({ isOpen: true, type, projectId })}
            />
          ))}
        </motion.div>
      )}

      {/* Table View */}
      {viewMode === "table" && filtered.length > 0 && (
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
    </>
  );
}
