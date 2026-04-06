"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText, Search, Plus, DollarSign, Shield, Upload, Sparkles, AlertTriangle,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Clock,
  MoreVertical, Eye, Download, Archive, CheckCircle2, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";
import { useSowStore } from "@/lib/stores/sow-store";

/* ══════════════════════════════════════════ Status config (per FSD §7.1.4) ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:                      { label: "Draft",                    color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  review:                     { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  approval:                   { label: "In Review",                color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  pending_commercial_review:  { label: "Pending Commercial Review", color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  approved:                   { label: "Approved",                 color: "var(--color-forest-700)", bg: "var(--color-forest-50)" },
  rejected:                   { label: "Rejected",                 color: "var(--danger)",           bg: "var(--danger-light)" },
  changes_requested:          { label: "Changes Requested",        color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  archived:                   { label: "Archived",                 color: "var(--color-gray-500)",   bg: "var(--color-gray-100)" },
};

const sensitivityConfig: Record<string, { label: string; color: string; bg: string }> = {
  public:       { label: "Public",       color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  internal:     { label: "Internal",     color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  confidential: { label: "Confidential", color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  restricted:   { label: "Restricted",   color: "var(--danger)",           bg: "var(--danger-light)" },
};

/* FSD §7.1.4: Risk bar colors — green 0–25, amber 26–50, orange-red 51–75, red 76–100 */
function riskBarColor(score: number): string {
  if (score <= 25) return "var(--color-forest-500)";
  if (score <= 50) return "var(--color-gold-500)";
  if (score <= 75) return "#e67e22";
  return "var(--danger)";
}
function riskScoreColor(score: number): string {
  if (score <= 25) return "var(--color-forest-700)";
  if (score <= 50) return "var(--color-gold-700)";
  if (score <= 75) return "#c0570a";
  return "var(--danger)";
}

/* FSD §7.1.4: DD Mon YYYY format */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

type SortField = "title" | "client" | "intake" | "status" | "sensitivity" | "risk" | "version" | "modified";
type SortDir = "asc" | "desc";

/* FSD §7.1.3: STATUS filter options */
const statusFilterOptions = [
  { value: "all",       label: "STATUS: ALL" },
  { value: "draft",     label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "pending_commercial_review", label: "Pending Commercial Review" },
  { value: "approved",  label: "Approved" },
  { value: "rejected",  label: "Rejected" },
  { value: "archived",  label: "Archived" },
];

/* FSD §7.1.3: INTAKE filter options */
const intakeFilterOptions = [
  { value: "all",          label: "INTAKE: ALL" },
  { value: "ai_generated", label: "AI-Generated" },
  { value: "manual_upload", label: "Manual Upload" },
];

/* FSD §7.1.3: RISK filter options */
const riskFilterOptions = [
  { value: "all",      label: "RISK: ALL" },
  { value: "low",      label: "Low (0–25)" },
  { value: "medium",   label: "Medium (26–50)" },
  { value: "high",     label: "High (51–75)" },
  { value: "critical", label: "Critical (76–100)" },
];

/* ══════════════════════════════════════════ Pill helper ══════════════════════════════════════════ */

