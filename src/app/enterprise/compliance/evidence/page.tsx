"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileStack,
  Search,
  Download,
  Calendar,
  User2,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  X,
  ArrowLeft,
  ExternalLink,
  PackageOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";
import {
  mockDeliverables,
  mockProjects,
  mockMilestones,
} from "@/mocks/data/enterprise-projects";

/* ── Status config ── */
const statusConfig: Record<
  string,
  { variant: "gold" | "forest" | "danger" | "brown"; label: string; icon: React.ElementType }
> = {
  pending: { variant: "gold", label: "Pending Review", icon: Clock },
  approved: { variant: "forest", label: "Approved", icon: CheckCircle2 },
  rework: { variant: "brown", label: "Rework", icon: RotateCcw },
  escalated: { variant: "danger", label: "Escalated", icon: AlertTriangle },
};

type StatusKey = "pending" | "approved" | "rework" | "escalated";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getProjectTitle(pid: string) {
  return mockProjects.find((p) => p.id === pid)?.title ?? pid;
}

function getMilestoneTitle(mid: string) {
  return mockMilestones.find((m) => m.id === mid)?.title ?? mid;
}

/* ── Page ── */
export default function EvidencePacksPage() {
  /* Filters — FSD §9.1 */
  const [projectFilter, setProjectFilter] = React.useState("all");
  const [milestoneFilter, setMilestoneFilter] = React.useState("all");
  const [statusFilters, setStatusFilters] = React.useState<Set<StatusKey>>(new Set());
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  /* Unique filter options */
  const projectOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    mockDeliverables.forEach((d) => map.set(d.projectId, getProjectTitle(d.projectId)));
    return Array.from(map.entries());
  }, []);

  const milestoneOptions = React.useMemo(() => {
    let ms = mockMilestones;
    if (projectFilter !== "all") ms = ms.filter((m) => m.projectId === projectFilter);
    return ms.map((m) => ({ id: m.id, title: m.title }));
  }, [projectFilter]);

  /* Toggle status */
  const toggleStatus = (s: StatusKey) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  /* Filtered deliverables */
  const filtered = React.useMemo(() => {
    let res = [...mockDeliverables];
    if (projectFilter !== "all") res = res.filter((d) => d.projectId === projectFilter);
    if (milestoneFilter !== "all") res = res.filter((d) => d.milestoneId === milestoneFilter);
    if (statusFilters.size > 0) res = res.filter((d) => statusFilters.has(d.status as StatusKey));
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      res = res.filter((d) => new Date(d.submittedAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      res = res.filter((d) => new Date(d.submittedAt).getTime() <= to);
    }
    return res;
  }, [projectFilter, milestoneFilter, statusFilters, dateFrom, dateTo]);

  const hasFilters = projectFilter !== "all" || milestoneFilter !== "all" || statusFilters.size > 0 || dateFrom || dateTo;

  /* Bulk download handler */
  const handleBulkDownload = () => {
    const projectName = projectFilter !== "all" ? getProjectTitle(projectFilter) : "all-projects";
    toast.info("Download Started", `Compiling ${filtered.length} evidence packs as ZIP for ${projectName}...`);
  };

  /* KPIs */
  const pendingCount = mockDeliverables.filter((d) => d.status === "pending").length;
  const approvedCount = mockDeliverables.filter((d) => d.status === "approved").length;
  const totalFiles = mockDeliverables.reduce((sum, d) => sum + d.evidenceFiles, 0);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <motion.div variants={fadeUp}>
        <Link href="/enterprise/review" className="inline-flex items-center gap-1.5 text-[12px] text-teal-600 hover:text-teal-700 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Review Queue
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-200/40">
            <FileStack className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">Evidence Packs — All Projects</h1>
            <p className="text-[13px] text-beige-500 mt-1">
              Global view of all evidence packs across all projects. Filter, review, and bulk download.
            </p>
          </div>
        </div>
        <button
          onClick={handleBulkDownload}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-[12px] font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Download All as ZIP
        </button>
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending Review", value: pendingCount, color: "from-gold-400 to-gold-600", icon: Clock },
          { label: "Approved", value: approvedCount, color: "from-forest-400 to-forest-600", icon: CheckCircle2 },
          { label: "Total Evidence Files", value: totalFiles, color: "from-teal-400 to-teal-600", icon: FileStack },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", s.color)}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">{s.value}</p>
              <p className="text-[10px] text-beige-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters — FSD §9.1: Project, Milestone, Status (multi-select), Date Range */}
      <motion.div variants={fadeUp} className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project */}
          <div className="relative">
            <select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setMilestoneFilter("all"); }}
              className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40 cursor-pointer min-w-[160px]"
            >
              <option value="all">All Projects</option>
              {projectOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-beige-400 pointer-events-none" />
          </div>

          {/* Milestone */}
          <div className="relative">
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40 cursor-pointer min-w-[160px]"
            >
              <option value="all">All Milestones</option>
              {milestoneOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-beige-400 pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-beige-500 font-medium">From:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 px-2 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40" />
            <span className="text-[11px] text-beige-500 font-medium">To:</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 px-2 rounded-lg bg-white/60 border border-beige-200/60 text-[12px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40" />
          </div>

          {hasFilters && (
            <button
              onClick={() => { setProjectFilter("all"); setMilestoneFilter("all"); setStatusFilters(new Set()); setDateFrom(""); setDateTo(""); }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-beige-500 hover:text-brown-700 hover:bg-beige-100 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Status multi-select pills — FSD §9.1 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-beige-500 uppercase tracking-wider">Status:</span>
          {(Object.entries(statusConfig) as [StatusKey, typeof statusConfig[string]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => toggleStatus(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                statusFilters.has(key)
                  ? cfg.variant === "gold" ? "bg-gold-50 text-gold-700 border-gold-200"
                  : cfg.variant === "forest" ? "bg-forest-50 text-forest-600 border-forest-200"
                  : cfg.variant === "danger" ? "bg-danger/10 text-danger border-danger/20"
                  : "bg-brown-100 text-brown-700 border-brown-200"
                  : "bg-white/60 text-beige-500 border-beige-200/60 hover:border-beige-300"
              )}
            >
              {statusFilters.has(key) && <CheckCircle2 className="w-3 h-3" />}
              {cfg.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Evidence Packs List */}
      {filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <PackageOpen className="w-7 h-7 text-teal-400" />
          </div>
          <h3 className="text-[15px] font-bold text-brown-800">No evidence packs found</h3>
          <p className="text-[13px] text-beige-500 mt-1 max-w-sm">
            {hasFilters ? "No evidence packs match your current filters." : "No evidence packs have been submitted yet."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="space-y-3">
          {filtered.map((d) => {
            const cfg = statusConfig[d.status] ?? statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <Link key={d.id} href={`/enterprise/review/${d.id}`} className="block group">
                <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/60 flex items-center justify-center shrink-0">
                      <FileStack className="w-5 h-5 text-teal-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[14px] font-semibold text-brown-900 truncate group-hover:text-teal-700 transition-colors">
                          {d.title}
                        </h3>
                        <Badge variant={cfg.variant} size="sm" dot>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-beige-500 flex-wrap">
                        <span className="font-medium text-brown-700">{getProjectTitle(d.projectId)}</span>
                        <span className="text-beige-300">|</span>
                        <span>{getMilestoneTitle(d.milestoneId)}</span>
                        <span className="text-beige-300">|</span>
                        <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{d.submittedBy}</span>
                        <span className="text-beige-300">|</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(d.submittedAt)}</span>
                        <span className="text-beige-300">|</span>
                        <span className="text-teal-600 font-medium">{d.evidenceFiles} files</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1 text-[11px] text-brown-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Review Evidence <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Reviewer notes */}
                  {d.reviewerNotes && (
                    <div className="mt-3 ml-15 p-2.5 rounded-xl bg-beige-50/80 border border-beige-100/60">
                      <p className="text-[11px] text-beige-600 italic leading-relaxed line-clamp-2">&ldquo;{d.reviewerNotes}&rdquo;</p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
