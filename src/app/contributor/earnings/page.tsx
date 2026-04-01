"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Wallet, Clock, CheckCircle2, CreditCard,
  TrendingUp, ArrowUpRight, ArrowDownRight, ArrowUp, ArrowDown,
  ChevronRight, ChevronLeft, Banknote, CalendarDays,
  Download, ExternalLink, Building2, X, AlertCircle, Settings,
  ShieldCheck, ArrowRight, Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import {
  mockEarnings, mockPayouts, mockEarningsSummary, mockContributorProfile, mockContributorTasks,
} from "@/mocks/data/contributor";

/* ═══ Helpers ═══ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

const earnCfg: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    label: "Pending" },
  eligible:   { color: "var(--color-teal-700)",   bg: "var(--color-teal-50)",    label: "Eligible" },
  processing: { color: "var(--color-brown-700)",  bg: "var(--color-brown-50)",   label: "Processing" },
  paid:       { color: "var(--color-forest-700)", bg: "var(--color-forest-50)",  label: "Paid" },
  failed:     { color: "var(--danger)",           bg: "var(--danger-light)",     label: "Failed" },
};
const payoutCfg: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    label: "Pending" },
  processing: { color: "var(--color-brown-700)",  bg: "var(--color-brown-50)",   label: "Processing" },
  completed:  { color: "var(--color-forest-700)", bg: "var(--color-forest-50)",  label: "Completed" },
  failed:     { color: "var(--danger)",           bg: "var(--danger-light)",     label: "Failed" },
};
const methodLabel: Record<string, string> = { bank_transfer: "Bank Transfer", mobile_money: "Mobile Money", paypal: "PayPal", crypto: "Crypto", upi: "UPI" };

function fmt$(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

const taskMap = new Map(mockContributorTasks.map((t) => [t.id, t]));
function getTask(id: string) { return taskMap.get(id); }

type EarnSortField = "task" | "amount" | "status" | "date";
type PayoutSortField = "reference" | "amount" | "method" | "status" | "date";
type SortDir = "asc" | "desc";

/* ═══ Drawer ═══ */

function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <span className="text-[15px] font-heading font-semibold text-gray-900">{title}</span>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══ Chart ═══ */

const allChartData = [
  { label: "Apr '25", value: 0 }, { label: "May", value: 0 }, { label: "Jun", value: 120 },
  { label: "Jul", value: 180 }, { label: "Aug", value: 340 }, { label: "Sep", value: 280 },
  { label: "Oct", value: 0 }, { label: "Nov", value: 220 }, { label: "Dec", value: 380 },
  { label: "Jan '26", value: 600 }, { label: "Feb", value: 1480 }, { label: "Mar", value: 1120 },
];

