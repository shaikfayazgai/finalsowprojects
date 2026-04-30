"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FileText, Search, Clock, CheckCircle2, AlertTriangle,
  ShieldAlert, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
  Building2, Eye, ArrowUpDown, Sparkles, Upload, Lock, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { useAdminSowList } from "@/lib/hooks/use-sow-wizard";
import type { SOW, SOWApprovalStage } from "@/types/enterprise";

/* ════════════════════════ API normalisation (matches enterprise SOW repository) ════════════════════════ */

function extractList(res: unknown): Record<string, unknown>[] {
  if (!res) return [];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r)) return r as Record<string, unknown>[];
  if (Array.isArray(r.data)) return r.data as Record<string, unknown>[];
  const d = (r.data ?? r) as Record<string, unknown>;
  for (const k of ["sows", "items", "results", "documents", "list"]) {
    if (Array.isArray(d[k])) return d[k] as Record<string, unknown>[];
  }
  return [];
}

/* Derive SOW-level status from the approval pipeline (source of truth).
   Falls back to the raw list status when no pipeline data is attached. */
function deriveStatusFromStages(stages: SOWApprovalStage[], fallback: SOW["status"]): SOW["status"] {
  if (!stages || stages.length === 0) return fallback;
  if (stages.every(s => s.status === "approved")) return "approved";
  if (stages.some(s => s.status === "rejected")) return "changes_requested";
  if (stages.some(s => s.status === "in_review")) return "approval";
  /* Mix of pending + approved (some signed off) → still in approval */
  if (stages.some(s => s.status === "approved")) return "approval";
  return fallback;
}

function normaliseToSOW(item: Record<string, unknown>, mode: "ai_generated" | "manual_upload"): SOW {
  const updatedAt = String(item.updated_at ?? item.updatedAt ?? item.created_at ?? item.createdAt ?? new Date().toISOString());
  const gc = mode === "ai_generated" ? ((item.generated_content ?? {}) as Record<string, unknown>) : {};

  const title = String(gc.document_title ?? item.title ?? item.project_title ?? item.document_title ?? "Untitled SOW");

  let client = String(item.client ?? item.client_organisation ?? item.clientOrganisation ?? gc.client_name ?? gc.client ?? "");
  if (!client && mode === "ai_generated") {
    const bizOwner = String(item.business_owner_approver_id ?? "");
    if (bizOwner.includes(", ")) client = bizOwner.split(", ").pop()?.trim() ?? "";
  }

  const qm = (item.quality_metrics ?? item.qualityMetrics ?? {}) as Record<string, unknown>;
  const riskRaw = item.risk_score ?? item.riskScore ?? qm.risk_score ?? qm.riskScore;
  let riskOverall = 0;
  if (typeof riskRaw === "number") {
    riskOverall = riskRaw;
  } else if (riskRaw && typeof riskRaw === "object") {
    riskOverall = Number((riskRaw as Record<string, unknown>).overall ?? 0);
  } else if (mode === "ai_generated") {
    const conf = Number(qm.overall_confidence ?? item.confidence_score ?? item.confidenceScore ?? 0);
    riskOverall = conf > 0 ? Math.round(100 - conf) : 0;
  }

  const aiConfidence = Number(qm.overall_confidence ?? item.confidence_score ?? item.confidenceScore ?? item.ai_confidence ?? 0);

  const rawApprovalStages = ((item.approval_stages ?? item.approvalStages ?? []) as SOWApprovalStage[]);
  const rawStatus = String(item.status ?? "draft") as SOW["status"];
  const derivedStatus = deriveStatusFromStages(rawApprovalStages, rawStatus);

  return {
    id:               String(item.id ?? item._id ?? item.sow_id ?? item.wizard_id ?? ""),
    title,
    client,
    status:           derivedStatus,
    intakeMode:       mode,
    confidentiality:  (String(item.confidentiality ?? item.data_sensitivity ?? item.dataSensitivity ?? "internal") as SOW["confidentiality"]),
    dataSensitivity:  (String(item.data_sensitivity ?? item.dataSensitivity ?? "internal") as SOW["dataSensitivity"]),
    riskScore:        { overall: riskOverall, completeness: 0, confidence: 0, compliance: 0, patternMatch: 0 },
    version:          Number(item.version ?? 1),
    updatedAt,
    createdAt:        String(item.created_at ?? item.createdAt ?? updatedAt),
    estimatedBudget:  Number(item.estimated_budget ?? item.estimatedBudget ?? 0),
    estimatedDuration:String(item.estimated_duration ?? item.estimatedDuration ?? ""),
    createdBy:        String(item.created_by ?? item.createdBy ?? ""),
    approvedBy:       String(item.approved_by ?? item.approvedBy ?? ""),
    approvalStages:   rawApprovalStages,
    parsedSections:   Number(item.parsed_sections ?? item.parsedSections ?? 0),
    totalSections:    Number(item.total_sections ?? item.totalSections ?? 0),
    pages:            Number(item.pages ?? 0),
    fileSize:         String(item.file_size ?? item.fileSize ?? ""),
    aiConfidence,
    tags:             ((item.tags ?? []) as string[]),
    stakeholders:     ((item.stakeholders ?? []) as string[]),
    industry:         String(item.industry ?? gc.industry ?? ""),
  };
}

