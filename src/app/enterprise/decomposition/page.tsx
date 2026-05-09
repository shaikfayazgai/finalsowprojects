"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Network, Clock, Layers, ArrowRight, Boxes, Sparkles, Download,
  Milestone as MilestoneIcon, BrainCircuit, CheckCircle2, Search, X,
  ChevronRight, ChevronLeft, ArrowUp, ArrowDown, ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Skeleton } from "@/components/ui";
import type { DecompositionPlan, PlanStatus } from "@/types/enterprise";
import { useKickoff, useWithdraw } from "@/lib/hooks/use-decomposition";
import { decompositionApi } from "@/lib/api/decomposition";
import { ApiError } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { listEnterpriseDecompositionPlans } from "@/lib/api/decomposition-plans";
import {
  useRazorpayScript,
} from "@/components/enterprise/decomposition/PaymentReleaseTab";
import { MilestonePaymentModal } from "@/components/enterprise/decomposition/MilestonePaymentModal";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return <span className={cn("inline-flex items-center gap-1 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>{children}</span>;
}

const statusMap: Record<PlanStatus, { variant: string; label: string }> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Plan Review Required" },
  revision_in_progress: { variant: "teal", label: "Revision In Progress" },
  approved: { variant: "forest", label: "Plan Confirmed" },
  in_progress: { variant: "beige", label: "Plan Locked" },
  completed: { variant: "brown", label: "Completed" },
};

function formatCost(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }).format(n); }

/* ═══ Primary Action Button ═══ */
function PrimaryActionButton({ plan, onClick, onKickoff, onWithdraw }: { plan: DecompositionPlan; onClick: (e: React.MouseEvent) => void; onKickoff?: (e: React.MouseEvent) => void; onWithdraw?: (planId: string) => void }) {
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  if (plan.status === "draft") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onKickoff?.(e); }}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-teal-500 hover:bg-teal-600 transition-all shadow-sm">
        Kick-off
      </button>
    );
  }
  if (plan.status === "pending_review") {
    return (
      <button onClick={onClick}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-gold-500 hover:bg-gold-600 transition-all shadow-sm">
        View Plan
      </button>
    );
  }
  if (plan.status === "in_progress") {
    return (
      <>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWithdrawModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[380px] mx-4"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center gap-3 mb-3 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-600 text-lg">⚠️</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-gray-900">Withdraw Plan?</p>
                  <p className="text-[12px] text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-[12px] text-gray-600 mb-5 leading-relaxed">
                By clicking this your onboarding project will be off-boarded.And this will be removed from the active project.
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setShowConfirmModal(true);
                  }}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-all">
                  Yes, Withdraw
                </button>
              </div>
            </div>
          </div>
        )}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg">
            <span className="text-green-400 text-lg">✓</span>
            <span className="text-[13px] font-medium">Plan has been successfully off-boarded.</span>
          </div>
        )}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] mx-4 text-center"
              onClick={(e) => e.stopPropagation()}>
              <p className="text-[15px] font-bold text-gray-900 mb-2">Are you sure?</p>
              <p className="text-[12px] text-gray-500 mb-5">This will permanently off-board the project.</p>
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                  No
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onWithdraw?.(plan.id);
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                  }}
                  className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-all">
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setShowWithdrawModal(true); }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
          Withdraw
        </button>
      </>
    );
  }
  // covers: revision_in_progress, approved, completed
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-all">
      View Plan
    </button>
  );
}

/* ═══ Sort ═══ */

type SortField = "title" | "status" | "tasks" | "confidence" | "cost" | "updated";
type SortDir = "asc" | "desc";

const columns = [
  { field: "title" as SortField, label: "Project Name", align: "left" },
  { field: "updated" as SortField, label: "SOW Reference", align: "left" },
  { field: "cost" as SortField, label: "Action", align: "center" },
];

/* ═══ PAGE ═══ */