function Pill({ bg, color, children, bold, className }: { bg: string; color: string; children: React.ReactNode; bold?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] tracking-wide uppercase px-2.5 py-0.5 rounded-full", bold ? "font-bold" : "font-medium", className)}
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════ Risk Bar (FSD §7.1.4) ══════════════════════════════════════════ */

function RiskBar({ score }: { score: number }) {
  if (score <= 0) return <span className="text-[11px] text-gray-300">—</span>;
  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%`, background: riskBarColor(score) }} />
      </div>
      <span className="font-mono text-[11px] font-semibold" style={{ color: riskScoreColor(score), minWidth: 20, textAlign: "right" }}>
        {score}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════ Row Kebab Menu (FSD §7.1.5) ══════════════════════════════════════════ */

function RowKebab({ sow, onAction }: { sow: typeof mockSOWs[0]; onAction: (action: string, sowId: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items: { label: string; action: string; show: boolean }[] = [
    { label: "View Detail",            action: "view",     show: true },
    { label: "Edit",                   action: "edit",     show: sow.status === "draft" },
    { label: "Download PDF",           action: "download", show: true },
    { label: "View Approval Progress", action: "approval", show: ["approval", "review", "pending_commercial_review"].includes(sow.status) },
    { label: "Archive",                action: "archive",  show: ["approved", "rejected"].includes(sow.status) },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          {items.filter((i) => i.show).map((item) => (
            <button key={item.action} onClick={(e) => { e.stopPropagation(); onAction(item.action, sow.id); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors text-left">
              {item.action === "view" && <Eye className="w-3.5 h-3.5" />}
              {item.action === "edit" && <FileText className="w-3.5 h-3.5" />}
              {item.action === "download" && <Download className="w-3.5 h-3.5" />}
              {item.action === "approval" && <CheckCircle2 className="w-3.5 h-3.5" />}
              {item.action === "archive" && <Archive className="w-3.5 h-3.5" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════ Recently Viewed Panel (FSD §7.1.3) ══════════════════════════════════════════ */

function RecentlyViewedPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  /* Mock recent items — last 10 accessed, sorted by access time */
  const recentItems = mockSOWs.slice(0, 5).map((s, i) => ({
    id: s.id, title: s.title, client: s.client, status: s.status,
    timeAgo: ["2h ago", "5h ago", "1d ago", "2d ago", "3d ago"][i],
  }));

  if (!open) return null;
  return (
    <div ref={ref} className="absolute right-0 top-10 z-50 w-80 rounded-xl bg-white shadow-lg border border-gray-100"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
        <span className="text-[12px] font-semibold text-gray-700">Recently Viewed</span>
      </div>
      <div className="max-h-[320px] overflow-y-auto">
        {recentItems.map((item) => {
          const sc = statusConfig[item.status] || statusConfig.draft;
          return (
            <Link key={item.id} href={`/enterprise/sow/${item.id}`}>
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-800 truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{item.client}</div>
                </div>
                <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
                <span className="text-[10px] text-gray-400 shrink-0">{item.timeAgo}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ SOW REPOSITORY PAGE (FSD §7.1) ══════════════════════════════════════════ */

export default function SOWListPage() {
  const router = useRouter();

  /* Filters — FSD §7.1.3 */
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [intakeFilter, setIntakeFilter] = React.useState("all");
  const [riskFilter, setRiskFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [recentViewedOpen, setRecentViewedOpen] = React.useState(false);

  const allSows = useSowStore((s) => s.sows);
  const uniqueClients = React.useMemo(() => [...new Set(allSows.map((s) => s.client))].sort(), [allSows]);

  const [sortField, setSortField] = React.useState<SortField>("modified");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  /* ⌘K / Ctrl+K keyboard shortcut for search — FSD §7.1.3 */
  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  /* Filter + Sort logic — FSD §7.1.3 (AND logic, real-time) */
  const filtered = React.useMemo(() => {
    let list = [...allSows];
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "draft": list = list.filter((s) => s.status === "draft"); break;
        case "in_review": list = list.filter((s) => ["review", "approval"].includes(s.status)); break;
        case "pending_commercial_review": list = list.filter((s) => s.status === "pending_commercial_review"); break;
        case "approved": list = list.filter((s) => s.status === "approved"); break;
        case "rejected": list = list.filter((s) => s.status === "rejected"); break;
        case "archived": list = list.filter((s) => s.status === "archived"); break;
      }
    }

    /* INTAKE filter */
    if (intakeFilter !== "all") list = list.filter((s) => s.intakeMode === intakeFilter);

    /* RISK filter */
    if (riskFilter !== "all") {
      switch (riskFilter) {
        case "low":      list = list.filter((s) => s.riskScore.overall >= 0 && s.riskScore.overall <= 25); break;
        case "medium":   list = list.filter((s) => s.riskScore.overall >= 26 && s.riskScore.overall <= 50); break;
        case "high":     list = list.filter((s) => s.riskScore.overall >= 51 && s.riskScore.overall <= 75); break;
        case "critical": list = list.filter((s) => s.riskScore.overall >= 76 && s.riskScore.overall <= 100); break;
      }
    }

    /* Search — FSD §7.1.3: min 3 chars, searches title, client, ID */
    if (search.trim().length >= 3) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) || s.client.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      );
    }

    /* Sort — FSD §7.1.4: default sort Modified descending */
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title": cmp = a.title.localeCompare(b.title); break;
        case "client": cmp = a.client.localeCompare(b.client); break;
        case "intake": cmp = a.intakeMode.localeCompare(b.intakeMode); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "sensitivity": cmp = (a.dataSensitivity || "").localeCompare(b.dataSensitivity || ""); break;
        case "risk": cmp = a.riskScore.overall - b.riskScore.overall; break;
        case "version": cmp = a.version - b.version; break;
        case "modified": cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [statusFilter, intakeFilter, riskFilter, search, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [statusFilter, intakeFilter, riskFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [statusFilter, intakeFilter, riskFilter].filter((v) => v !== "all").length;

  function clearAllFilters() { setStatusFilter("all"); setIntakeFilter("all"); setRiskFilter("all"); setSearch(""); }

  const totalSOWs = allSows.length;
  const pendingCount = allSows.filter((s) => ["approval", "review", "changes_requested"].includes(s.status)).length;
  const approvedCount = allSows.filter((s) => s.status === "approved").length;
  const scoredSOWs = allSows.filter((s) => s.riskScore.overall > 0);
  const avgRisk = scoredSOWs.length > 0 ? Math.round(scoredSOWs.reduce((sum, s) => sum + s.riskScore.overall, 0) / scoredSOWs.length) : 0;
  const totalBudget = allSows.filter((s) => s.status === "approved").reduce((sum, s) => sum + s.estimatedBudget, 0);

  /* Tile click handlers — FSD §7.1.2 */
  function handleTileClick(tile: string) {
    switch (tile) {
      case "total": clearAllFilters(); break;
      case "pending": clearAllFilters(); setStatusFilter("in_review"); break;
      case "approved": clearAllFilters(); setStatusFilter("approved"); break;
      case "risk": clearAllFilters(); setSortField("risk"); setSortDir("desc"); break;
      case "budget": router.push("/enterprise/billing"); break;
    }
  }

  /* Row action handler — FSD §7.1.5 */
  function handleRowAction(action: string, sowId: string) {
    switch (action) {
      case "view": router.push(`/enterprise/sow/${sowId}`); break;
      case "edit": router.push(`/enterprise/sow/${sowId}`); break;
      case "download": break; /* PDF download */
      case "approval": router.push(`/enterprise/sow/${sowId}`); break;
      case "archive": break; /* Archive confirmation */
    }
  }

  const columns = [
    { field: "title" as SortField, label: "Title + ID", align: "left", minW: 240 },
    { field: "client" as SortField, label: "Client", align: "left", minW: 120 },
    { field: "intake" as SortField, label: "Intake", align: "left", minW: 130 },
    { field: "status" as SortField, label: "Status", align: "left", minW: 130 },
    { field: "sensitivity" as SortField, label: "Sensitivity", align: "left", minW: 100 },
    { field: "risk" as SortField, label: "Risk", align: "center", minW: 110 },
    { field: "version" as SortField, label: "Version", align: "center", minW: 70 },
    { field: "modified" as SortField, label: "Modified ↓", align: "left", minW: 100 },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO — FSD §7.1.1 ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
              SOW Repository
            </h1>
            <p className="mt-1.5 text-[13px] text-gray-500">
              Manage all Statements of Work — upload, track, and approve across projects.
            </p>
          </div>
          <Link href="/enterprise/sow/intake">
            <button className="flex items-center gap-1.5 rounded-xl text-white text-xs font-medium px-4 py-2.5 shrink-0 transition-all hover:-translate-y-0.5 bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
              style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 30%, transparent)" }}>
              <Plus className="w-3 h-3" /> New SOW
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ═══ KPI TILES — FSD §7.1.2 ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
        {[
          { key: "total",    label: "Total SOWs",    value: String(totalSOWs), icon: FileText,       iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { key: "pending",  label: "Pending Action", value: String(pendingCount), icon: AlertTriangle, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { key: "approved", label: "Approved",       value: String(approvedCount), icon: Shield,       iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { key: "risk",     label: "Avg Risk Score", value: String(avgRisk),  icon: AlertTriangle,  iconBg: "bg-gradient-to-br from-brown-500 to-brown-700" },
          { key: "budget",   label: "Total Budget",   value: `$${(totalBudget / 1000).toFixed(0)}K`, icon: DollarSign, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          /* FSD §7.1.2: Avg Risk color — green ≤25, amber 26–50, red >50 */
          const riskTextColor = kpi.key === "risk" && avgRisk > 0
            ? (avgRisk <= 25 ? "var(--color-forest-700)" : avgRisk <= 50 ? "var(--color-gold-700)" : "var(--danger)")
            : undefined;
          return (
            <motion.div key={kpi.key} variants={scaleIn}
              className="card-parchment flex items-center gap-5 px-5 py-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleTileClick(kpi.key)}>
              <div className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{kpi.label}</div>
                <div className="num-display text-[28px] leading-none mt-1" style={{ color: riskTextColor || "var(--ink-dark)" }}>
                  {kpi.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ TABLE CARD ═══ */}
      {allSows.length === 0 ? (
        <motion.div variants={fadeUp} className="card-parchment">
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-800 mb-1.5">Upload your first SOW or use our AI Generator.</h2>
            <p className="text-xs text-gray-500 max-w-[380px] mb-5">Create a Statement of Work to kick off your first project on GlimmoraTeam.</p>
            <div className="flex items-center gap-3">
              <Link href="/enterprise/sow/upload">
                <button className="flex items-center gap-1.5 rounded-xl text-xs font-medium px-4 py-2.5 border border-brown-200 text-brown-600 hover:bg-brown-50 transition-all">
                  <Upload className="w-3 h-3" /> Upload Document
                </button>
              </Link>
              <Link href="/enterprise/sow/generate">
                <button className="flex items-center gap-1.5 rounded-xl text-white text-xs font-medium px-4 py-2.5 bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 transition-all"
                  style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 30%, transparent)" }}>
                  <Sparkles className="w-3 h-3" /> Use AI Generator
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="card-parchment mb-5">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">All Statements of Work</span>
          </div>

          {/* ═══ FILTER BAR — FSD §7.1.3 ═══ */}
          <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
            {/* Search — FSD §7.1.3: "Search SOWs by title, client, or ID..." + ⌘K */}
            <div className={cn("flex items-center gap-2 rounded-lg transition-all duration-200 shrink-0", searchFocused ? "w-64" : "w-[240px]")}
              style={{
                background: searchFocused ? "white" : "var(--color-gray-50)",
                border: searchFocused ? "1px solid var(--color-brown-300)" : "1px solid var(--border-soft)",
                padding: "7px 12px",
                boxShadow: searchFocused ? "0 0 0 3px color-mix(in srgb, var(--color-brown-500) 8%, transparent)" : undefined,
              }}
            >
              <Search className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <input ref={searchRef} type="text" placeholder="Search SOWs by title, client, or ID..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                className="border-none outline-none bg-transparent w-full text-[12.5px] text-gray-700 placeholder:text-gray-400" />
              {search ? (
                <button onClick={() => setSearch("")} className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
              ) : !searchFocused ? (
                <kbd className="font-mono whitespace-nowrap shrink-0 text-[9px] text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-px rounded">⌘K</kbd>
              ) : null}
            </div>

            {/* Filters + Recently Viewed — FSD §7.1.3 */}
            <div className="flex items-center gap-2">
              {/* STATUS filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 130 }}><SelectValue placeholder="STATUS: ALL" /></SelectTrigger>
                <SelectContent>{statusFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
              {/* INTAKE filter */}
              <Select value={intakeFilter} onValueChange={setIntakeFilter}>
                <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 120 }}><SelectValue placeholder="INTAKE: ALL" /></SelectTrigger>
                <SelectContent>{intakeFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
              {/* RISK filter */}
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}><SelectValue placeholder="RISK: ALL" /></SelectTrigger>
                <SelectContent>{riskFilterOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}

              {/* Clock icon — Recently Viewed (FSD §7.1.3) */}
              <div className="relative">
                <button onClick={() => setRecentViewedOpen(!recentViewedOpen)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all">
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <RecentlyViewedPanel open={recentViewedOpen} onClose={() => setRecentViewedOpen(false)} />
              </div>
            </div>
          </div>

          {/* ═══ TABLE — FSD §7.1.4 ═══ */}
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
                          padding: "11px 16px", textAlign: col.align as "left" | "center",
                          fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
                          color: active ? "var(--ink-mid)" : "var(--color-gray-400)",
                          background: "color-mix(in srgb, var(--color-gray-100) 40%, white)",
                          minWidth: col.minW,
                        }}>
                        <div className="flex items-center gap-1" style={{ justifyContent: col.align === "center" ? "center" : "flex-start" }}>
                          <span>{col.label}</span>
                          <span style={{ opacity: active ? 1 : 0, transition: "opacity 0.15s" }}>
                            {active && sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  {/* Actions column */}
                  <th style={{ padding: "11px 12px", width: 48, background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }} />
                </tr>
              </thead>
              <tbody>
                {paginated.map((sow) => {
                  const sc = statusConfig[sow.status] || statusConfig.draft;
                  const sens = sensitivityConfig[sow.dataSensitivity] || sensitivityConfig.internal;
                  /* FSD §7.1.4: Pending Commercial Review uses amber-orange, bold */
                  const isPendingCommercial = sow.status === "pending_commercial_review";
                  /* Format SOW ID as SOW-001 format */
                  const sowIdFormatted = sow.id.replace("sow-", "SOW-").toUpperCase();
                  return (
                    <tr key={sow.id} onClick={() => router.push(`/enterprise/sow/${sow.id}`)}
                      className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                      style={{ borderBottom: "1px solid var(--border-hair)" }}>

                      {/* Title + ID — FSD §7.1.4 */}
                      <td style={{ padding: "13px 16px" }}>
                        <div>
                          <div className="text-[13px] font-semibold text-gray-800 truncate max-w-[260px]">{sow.title}</div>
                          <div className="font-mono text-[10px] text-gray-400 mt-0.5">{sowIdFormatted}</div>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="text-[12.5px] text-gray-600" style={{ padding: "13px 16px" }}>{sow.client}</td>

                      {/* Intake — FSD §7.1.4: Sparkle + "AI-GENERATED" or Upload arrow + "MANUAL UPLOAD" */}
                      <td style={{ padding: "13px 16px" }}>
                        <Pill bg={sow.intakeMode === "ai_generated" ? "var(--color-teal-50)" : "var(--color-gray-100)"}
                              color={sow.intakeMode === "ai_generated" ? "var(--color-teal-700)" : "var(--color-gray-600)"}>
                          {sow.intakeMode === "ai_generated"
                            ? <><Sparkles className="w-2.5 h-2.5" /> AI-Generated</>
                            : <><Upload className="w-2.5 h-2.5" /> Manual Upload</>}
                        </Pill>
                      </td>

                      {/* Status — FSD §7.1.4 */}
                      <td style={{ padding: "13px 16px" }}>
                        <Pill bg={sc.bg} color={sc.color} bold={isPendingCommercial}>{sc.label}</Pill>
                      </td>

                      {/* Sensitivity — FSD §7.1.4: plain text, no pill styling */}
                      <td className="text-[12px] text-gray-600" style={{ padding: "13px 16px" }}>{sens.label}</td>

                      {/* Risk — FSD §7.1.4: Coloured progress bar + numeric score */}
                      <td style={{ padding: "13px 16px" }}>
                        <RiskBar score={sow.riskScore.overall} />
                      </td>

                      {/* Version */}
                      <td style={{ padding: "13px 16px", textAlign: "center" }}>
                        <span className="font-mono text-[12px] font-medium text-gray-600">v{sow.version}</span>
                      </td>

                      {/* Modified — FSD §7.1.4: DD Mon YYYY */}
                      <td style={{ padding: "13px 16px" }}>
                        <span className="text-[11.5px] text-gray-500">{formatDate(sow.updatedAt)}</span>
                      </td>

                      {/* Kebab menu — FSD §7.1.5 */}
                      <td style={{ padding: "8px 12px" }} onClick={(e) => e.stopPropagation()}>
                        <RowKebab sow={sow} onAction={handleRowAction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* No filter results */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">No SOWs match your filters</p>
                <p className="text-xs text-gray-500 max-w-[280px] mb-4">Try different keywords or clear filters to see all SOWs.</p>
                <button onClick={clearAllFilters}
                  className="flex items-center gap-1.5 rounded-xl text-xs font-medium text-brown-500 px-3.5 py-1.5 border border-brown-200 hover:bg-brown-50 transition-all">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Rows per page</span>
              <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-7 w-auto rounded-lg bg-white border border-gray-200 px-2.5 text-[11px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 52 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-gray-400">
                {filtered.length > 0 ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}` : "0 results"}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>}

        </motion.div>
      )}
    </motion.div>
  );
}
