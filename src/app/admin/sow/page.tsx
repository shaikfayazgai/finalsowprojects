"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Search, Clock, CheckCircle2, AlertTriangle,
  DollarSign, ShieldAlert, ArrowUp, ArrowDown, ChevronRight,
  Building2, Eye, TrendingUp, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import type { SOW } from "@/types/enterprise";

/* ════════════════════════ Helpers ════════════════════════ */

function fmtBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return n > 0 ? `$${n}` : "—";
}

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

type SortField = "title" | "client" | "budget" | "updated" | "risk" | "status";
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
  const [mounted, setMounted]     = React.useState(false);
  const [tab, setTab]             = React.useState<TabId>("all");
  const [search, setSearch]       = React.useState("");
  const [sortField, setSortField] = React.useState<SortField>("updated");
  const [sortDir, setSortDir]     = React.useState<SortDir>("desc");
  const searchRef = React.useRef<HTMLInputElement>(null);

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
  }

  /* ── Derived lists ── */
  const approvalList = mockSOWs.filter(s => s.status === "approval" || s.status === "review");
  const approvedList = mockSOWs.filter(s => s.status === "approved");
  const changesList  = mockSOWs.filter(s => s.status === "changes_requested");
  const draftList    = mockSOWs.filter(s => s.status === "draft" || s.status === "parsing");
  const pendingComm  = mockSOWs.filter(needsCommercialReview);

  const base = React.useMemo(() => {
    if (tab === "approval") return approvalList;
    if (tab === "approved") return approvedList;
    if (tab === "changes")  return changesList;
    if (tab === "draft")    return draftList;
    return mockSOWs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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
    if (sortField === "budget")  cmp = a.estimatedBudget - b.estimatedBudget;
    if (sortField === "updated") cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    if (sortField === "risk")    cmp = a.riskScore.overall - b.riskScore.overall;
    if (sortField === "status")  cmp = a.status.localeCompare(b.status);
    return sortDir === "asc" ? cmp : -cmp;
  }), [filtered, sortField, sortDir]);

  const tabCounts: Record<TabId, number> = {
    all: mockSOWs.length, approval: approvalList.length,
    approved: approvedList.length, changes: changesList.length, draft: draftList.length,
  };

  const totalValue = approvedList.reduce((a, s) => a + s.estimatedBudget, 0);
  const avgRisk    = mockSOWs.length
    ? Math.round(mockSOWs.reduce((a, s) => a + s.riskScore.overall, 0) / mockSOWs.length) : 0;

  if (!mounted) return <PageSkeleton />;

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
          value={String(mockSOWs.length)}
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
          sub={`${fmtBudget(totalValue)} total contract value`}
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
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-beige-50 bg-beige-50/40">
                  <th className="text-left px-5 py-3 w-[30%]">
                    <SortHeader field="title"   label="Statement of Work" current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[13%]">
                    <SortHeader field="client"  label="Client"            current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[13%]">
                    <SortHeader field="status"  label="Status"            current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[10%]">
                    <SortHeader field="budget"  label="Value"             current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[10%]">
                    <SortHeader field="updated" label="Updated"           current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[13%]">
                    <SortHeader field="risk"    label="Risk"              current={sortField} dir={sortDir} onSort={toggleSort} />
                  </th>
                  <th className="text-left px-4 py-3 w-[8%]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Stage</span>
                  </th>
                  <th className="px-4 py-3 w-[9%]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-50">
                {sorted.map((sow) => {
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
                            <p className="text-[13px] font-semibold text-brown-950 leading-snug truncate max-w-[210px]">
                              {sow.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-beige-400">
                              <span className="truncate max-w-[110px]">{sow.createdBy}</span>
                              {sow.industry && (
                                <>
                                  <span className="text-beige-200">·</span>
                                  <span className="truncate max-w-[80px]">{sow.industry}</span>
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
                          <span className="text-[12px] font-medium text-brown-700 truncate max-w-[95px]">
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

                      {/* Budget */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-beige-300 shrink-0" />
                          <span className="text-[13px] font-bold text-brown-950 tabular-nums">
                            {fmtBudget(sow.estimatedBudget)}
                          </span>
                        </div>
                        {sow.estimatedDuration && (
                          <p className="text-[10px] text-beige-400 mt-0.5 pl-4">{sow.estimatedDuration}</p>
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

        {/* Footer */}
        {sorted.length > 0 && (
          <div className="flex items-center gap-4 px-5 py-2.5 border-t border-beige-100 bg-beige-50/40">
            {/* Count */}
            <div className="flex items-center gap-1.5 text-[11px] text-beige-500 shrink-0">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span className="tabular-nums font-semibold text-brown-700">{sorted.length}</span>
              <span>SOW{sorted.length !== 1 ? "s" : ""}{search.trim().length >= 2 ? ` matching "${search}"` : ""}</span>
            </div>

            {/* Dividers + tab breakdown */}
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
              {([
                { label: "In Approval", count: approvalList.length, color: "text-gold-600 bg-gold-50 border-gold-100" },
                { label: "Approved",    count: approvedList.length, color: "text-forest-700 bg-forest-50 border-forest-100" },
                { label: "Changes",     count: changesList.length,  color: "text-amber-700 bg-amber-50 border-amber-100" },
                { label: "Draft",       count: draftList.length,    color: "text-gray-500 bg-gray-100 border-gray-200" },
              ] as const).filter(item => item.count > 0).map(item => (
                <span key={item.label} className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap shrink-0", item.color)}>
                  {item.label} <span className="tabular-nums">{item.count}</span>
                </span>
              ))}
            </div>

            {/* Pending action */}
            {pendingComm.length > 0 && (
              <button
                onClick={() => setTab("approval")}
                className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-gold-700 bg-gold-50 hover:bg-gold-100 border border-gold-200 px-3 py-1 rounded-lg transition-all"
              >
                <Clock className="w-3 h-3" />
                {pendingComm.length} pending sign-off
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

