"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Plus,
  DollarSign,
  Shield,
  Upload,
  Bot,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ClipboardCheck,
  Eye,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";

/* ══════════════════════════════════════════
   Status config
   ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  draft:    { label: "Draft", color: "#6A4C3F", bg: "linear-gradient(135deg, rgba(166,119,99,0.12), rgba(208,176,96,0.05))", border: "rgba(166,119,99,0.20)", icon: FileText },
  parsing:  { label: "Parsing", color: "#2A6068", bg: "linear-gradient(135deg, rgba(91,155,162,0.14), rgba(77,87,65,0.05))", border: "rgba(91,155,162,0.22)", icon: Bot },
  review:   { label: "In Review", color: "#3A6368", bg: "linear-gradient(135deg, rgba(91,155,162,0.10), rgba(77,87,65,0.04))", border: "rgba(91,155,162,0.20)", icon: Eye },
  approval: { label: "In Approval", color: "#86713D", bg: "linear-gradient(135deg, rgba(208,176,96,0.14), rgba(166,119,99,0.05))", border: "rgba(208,176,96,0.24)", icon: ClipboardCheck },
  approved: { label: "Approved", color: "#344028", bg: "linear-gradient(135deg, rgba(77,87,65,0.12), rgba(91,155,162,0.04))", border: "rgba(77,87,65,0.20)", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "#8B2C2C", bg: "linear-gradient(135deg, rgba(160,50,50,0.10), rgba(190,120,50,0.04))", border: "rgba(160,50,50,0.18)", icon: AlertTriangle },
  changes_requested: { label: "Changes Req.", color: "#7A6030", bg: "linear-gradient(135deg, rgba(208,176,96,0.10), rgba(166,119,99,0.04))", border: "rgba(208,176,96,0.22)", icon: AlertTriangle },
  archived: { label: "Archived", color: "#706B66", bg: "linear-gradient(135deg, rgba(166,119,99,0.08), rgba(166,119,99,0.03))", border: "rgba(166,119,99,0.14)", icon: FileText },
};

const sensitivityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  public:       { label: "Public", color: "#2A6068", bg: "rgba(91,155,162,0.08)", border: "rgba(91,155,162,0.18)" },
  internal:     { label: "Internal", color: "#706B66", bg: "rgba(166,119,99,0.06)", border: "rgba(166,119,99,0.14)" },
  confidential: { label: "Confidential", color: "#86713D", bg: "rgba(208,176,96,0.10)", border: "rgba(208,176,96,0.22)" },
  restricted:   { label: "Restricted", color: "#8B2C2C", bg: "rgba(160,50,50,0.07)", border: "rgba(160,50,50,0.16)" },
};

function riskColor(score: number): string {
  if (score <= 25) return "#344028";
  if (score <= 50) return "#86713D";
  return "#8B2C2C";
}

function riskBg(score: number): string {
  if (score <= 25) return "rgba(77,87,65,0.08)";
  if (score <= 50) return "rgba(208,176,96,0.10)";
  return "rgba(160,50,50,0.07)";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type SortField = "title" | "client" | "intake" | "status" | "sensitivity" | "risk" | "version" | "modified";
type SortDir = "asc" | "desc";

/* ══════════════════════════════════════════
   STATUS CHIP DATA
   ══════════════════════════════════════════ */

const statusChips = [
  { value: "all", label: "All", statuses: [] as string[] },
  { value: "draft", label: "Draft", statuses: ["draft"] },
  { value: "in_progress", label: "In Progress", statuses: ["parsing", "review", "approval", "changes_requested"] },
  { value: "approved", label: "Approved", statuses: ["approved"] },
  { value: "rejected", label: "Rejected", statuses: ["rejected"] },
  { value: "archived", label: "Archived", statuses: ["archived"] },
];

/* ══════════════════════════════════════════
   SOW REPOSITORY PAGE
   ══════════════════════════════════════════ */