function EarningsChart() {
  const [period, setPeriod] = React.useState<"3m" | "6m" | "1y">("6m");
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const sliceCount = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const months = allChartData.slice(-sliceCount);
  const max = Math.max(...months.map((m) => m.value), 100);
  const current = months[months.length - 1];
  const prev = months.length >= 2 ? months[months.length - 2] : { value: 0 };
  const diff = current.value - prev.value;
  const up = diff >= 0;

  const W = 800, H = 320, PL = 56, PR = 28, PT = 20, PB = 44;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const points = months.map((m, i) => ({
    x: PL + (months.length === 1 ? chartW / 2 : (i / (months.length - 1)) * chartW),
    y: PT + chartH - (m.value / max) * chartH,
    ...m,
  }));

  function smoothPath(pts: { x: number; y: number }[]) {
    if (pts.length < 2) return `M${pts[0]?.x ?? 0},${pts[0]?.y ?? 0}`;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      const t = 0.3;
      d += ` C${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
    }
    return d;
  }
  const curvePath = smoothPath(points);
  const areaPath = `${curvePath} L${points[points.length - 1].x},${PT + chartH} L${points[0].x},${PT + chartH} Z`;

  return (
    <div className="card-parchment mb-6">
      {/* Header — matches Section pattern */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">Earnings Over Time</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-forest-500" />
            <span className="text-[11px] font-semibold text-forest-600">
              {months.length >= 2 && max > 0 ? `${up ? "+" : ""}${Math.round(((current.value - months[0].value) / Math.max(months[0].value, 1)) * 100)}%` : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5">
            {(["3m", "6m", "1y"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors",
                  period === p ? "bg-white text-brown-700 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}>{p.toUpperCase()}</button>
            ))}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-400">This month</div>
            <div className="flex items-center gap-1.5">
              <span className="num-display text-[16px] text-gray-900 leading-none">{fmt$(current.value)}</span>
              <span className={cn("flex items-center text-[10px] font-semibold", up ? "text-forest-600" : "text-red-500")}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {fmt$(Math.abs(diff))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart body */}
      <div className="px-6 py-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <linearGradient id="earningsAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brown-400)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--color-brown-400)" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const y = PT + chartH - f * chartH;
            return (
              <g key={i}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="var(--color-gray-100)" strokeWidth="1" />
                <text x={PL - 10} y={y + 4} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}>
                  ${Math.round(f * max).toLocaleString()}
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill="url(#earningsAreaGrad)" />
          <path d={curvePath} fill="none" stroke="var(--color-brown-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => {
            const isCurrent = i === points.length - 1;
            return (
              <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: "pointer" }}>
                <rect x={p.x - 30} y={PT} width={60} height={chartH + PB} fill="transparent" />
                {hoveredIdx === i && <line x1={p.x} y1={PT} x2={p.x} y2={PT + chartH} stroke="var(--color-brown-200)" strokeWidth="1" strokeDasharray="4,4" />}
                <circle cx={p.x} cy={p.y} r={isCurrent ? 6 : hoveredIdx === i ? 5 : 3.5}
                  fill="white" stroke={isCurrent ? "var(--color-brown-500)" : hoveredIdx === i ? "var(--color-brown-400)" : "var(--color-gray-300)"}
                  strokeWidth={isCurrent ? 2.5 : 2} />
                {(hoveredIdx === i || isCurrent) && p.value > 0 && (
                  <>
                    <rect x={p.x - 32} y={p.y - 30} width={64} height={22} rx={6} fill={isCurrent ? "var(--color-brown-600)" : "var(--color-gray-700)"} />
                    <text x={p.x} y={p.y - 15.5} textAnchor="middle" fill="white" style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono, monospace)" }}>
                      ${p.value.toLocaleString()}
                    </text>
                  </>
                )}
                <text x={p.x} y={H - 10} textAnchor="middle" className={isCurrent ? "fill-brown-600" : "fill-gray-400"} style={{ fontSize: 11, fontWeight: isCurrent ? 600 : 500 }}>
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function EarningsPage() {
  const summary = mockEarningsSummary;
  const allEarnings = mockEarnings;
  const allPayouts = mockPayouts;
  const profile = mockContributorProfile;

  /* Drawers */
  const [earningDrawer, setEarningDrawer] = React.useState<any>(null);
  const [payoutDrawer, setPayoutDrawer] = React.useState<any>(null);

  /* G1 — Earnings table state */
  const [earnStatusFilter, setEarnStatusFilter] = React.useState("all");
  const [earnSort, setEarnSort] = React.useState<EarnSortField>("date");
  const [earnSortDir, setEarnSortDir] = React.useState<SortDir>("desc");
  const [earnPageSize, setEarnPageSize] = React.useState(10);
  const [earnPage, setEarnPage] = React.useState(1);

  function handleEarnSort(field: EarnSortField) {
    if (earnSort === field) setEarnSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setEarnSort(field); setEarnSortDir("desc"); }
  }

  const filteredEarnings = React.useMemo(() => {
    let list = earnStatusFilter === "all" ? [...allEarnings] : allEarnings.filter((e: any) => e.status === earnStatusFilter);
    list.sort((a: any, b: any) => {
      let cmp = 0;
      switch (earnSort) {
        case "task": cmp = a.taskTitle.localeCompare(b.taskTitle); break;
        case "amount": cmp = a.amount - b.amount; break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "date": cmp = new Date(a.earnedAt || "2099-01-01").getTime() - new Date(b.earnedAt || "2099-01-01").getTime(); break;
      }
      return earnSortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [allEarnings, earnStatusFilter, earnSort, earnSortDir]);

  const earnTotalPages = Math.max(1, Math.ceil(filteredEarnings.length / earnPageSize));
  const pagedEarnings = filteredEarnings.slice((earnPage - 1) * earnPageSize, earnPage * earnPageSize);
  React.useEffect(() => { setEarnPage(1); }, [earnStatusFilter, earnSort, earnSortDir]);

  /* G3 — Payout table state */
  const [payoutStatusFilter, setPayoutStatusFilter] = React.useState("all");
  const [payoutSort, setPayoutSort] = React.useState<PayoutSortField>("date");
  const [payoutSortDir, setPayoutSortDir] = React.useState<SortDir>("desc");
  const [payoutPageSize, setPayoutPageSize] = React.useState(10);
  const [payoutPage, setPayoutPage] = React.useState(1);

  function handlePayoutSort(field: PayoutSortField) {
    if (payoutSort === field) setPayoutSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setPayoutSort(field); setPayoutSortDir("desc"); }
  }

  const filteredPayouts = React.useMemo(() => {
    let list = payoutStatusFilter === "all" ? [...allPayouts] : allPayouts.filter((p: any) => p.status === payoutStatusFilter);
    list.sort((a: any, b: any) => {
      let cmp = 0;
      switch (payoutSort) {
        case "reference": cmp = a.reference.localeCompare(b.reference); break;
        case "amount": cmp = a.amount - b.amount; break;
        case "method": cmp = (a.method as string).localeCompare(b.method); break;
        case "status": cmp = (a.status as string).localeCompare(b.status); break;
        case "date": cmp = new Date(a.initiatedAt).getTime() - new Date(b.initiatedAt).getTime(); break;
      }
      return payoutSortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [allPayouts, payoutStatusFilter, payoutSort, payoutSortDir]);

  const payoutTotalPages = Math.max(1, Math.ceil(filteredPayouts.length / payoutPageSize));
  const pagedPayouts = filteredPayouts.slice((payoutPage - 1) * payoutPageSize, payoutPage * payoutPageSize);
  React.useEffect(() => { setPayoutPage(1); }, [payoutStatusFilter, payoutSort, payoutSortDir]);

  /* G2 data */
  const processingPayouts = allPayouts.filter((p: any) => p.status === "processing");
  const hasPayoutMethod = true;
  const isWomenTrack = profile.track === "women";

  /* Column header renderer — matches SOW page exactly */
  function ColHeader({ field, activeField, activeDir, onClick, label, align = "left" }: {
    field: string; activeField: string; activeDir: SortDir; onClick: () => void; label: string; align?: string;
  }) {
    const active = field === activeField;
    return (
      <th onClick={onClick} className="cursor-pointer select-none transition-colors"
        style={{ padding: "11px 16px", textAlign: align as any, fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
          color: active ? "var(--ink-mid)" : "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }}>
        <div className="flex items-center gap-1" style={{ justifyContent: align === "center" ? "center" : "flex-start" }}>
          <span>{label}</span>
          <span style={{ opacity: active ? 1 : 0, transition: "opacity 0.15s" }}>
            {active && activeDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
          </span>
        </div>
      </th>
    );
  }

  /* Filter dropdown — matches SOW page exactly */
  function FilterSelect({ value, onValueChange, placeholder, options }: {
    value: string; onValueChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[];
  }) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 rounded-lg bg-white border border-gray-200 px-3 text-[12px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    );
  }

  /* Pagination — matches SOW page exactly */
  function TablePagination({ page, totalPages, total, pageSize, onPage, onPageSize }: {
    page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void; onPageSize: (s: number) => void;
  }) {
    if (totalPages <= 1 && total <= 10) return null;
    return (
      <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">Rows per page</span>
          <Select value={pageSize.toString()} onValueChange={(v) => { onPageSize(Number(v)); onPage(1); }}>
            <SelectTrigger className="h-7 w-auto rounded-lg bg-white border border-gray-200 px-2.5 text-[11px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 52 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gray-400">
            {total > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : "0 results"}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Earnings
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Track your earnings, monitor payout status, and view transaction history.
        </p>
      </motion.div>

      {/* ═══ KYC STATUS ═══ */}
      {profile.kycStatus !== "verified" ? (
        <motion.div variants={fadeUp} className="mb-5">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-50 border border-gold-200">
            <ShieldCheck className="w-5 h-5 text-gold-600 shrink-0" />
            <span className="text-[13px] text-gold-800 flex-1">
              Identity verification required for payouts.
            </span>
            <Link href="/contributor/earnings/kyc" className="inline-flex items-center gap-1 text-[12px] font-semibold text-gold-700 hover:text-gold-900 transition-colors whitespace-nowrap">
              Verify Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="mb-5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-500" />
            KYC Verified
          </div>
        </motion.div>
      )}

      {/* ═══ TABS ═══ */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Earnings Overview</TabsTrigger>
            <TabsTrigger value="payout-status">Payout Status</TabsTrigger>
            <TabsTrigger value="payout-history">Payout History</TabsTrigger>
          </TabsList>

          {/* ━━━ TAB 1: EARNINGS OVERVIEW (G1) ━━━ */}
          <TabsContent value="overview">

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
              {[
                { label: "Total Earned", value: fmt$(summary.totalEarned), icon: DollarSign, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
                { label: "Eligible for Payout", value: fmt$(summary.eligible), icon: Wallet, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
                { label: "Pending Review", value: fmt$(summary.pending), icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
                { label: "Paid Out", value: fmt$(summary.paidOut), icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
              ].map((kpi) => {
                const KpiIcon = kpi.icon;
                return (
                  <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
                    <div className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                      <KpiIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                      <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Chart */}
            <EarningsChart />

            {/* Earnings Table */}
            <div className="card-parchment">
              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="text-sm font-semibold text-gray-800">Earnings List</span>
              </div>

              {/* Filter row */}
              <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                <div className="flex items-center gap-2">
                  <FilterSelect value={earnStatusFilter} onValueChange={setEarnStatusFilter} placeholder="All Status"
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "eligible", label: "Eligible" },
                      { value: "pending", label: "Pending" },
                      { value: "paid", label: "Paid" },
                      { value: "processing", label: "Processing" },
                    ]} />
                  {earnStatusFilter !== "all" && (
                    <button onClick={() => setEarnStatusFilter("all")} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <span className="font-mono text-[11px] text-gray-400">{filteredEarnings.length} result{filteredEarnings.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <ColHeader field="task" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("task")} label="Task / Project" />
                      <ColHeader field="amount" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("amount")} label="Gross" />
                      <th style={{ padding: "11px 16px", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }}>
                        <div className="flex items-center gap-1" title="GlimmoraTeam platform fee (15%)">
                          <span>Platform Fee</span>
                          <Info className="w-3 h-3 text-gray-300" />
                        </div>
                      </th>
                      <th style={{ padding: "11px 16px", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-gray-400)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }}>
                        <span>Net Amount</span>
                      </th>
                      <ColHeader field="status" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("status")} label="Status" />
                      <ColHeader field="date" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("date")} label="Date" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedEarnings.map((e: any) => {
                      const ec = earnCfg[e.status] || earnCfg.pending;
                      return (
                        <tr key={e.id} onClick={() => setEarningDrawer(e)}
                          className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                          style={{ borderBottom: "1px solid var(--border-hair)" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="text-[13px] font-medium text-gray-800 truncate max-w-[280px]">{e.taskTitle}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{e.projectTitle}</div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[13px] font-semibold text-gray-900 font-mono">{fmt$(e.amount)}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[12px] font-mono text-red-400">-{fmt$(e.platformFee ?? Math.round(e.amount * 0.15))}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[13px] font-semibold text-forest-700 font-mono">{fmt$(e.netAmount ?? e.amount - Math.round(e.amount * 0.15))}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Pill bg={ec.bg} color={ec.color}>{ec.label}</Pill>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[11.5px] text-gray-500">{e.earnedAt ? fmtDate(e.earnedAt) : "—"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredEarnings.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] text-gray-400">{earnStatusFilter === "all" ? "Complete and get your first task accepted to start earning!" : `No ${earnStatusFilter} earnings found.`}</p>
                  </div>
                )}
              </div>
              <TablePagination page={earnPage} totalPages={earnTotalPages} total={filteredEarnings.length} pageSize={earnPageSize} onPage={setEarnPage} onPageSize={setEarnPageSize} />
            </div>
          </TabsContent>

          {/* ━━━ TAB 2: PAYOUT STATUS (G2) ━━━ */}
          <TabsContent value="payout-status">

            {/* Next Payout — hero card, full width */}
            <div className="card-parchment mb-4">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="text-sm font-semibold text-gray-800">Next Payout</span>
                <span className="text-[11px] text-gray-400">Bi-weekly cycle · Min. $50</span>
              </div>
              <div className="px-6 py-6">
                <div className="flex items-center gap-8 lg:gap-16">
                  {/* Date */}
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Scheduled Date</div>
                    <div className="num-display text-[28px] text-gray-900 leading-none mt-2">Apr 1, 2026</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-100 hidden lg:block" />
                  {/* Eligible */}
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Eligible Amount</div>
                    <div className="num-display text-[28px] text-forest-600 leading-none mt-2">{fmt$(summary.eligible)}</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-100 hidden lg:block" />
                  {/* Method */}
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Method</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-[13px] font-medium text-gray-800">Bank ****4521</span>
                      <Pill bg="var(--color-forest-50)" color="var(--color-forest-700)">Verified</Pill>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Balance + Method + Processing — 3 column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

              {/* Wallet Breakdown */}
              <div className="card-parchment">
                <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  <span className="text-sm font-semibold text-gray-800">Wallet Balance</span>
                </div>
                <div className="px-6 py-5">
                  <div className="num-display text-[28px] text-gray-900 leading-none">{fmt$(summary.totalEarned - summary.paidOut)}</div>
                  {/* Breakdown bar */}
                  <div className="flex h-2 rounded-full overflow-hidden mt-4 bg-gray-100">
                    {summary.eligible > 0 && <div className="bg-teal-500 transition-all" style={{ width: `${(summary.eligible / (summary.totalEarned - summary.paidOut)) * 100}%` }} />}
                    {summary.pending > 0 && <div className="bg-gold-400 transition-all" style={{ width: `${(summary.pending / (summary.totalEarned - summary.paidOut)) * 100}%` }} />}
                    {summary.processing > 0 && <div className="bg-brown-400 transition-all" style={{ width: `${(summary.processing / (summary.totalEarned - summary.paidOut)) * 100}%` }} />}
                  </div>
                  {/* Legend */}
                  <div className="mt-3 space-y-2">
                    {[
                      { label: "Eligible", value: fmt$(summary.eligible), color: "bg-teal-500" },
                      { label: "Pending", value: fmt$(summary.pending), color: "bg-gold-400" },
                      { label: "Processing", value: fmt$(summary.processing), color: "bg-brown-400" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-[11px] text-gray-500">{item.label}</span>
                        </div>
                        <span className="text-[12px] font-mono font-medium text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payout Method */}
              <div className="card-parchment">
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  <span className="text-sm font-semibold text-gray-800">Payout Method</span>
                  <Link href="/contributor/settings" className="text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">Manage</Link>
                </div>
                <div className="px-6 py-5">
                  {hasPayoutMethod ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-gray-800">Bank Transfer</span>
                            <Pill bg="var(--color-forest-50)" color="var(--color-forest-700)">Verified</Pill>
                          </div>
                          <span className="text-[11px] text-gray-400">****4521 · Standard Bank</span>
                        </div>
                      </div>
                      <div className="space-y-0">
                        {[
                          { label: "Processing Time", value: "2–3 business days" },
                          { label: "Minimum Payout", value: "$50.00" },
                          { label: "Payout Cycle", value: "Bi-weekly" },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <span className="text-[11px] text-gray-400">{row.label}</span>
                            <span className="text-[11px] text-gray-600">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      {isWomenTrack && (
                        <Link href="/contributor/settings#payout-methods" className="flex items-center justify-between mt-4 p-3 rounded-xl border border-dashed border-gray-200 hover:bg-gray-50 transition-colors">
                          <div>
                            <span className="text-[12px] font-semibold text-gray-700">Mobile Money</span>
                            <p className="text-[10px] text-gray-400 mt-0.5">JazzCash / EasyPaisa</p>
                          </div>
                          <span className="text-[11px] font-medium text-brown-500">Set up</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gold-500" />
                      <p className="text-[13px] font-semibold text-gray-800 mb-1">No method configured</p>
                      <p className="text-[11px] text-gray-500 mb-3">Set up a payout method to receive payments.</p>
                      <Link href="/contributor/settings#payout-methods"
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <Settings className="w-3.5 h-3.5" /> Set Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Currently Processing */}
              <div className="card-parchment">
                <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  <span className="text-sm font-semibold text-gray-800">Processing</span>
                </div>
                <div className="px-6 py-5">
                  {processingPayouts.length > 0 ? (
                    <div className="space-y-3">
                      {processingPayouts.map((p: any) => {
                        const pc = payoutCfg[p.status];
                        return (
                          <div key={p.id} className="cursor-pointer hover:bg-black/[0.02] -mx-2 px-2 py-2 rounded-xl transition-colors"
                            onClick={() => setPayoutDrawer(p)}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[12px] font-medium text-gray-800">{p.reference}</span>
                              <span className="text-[13px] font-semibold font-mono text-gray-900">{fmt$(p.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400">{fmtDate(p.initiatedAt)}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-brown-400 animate-pulse" />
                                <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-brown-400 animate-pulse" style={{ width: "60%" }} />
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 block">Est. 2–3 business days</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                      <p className="text-[12px] text-gray-400">No payouts in progress</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">All recent payouts have been completed.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-payout note */}
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-teal-50/50">
              <CalendarDays className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-[11px] text-teal-700">Payouts are processed automatically. Eligible earnings are sent to your configured method on each payout cycle.</span>
            </div>
          </TabsContent>

          {/* ━━━ TAB 3: PAYOUT HISTORY (G3) ━━━ */}
          <TabsContent value="payout-history">
            <div className="card-parchment">
              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="text-sm font-semibold text-gray-800">Payout History</span>
              </div>

              {/* Filter row */}
              <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                <div className="flex items-center gap-2">
                  <FilterSelect value={payoutStatusFilter} onValueChange={setPayoutStatusFilter} placeholder="All Status"
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "completed", label: "Completed" },
                      { value: "processing", label: "Processing" },
                      { value: "failed", label: "Failed" },
                    ]} />
                  {payoutStatusFilter !== "all" && (
                    <button onClick={() => setPayoutStatusFilter("all")} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <span className="font-mono text-[11px] text-gray-400">{filteredPayouts.length} result{filteredPayouts.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <ColHeader field="reference" activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("reference")} label="Reference" />
                      <ColHeader field="amount" activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("amount")} label="Amount" />
                      <ColHeader field="method" activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("method")} label="Method" />
                      <ColHeader field="status" activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("status")} label="Status" />
                      <ColHeader field="date" activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("date")} label="Date" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPayouts.map((p: any) => {
                      const pc = payoutCfg[p.status] || payoutCfg.pending;
                      return (
                        <tr key={p.id} onClick={() => setPayoutDrawer(p)}
                          className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                          style={{ borderBottom: "1px solid var(--border-hair)" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="text-[13px] font-medium text-gray-800">{p.reference}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p.earningIds?.length || 0} task{(p.earningIds?.length || 0) !== 1 ? "s" : ""} included</div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[13px] font-semibold text-gray-900 font-mono">{fmt$(p.amount)}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              <span className="text-[12px] text-gray-600">{methodLabel[p.method] || p.method}</span>
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[11.5px] text-gray-500">{fmtDate(p.initiatedAt)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredPayouts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <Banknote className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] text-gray-400">{payoutStatusFilter === "all" ? "No payouts yet. Earnings become eligible for payout when tasks are accepted." : `No ${payoutStatusFilter} payouts found.`}</p>
                  </div>
                )}
              </div>
              <TablePagination page={payoutPage} totalPages={payoutTotalPages} total={filteredPayouts.length} pageSize={payoutPageSize} onPage={setPayoutPage} onPageSize={setPayoutPageSize} />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ═══ G4: EARNINGS BREAKDOWN DRAWER ═══ */}
      <Drawer open={!!earningDrawer} onClose={() => setEarningDrawer(null)} title="Task Earnings Breakdown">
        {earningDrawer && (() => {
          const e = earningDrawer;
          const ec = earnCfg[e.status] || earnCfg.pending;
          const task = getTask(e.taskId);
          const platformFee = Math.round(e.amount * 0.1);
          const taxWithholding = 0;
          const net = e.amount - platformFee - taxWithholding;
          return (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2"><Pill bg={ec.bg} color={ec.color}>{ec.label}</Pill></div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{e.taskTitle}</h3>
                <p className="text-[12px] text-gray-400">{e.projectTitle}</p>
                {e.earnedAt && <p className="text-[11px] text-gray-400 mt-1">Accepted: {fmtDate(e.earnedAt)}</p>}
              </div>
              <div className="rounded-xl p-5 mb-6 text-center" style={{ background: "linear-gradient(135deg, var(--color-forest-50), var(--color-teal-50))" }}>
                <div className="text-[10px] text-gray-400 font-medium mb-1">Net Earnings</div>
                <div className="num-display text-[32px] text-forest-600 leading-none">{fmt$(net)}</div>
              </div>
              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pricing Breakdown</span>
                <div className="mt-3">
                  {[
                    { label: "Rate Card", value: task ? task.pricing.model : "—" },
                    { label: "Rate", value: task ? fmt$(task.pricing.amount) : fmt$(e.amount) },
                    { label: "Estimated Effort", value: task ? `${task.estimatedHours} hours` : "—" },
                    { label: "Gross Amount", value: fmt$(e.amount), bold: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className={cn("text-[12px] font-mono", row.bold ? "font-semibold text-gray-800" : "text-gray-600")}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <span className="text-[12px] text-gray-400">Platform Fee (10%)</span>
                    <span className="text-[12px] font-mono text-red-400">-{fmt$(platformFee)}</span>
                  </div>
                  {taxWithholding > 0 && (
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">Tax Withholding</span>
                      <span className="text-[12px] font-mono text-red-400">-{fmt$(taxWithholding)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[12px] font-semibold text-gray-700">Net Earnings</span>
                    <span className="text-[13px] font-mono font-bold text-forest-600">{fmt$(net)}</span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payout Status</span>
                <div className="mt-3">
                  {[
                    { label: "Status", value: ec.label },
                    { label: "Paid", value: e.paidAt ? fmtDate(e.paidAt) : "Not yet — will be in next cycle" },
                    { label: "Payout Ref", value: e.payoutId || "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className="text-[12px] text-gray-600">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 mb-5">
                <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-[11px] text-gray-500">If you believe this pricing is incorrect, <Link href="/contributor/support" className="text-brown-500 hover:text-brown-600 font-medium">contact support</Link>.</span>
              </div>
              {task && (
                <Link href={`/contributor/tasks/${task.id}`} onClick={() => setEarningDrawer(null)}
                  className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 px-4 py-2.5 rounded-xl transition-all w-full">
                  <ExternalLink className="w-3.5 h-3.5" /> View Task Detail
                </Link>
              )}
            </>
          );
        })()}
      </Drawer>

      {/* ═══ G3 Step 2: PAYOUT DETAIL DRAWER ═══ */}
      <Drawer open={!!payoutDrawer} onClose={() => setPayoutDrawer(null)} title="Payout Detail">
        {payoutDrawer && (() => {
          const p = payoutDrawer;
          const pc = payoutCfg[p.status] || payoutCfg.pending;
          const includedEarnings = allEarnings.filter((e: any) => p.earningIds?.includes(e.id));
          const totalGross = includedEarnings.reduce((s: number, e: any) => s + e.amount, 0);
          const totalFee = Math.round(totalGross * 0.1);
          const netPayout = totalGross - totalFee;
          return (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2"><Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill></div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{p.reference}</h3>
                <p className="text-[12px] text-gray-400">{methodLabel[p.method] || p.method}{p.bankLast4 ? ` · ****${p.bankLast4}` : ""}</p>
              </div>
              <div className="rounded-xl p-5 mb-6 text-center" style={{ background: "linear-gradient(135deg, var(--color-forest-50), var(--color-teal-50))" }}>
                <div className="text-[10px] text-gray-400 font-medium mb-1">Payout Amount</div>
                <div className="num-display text-[32px] text-forest-600 leading-none">{fmt$(p.amount)}</div>
              </div>
              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tasks Included ({includedEarnings.length})</span>
                <div className="mt-3">
                  {includedEarnings.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <div className="min-w-0 flex-1 mr-3">
                        <span className="text-[12px] text-gray-700 block truncate">{e.taskTitle}</span>
                        <span className="text-[10px] text-gray-400">{e.projectTitle}</span>
                      </div>
                      <span className="text-[12px] font-mono font-semibold text-gray-700 shrink-0">{fmt$(e.amount)}</span>
                    </div>
                  ))}
                  {includedEarnings.length === 0 && <p className="text-[12px] text-gray-400 py-3">Task details not available for this payout.</p>}
                </div>
              </div>
              {includedEarnings.length > 0 && (
                <div className="mb-6">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Breakdown</span>
                  <div className="mt-3">
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">Gross Total</span><span className="text-[12px] font-mono text-gray-600">{fmt$(totalGross)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">Platform Fees</span><span className="text-[12px] font-mono text-red-400">-{fmt$(totalFee)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span className="text-[12px] font-semibold text-gray-700">Net Amount</span><span className="text-[13px] font-mono font-bold text-forest-600">{fmt$(netPayout)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Timeline</span>
                <div className="mt-3">
                  {[
                    { label: "Initiated", value: fmtDate(p.initiatedAt) },
                    { label: "Completed", value: p.completedAt ? fmtDate(p.completedAt) : "In progress — est. 2–3 business days" },
                    { label: "Method", value: `${methodLabel[p.method] || p.method}${p.bankLast4 ? ` ****${p.bankLast4}` : ""}` },
                    { label: "Transaction Ref", value: p.reference },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span><span className="text-[12px] text-gray-600">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => toast.success("Receipt downloaded", "payout-receipt.pdf saved to your downloads")} className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 px-4 py-2.5 rounded-xl transition-all w-full">
                <Download className="w-3.5 h-3.5" /> Download Receipt (PDF)
              </button>
            </>
          );
        })()}
      </Drawer>

    </motion.div>
  );
}