/* ════════════════════════ Helpers ════════════════════════ */

function fmtDate(iso: string) {
  const d = new Date(iso);
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
}

function riskColor(s: number): string {
  if (s <= 25) return "text-forest-700";
  if (s <= 50) return "text-gold-700";
  if (s <= 75) return "text-orange-700";
  return "text-red-700";
}

function riskBarBg(s: number): string {
  if (s <= 25) return "bg-forest-400";
  if (s <= 50) return "bg-gold-400";
  if (s <= 75) return "bg-orange-400";
  return "bg-red-500";
}

function riskLabel(s: number): string {
  if (s <= 25) return "Low";
  if (s <= 50) return "Medium";
  if (s <= 75) return "High";
  return "Critical";
}

function needsCommercialReview(sow: SOW): boolean {
  const biz = sow.approvalStages.find(s => s.stage === "business");
  const com = sow.approvalStages.find(s => s.stage === "glimmora_commercial");
  return biz?.status === "approved" && (com?.status === "in_review" || com?.status === "pending");
}

/* ════════════════════════ Status config ════════════════════════ */

const STATUS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft:             { label: "Draft",             bg: "bg-gray-100",   text: "text-gray-500",   dot: "bg-gray-400" },
  parsing:           { label: "Processing",        bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400" },
  review:            { label: "In Review",         bg: "bg-teal-50",    text: "text-teal-700",   dot: "bg-teal-400" },
  approval:          { label: "In Approval",       bg: "bg-gold-50",    text: "text-gold-700",   dot: "bg-gold-400" },
  approved:          { label: "Approved",          bg: "bg-forest-50",  text: "text-forest-700", dot: "bg-forest-400" },
  rejected:          { label: "Rejected",          bg: "bg-red-50",     text: "text-red-600",    dot: "bg-red-400" },
  changes_requested: { label: "Changes Requested", bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  archived:          { label: "Archived",          bg: "bg-gray-100",   text: "text-gray-400",   dot: "bg-gray-300" },
};

const STAGE_LABELS = ["Business", "Commercial", "Legal", "Security", "Final"];

type SortField = "title" | "client" | "updated" | "risk" | "status";
type SortDir   = "asc" | "desc";
type TabId     = "all" | "approval" | "approved" | "changes" | "draft";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "all",      label: "All SOWs",           icon: FileText },
  { id: "approval", label: "In Approval",         icon: Clock },
  { id: "approved", label: "Approved",            icon: CheckCircle2 },
  { id: "changes",  label: "Changes Requested",   icon: AlertTriangle },
  { id: "draft",    label: "Draft",               icon: FileText },
];

/* ════════════════════════ Sub-components ════════════════════════ */

function RiskBar({ score }: { score: number }) {
  if (!score) return <span className="text-[11px] text-beige-300">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-beige-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", riskBarBg(score))}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={cn("text-[11px] font-semibold tabular-nums", riskColor(score))}>
        {score}
      </span>
    </div>
  );
}

function PipelineDots({ sow }: { sow: SOW }) {
  return (
    <div className="flex items-center gap-1.5">
      {sow.approvalStages.map((stage, i) => {
        const done   = stage.status === "approved";
        const active = stage.status === "in_review";
        const rej    = stage.status === "rejected";
        return (
          <div
            key={stage.stage}
            title={STAGE_LABELS[i]}
            className={cn(
              "rounded-full transition-all",
              active || rej ? "w-2.5 h-2.5" : "w-1.5 h-1.5",
              done   ? "bg-forest-400" :
              active ? "bg-gold-500 ring-2 ring-gold-200 ring-offset-1" :
              rej    ? "bg-red-400" :
                       "bg-beige-200",
            )}
          />
        );
      })}
    </div>
  );
}