export default function SOWListPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("all");
  const [clientFilter, setClientFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);

  const uniqueClients = React.useMemo(
    () => [...new Set(mockSOWs.map((s) => s.client))].sort(),
    []
  );

  const [sortField, setSortField] = React.useState<SortField>("modified");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filtered = React.useMemo(() => {
    let list = [...mockSOWs];
    if (statusFilter !== "all") {
      const chip = statusChips.find((c) => c.value === statusFilter);
      if (chip) list = list.filter((s) => chip.statuses.includes(s.status));
    }
    if (clientFilter !== "all") list = list.filter((s) => s.client === clientFilter);
    if (dateFilter !== "all") {
      const now = new Date("2026-03-09T00:00:00Z");
      const cutoff = new Date(now);
      switch (dateFilter) {
        case "7d": cutoff.setDate(now.getDate() - 7); break;
        case "30d": cutoff.setDate(now.getDate() - 30); break;
        case "90d": cutoff.setDate(now.getDate() - 90); break;
      }
      list = list.filter((s) => new Date(s.updatedAt) >= cutoff);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.client.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.stakeholders.some((st) => st.toLowerCase().includes(q)) ||
          mockSOWSections.filter((sec) => sec.sowId === s.id).some((sec) => sec.content.toLowerCase().includes(q))
      );
    }
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
  }, [statusFilter, clientFilter, dateFilter, search, sortField, sortDir]);

  React.useEffect(() => { setCurrentPage(1); }, [statusFilter, clientFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount = [statusFilter, dateFilter, clientFilter].filter((v) => v !== "all").length;

  function clearAllFilters() {
    setStatusFilter("all");
    setDateFilter("all");
    setClientFilter("all");
    setSearch("");
  }

  const totalSOWs = mockSOWs.length;
  const pendingCount = mockSOWs.filter((s) => ["approval", "review", "parsing"].includes(s.status)).length;
  const approvedCount = mockSOWs.filter((s) => s.status === "approved").length;
  const scoredSOWs = mockSOWs.filter((s) => s.riskScore.overall > 0);
  const avgRisk = scoredSOWs.length > 0 ? Math.round(scoredSOWs.reduce((sum, s) => sum + s.riskScore.overall, 0) / scoredSOWs.length) : 0;
  const totalBudget = mockSOWs.reduce((sum, s) => sum + s.estimatedBudget, 0);

  const kpiData = [
    { label: "Total SOWs", value: totalSOWs.toString(), iconBg: "linear-gradient(135deg, rgba(166,119,99,0.14), rgba(208,176,96,0.06))", iconBorder: "rgba(166,119,99,0.20)", iconColor: "#6A4C3F", accent: "linear-gradient(90deg, transparent, #A67763, transparent)", icon: FileText },
    { label: "Pending Action", value: pendingCount.toString(), iconBg: "linear-gradient(135deg, rgba(208,176,96,0.16), rgba(166,119,99,0.06))", iconBorder: "rgba(208,176,96,0.22)", iconColor: "#86713D", accent: "linear-gradient(90deg, transparent, #D0B060, transparent)", icon: AlertTriangle },
    { label: "Approved", value: approvedCount.toString(), iconBg: "linear-gradient(135deg, rgba(77,87,65,0.14), rgba(91,155,162,0.05))", iconBorder: "rgba(77,87,65,0.20)", iconColor: "#3F4735", accent: "linear-gradient(90deg, transparent, #4D5741, transparent)", icon: Shield },
    { label: "Avg Risk Score", value: avgRisk.toString(), iconBg: "linear-gradient(135deg, rgba(91,155,162,0.14), rgba(77,87,65,0.05))", iconBorder: "rgba(91,155,162,0.22)", iconColor: "#2A6068", accent: "linear-gradient(90deg, transparent, #5B9BA2, transparent)", icon: AlertTriangle },
    { label: "Total Budget", value: `$${(totalBudget / 1000).toFixed(0)}K`, iconBg: "linear-gradient(135deg, rgba(190,120,50,0.14), rgba(208,176,96,0.06))", iconBorder: "rgba(190,120,50,0.20)", iconColor: "#7A5020", accent: "linear-gradient(90deg, transparent, #BE7832, transparent)", icon: DollarSign },
  ];

  const columns = [
    { field: "title" as SortField, label: "Title", align: "left" },
    { field: "client" as SortField, label: "Client", align: "left" },
    { field: "intake" as SortField, label: "Intake", align: "left" },
    { field: "status" as SortField, label: "Status", align: "left" },
    { field: "sensitivity" as SortField, label: "Sensitivity", align: "left" },
    { field: "risk" as SortField, label: "Risk", align: "center" },
    { field: "version" as SortField, label: "Ver.", align: "center" },
    { field: "modified" as SortField, label: "Modified", align: "left" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══════════════════════════════════
          HERO
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="relative mb-7">
        <div className="absolute pointer-events-none" style={{
          top: -60, left: -80, width: 500, height: 300,
          background: 'radial-gradient(ellipse at 20% 40%, rgba(208,176,96,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 20%, rgba(91,155,162,0.06) 0%, transparent 45%)',
          filter: 'blur(40px)',
        }} />
        <div className="relative flex items-end justify-between gap-6">
          <div>
            <h1 className="font-heading leading-[1.15]" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              SOW Repository
            </h1>
            <p className="whitespace-nowrap" style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-muted)', fontWeight: 400, lineHeight: 1.55 }}>
              Manage all Statements of Work — upload, track, and approve across projects.
            </p>
          </div>
          <Link href="/enterprise/sow/intake">
            <button
              className="flex items-center gap-1.5 rounded-lg transition-all duration-200 shrink-0"
              style={{
                padding: '7px 16px',
                background: 'linear-gradient(135deg, #A67763, #886151)',
                color: '#FFFFFF', fontSize: 12, fontWeight: 500,
                border: '1px solid rgba(166,119,99,0.30)',
                boxShadow: '0 1px 6px rgba(166,119,99,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 3px 12px rgba(166,119,99,0.30), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(166,119,99,0.20), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = ''; }}
            >
              <Plus className="w-3 h-3" /> New SOW
            </button>
          </Link>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          KPI ROW
          ═══════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              variants={scaleIn}
              className="relative overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(155deg, rgba(253,250,247,0.95), rgba(255,255,255,0.7) 40%, rgba(249,245,241,0.6))',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid var(--border-soft)', borderRadius: 18,
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
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.98) 40%, rgba(255,255,255,0.98) 60%, transparent)' }} />
              <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: kpi.accent, opacity: 0.6 }} />
              <div className="flex items-center justify-between mb-5">
                <div className="label-caps">{kpi.label}</div>
                <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 9, background: kpi.iconBg, border: `1px solid ${kpi.iconBorder}` }}>
                  <Icon className="w-3 h-3" style={{ color: kpi.iconColor }} />
                </div>
              </div>
              <div className="num-display" style={{ fontSize: '3rem', color: '#000000' }}>{kpi.value}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══════════════════════════════════
          UNIFIED TABLE CARD (search + filters + table + pagination)
          ═══════════════════════════════════ */}
      {mockSOWs.length === 0 ? (
        <motion.div variants={fadeUp} className="card-parchment">
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="flex items-center justify-center mb-4" style={{ width: 52, height: 52, borderRadius: 15, background: 'linear-gradient(135deg, rgba(166,119,99,0.12), rgba(208,176,96,0.06))', border: '1px solid rgba(166,119,99,0.18)' }}>
              <FileText className="w-6 h-6" style={{ color: '#6A4C3F' }} />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Create your first SOW</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-muted)', maxWidth: 320, marginBottom: 20 }}>Upload or generate a Statement of Work to kick off your first project.</p>
            <Link href="/enterprise/sow/intake">
              <button className="flex items-center gap-1.5 rounded-lg" style={{ padding: '7px 16px', background: 'linear-gradient(135deg, #A67763, #886151)', color: '#FFFFFF', fontSize: 12, fontWeight: 500, border: '1px solid rgba(166,119,99,0.30)', boxShadow: '0 1px 6px rgba(166,119,99,0.20)' }}>
                <Plus className="w-3 h-3" /> New SOW
              </button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div variants={fadeUp} className="card-parchment mb-5">

            {/* ── Card Header: Title + Count ── */}
            <div className="section-header-parchment">
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                All Statements of Work
              </div>
            </div>

            {/* ── Search + Filters in one row ── */}
            <div className="flex items-center justify-between gap-3" style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-hair)' }}>
              {/* Search — left side */}
              <div
                className={cn("flex items-center gap-2 rounded-full transition-all duration-300 shrink-0", searchFocused ? "w-64" : "w-[220px]")}
                style={{
                  background: searchFocused
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(253,250,247,0.95))'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(249,245,241,0.7))',
                  border: searchFocused
                    ? '1px solid rgba(208,176,96,0.45)'
                    : '1px solid rgba(166,119,99,0.12)',
                  padding: '6px 14px',
                  boxShadow: searchFocused
                    ? '0 0 0 3px rgba(208,176,96,0.10), 0 2px 8px rgba(166,119,99,0.06), inset 0 1px 2px rgba(77,55,46,0.03)'
                    : '0 1px 3px rgba(77,55,46,0.03), inset 0 1px 2px rgba(77,55,46,0.03)',
                }}
              >
                <Search className="w-[13px] h-[13px] shrink-0" style={{ color: 'var(--ink-faint)' }} />
                <input
                  type="text"
                  placeholder="Search SOWs…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="border-none outline-none bg-transparent w-full font-sans"
                  style={{ fontSize: '12.5px', color: 'var(--ink-mid)' }}
                />
                {search ? (
                  <button onClick={() => setSearch("")} className="shrink-0 p-0.5 rounded transition-colors" style={{ color: 'var(--ink-faint)' }}>
                    <X className="w-3 h-3" />
                  </button>
                ) : !searchFocused ? (
                  <span className="font-mono whitespace-nowrap shrink-0" style={{ fontSize: 9, color: 'var(--ink-faint)', background: 'rgba(166,119,99,0.08)', border: '1px solid var(--border-soft)', padding: '1px 6px', borderRadius: 4 }}>
                    ⌘F
                  </span>
                ) : null}
              </div>

              {/* Filters — right side */}
              <div className="flex items-center gap-2.5">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="filter-trigger" style={{ minWidth: 110 }}><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    {statusChips.map((chip) => (
                      <SelectItem key={chip.value} value={chip.value}>{chip.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="filter-trigger" style={{ minWidth: 120 }}><SelectValue placeholder="All Clients" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="filter-trigger" style={{ minWidth: 100 }}><SelectValue placeholder="All Time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 transition-all duration-150"
                    style={{ fontSize: 11, fontWeight: 500, color: '#A67763', padding: '5px 10px', borderRadius: 8 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-hair)' }}>
                    {columns.map((col) => {
                      const active = sortField === col.field;
                      return (
                        <th
                          key={col.field}
                          onClick={() => handleSort(col.field)}
                          className="cursor-pointer select-none transition-colors"
                          style={{
                            padding: '11px 16px',
                            textAlign: col.align as "left" | "center",
                            fontSize: 10, fontWeight: 600,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            color: active ? 'var(--ink-mid)' : 'var(--ink-faint)',
                            background: 'rgba(166,119,99,0.02)',
                          }}
                        >
                          <div className="flex items-center gap-1" style={{ justifyContent: col.align === "center" ? "center" : "flex-start" }}>
                            <span>{col.label}</span>
                            <span style={{ opacity: active ? 1 : 0, transition: 'opacity 0.15s' }}>
                              {active && sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((sow) => {
                    const sc = statusConfig[sow.status] || statusConfig.draft;
                    const sens = sensitivityConfig[sow.dataSensitivity] || sensitivityConfig.internal;

                    return (
                      <tr
                        key={sow.id}
                        onClick={() => router.push(`/enterprise/sow/${sow.id}`)}
                        className="cursor-pointer transition-all"
                        style={{ borderBottom: '1px solid var(--border-hair)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                      >
                        {/* Title — no icon container */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                              {sow.title}
                            </div>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                              {sow.id.toUpperCase()} · {sow.pages} pg
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--ink-mid)' }}>{sow.client}</td>

                        {/* Intake */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className="badge-parchment" style={{
                            background: sow.intakeMode === "ai_generated" ? "rgba(91,155,162,0.08)" : "rgba(166,119,99,0.06)",
                            color: sow.intakeMode === "ai_generated" ? "#2A6068" : "#706B66",
                            border: `1px solid ${sow.intakeMode === "ai_generated" ? "rgba(91,155,162,0.18)" : "rgba(166,119,99,0.14)"}`,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {sow.intakeMode === "ai_generated" ? <><Bot className="w-2.5 h-2.5" /> AI</> : <><Upload className="w-2.5 h-2.5" /> Manual</>}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className="badge-parchment" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                        </td>

                        {/* Sensitivity */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className="badge-parchment" style={{ background: sens.bg, color: sens.color, border: `1px solid ${sens.border}` }}>{sens.label}</span>
                        </td>

                        {/* Risk */}
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          {sow.riskScore.overall > 0 ? (
                            <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: riskColor(sow.riskScore.overall), background: riskBg(sow.riskScore.overall), padding: '3px 10px', borderRadius: 100 }}>
                              {sow.riskScore.overall}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>—</span>
                          )}
                        </td>

                        {/* Version */}
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                          <span className="font-mono" style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-mid)' }}>v{sow.version}</span>
                        </td>

                        {/* Modified */}
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{formatDate(sow.updatedAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="flex items-center justify-center mb-4" style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(166,119,99,0.10), rgba(208,176,96,0.05))', border: '1px solid rgba(166,119,99,0.14)' }}>
                    <Search className="w-5 h-5" style={{ color: '#A67763' }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-heading)', marginBottom: 4 }}>No SOWs match your filters</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', maxWidth: 280, marginBottom: 16 }}>Try different keywords or clear filters to see all SOWs.</p>
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 rounded-lg transition-all duration-150"
                    style={{ fontSize: 12, fontWeight: 500, color: '#A67763', padding: '6px 14px', border: '1px solid rgba(166,119,99,0.18)', background: 'rgba(166,119,99,0.04)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(166,119,99,0.04)'; }}
                  >
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* ── Pagination (inside card) — only when more than 10 items ── */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between" style={{ padding: '12px 24px', borderTop: '1px solid var(--border-hair)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Rows</span>
                  <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="filter-trigger" style={{ minWidth: 56 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                    {`${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="flex items-center justify-center rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ width: 28, height: 28, border: '1px solid var(--border-hair)', color: 'var(--ink-muted)', background: 'rgba(255,255,255,0.5)' }}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="flex items-center justify-center rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ width: 28, height: 28, border: '1px solid var(--border-hair)', color: 'var(--ink-muted)', background: 'rgba(255,255,255,0.5)' }}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </>
      )}
    </motion.div>
  );
}