export default function DecompositionPlansPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [sortField, setSortField] = React.useState<SortField>("updated");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [paymentPlan, setPaymentPlan] = React.useState<DecompositionPlan | null>(null);
  const [plans, setPlans] = React.useState<DecompositionPlan[]>([]);
  const [justPaidIds, setJustPaidIds] = React.useState<Set<string>>(new Set());

  // ── API data & mutations ──
  const { data: apiPlansRes, isLoading: plansLoading, isError: plansError, error: plansErrorObj } = useQuery({
    queryKey: ["enterprise", "decomposition", "plans"],
    queryFn: listEnterpriseDecompositionPlans,
    staleTime: 30_000,
  });
  const kickoffMutation = useKickoff();
  const withdrawMutation = useWithdraw();

  // Map backend status strings to frontend PlanStatus
  const normalizeStatus = (s: string): PlanStatus => {
    const map: Record<string, PlanStatus> = {
      PLAN_REVIEW_REQUIRED: "pending_review",
      PENDING_KICKOFF: "draft",
      NEW: "draft",
      PLAN_CONFIRMED: "approved",
      PLAN_LOCKED: "in_progress",
      REVISION_IN_PROGRESS: "revision_in_progress",
      COMPLETED: "completed",
      WITHDRAWN: "completed",
    };
    return map[s] ?? (s as PlanStatus);
  };

  // Map API plans to DecompositionPlan interface
  const allPlans: DecompositionPlan[] = React.useMemo(() => {
    // Handle both: direct array OR {data: [...]} OR {data: {plans: [...]}}
    const resp = apiPlansRes as unknown;
    let rawArr: Record<string, unknown>[] | null = null;

    if (Array.isArray(resp)) {
      rawArr = resp;
    } else if (resp && typeof resp === "object") {
      const obj = resp as Record<string, unknown>;
      const inner = obj.data ?? obj;
      if (Array.isArray(inner)) {
        rawArr = inner;
      } else if (inner && typeof inner === "object") {
        const nested = (inner as Record<string, unknown>).plans ?? (inner as Record<string, unknown>).items;
        if (Array.isArray(nested)) rawArr = nested;
      }
    }

    if (!rawArr || rawArr.length === 0) {
      console.log("[DecompositionPlans] rawArr empty. Full response:", JSON.stringify(resp, null, 2));
      return [];
    }

    console.log("[DecompositionPlans] raw plan fields (first):", JSON.stringify(rawArr[0], null, 2));

    return rawArr.map((p) => ({
      id: (p.plan_id ?? p.id ?? p._id ?? "") as string,
      sowId: (p.sow_id ?? p.sowId ?? p.wizard_id ?? p.sow_reference ?? "") as string,
      title: (p.title ?? p.project_name ?? "Untitled Plan") as string,
      status: normalizeStatus((p.status ?? "draft") as string),
      createdAt: (p.created_at ?? p.createdAt ?? new Date().toISOString()) as string,
      updatedAt: (p.updated_at ?? p.updatedAt ?? new Date().toISOString()) as string,
      totalTasks: Number(p.total_tasks ?? p.totalTasks ?? p.task_count ?? 0),
      totalSubtasks: Number(p.total_subtasks ?? p.totalSubtasks ?? 0),
      totalMilestones: Number(p.total_milestones ?? p.totalMilestones ?? p.milestone_count ?? 0),
      estimatedHours: Number(p.estimated_hours ?? p.estimatedHours ?? 0),
      estimatedCost: Number(p.estimated_cost ?? p.estimatedCost ?? 0),
      complexity: (p.complexity ?? "medium") as DecompositionPlan["complexity"],
      version: Number(p.version ?? p.plan_version ?? p.sow_version ?? 1),
      teamId: (p.team_id ?? p.teamId) as string | undefined,
      projectId: (p.project_id ?? p.projectId) as string | undefined,
      aiConfidence: Number(p.ai_confidence ?? p.aiConfidence ?? 0),
      criticalPathDuration: Number(p.critical_path_duration ?? p.criticalPathDuration ?? 0),
      uniqueSkills: Number(p.unique_skills ?? p.uniqueSkills ?? 0),
      dependencyCount: Number(p.dependency_count ?? p.dependencyCount ?? 0),
    }));
  }, [apiPlansRes]);

  const handleKickoff = (plan: DecompositionPlan) => {
    kickoffMutation.mutate({ plan_id: plan.id });
    setPaymentPlan(plan);
  };

  const handleViewPlan = (plan: DecompositionPlan) => {
    decompositionApi.getPlan(plan.id).catch(() => {}).finally(() => {
      const suffix = justPaidIds.has(plan.id) ? "?ai=generating" : "";
      router.push(`/enterprise/decomposition/${plan.id}${suffix}`);
    });
  };

  const handlePaymentSuccess = (paidPlanId: string) => {
    setPlans((prev) =>
      prev.map((p) => p.id === paidPlanId ? { ...p, status: "approved" } : p)
    );
    setJustPaidIds((prev) => {
      const next = new Set(prev);
      next.add(paidPlanId);
      return next;
    });
    setPaymentPlan(null);
  };

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = React.useMemo(() => {
    let list = [...allPlans];
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.sowId.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title": cmp = a.title.localeCompare(b.title); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "tasks": cmp = a.totalTasks - b.totalTasks; break;
        case "confidence": cmp = a.aiConfidence - b.aiConfidence; break;
        case "cost": cmp = a.estimatedCost - b.estimatedCost; break;
        case "updated": cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [allPlans, statusFilter, search, sortField, sortDir]);

  const totalPlans = allPlans.length;
  const totalMilestones = allPlans.reduce((s, p) => s + p.totalMilestones, 0);
  const totalTasks = allPlans.reduce((s, p) => s + p.totalTasks, 0);
  const avgConfidence = totalPlans > 0 ? Math.round(allPlans.reduce((s, p) => s + p.aiConfidence, 0) / totalPlans) : 0;
  const totalBudget = allPlans.reduce((s, p) => s + p.estimatedCost, 0);

  const statusOptions = [
    { value: "all", label: "All Status" }, { value: "draft", label: "Draft" },
    { value: "pending_review", label: "Pending Review" }, { value: "approved", label: "Approved" },
    { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" },
  ];

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

  /* ── Loading skeleton ── */
  if (plansLoading) {
    return (
      <div className="space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* KPI row — 5 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-parchment flex items-center gap-5 px-5 py-5">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 px-6 py-3" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            {["w-28", "w-24", "w-16"].map((w, i) => (
              <Skeleton key={i} className={`h-2.5 ${w}`} />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 px-6 py-5 items-center" style={{ borderBottom: "1px solid var(--border-hair)" }}>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Service-unavailable banner (shown above empty state, not a hard block) ── */
  const isServiceDown = plansError && plansErrorObj instanceof ApiError && plansErrorObj.status >= 500;

  return (
    <>
    {paymentPlan && (
      <MilestonePaymentModal
        title={paymentPlan.title}
        budget={paymentPlan.estimatedCost}
        pendingId="m1"
        entityId={paymentPlan.id}
        onSuccess={() => handlePaymentSuccess(paymentPlan!.id)}
        onClose={() => setPaymentPlan(null)}
      />
    )}
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
        <div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Decomposition Plans</h1>
          <p className="text-[13px] text-gray-500 mt-1.5">AI-powered task decomposition from your SOW documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-500 text-[12px] font-medium hover:border-gray-300 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <Link href="/enterprise/sow/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[12px] font-semibold bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 transition-all">
            <Sparkles className="w-3.5 h-3.5" /> Upload SOW
          </Link>
        </div>
      </motion.div>

      {/* ── Service-unavailable banner ── */}
      {isServiceDown && (
        <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-700">
            The decomposition service is temporarily unavailable. Showing cached or empty data — plans will appear once the service recovers.
          </p>
        </motion.div>
      )}

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
        {[
          { label: "Total Plans", value: totalPlans, icon: Boxes, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Milestones", value: totalMilestones, icon: MilestoneIcon, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Total Tasks", value: totalTasks, icon: Layers, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Avg AI Confidence", value: `${avgConfidence}%`, icon: BrainCircuit, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Total Budget", value: formatCost(totalBudget), icon: Clock, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ TABLE CARD ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">

        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">All Decomposition Plans</span>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
          <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0", searchFocused ? "w-64" : "w-[220px]")}
            style={{
              background: searchFocused ? "white" : "var(--color-gray-50)",
              border: searchFocused ? "1px solid var(--color-brown-300)" : "1px solid var(--border-soft)",
              padding: "7px 12px",
              boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : undefined,
            }}>
            <Search className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <input type="text" placeholder="Search plans…" value={search} onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              className="border-none outline-none bg-transparent w-full text-[12.5px] text-gray-700 placeholder:text-gray-400" />
            {search && <button onClick={() => setSearch("")} className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 130 }}>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                {columns.map((col) => {
                  const active = sortField === col.field;
                  return (
                    <th key={col.field} onClick={() => handleSort(col.field)}
                      className="cursor-pointer select-none transition-colors"
                      style={{
                        padding: "11px 16px", textAlign: col.align as "left" | "center" | "right",
                        fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: active ? "var(--ink-mid)" : "var(--color-gray-400)",
                        background: "color-mix(in srgb, var(--color-gray-100) 40%, white)",
                      }}>
                      <div className="flex items-center gap-1" style={{ justifyContent: col.align === "center" ? "center" : col.align === "right" ? "flex-end" : "flex-start" }}>
                        <span>{col.label}</span>
                        <span style={{ opacity: active ? 1 : 0 }}>
                          {active && sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan) => {
                
                const sowVersion = `SOW Version V${plan.version}`;
                const sowRef = `SOW-2026-${plan.sowId.replace("sow-", "").padStart(3, "0")}`;

                return (
                  <tr key={plan.id} onClick={() => router.push(`/enterprise/decomposition/${plan.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                    style={{ borderBottom: "1px solid var(--border-hair)" }}>

                    {/* Project Name */}
                    <td style={{ padding: "13px 16px" }}>
                      <div className="text-[13px] font-medium text-gray-800">{plan.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{sowVersion}</span>
                      </div>
                    </td>

                    

                    {/* SOW Reference */}
                    <td style={{ padding: "13px 16px" }}>
                      {plan.sowId ? (
                        <Link
                          href={`/enterprise/sow/${plan.sowId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-[12px] text-brown-500 hover:text-brown-700 hover:underline transition-colors"
                        >
                          {plan.sowId}
                        </Link>
                      ) : (
                        <span className="text-[12px] text-gray-400">—</span>
                      )}
                    </td>

                    {/* Primary Action */}
                    <td style={{ padding: "13px 16px", textAlign: "center" }}>
                      <PrimaryActionButton
                        plan={plan}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPlan(plan);
                        }}
                        onKickoff={() => handleKickoff(plan)}
                        onWithdraw={(id) => withdrawMutation.mutate(id)}
                      />
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center mb-4">
                <Network className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">No plans match your filters</p>
              <p className="text-xs text-gray-500 max-w-[280px] mb-4">Try different keywords or clear filters.</p>
              <button onClick={() => { setStatusFilter("all"); setSearch(""); }}
                className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 hover:bg-brown-50 transition-all">
                <X className="w-3 h-3" /> Clear all filters
              </button>
            </div>
          )}
        </div>
      </motion.div>

    </motion.div>
    </>
  );
}