function SortHeader({
  field, label, current, dir, onSort,
}: { field: SortField; label: string; current: SortField; dir: SortDir; onSort: (f: SortField) => void }) {
  const active = current === field;
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "group flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors",
        active ? "text-brown-800" : "text-beige-400 hover:text-brown-600",
      )}
    >
      {label}
      <Icon className={cn(
        "w-2.5 h-2.5 transition-opacity",
        active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
      )} />
    </button>
  );
}

/* ════════════════════════ Skeleton ════════════════════════ */

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-beige-100 rounded" />
        <div className="h-8 w-52 bg-beige-100 rounded" />
        <div className="h-3 w-72 bg-beige-50 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-2xl bg-white border border-beige-100 p-5 space-y-3">
            <div className="w-9 h-9 bg-beige-100 rounded-xl" />
            <div className="h-6 w-12 bg-beige-100 rounded" />
            <div className="h-2.5 w-28 bg-beige-50 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white border border-beige-100 overflow-hidden">
        <div className="h-[52px] bg-beige-50/60 border-b border-beige-100" />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-5 px-5 py-[18px] border-b border-beige-50 last:border-0">
            <div className="w-8 h-8 bg-beige-100 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-44 bg-beige-100 rounded" />
              <div className="h-2.5 w-28 bg-beige-50 rounded" />
            </div>
            <div className="h-5 w-20 bg-beige-100 rounded-full ml-auto" />
            <div className="h-7 w-16 bg-beige-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════ Stat card ════════════════════════ */

function StatCard({
  label, value, sub, icon: Icon, iconBg, iconColor, highlight,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl bg-white border shadow-sm p-5",
      highlight ? "border-gold-200 ring-1 ring-gold-100" : "border-beige-100",
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        {highlight && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">
            Action needed
          </span>
        )}
      </div>
      <p className="font-heading text-[24px] font-bold text-brown-950 leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-beige-400 mt-1.5 mb-0.5">{label}</p>
      <p className="text-[11px] text-beige-400 leading-snug">{sub}</p>
    </div>
  );
}

/* ════════════════════════ Page ════════════════════════ */

export default function AdminSOWOversightPage() {
  const PAGE_SIZE = 10;
  const [mounted, setMounted]     = React.useState(false);
  const [tab, setTab]             = React.useState<TabId>("all");
  const [search, setSearch]       = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("updated");
  const [sortDir, setSortDir]     = React.useState<SortDir>("desc");
  const [page, setPage]           = React.useState(1);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // ── Session & Role Check ──
  const { data: session, status } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isSessionLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  /* ── API: all enterprise SOWs via admin endpoint ── */
  const { data: sowListRes, isLoading, isError: hasError } = useAdminSowList();

  const sows: SOW[] = React.useMemo(
    () => extractList(sowListRes).map((item) => {
      const mode = item.intake_mode === "manual_upload" || item.intakeMode === "manual_upload"
        ? "manual_upload" as const
        : "ai_generated" as const;
      return normaliseToSOW(item, mode);
    }),
    [sowListRes],
  );

  React.useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
    setPage(1);
  }

  /* ── Derived lists ── */
  const approvalList = sows.filter(s => s.status === "approval" || s.status === "review");
  const approvedList = sows.filter(s => s.status === "approved");
  const changesList  = sows.filter(s => s.status === "changes_requested");
  const draftList    = sows.filter(s => s.status === "draft" || s.status === "parsing");
  const pendingComm  = sows.filter(needsCommercialReview);

  const base = React.useMemo(() => {
    setPage(1);
    if (tab === "approval") return approvalList;
    if (tab === "approved") return approvedList;
    if (tab === "changes")  return changesList;
    if (tab === "draft")    return draftList;
    return sows;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, sows]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return base;
    return base.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.client.toLowerCase().includes(q) ||
      (s.industry ?? "").toLowerCase().includes(q),
    );
  }, [base, search]);

  const sorted = React.useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "title")   cmp = a.title.localeCompare(b.title);
    if (sortField === "client")  cmp = a.client.localeCompare(b.client);
    if (sortField === "updated") cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    if (sortField === "risk")    cmp = a.riskScore.overall - b.riskScore.overall;
    if (sortField === "status")  cmp = a.status.localeCompare(b.status);
    return sortDir === "asc" ? cmp : -cmp;
  }), [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCounts: Record<TabId, number> = {
    all: sows.length, approval: approvalList.length,
    approved: approvedList.length, changes: changesList.length, draft: draftList.length,
  };

  const avgRisk    = sows.length
    ? Math.round(sows.reduce((a, s) => a + s.riskScore.overall, 0) / sows.length) : 0;

  // Show loading skeleton during session hydration
  if (!mounted || isSessionLoading) return <PageSkeleton />;

  // Check access control — show error if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1.5">Platform Admin</p>
            <h1 className="font-heading text-[28px] font-bold text-brown-950 leading-tight">SOW Oversight</h1>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-2xl bg-red-50 border border-red-200 px-6 py-8 text-center">
          <Lock className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">Access Denied</p>
          <p className="text-red-700 text-sm mb-4">You do not have permission to access this page. Only admin users can view the SOW oversight dashboard.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Go to Home
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  // Show loading state while fetching data
  if (isLoading) return <PageSkeleton />;

  // Show error message if API failed
  if (hasError) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1.5">Platform Admin</p>
            <h1 className="font-heading text-[28px] font-bold text-brown-950 leading-tight">SOW Oversight</h1>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-amber-900 mb-2">Unable to Load SOWs</p>
          <p className="text-amber-700 text-sm mb-4">We couldn't retrieve the SOW data at this time. Please try refreshing the page or contact support if the problem continues.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1.5">
            Platform Admin
          </p>
          <h1 className="font-heading text-[28px] font-bold text-brown-950 leading-tight">
            SOW Oversight
          </h1>
          <p className="text-sm text-beige-500 mt-1">
            Full visibility across all Statements of Work on the platform
          </p>
        </div>
        {pendingComm.length > 0 && (
          <button
            onClick={() => setTab("approval")}
            className="flex items-center gap-2 bg-gold-50 hover:bg-gold-100 border border-gold-200 text-gold-700 text-[11px] font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
          >
            <Clock className="w-3.5 h-3.5" />
            {pendingComm.length} awaiting commercial sign-off
          </button>
        )}
      </motion.div>

      {/* ── Stats ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total SOWs"
          value={String(sows.length)}
          sub={`${draftList.length} in draft · ${approvalList.length} in approval`}
          icon={FileText}
          iconBg="bg-brown-50"
          iconColor="text-brown-500"
        />
        <StatCard
          label="In Approval"
          value={String(approvalList.length)}
          sub={`${pendingComm.length} need commercial sign-off`}
          icon={Clock}
          iconBg="bg-gold-50"
          iconColor="text-gold-600"
          highlight={pendingComm.length > 0}
        />
        <StatCard
          label="Approved"
          value={String(approvedList.length)}
          sub={`${approvedList.length} of ${sows.length} SOWs approved`}
          icon={CheckCircle2}
          iconBg="bg-forest-50"
          iconColor="text-forest-600"
        />
        <StatCard
          label="Avg Risk Score"
          value={`${avgRisk}/100`}
          sub={`${riskLabel(avgRisk)} risk · ${changesList.length} changes requested`}
          icon={ShieldAlert}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden"
      >

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-beige-50">

          {/* Tabs */}
          <div className="flex items-center gap-0.5 p-1 bg-beige-50 rounded-xl flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              const count  = tabCounts[id];
              return (
                <button
                  key={id}
                  onClick={() => { setTab(id); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                    active
                      ? "bg-white text-brown-950 shadow-sm"
                      : "text-beige-500 hover:text-brown-700 hover:bg-white/50",
                  )}
                >
                  <Icon className={cn("w-3 h-3 shrink-0", active ? "text-brown-600" : "text-beige-400")} />
                  <span className="hidden sm:inline">{label}</span>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-px rounded-full",
                    active
                      ? "bg-brown-100 text-brown-700"
                      : "bg-beige-200 text-beige-500",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search SOWs…"
              className="h-9 pl-9 pr-10 w-52 text-[12px] rounded-xl border border-beige-100 bg-beige-50 placeholder:text-beige-400 text-brown-800 focus:bg-white focus:border-brown-300 focus:outline-none transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-beige-300 font-mono pointer-events-none hidden sm:block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Table body */}
        {sorted.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-beige-50 bg-beige-50/40">
                  <th className="text-left px-5 py-3 w-[32%]">
                    <SortHeader field="title"   label="Statement of Work" current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[15%]">
                    <SortHeader field="client"  label="Client"            current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[15%]">
                    <SortHeader field="status"  label="Status"            current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[12%]">
                    <SortHeader field="updated" label="Updated"           current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[13%]">
                    <SortHeader field="risk"    label="Risk"              current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[8%]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Stage</span>
                  </th>
                  <th className="px-4 py-3 w-[5%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-50">
                {paginated.map((sow) => {
                  const sc       = STATUS[sow.status] ?? STATUS.draft;
                  const isComm   = needsCommercialReview(sow);
                  const allDone  = sow.approvalStages.every(s => s.status === "approved");
                  const done     = sow.approvalStages.filter(s => s.status === "approved").length;

                  return (
                    <tr
                      key={sow.id}
                      className={cn(
                        "group transition-colors",
                        isComm
                          ? "bg-gold-50/30 hover:bg-gold-50/60"
                          : "hover:bg-beige-50/60",
                      )}
                    >
                      {/* SOW title */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                            isComm
                              ? "bg-gold-50 border-gold-100"
                              : sow.status === "approved"
                              ? "bg-forest-50 border-forest-100"
                              : sow.status === "changes_requested"
                              ? "bg-amber-50 border-amber-100"
                              : "bg-beige-50 border-beige-100",
                          )}>
                            <FileText className={cn(
                              "w-3.5 h-3.5",
                              isComm              ? "text-gold-600"
                              : sow.status === "approved"          ? "text-forest-500"
                              : sow.status === "changes_requested" ? "text-amber-500"
                              : "text-beige-400",
                            )} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-[13px] font-semibold text-brown-950 leading-snug">
                                {sow.title}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border shrink-0",
                                  sow.intakeMode === "ai_generated"
                                    ? "bg-teal-50 text-teal-700 border-teal-100"
                                    : "bg-brown-50 text-brown-700 border-brown-100",
                                )}
                                title={sow.intakeMode === "ai_generated" ? "AI-generated" : "Manual upload"}
                              >
                                {sow.intakeMode === "ai_generated"
                                  ? <><Sparkles className="w-2 h-2" /> AI</>
                                  : <><Upload className="w-2 h-2" /> Manual</>}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-beige-400">
                              <span>{sow.createdBy}</span>
                              {sow.industry && (
                                <>
                                  <span className="text-beige-200">·</span>
                                  <span>{sow.industry}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-beige-300 shrink-0" />
                          <span className="text-[12px] font-medium text-brown-700">
                            {sow.client}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                          sc.bg, sc.text,
                        )}>
                          <span className={cn("w-[5px] h-[5px] rounded-full shrink-0", sc.dot)} />
                          {sc.label}
                        </span>
                        {isComm && (
                          <p className="text-[9px] text-gold-600 font-semibold mt-1 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            Needs sign-off
                          </p>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-4">
                        <p className="text-[12px] text-brown-700">{fmtDate(sow.updatedAt)}</p>
                        <p className="text-[10px] text-beige-400 mt-0.5">v{sow.version} · {sow.pages}pp</p>
                      </td>

                      {/* Risk */}
                      <td className="px-4 py-4">
                        <RiskBar score={sow.riskScore.overall} />
                        <p className="text-[10px] text-beige-400 mt-1">AI conf. {sow.aiConfidence}%</p>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-4">
                        <PipelineDots sow={sow} />
                        <p className="text-[10px] text-beige-400 mt-1.5 font-medium">
                          {allDone ? "Complete" : `${done} / ${sow.approvalStages.length}`}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-right">
                        {isComm ? (
                          <Link
                            href={`/admin/sow/${sow.id}/approve`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-3.5 py-1.5 rounded-lg bg-brown-950 hover:bg-brown-800 text-brown-50 transition-colors shadow-sm"
                          >
                            Review <ChevronRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/sow/${sow.id}/approve`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg text-brown-600 border border-beige-200 hover:bg-beige-50 hover:border-beige-300 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            {search.trim().length >= 2 ? (
              <>
                <div className="w-11 h-11 rounded-2xl bg-beige-50 border border-beige-100 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-beige-300" />
                </div>
                <p className="text-[14px] font-semibold text-brown-950 mb-1">No results</p>
                <p className="text-[12px] text-beige-400">
                  Nothing matched <span className="font-medium text-brown-700">&ldquo;{search}&rdquo;</span>
                </p>
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-5 h-5 text-forest-500" />
                </div>
                <p className="text-[14px] font-semibold text-brown-950 mb-1">Nothing here</p>
                <p className="text-[12px] text-beige-400">No SOWs in this category yet.</p>
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-beige-100 bg-beige-50/40">
            <p className="text-[11px] text-beige-500">
              Showing <span className="font-semibold text-brown-700">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)}</span> of <span className="font-semibold text-brown-700">{sorted.length}</span> SOWs
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-beige-200 text-brown-600 hover:bg-beige-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-7 h-7 text-[11px] font-semibold rounded-lg transition-colors",
                    p === page
                      ? "bg-brown-950 text-white"
                      : "text-brown-600 hover:bg-beige-100 border border-beige-200",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-beige-200 text-brown-600 hover:bg-beige-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

