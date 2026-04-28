"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Wallet, Clock, CheckCircle2, CreditCard,
  TrendingUp, ArrowUpRight, ArrowDownRight, ArrowUp, ArrowDown,
  ChevronRight, ChevronLeft, Banknote, CalendarDays,
  Download, ExternalLink, Building2, X, AlertCircle, Settings,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";
import {
  mockEarnings, mockPayouts, mockContributorProfile, mockContributorTasks,
} from "@/mocks/data/contributor";
import {
  fetchEarningsSummary, fetchEarningsOverview, fetchEarningsChart, fetchEarnings,
  fetchKycStatus, startKyc, fetchEarningById, fetchPayoutById, fetchPayouts, fetchPayoutReceipt,
  fetchPayoutPreferences, updatePayoutPreferences,
  type EarningsSummary, type ChartPeriod, type EarningsListParams, type PayoutPreferences,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";

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

export type ChartPoint = { label: string; value: number };

/* Maps the UI period key to the exact value the API expects */
const PERIOD_API_MAP: Record<"3m" | "6m" | "1y", ChartPeriod> = {
  "3m": "3M",
  "6m": "6m",
  "1y": "1y",
};

/* Normalise whatever the API returns into ChartPoint[] */
function parseChartString(raw: string): ChartPoint[] {
  try {
    const parsed = JSON.parse(raw);
    const arr: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data) ? parsed.data
      : Array.isArray(parsed?.points) ? parsed.points
      : Array.isArray(parsed?.chart) ? parsed.chart
      : [];
    return arr
      .map((item: unknown) => {
        const o = item as Record<string, unknown>;
        const label = String(o.label ?? o.month ?? o.period ?? o.name ?? "");
        const value = Number(o.value ?? o.amount ?? o.total ?? 0);
        return { label, value };
      })
      .filter((pt) => pt.label !== "");
  } catch {
    return [];
  }
}

function buildFallbackChartData(): ChartPoint[] {
  // Fallback from local earnings records when chart API returns empty/unexpected payload.
  const monthly = new Map<string, number>();
  for (const row of mockEarnings) {
    const d = new Date(String(row.earnedAt ?? row.earned_at ?? ""));
    if (Number.isNaN(d.getTime())) continue;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const amount = Number(row.amount ?? 0);
    monthly.set(label, (monthly.get(label) ?? 0) + amount);
  }
  return Array.from(monthly.entries()).map(([label, value]) => ({ label, value }));
}

function EarningsChart() {
  const { data: session, status: sessionStatus } = useSession();
  const token = getContributorAccessToken(session);
  const [period, setPeriod] = React.useState<"3m" | "6m" | "1y">("6m");
  const [retryCount, setRetryCount] = React.useState(0);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const [allChartData, setAllChartData] = React.useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = React.useState(false);
  const [chartError, setChartError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) {
      setAllChartData(buildFallbackChartData());
      setChartLoading(false);
      return;
    }
    setChartLoading(true);
    setChartError(null);
    fetchEarningsChart(token, PERIOD_API_MAP[period])
      .then((raw) => {
        const parsed = parseChartString(raw);
        setAllChartData(parsed.length > 0 ? parsed : buildFallbackChartData());
        setChartLoading(false);
      })
      .catch((err: unknown) => {
        setAllChartData(buildFallbackChartData());
        setChartError(err instanceof Error ? err.message : "Failed to load chart");
        setChartLoading(false);
      });
  }, [token, sessionStatus, period, retryCount]);

  const sliceCount = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const months = allChartData.slice(-sliceCount);
  const hasData = months.length > 0;
  const max = Math.max(...months.map((m) => m.value), 100);
  const current = hasData ? months[months.length - 1] : { label: "", value: 0 };
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
  const curvePath = hasData ? smoothPath(points) : "";
  const areaPath = hasData ? `${curvePath} L${points[points.length - 1].x},${PT + chartH} L${points[0].x},${PT + chartH} Z` : "";

  return (
    <div className="card-parchment mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">Earnings Over Time</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-forest-500" />
            <span className="text-[11px] font-semibold text-forest-600">
              {!chartLoading && months.length >= 2 && max > 0
                ? `${up ? "+" : ""}${Math.round(((current.value - months[0].value) / Math.max(months[0].value, 1)) * 100)}%`
                : "—"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Period selector — triggers a fresh API call */}
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
            {chartLoading ? (
              <div className="h-4 w-16 rounded-md bg-gray-100 animate-pulse mt-0.5" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="num-display text-[16px] text-gray-900 leading-none">{fmt$(current.value)}</span>
                <span className={cn("flex items-center text-[10px] font-semibold", up ? "text-forest-600" : "text-red-500")}>
                  {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {fmt$(Math.abs(diff))}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart body */}
      <div className="px-6 py-5">
        {chartLoading ? (
          /* Skeleton bars while loading */
          <div className="flex items-end gap-3 h-[120px] px-4">
            {Array.from({ length: period === "3m" ? 3 : period === "6m" ? 6 : 12 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gray-100 animate-pulse"
                style={{ height: `${30 + ((i * 17) % 70)}%` }} />
            ))}
          </div>
        ) : chartError ? (
          /* 422 / network error inline */
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-[12px] text-red-500 text-center max-w-xs">{chartError}</p>
            <button onClick={() => setRetryCount((c) => c + 1)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors mt-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : !hasData ? (
          <div className="py-12 text-center text-[12px] text-gray-400">No earnings data yet</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

const SUMMARY_FALLBACK: EarningsSummary = {
  total_earned: 0,
  eligible: 0,
  pending: 0,
  processing: 0,
  paid_out: 0,
  currency: "USD",
  current_month: 0,
  previous_month: 0,
  lifetime_tasks_completed: 0,
  average_per_task: 0,
};

export default function EarningsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const token = getContributorAccessToken(session);

  const [summary, setSummary] = React.useState<EarningsSummary>(SUMMARY_FALLBACK);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setSummaryLoading(false); return; }
    setSummaryLoading(true);
    setSummaryError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:earn-summary:${sk}`, () => fetchEarningsSummary(token))
      .then((data) => {
        if (!live) return;
        setSummary(data);
        setSummaryLoading(false);
      })
      .catch((err: Error) => {
        if (!live) return;
        setSummaryError(err.message ?? "Failed to load earnings summary");
        setSummaryLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus]);
  
  /* ── Overview (earnings list + chart) ─────────────────────────── */
  const [overviewRaw, setOverviewRaw] = React.useState<string>("");
  const [overviewLoading, setOverviewLoading] = React.useState(true);
  const [overviewError, setOverviewError] = React.useState<string | null>(null);

  const loadOverview = React.useCallback((t: string) => {
    setOverviewLoading(true);
    setOverviewError(null);
    fetchEarningsOverview(t)
      .then((raw) => { setOverviewRaw(raw); setOverviewLoading(false); })
      .catch((err: Error) => { setOverviewError(err.message ?? "Failed to load earnings overview"); setOverviewLoading(false); });
  }, []);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setOverviewLoading(false); return; }
    setOverviewLoading(true);
    setOverviewError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:earn-overview:${sk}`, () => fetchEarningsOverview(token))
      .then((raw) => {
        if (!live) return;
        setOverviewRaw(raw);
        setOverviewLoading(false);
      })
      .catch((err: Error) => {
        if (!live) return;
        setOverviewError(err.message ?? "Failed to load earnings overview");
        setOverviewLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus]);
  
  /* Parse the raw string the API returns — may be JSON-encoded */
  const parsedOverview = React.useMemo<Record<string, unknown> | unknown[] | null>(() => {
    if (!overviewRaw) return null;
    try { return JSON.parse(overviewRaw); } catch { return null; }
  }, [overviewRaw]);

  /* Derive earnings list — supports both array and { items/earnings: [...] } shapes */
  const apiEarnings: Record<string, unknown>[] = React.useMemo(() => {
    if (!parsedOverview) return [];
    if (Array.isArray(parsedOverview)) return parsedOverview as Record<string, unknown>[];
    const obj = parsedOverview as Record<string, unknown>;
    const list = obj.items ?? obj.earnings ?? obj.data ?? obj.records ?? [];
    return Array.isArray(list) ? list as Record<string, unknown>[] : [];
  }, [parsedOverview]);

  /* ── KYC status ────────────────────────────────────────────────── */
  const [kycRaw, setKycRaw] = React.useState<unknown>(null);
  const [kycLoading, setKycLoading] = React.useState(true);
  const [kycError, setKycError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setKycLoading(false);
      return;
    }
    setKycLoading(true);
    setKycError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:earn-kyc:${sk}`, () => fetchKycStatus(token))
      .then((raw) => {
        if (!live) return;
        setKycRaw(raw);
        setKycLoading(false);
      })
      .catch((err: Error) => {
        if (!live) return;
        setKycError(err.message ?? "Failed to load KYC status");
        setKycLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus]);
  
  const [kycStarting, setKycStarting] = React.useState(false);
  const [kycStartError, setKycStartError] = React.useState<string | null>(null);

  async function handleStartKyc() {
    if (!token || kycStarting) return;
    setKycStarting(true);
    setKycStartError(null);
    console.log("[KYC Start] → POST /api/contributor/earnings/kyc/start");
    try {
      const raw = await startKyc(token);
      console.log("[KYC Start] ✓ 200 — response:", raw);
      /* If the response is (or contains) a URL, redirect the user */
      const maybeUrl = (() => {
        if (typeof raw === "string" && (raw.startsWith("http://") || raw.startsWith("https://"))) return raw;
        try {
          const parsed = raw as unknown as Record<string, unknown>;
          if (typeof parsed === "object" && parsed !== null) {
            const url = parsed.url ?? parsed.redirect_url ?? parsed.kyc_url ?? parsed.link;
            if (typeof url === "string" && url.startsWith("http")) return url;
          }
        } catch { /* ignore */ }
        return null;
      })();
      if (maybeUrl) {
        window.location.href = maybeUrl;
      } else {
        toast.success("KYC started", typeof raw === "string" ? raw : "Follow the instructions to complete your verification.");
        /* Refresh KYC status after starting */
        setKycRaw(null);
        setKycLoading(true);
        fetchKycStatus(token)
          .then((s) => { setKycRaw(s); setKycLoading(false); })
          .catch(() => setKycLoading(false));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start KYC";
      console.error("[KYC Start] ✗ —", msg);
      setKycStartError(msg);
    } finally {
      setKycStarting(false);
    }
  }

  /* Normalise whatever the API returns into a lowercase status key */
  const kycStatus = React.useMemo((): string => {
    if (kycRaw === null || kycRaw === undefined) return "unknown";

    /* Already a plain object (API returned JSON object) */
    if (typeof kycRaw === "object" && !Array.isArray(kycRaw)) {
      const obj = kycRaw as Record<string, unknown>;
      return String(obj.status ?? obj.kyc_status ?? obj.state ?? obj.value ?? "unknown").toLowerCase();
    }

    /* Number or boolean */
    if (typeof kycRaw !== "string") return String(kycRaw).toLowerCase();

    /* Plain string — try JSON-parsing it first */
    try {
      const parsed = JSON.parse(kycRaw);
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        return String(obj.status ?? obj.kyc_status ?? obj.state ?? obj.value ?? "unknown").toLowerCase();
      }
      return String(parsed).toLowerCase();
    } catch {
      /* Not JSON-encoded — use raw string directly */
      return kycRaw.toLowerCase().trim();
    }
  }, [kycRaw]);

  const allPayouts = mockPayouts;
  const profile = mockContributorProfile;

  /* Drawers */
  const [earningDrawer, setEarningDrawer] = React.useState<any>(null);
  const [payoutDrawer, setPayoutDrawer] = React.useState<any>(null);

  /* Payout detail — fetched when payout drawer opens */
  const [payoutDetail, setPayoutDetail] = React.useState<Record<string, unknown> | null>(null);
  const [payoutDetailLoading, setPayoutDetailLoading] = React.useState(false);
  const [payoutDetailError, setPayoutDetailError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!payoutDrawer || !token) {
      setPayoutDetail(null);
      setPayoutDetailError(null);
      return;
    }
    const id = payoutDrawer.id ?? payoutDrawer.payout_id;
    if (!id) return;
    setPayoutDetailLoading(true);
    setPayoutDetailError(null);
    setPayoutDetail(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:payout-detail:${id}:${sk}`, () => fetchPayoutById(token, id))
      .then((raw) => {
        if (!live) return;
        let parsed: Record<string, unknown> = {};
        if (typeof raw === "string") {
          try { parsed = JSON.parse(raw); } catch { parsed = {}; }
        } else if (raw && typeof raw === "object") {
          parsed = raw as Record<string, unknown>;
        }
        setPayoutDetail(parsed);
        setPayoutDetailLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setPayoutDetailError(err instanceof Error ? err.message : "Failed to load payout detail");
        setPayoutDetailLoading(false);
      });
    return () => {
      live = false;
    };
  }, [payoutDrawer?.id ?? payoutDrawer?.payout_id, token]);

  /* Payout receipt — fetched when payout drawer opens */
  const [receipt, setReceipt] = React.useState<Record<string, unknown> | null>(null);
  const [receiptLoading, setReceiptLoading] = React.useState(false);
  const [receiptError, setReceiptError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!payoutDrawer || !token) {
      setReceipt(null);
      setReceiptError(null);
      return;
    }
    const id = payoutDrawer.id ?? payoutDrawer.payout_id;
    if (!id) return;
    setReceiptLoading(true);
    setReceiptError(null);
    setReceipt(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:payout-receipt:${id}:${sk}`, () => fetchPayoutReceipt(token, id))
      .then((raw) => {
        if (!live) return;
        let parsed: Record<string, unknown> = {};
        if (typeof raw === "string") {
          try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
        } else if (raw && typeof raw === "object") {
          parsed = raw as Record<string, unknown>;
        }
        setReceipt(parsed);
        setReceiptLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setReceiptError(err instanceof Error ? err.message : "Failed to load receipt");
        setReceiptLoading(false);
      });
    return () => {
      live = false;
    };
  }, [payoutDrawer?.id ?? payoutDrawer?.payout_id, token]);

  /* Earning detail (fetched when drawer opens) */
  const [drawerDetail, setDrawerDetail] = React.useState<Record<string, unknown> | null>(null);
  const [drawerDetailLoading, setDrawerDetailLoading] = React.useState(false);
  const [drawerDetailError, setDrawerDetailError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!earningDrawer || !token) {
      setDrawerDetail(null);
      setDrawerDetailError(null);
      return;
    }
    const id = earningDrawer.id ?? earningDrawer.earning_id;
    if (!id) return;
    setDrawerDetailLoading(true);
    setDrawerDetailError(null);
    setDrawerDetail(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:earning-detail:${id}:${sk}`, () => fetchEarningById(token, id))
      .then((raw) => {
        if (!live) return;
        let parsed: Record<string, unknown> = {};
        if (typeof raw === "string") {
          try { parsed = JSON.parse(raw); } catch { parsed = {}; }
        } else if (raw && typeof raw === "object") {
          parsed = raw as Record<string, unknown>;
        }
        setDrawerDetail(parsed);
        setDrawerDetailLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setDrawerDetailError(err instanceof Error ? err.message : "Failed to load detail");
        setDrawerDetailLoading(false);
      });
    return () => {
      live = false;
    };
  }, [earningDrawer?.id ?? earningDrawer?.earning_id, token]);

  /* ── G1: Earnings table — filter / sort / pagination state ─────── */
  const [earnStatusFilter, setEarnStatusFilter] = React.useState("all");
  const [earnSort, setEarnSort] = React.useState<EarnSortField>("date");
  const [earnSortDir, setEarnSortDir] = React.useState<SortDir>("desc");
  const [earnPageSize, setEarnPageSize] = React.useState(10);
  const [earnPage, setEarnPage] = React.useState(1);
  const [listRetryCount, setListRetryCount] = React.useState(0);

  /* Reset to page 1 whenever filter or sort changes */
  React.useEffect(() => { setEarnPage(1); }, [earnStatusFilter, earnSort, earnSortDir]);

  function handleEarnSort(field: EarnSortField) {
    if (earnSort === field) setEarnSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setEarnSort(field); setEarnSortDir("desc"); }
  }

  /* ── G1: Earnings list API ─────────────────────────────────────── */
  const [listItems, setListItems] = React.useState<Record<string, unknown>[]>([]);
  const [listTotal, setListTotal] = React.useState(0);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setListLoading(false); return; }
    setListLoading(true);
    setListError(null);

    const params: EarningsListParams = {
      sort_by: earnSort,
      sort_dir: earnSortDir,
      page: earnPage,
      page_size: earnPageSize,
      ...(earnStatusFilter !== "all" && { status: earnStatusFilter }),
    };
    const sk = sessionKeyFragment(token);
    const qk = JSON.stringify({ ...params, listRetryCount });
    let live = true;

    void dedupeAsync(`contrib:earn-list:${sk}:${qk}`, () => fetchEarnings(token, params))
      .then((raw) => {
        if (!live) return;
        let items: Record<string, unknown>[] = [];
        let total = 0;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            items = parsed as Record<string, unknown>[];
            total = items.length;
          } else if (parsed && typeof parsed === "object") {
            const obj = parsed as Record<string, unknown>;
            const list = obj.items ?? obj.earnings ?? obj.data ?? obj.results ?? [];
            items = Array.isArray(list) ? list as Record<string, unknown>[] : [];
            total = Number(obj.total ?? obj.count ?? obj.total_count ?? items.length);
          }
        } catch { /* raw is not JSON — leave items empty */ }
        setListItems(items);
        setListTotal(total);
        setListLoading(false);
      })
      .catch((err: Error) => {
        if (!live) return;
        setListError(err.message ?? "Failed to load earnings");
        setListLoading(false);
      });

    return () => {
      live = false;
    };
  }, [token, sessionStatus, earnStatusFilter, earnSort, earnSortDir, earnPage, earnPageSize, listRetryCount]);

  /* Server handles filtering/sorting/pagination — use API items directly */
  const pagedEarnings = listItems;
  const earnTotalPages = Math.max(1, Math.ceil(listTotal / earnPageSize));

  /* G3 — Payout table state */
  const [payoutStatusFilter, setPayoutStatusFilter] = React.useState("all");
  const [payoutSort, setPayoutSort] = React.useState<PayoutSortField>("date");
  const [payoutSortDir, setPayoutSortDir] = React.useState<SortDir>("desc");
  const [payoutPageSize, setPayoutPageSize] = React.useState(10);
  const [payoutPage, setPayoutPage] = React.useState(1);

  /* G3 — Payout API state */
  const [payoutItems, setPayoutItems] = React.useState<Record<string, unknown>[]>([]);
  const [payoutTotal, setPayoutTotal] = React.useState(0);
  const [payoutLoading, setPayoutLoading] = React.useState(true);
  const [payoutError, setPayoutError] = React.useState<string | null>(null);
  const [payoutRetryCount, setPayoutRetryCount] = React.useState(0);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setPayoutLoading(false); return; }
    setPayoutLoading(true);
    setPayoutError(null);
    const sortFieldMap: Record<PayoutSortField, string> = {
      reference: "reference", amount: "amount", method: "method", status: "status", date: "date",
    };
    const req = {
      status:    payoutStatusFilter !== "all" ? payoutStatusFilter : undefined,
      sort_by:   sortFieldMap[payoutSort],
      sort_dir:  payoutSortDir,
      page:      payoutPage,
      page_size: payoutPageSize,
    };
    const sk = sessionKeyFragment(token);
    const qk = JSON.stringify({ ...req, payoutRetryCount });
    let live = true;
    void dedupeAsync(`contrib:payouts-list:${sk}:${qk}`, () => fetchPayouts(token, req))
      .then((raw) => {
        if (!live) return;
        let parsed: Record<string, unknown> = {};
        if (typeof raw === "string") {
          try { parsed = JSON.parse(raw); } catch { parsed = {}; }
        } else if (raw && typeof raw === "object") {
          parsed = raw as Record<string, unknown>;
        }
        const items = (parsed.items ?? parsed.payouts ?? parsed.data ?? []) as Record<string, unknown>[];
        const total = Number(parsed.total ?? parsed.count ?? items.length);
        setPayoutItems(items);
        setPayoutTotal(total);
        setPayoutLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setPayoutError(err instanceof Error ? err.message : "Failed to load payouts");
        setPayoutLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus, payoutStatusFilter, payoutSort, payoutSortDir, payoutPage, payoutPageSize, payoutRetryCount]);

  function handlePayoutSort(field: PayoutSortField) {
    if (payoutSort === field) setPayoutSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setPayoutSort(field); setPayoutSortDir("desc"); }
    setPayoutPage(1);
  }

  const pagedPayouts = payoutItems;
  const payoutTotalPages = Math.max(1, Math.ceil(payoutTotal / payoutPageSize));
  React.useEffect(() => { setPayoutPage(1); }, [payoutStatusFilter]);

  /* G2 data */
  const processingPayouts = payoutItems.filter((p: any) => p.status === "processing");

  /* ── Payout Preferences ─────────────────────────────────────── */
  const [prefs, setPrefs] = React.useState<PayoutPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = React.useState(true);
  const [prefsError, setPrefsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) { setPrefsLoading(false); return; }
    setPrefsLoading(true);
    setPrefsError(null);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:payout-prefs:${sk}`, () => fetchPayoutPreferences(token))
      .then((data) => {
        if (!live) return;
        setPrefs(data);
        setPrefsLoading(false);
      })
      .catch((err) => {
        if (!live) return;
        setPrefsError(err instanceof Error ? err.message : "Failed to load payout preferences");
        setPrefsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [token, sessionStatus]);

  const hasPayoutMethod = !prefsLoading && !!prefs?.preferred_method && prefs.preferred_method !== "none";
  const isWomenTrack = profile.track === "women";

  /* ── Payout Preferences Edit Drawer ─────────────────────────── */
  const [prefsDrawerOpen, setPrefsDrawerOpen] = React.useState(false);
  const [editMethod, setEditMethod] = React.useState("bank_transfer");
  const [editFields, setEditFields] = React.useState<Record<string, string>>({});
  const [editMinAmount, setEditMinAmount] = React.useState("0");
  const [editAutoPayout, setEditAutoPayout] = React.useState(false);
  const [prefsSaving, setPrefsSaving] = React.useState(false);
  const [prefsSaveError, setPrefsSaveError] = React.useState<string | null>(null);

  /* Pre-fill the form whenever the drawer opens */
  function openPrefsDrawer() {
    setEditMethod(prefs?.preferred_method || "bank_transfer");
    setEditMinAmount(String(Number(prefs?.minimum_payout_amount) || 0));
    setEditAutoPayout(prefs?.auto_payout ?? false);
    setEditFields({
      account_name:   prefs?.account_name   || "",
      account_number: prefs?.account_number || "",
      bank_name:      prefs?.bank_name      || "",
      routing_code:   prefs?.routing_code   || "",
      country:        prefs?.country        || "",
      provider:       prefs?.provider       || "",
      phone_number:   prefs?.phone_number   || "",
      paypal_email:   prefs?.paypal_email   || "",
      upi_id:         prefs?.upi_id         || "",
      wallet_address: prefs?.wallet_address || "",
      network:        prefs?.network        || "",
      token:          prefs?.token          || "",
    });
    setPrefsSaveError(null);
    setPrefsDrawerOpen(true);
  }

  async function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!token || prefsSaving) return;
    setPrefsSaving(true);
    setPrefsSaveError(null);
    const body = {
      preferred_method:      editMethod,
      minimum_payout_amount: Number(editMinAmount) || 0,
      auto_payout:           editAutoPayout,
      ...editFields,
    };
    console.log("[Payout Preferences] → PUT /api/contributor/payout-preferences", body);
    try {
      const updated = await updatePayoutPreferences(token, body);
      console.log("[Payout Preferences] ✓ 200 —", updated);
      setPrefs(updated);
      setPrefsDrawerOpen(false);
      toast.success("Payout preferences saved", "Your payout method has been updated successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save preferences";
      console.error("[Payout Preferences] ✗ —", msg);
      setPrefsSaveError(msg);
    } finally {
      setPrefsSaving(false);
    }
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

      {/* ═══ API ERROR BANNERS ═══ */}
      {summaryError && (
        <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-[12px] text-red-700 flex-1">{summaryError}</span>
          <button
            onClick={() => {
              if (!token) return;
              setSummaryLoading(true);
              setSummaryError(null);
              fetchEarningsSummary(token)
                .then((data) => { setSummary(data); setSummaryLoading(false); })
                .catch((err: Error) => { setSummaryError(err.message ?? "Failed to load earnings summary"); setSummaryLoading(false); });
            }}
            className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 hover:text-red-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </motion.div>
      )}
      {overviewError && (
        <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-[12px] text-red-700 flex-1">{overviewError}</span>
          <button
            onClick={() => { if (token) loadOverview(token); }}
            className="flex items-center gap-1.5 text-[11px] font-medium text-red-600 hover:text-red-700 transition-colors shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </motion.div>
      )}

      {/* ═══ KYC STATUS BANNER ═══ */}
      {(() => {
        const KYC_CFG: Record<string, { icon: React.ReactNode; wrapper: string; badge: string; badgeText: string; title: string; body: string }> = {
          verified:        { icon: <CheckCircle2 className="w-4.5 h-4.5 text-forest-600" />, wrapper: "bg-forest-50 border border-forest-200", badge: "bg-forest-100 text-forest-700", badgeText: "Verified",         title: "Identity Verified",     body: "Your KYC is complete. You are eligible to receive payouts." },
          approved:        { icon: <CheckCircle2 className="w-4.5 h-4.5 text-forest-600" />, wrapper: "bg-forest-50 border border-forest-200", badge: "bg-forest-100 text-forest-700", badgeText: "Approved",         title: "Identity Verified",     body: "Your KYC is complete. You are eligible to receive payouts." },
          pending:         { icon: <Clock className="w-4.5 h-4.5 text-gold-600" />,          wrapper: "bg-gold-50 border border-gold-200",     badge: "bg-gold-100 text-gold-700",     badgeText: "Pending",          title: "KYC Under Review",      body: "Your documents are being reviewed. This usually takes 1–3 business days." },
          under_review:    { icon: <Clock className="w-4.5 h-4.5 text-gold-600" />,          wrapper: "bg-gold-50 border border-gold-200",     badge: "bg-gold-100 text-gold-700",     badgeText: "Under Review",     title: "KYC Under Review",      body: "Your documents are being reviewed. This usually takes 1–3 business days." },
          in_review:       { icon: <Clock className="w-4.5 h-4.5 text-gold-600" />,          wrapper: "bg-gold-50 border border-gold-200",     badge: "bg-gold-100 text-gold-700",     badgeText: "In Review",        title: "KYC Under Review",      body: "Your documents are being reviewed. This usually takes 1–3 business days." },
          rejected:        { icon: <AlertCircle className="w-4.5 h-4.5 text-red-500" />,     wrapper: "bg-red-50 border border-red-200",       badge: "bg-red-100 text-red-700",       badgeText: "Rejected",         title: "KYC Rejected",          body: "Your submission was rejected. Re-submit with correct documents to enable payouts." },
          failed:          { icon: <AlertCircle className="w-4.5 h-4.5 text-red-500" />,     wrapper: "bg-red-50 border border-red-200",       badge: "bg-red-100 text-red-700",       badgeText: "Failed",           title: "KYC Failed",            body: "Your submission failed. Re-submit with correct documents to enable payouts." },
          requires_action: { icon: <AlertCircle className="w-4.5 h-4.5 text-amber-500" />,   wrapper: "bg-amber-50 border border-amber-200",   badge: "bg-amber-100 text-amber-700",   badgeText: "Action Required",  title: "Action Required",       body: "Additional information is needed to complete your KYC. Please check your profile." },
          not_started:     { icon: <AlertCircle className="w-4.5 h-4.5 text-amber-500" />,   wrapper: "bg-amber-50 border border-amber-200",   badge: "bg-amber-100 text-amber-700",   badgeText: "Not Started",      title: "KYC Not Started",       body: "Complete identity verification to unlock payouts. It only takes a few minutes." },
          not_submitted:   { icon: <AlertCircle className="w-4.5 h-4.5 text-amber-500" />,   wrapper: "bg-amber-50 border border-amber-200",   badge: "bg-amber-100 text-amber-700",   badgeText: "Not Submitted",    title: "KYC Not Submitted",     body: "Complete identity verification to unlock payouts. It only takes a few minutes." },
        };
        const normalizedKycStatus = String(kycStatus || "unknown")
          .toLowerCase()
          .trim()
          .replace(/[\s-]+/g, "_");
        const fallback = { icon: <AlertCircle className="w-4.5 h-4.5 text-gray-400" />, wrapper: "bg-gray-50 border border-gray-200", badge: "bg-gray-100 text-gray-500", badgeText: normalizedKycStatus, title: "KYC Status", body: "Verify your identity to unlock payouts." };
        const c = KYC_CFG[normalizedKycStatus] ?? fallback;
        const needsCta = !kycLoading && !kycError && !["verified", "approved", "pending", "under_review", "in_review"].includes(normalizedKycStatus);
        return (
          <motion.div variants={fadeUp} className={`flex items-center gap-4 px-5 py-3.5 rounded-xl mb-5 ${c.wrapper}`}>
            <div className="shrink-0">{c.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-gray-800">{c.title}</span>
                {kycLoading
                  ? <div className="h-4 w-16 rounded-full bg-gray-200 animate-pulse" />
                  : <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{c.badgeText}</span>
                }
              </div>
              {kycLoading
                ? <div className="h-3 w-56 rounded-md bg-gray-200 animate-pulse mt-1" />
                : kycError
                  ? <p className="text-[11px] text-red-500 mt-0.5">{kycError}</p>
                  : <p className="text-[11px] text-gray-500 mt-0.5">{c.body}</p>
              }
            </div>
            {needsCta && (
              <div className="shrink-0 flex flex-col items-end gap-1">
                <button
                  onClick={handleStartKyc}
                  disabled={kycStarting}
                  className="text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5">
                  {kycStarting && <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                  {kycStarting ? "Starting…" : "Complete KYC"}
                </button>
                {kycStartError && (
                  <p className="text-[10px] text-red-500 max-w-[160px] text-right">{kycStartError}</p>
                )}
              </div>
            )}
          </motion.div>
        );
      })()}

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
                { label: "Total Earned", value: fmt$(summary.total_earned), icon: DollarSign, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
                { label: "Eligible for Payout", value: fmt$(summary.eligible), icon: Wallet, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
                { label: "Pending Review", value: fmt$(summary.pending), icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
                { label: "Paid Out", value: fmt$(summary.paid_out), icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
              ].map((kpi) => {
                const KpiIcon = kpi.icon;
                return (
                  <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
                    <div className={`w-12 h-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                      <KpiIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                      {summaryLoading ? (
                        <div className="h-7 w-20 rounded-lg bg-gray-100 animate-pulse mt-1" />
                      ) : (
                        <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                      )}
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
                {listError && (
                  <button onClick={() => setListRetryCount((c) => c + 1)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors">
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>

              {/* Error banner */}
              {listError && (
                <div className="flex items-center gap-2.5 px-6 py-3 bg-red-50 border-b border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-[11px] text-red-600">{listError}</span>
                </div>
              )}

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
                {listLoading
                  ? <div className="h-3 w-16 rounded-md bg-gray-100 animate-pulse" />
                  : <span className="font-mono text-[11px] text-gray-400">{listTotal} result{listTotal !== 1 ? "s" : ""}</span>
                }
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <ColHeader field="task" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("task")} label="Task / Project" />
                      <ColHeader field="amount" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("amount")} label="Amount" />
                      <ColHeader field="status" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("status")} label="Status" />
                      <ColHeader field="date" activeField={earnSort} activeDir={earnSortDir} onClick={() => handleEarnSort("date")} label="Date" />
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loading skeleton */}
                    {listLoading && Array.from({ length: earnPageSize > 5 ? 5 : earnPageSize }).map((_, i) => (
                      <tr key={`skel-${i}`} style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        <td style={{ padding: "13px 16px" }}>
                          <div className="h-3.5 w-48 rounded-md bg-gray-100 animate-pulse mb-1.5" />
                          <div className="h-2.5 w-28 rounded-md bg-gray-100 animate-pulse" />
                        </td>
                        <td style={{ padding: "13px 16px" }}><div className="h-3.5 w-16 rounded-md bg-gray-100 animate-pulse" /></td>
                        <td style={{ padding: "13px 16px" }}><div className="h-5 w-20 rounded-full bg-gray-100 animate-pulse" /></td>
                        <td style={{ padding: "13px 16px" }}><div className="h-3.5 w-20 rounded-md bg-gray-100 animate-pulse" /></td>
                      </tr>
                    ))}
                    {/* Rows from API */}
                    {!listLoading && pagedEarnings.map((e: any) => {
                      const ec = earnCfg[e.status] || earnCfg.pending;
                      const taskTitle = e.task_title ?? e.taskTitle ?? e.title ?? "—";
                      const projectTitle = e.project_title ?? e.projectTitle ?? "";
                      const earnedAt = e.earned_at ?? e.earnedAt ?? "";
                      return (
                        <tr key={e.id} onClick={() => setEarningDrawer(e)}
                          className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                          style={{ borderBottom: "1px solid var(--border-hair)" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="text-[13px] font-medium text-gray-800 truncate max-w-[280px]">{taskTitle}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{projectTitle}</div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[13px] font-semibold text-gray-900 font-mono">{fmt$(e.amount)}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Pill bg={ec.bg} color={ec.color}>{ec.label}</Pill>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[11.5px] text-gray-500">{earnedAt ? fmtDate(earnedAt) : "—"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Empty state */}
                {!listLoading && !listError && pagedEarnings.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] text-gray-400">
                      {earnStatusFilter === "all"
                        ? "Complete and get your first task accepted to start earning!"
                        : `No ${earnStatusFilter} earnings found.`}
                    </p>
                  </div>
                )}
              </div>
              <TablePagination page={earnPage} totalPages={earnTotalPages} total={listTotal} pageSize={earnPageSize} onPage={setEarnPage} onPageSize={setEarnPageSize} />
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
                    <div className="num-display text-[28px] text-gray-900 leading-none mt-2">—</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-100 hidden lg:block" />
                  {/* Eligible */}
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Eligible Amount</div>
                    {summaryLoading ? (
                      <div className="h-7 w-24 rounded-lg bg-gray-100 animate-pulse mt-2" />
                    ) : (
                      <div className="num-display text-[28px] text-forest-600 leading-none mt-2">{fmt$(summary.eligible)}</div>
                    )}
                  </div>
                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-100 hidden lg:block" />
                  {/* Method */}
                  <div>
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Method</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-[13px] font-medium text-gray-400">Not configured</span>
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
                  {summaryLoading ? (
                    <div className="h-7 w-28 rounded-lg bg-gray-100 animate-pulse" />
                  ) : (
                    <div className="num-display text-[28px] text-gray-900 leading-none">{fmt$(summary.total_earned - summary.paid_out)}</div>
                  )}
                  {/* Breakdown bar */}
                  <div className="flex h-2 rounded-full overflow-hidden mt-4 bg-gray-100">
                    {summary.eligible > 0 && <div className="bg-teal-500 transition-all" style={{ width: `${(summary.eligible / (summary.total_earned - summary.paid_out)) * 100}%` }} />}
                    {summary.pending > 0 && <div className="bg-gold-400 transition-all" style={{ width: `${(summary.pending / (summary.total_earned - summary.paid_out)) * 100}%` }} />}
                    {summary.processing > 0 && <div className="bg-brown-400 transition-all" style={{ width: `${(summary.processing / (summary.total_earned - summary.paid_out)) * 100}%` }} />}
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
                  {prefsLoading
                    ? <span className="w-3 h-3 rounded-full border-2 border-brown-300 border-t-brown-600 animate-spin" />
                    : <button onClick={openPrefsDrawer} className="text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">Manage</button>
                  }
                </div>
                <div className="px-6 py-5">
                  {/* Loading skeleton */}
                  {prefsLoading && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-28 rounded-md bg-gray-200 animate-pulse" />
                          <div className="h-3 w-36 rounded-md bg-gray-200 animate-pulse" />
                        </div>
                      </div>
                      {[1,2,3].map((i) => (
                        <div key={i} className="flex justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                          <div className="h-3 w-24 rounded-md bg-gray-200 animate-pulse" />
                          <div className="h-3 w-16 rounded-md bg-gray-200 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {!prefsLoading && prefsError && (
                    <div className="flex items-center gap-2 text-[11px] text-red-500 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{prefsError}
                    </div>
                  )}

                  {/* Configured method */}
                  {!prefsLoading && !prefsError && hasPayoutMethod && prefs && (() => {
                    const method = prefs.preferred_method;
                    const minAmount = Number(prefs.minimum_payout_amount) || 0;
                    const methodIcon = method === "bank_transfer"  ? <Building2 className="w-5 h-5 text-white" />
                                     : method === "paypal"         ? <CreditCard className="w-5 h-5 text-white" />
                                     : method === "mobile_money"   ? <Wallet className="w-5 h-5 text-white" />
                                     :                               <Wallet className="w-5 h-5 text-white" />;

                    /* Build display rows based on method */
                    const detailRows: { label: string; value: string }[] = [];
                    if (method === "bank_transfer") {
                      if (prefs.bank_name)      detailRows.push({ label: "Bank",           value: prefs.bank_name });
                      if (prefs.account_number) detailRows.push({ label: "Account",        value: `****${prefs.account_number.slice(-4)}` });
                      if (prefs.routing_code)   detailRows.push({ label: "Routing Code",   value: prefs.routing_code });
                      if (prefs.country)        detailRows.push({ label: "Country",         value: prefs.country });
                    } else if (method === "paypal") {
                      if (prefs.paypal_email)   detailRows.push({ label: "PayPal Email",   value: prefs.paypal_email });
                    } else if (method === "mobile_money") {
                      if (prefs.provider)       detailRows.push({ label: "Provider",        value: prefs.provider });
                      if (prefs.phone_number)   detailRows.push({ label: "Phone",           value: prefs.phone_number });
                      if (prefs.country)        detailRows.push({ label: "Country",         value: prefs.country });
                    } else if (method === "upi") {
                      if (prefs.upi_id)         detailRows.push({ label: "UPI ID",          value: prefs.upi_id });
                    } else if (method === "crypto") {
                      if (prefs.network)        detailRows.push({ label: "Network",         value: prefs.network });
                      if (prefs.wallet_address) detailRows.push({ label: "Wallet",          value: `${prefs.wallet_address.slice(0,6)}…${prefs.wallet_address.slice(-4)}` });
                    }
                    detailRows.push({ label: "Min. Payout",  value: fmt$(minAmount) });
                    detailRows.push({ label: "Auto Payout",  value: prefs.auto_payout ? "Enabled" : "Disabled" });

                    return (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0">
                            {methodIcon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-gray-800">{methodLabel[method] || method}</span>
                              <Pill bg="var(--color-forest-50)" color="var(--color-forest-700)">Configured</Pill>
                            </div>
                            {prefs.account_name && <span className="text-[11px] text-gray-400">{prefs.account_name}</span>}
                          </div>
                        </div>
                        <div className="space-y-0">
                          {detailRows.map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                              <span className="text-[11px] text-gray-400">{row.label}</span>
                              <span className="text-[11px] text-gray-700 font-mono">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}

                  {/* No method configured */}
                  {!prefsLoading && !prefsError && !hasPayoutMethod && (
                    <div className="text-center py-4">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gold-500" />
                      <p className="text-[13px] font-semibold text-gray-800 mb-1">No method configured</p>
                      <p className="text-[11px] text-gray-500 mb-3">Set up a payout method to receive payments.</p>
                      <button onClick={openPrefsDrawer}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <Settings className="w-3.5 h-3.5" /> Set Up
                      </button>
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
                {payoutLoading && <span className="w-3 h-3 rounded-full border-2 border-brown-300 border-t-brown-600 animate-spin" />}
              </div>

              {/* Error banner */}
              {payoutError && (
                <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{payoutError}</span>
                  <button onClick={() => setPayoutRetryCount((c) => c + 1)} className="text-xs font-medium underline">Retry</button>
                </div>
              )}

              {/* Filter row */}
              <div className="flex items-center justify-between gap-3 px-6 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                <div className="flex items-center gap-2">
                  <FilterSelect value={payoutStatusFilter} onValueChange={(v) => { setPayoutStatusFilter(v); setPayoutPage(1); }} placeholder="All Status"
                    options={[
                      { value: "all",        label: "All Status" },
                      { value: "completed",  label: "Completed" },
                      { value: "processing", label: "Processing" },
                      { value: "failed",     label: "Failed" },
                    ]} />
                  {payoutStatusFilter !== "all" && (
                    <button onClick={() => { setPayoutStatusFilter("all"); setPayoutPage(1); }} className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 px-2.5 py-1 rounded-lg hover:bg-brown-50 transition-all">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <span className="font-mono text-[11px] text-gray-400">
                  {payoutLoading ? <span className="h-3 w-14 rounded-md bg-gray-200 animate-pulse inline-block" /> : `${payoutTotal} result${payoutTotal !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <ColHeader field="reference" activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("reference")} label="Reference" />
                      <ColHeader field="amount"    activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("amount")}    label="Amount" />
                      <ColHeader field="method"    activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("method")}    label="Method" />
                      <ColHeader field="status"    activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("status")}    label="Status" />
                      <ColHeader field="date"      activeField={payoutSort} activeDir={payoutSortDir} onClick={() => handlePayoutSort("date")}      label="Date" />
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loading skeleton rows */}
                    {payoutLoading && Array.from({ length: 4 }).map((_, i) => (
                      <tr key={`payout-skel-${i}`} style={{ borderBottom: "1px solid var(--border-hair)" }}>
                        {[180, 80, 110, 70, 90].map((w, j) => (
                          <td key={j} style={{ padding: "14px 16px" }}>
                            <div className={`h-3 rounded-md bg-gray-200 animate-pulse`} style={{ width: w }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* API rows */}
                    {!payoutLoading && pagedPayouts.map((p: any) => {
                      const status = p.status ?? "pending";
                      const pc = payoutCfg[status] || payoutCfg.pending;
                      const reference   = p.reference   ?? p.payout_ref ?? p.id ?? "—";
                      const amount      = Number(p.amount ?? 0);
                      const method      = p.method       ?? p.payout_method ?? "";
                      const initiatedAt = p.initiated_at ?? p.initiatedAt   ?? p.created_at ?? "";
                      const earningCount = Number(p.earning_count ?? p.earningIds?.length ?? 0);
                      return (
                        <tr key={p.id ?? reference} onClick={() => setPayoutDrawer(p)}
                          className="group cursor-pointer transition-colors hover:bg-black/[0.02]"
                          style={{ borderBottom: "1px solid var(--border-hair)" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="text-[13px] font-medium text-gray-800">{reference}</div>
                            {earningCount > 0 && <div className="text-[10px] text-gray-400 mt-0.5">{earningCount} task{earningCount !== 1 ? "s" : ""} included</div>}
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[13px] font-semibold text-gray-900 font-mono">{fmt$(amount)}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3 text-gray-400" />
                              <span className="text-[12px] text-gray-600">{methodLabel[method] || method || "—"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span className="text-[11.5px] text-gray-500">{initiatedAt ? fmtDate(initiatedAt) : "—"}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!payoutLoading && !payoutError && pagedPayouts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <Banknote className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] text-gray-400">
                      {payoutStatusFilter === "all"
                        ? "No payouts yet. Earnings become eligible for payout when tasks are accepted."
                        : `No ${payoutStatusFilter} payouts found.`}
                    </p>
                  </div>
                )}
              </div>
              <TablePagination page={payoutPage} totalPages={payoutTotalPages} total={payoutTotal} pageSize={payoutPageSize} onPage={setPayoutPage} onPageSize={setPayoutPageSize} />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ═══ G4: EARNINGS BREAKDOWN DRAWER ═══ */}
      <Drawer open={!!earningDrawer} onClose={() => setEarningDrawer(null)} title="Task Earnings Breakdown">
        {earningDrawer && (() => {
          /* Merge: API detail takes priority over list-row snapshot */
          const base = earningDrawer;
          const d = drawerDetail ?? {};
          const e: Record<string, any> = { ...base, ...d };

          const status  = (e.status ?? base.status ?? "pending") as string;
          const ec      = earnCfg[status] || earnCfg.pending;
          const task    = getTask(e.taskId ?? e.task_id);

          const gross   = Number(e.amount ?? e.gross_amount ?? 0);
          const fee     = Number(e.platform_fee ?? e.platformFee ?? Math.round(gross * 0.1));
          const tax     = Number(e.tax_withholding ?? e.taxWithholding ?? 0);
          const net     = Number(e.net_amount ?? e.netAmount ?? gross - fee - tax);

          const taskTitle    = e.task_title    ?? e.taskTitle    ?? e.title     ?? "—";
          const projectTitle = e.project_title ?? e.projectTitle ?? e.project   ?? "";
          const earnedAt     = e.earned_at     ?? e.earnedAt     ?? "";
          const paidAt       = e.paid_at       ?? e.paidAt       ?? null;
          const payoutRef    = e.payout_id     ?? e.payoutId     ?? e.payout_ref ?? null;
          const rateCard     = e.rate_card     ?? e.rateCard     ?? (task ? task.pricing.model : null);
          const rate         = e.rate          ?? (task ? task.pricing.amount : gross);
          const effort       = e.effort        ?? e.estimated_hours ?? (task ? `${task.estimatedHours} hours` : null);
          const taskLink     = e.task_id       ?? e.taskId       ?? (task ? task.id : null);
          const notes        = e.notes         ?? e.description  ?? null;

          const Skel = ({ w = "w-24" }: { w?: string }) => (
            <span className={`inline-block h-3 ${w} rounded-md bg-gray-200 animate-pulse`} />
          );

          return (
            <>
              {/* ── Header ── */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2"><Pill bg={ec.bg} color={ec.color}>{ec.label}</Pill></div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{taskTitle}</h3>
                {projectTitle && <p className="text-[12px] text-gray-400">{projectTitle}</p>}
                {earnedAt && <p className="text-[11px] text-gray-400 mt-1">Accepted: {fmtDate(earnedAt)}</p>}
                {drawerDetailError && (
                  <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Detail unavailable — showing summary data
                  </p>
                )}
              </div>

              {/* ── Net Hero ── */}
              <div className="rounded-xl p-5 mb-6 text-center" style={{ background: "linear-gradient(135deg, var(--color-forest-50), var(--color-teal-50))" }}>
                <div className="text-[10px] text-gray-400 font-medium mb-1">Net Earnings</div>
                {drawerDetailLoading
                  ? <div className="h-9 w-28 rounded-lg bg-forest-100 animate-pulse mx-auto" />
                  : <div className="num-display text-[32px] text-forest-600 leading-none">{fmt$(net)}</div>
                }
              </div>

              {/* ── Pricing Breakdown ── */}
              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pricing Breakdown</span>
                <div className="mt-3">
                  {([
                    { label: "Rate Card",         value: rateCard,              loading: drawerDetailLoading && !rateCard },
                    { label: "Rate",              value: fmt$(rate),             loading: false },
                    { label: "Estimated Effort",  value: effort ?? "—",          loading: drawerDetailLoading && !effort },
                    { label: "Gross Amount",      value: fmt$(gross),            loading: false, bold: true },
                  ] as { label: string; value: string | null; loading: boolean; bold?: boolean }[]).map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className={cn("text-[12px] font-mono", row.bold ? "font-semibold text-gray-800" : "text-gray-600")}>
                        {row.loading ? <Skel /> : (row.value ?? "—")}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <span className="text-[12px] text-gray-400">Platform Fee</span>
                    <span className="text-[12px] font-mono text-red-400">
                      {drawerDetailLoading ? <Skel w="w-16" /> : `-${fmt$(fee)}`}
                    </span>
                  </div>
                  {tax > 0 && (
                    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">Tax Withholding</span>
                      <span className="text-[12px] font-mono text-red-400">-{fmt$(tax)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-[12px] font-semibold text-gray-700">Net Earnings</span>
                    <span className="text-[13px] font-mono font-bold text-forest-600">
                      {drawerDetailLoading ? <Skel w="w-20" /> : fmt$(net)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Payout Status ── */}
              <div className="mb-6">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payout Status</span>
                <div className="mt-3">
                  {[
                    { label: "Status",     value: ec.label },
                    { label: "Paid",       value: paidAt ? fmtDate(paidAt) : "Not yet — will be in next cycle" },
                    { label: "Payout Ref", value: payoutRef ?? "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className="text-[12px] text-gray-600">
                        {drawerDetailLoading && row.label !== "Status" ? <Skel /> : row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Notes (detail-only field) ── */}
              {!drawerDetailLoading && notes && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Notes</span>
                  <p className="text-[12px] text-gray-600 mt-1.5 leading-relaxed">{notes}</p>
                </div>
              )}

              {/* ── Disclaimer ── */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 mb-5">
                <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-[11px] text-gray-500">If you believe this pricing is incorrect, <Link href="/contributor/support" className="text-brown-500 hover:text-brown-600 font-medium">contact support</Link>.</span>
              </div>

              {/* ── View Task CTA ── */}
              {taskLink && (
                <Link href={`/contributor/tasks/${taskLink}`} onClick={() => setEarningDrawer(null)}
                  className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 px-4 py-2.5 rounded-xl transition-all w-full">
                  <ExternalLink className="w-3.5 h-3.5" /> View Task Detail
                </Link>
              )}
            </>
          );
        })()}
      </Drawer>

      {/* ═══ PAYOUT PREFERENCES EDIT DRAWER ═══ */}
      <Drawer open={prefsDrawerOpen} onClose={() => setPrefsDrawerOpen(false)} title="Payout Preferences">
        <form onSubmit={handleSavePrefs} className="space-y-5">

          {/* Method selector */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Payout Method</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "bank_transfer",  label: "Bank Transfer" },
                { value: "paypal",         label: "PayPal" },
                { value: "mobile_money",   label: "Mobile Money" },
                { value: "upi",            label: "UPI" },
                { value: "crypto",         label: "Crypto" },
              ] as const).map((m) => (
                <button key={m.value} type="button"
                  onClick={() => setEditMethod(m.value)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-medium border transition-all text-left ${
                    editMethod === m.value
                      ? "bg-brown-50 border-brown-300 text-brown-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bank Transfer fields */}
          {editMethod === "bank_transfer" && <>
            {([
              { key: "account_name",   label: "Account Holder Name",   placeholder: "Full name on account" },
              { key: "account_number", label: "Account Number",         placeholder: "Account number" },
              { key: "bank_name",      label: "Bank Name",              placeholder: "Bank name" },
              { key: "routing_code",   label: "Routing / SWIFT / IBAN", placeholder: "Routing or SWIFT code" },
              { key: "country",        label: "Country",                placeholder: "e.g. US" },
            ] as { key: keyof typeof editFields; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                <input value={editFields[key] ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all" />
              </div>
            ))}
          </>}

          {/* PayPal fields */}
          {editMethod === "paypal" && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">PayPal Email</label>
              <input value={editFields.paypal_email ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, paypal_email: e.target.value }))}
                placeholder="you@paypal.com" type="email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all" />
            </div>
          )}

          {/* Mobile Money fields */}
          {editMethod === "mobile_money" && <>
            {([
              { key: "provider",     label: "Provider",     placeholder: "e.g. JazzCash, Mpesa" },
              { key: "phone_number", label: "Phone Number", placeholder: "+1234567890" },
              { key: "country",      label: "Country",      placeholder: "e.g. PK" },
            ] as { key: keyof typeof editFields; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                <input value={editFields[key] ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all" />
              </div>
            ))}
          </>}

          {/* UPI fields */}
          {editMethod === "upi" && (
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">UPI ID</label>
              <input value={editFields.upi_id ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, upi_id: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all" />
            </div>
          )}

          {/* Crypto fields */}
          {editMethod === "crypto" && <>
            {([
              { key: "network",        label: "Network",        placeholder: "e.g. Ethereum, BNB, Solana" },
              { key: "wallet_address", label: "Wallet Address", placeholder: "0x…" },
              { key: "token",          label: "Token",          placeholder: "e.g. USDT, USDC" },
            ] as { key: keyof typeof editFields; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                <input value={editFields[key] ?? ""} onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all" />
              </div>
            ))}
          </>}

          {/* Common fields: Min amount + Auto payout */}
          <div style={{ borderTop: "1px solid var(--border-hair)", paddingTop: "1.25rem" }}>
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Minimum Payout Amount (USD)</label>
              <input value={editMinAmount} onChange={(e) => setEditMinAmount(e.target.value)}
                type="number" min="0" step="0.01" placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-brown-400 focus:ring-2 focus:ring-brown-100 transition-all" />
            </div>
            <label className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
              <div>
                <span className="text-[13px] font-medium text-gray-800">Auto Payout</span>
                <p className="text-[11px] text-gray-400 mt-0.5">Automatically pay out when minimum is reached</p>
              </div>
              <div onClick={() => setEditAutoPayout((v) => !v)}
                className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${editAutoPayout ? "bg-brown-500" : "bg-gray-300"}`}
                style={{ width: 40, height: 22 }}>
                <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${editAutoPayout ? "translate-x-5" : "translate-x-0.5"}`}
                  style={{ width: 18, height: 18, top: 2, left: editAutoPayout ? 20 : 2 }} />
              </div>
            </label>
          </div>

          {/* Error */}
          {prefsSaveError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[12px] text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{prefsSaveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setPrefsDrawerOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={prefsSaving}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {prefsSaving && <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {prefsSaving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </form>
      </Drawer>

      {/* ═══ G3 Step 2: PAYOUT DETAIL DRAWER ═══ */}
      <Drawer open={!!payoutDrawer} onClose={() => setPayoutDrawer(null)} title="Payout Detail">
        {payoutDrawer && (() => {
          /* Merge: API detail takes priority over list-row snapshot */
          const p: Record<string, any> = { ...payoutDrawer, ...(payoutDetail ?? {}) };
          const status = (p.status ?? "pending") as string;
          const pc = payoutCfg[status] || payoutCfg.pending;

          const DetSkel = ({ w = "w-20" }: { w?: string }) => (
            <span className={`inline-block h-3 ${w} rounded-md bg-gray-200 animate-pulse`} />
          );
          const includedEarnings = apiEarnings.filter((e: any) => p.earningIds?.includes(e.id));
          const totalGross = includedEarnings.reduce((s: number, e: any) => s + e.amount, 0);
          const totalFee = Math.round(totalGross * 0.1);
          const netPayout = totalGross - totalFee;
          return (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
                  {payoutDetailLoading && <span className="w-3 h-3 rounded-full border-2 border-brown-300 border-t-brown-600 animate-spin" />}
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                  {p.reference ?? p.payout_ref ?? "—"}
                </h3>
                <p className="text-[12px] text-gray-400">
                  {payoutDetailLoading
                    ? <DetSkel w="w-32" />
                    : `${methodLabel[p.method ?? p.payout_method] || p.method || "—"}${p.bank_last4 ?? p.bankLast4 ? ` · ****${p.bank_last4 ?? p.bankLast4}` : ""}`
                  }
                </p>
                {payoutDetailError && (
                  <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Detail unavailable — showing summary data
                  </p>
                )}
              </div>
              <div className="rounded-xl p-5 mb-6 text-center" style={{ background: "linear-gradient(135deg, var(--color-forest-50), var(--color-teal-50))" }}>
                <div className="text-[10px] text-gray-400 font-medium mb-1">Payout Amount</div>
                {payoutDetailLoading
                  ? <div className="h-9 w-28 rounded-lg bg-forest-100 animate-pulse mx-auto" />
                  : <div className="num-display text-[32px] text-forest-600 leading-none">{fmt$(Number(p.amount ?? 0))}</div>
                }
              </div>
              <div className="mb-6">
                {(() => {
                  /* Prefer earnings list from API detail, fall back to list-row earningIds */
                  const detailEarnings = (p.earnings ?? p.tasks ?? p.included_earnings ?? []) as any[];
                  const merged = detailEarnings.length > 0
                    ? detailEarnings
                    : includedEarnings;
                  return (
                    <>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Tasks Included ({payoutDetailLoading ? "…" : merged.length})
                      </span>
                      <div className="mt-3">
                        {payoutDetailLoading && [1,2].map((i) => (
                          <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <DetSkel w="w-40" />
                            <DetSkel w="w-14" />
                          </div>
                        ))}
                        {!payoutDetailLoading && merged.map((e: any) => (
                          <div key={e.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <div className="min-w-0 flex-1 mr-3">
                              <span className="text-[12px] text-gray-700 block truncate">{e.task_title ?? e.taskTitle ?? e.title ?? "—"}</span>
                              <span className="text-[10px] text-gray-400">{e.project_title ?? e.projectTitle ?? ""}</span>
                            </div>
                            <span className="text-[12px] font-mono font-semibold text-gray-700 shrink-0">{fmt$(Number(e.amount ?? 0))}</span>
                          </div>
                        ))}
                        {!payoutDetailLoading && merged.length === 0 && (
                          <p className="text-[12px] text-gray-400 py-3">Task details not available for this payout.</p>
                        )}
                      </div>
                    </>
                  );
                })()}
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
                  {([
                    { label: "Initiated",      value: (p.initiated_at ?? p.initiatedAt) ? fmtDate(p.initiated_at ?? p.initiatedAt) : "—", detail: false },
                    { label: "Completed",      value: (p.completed_at ?? p.completedAt) ? fmtDate(p.completed_at ?? p.completedAt) : "In progress — est. 2–3 business days", detail: true },
                    { label: "Method",         value: `${methodLabel[p.method ?? p.payout_method] || p.method || "—"}${p.bank_last4 ?? p.bankLast4 ? ` ****${p.bank_last4 ?? p.bankLast4}` : ""}`, detail: true },
                    { label: "Transaction Ref",value: p.reference ?? p.payout_ref ?? "—", detail: false },
                    { label: "Notes",          value: p.notes ?? p.description ?? null, detail: true },
                  ] as { label: string; value: string | null; detail: boolean }[])
                    .filter((row) => row.value !== null)
                    .map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                      <span className="text-[12px] text-gray-400">{row.label}</span>
                      <span className="text-[12px] text-gray-600">
                        {row.detail && payoutDetailLoading ? <DetSkel /> : row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Receipt section ── */}
              <div className="mb-5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Receipt</span>
                <div className="mt-3">
                  {receiptLoading && (
                    <div className="flex items-center gap-2 py-3 text-[12px] text-gray-400">
                      <span className="w-3 h-3 rounded-full border-2 border-brown-300 border-t-brown-600 animate-spin shrink-0" />
                      Loading receipt…
                    </div>
                  )}
                  {receiptError && (
                    <div className="flex items-center gap-2 py-2 text-[11px] text-red-500">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {receiptError}
                    </div>
                  )}
                  {!receiptLoading && !receiptError && receipt && (() => {
                    /* Normalise possible field names from the API */
                    const receiptUrl      = receipt.receipt_url      ?? receipt.url           ?? receipt.pdf_url        ?? null;
                    const receiptNo       = receipt.receipt_number    ?? receipt.receipt_no    ?? receipt.reference      ?? null;
                    const issuedAt        = receipt.issued_at         ?? receipt.created_at    ?? null;
                    const receiptAmount   = receipt.amount            ?? p.amount              ?? null;
                    const receiptStatus   = receipt.status            ?? p.status              ?? null;
                    return (
                      <div className="space-y-2">
                        {receiptNo && (
                          <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <span className="text-[12px] text-gray-400">Receipt No.</span>
                            <span className="text-[12px] font-mono text-gray-700">{String(receiptNo)}</span>
                          </div>
                        )}
                        {issuedAt && (
                          <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <span className="text-[12px] text-gray-400">Issued</span>
                            <span className="text-[12px] text-gray-600">{fmtDate(String(issuedAt))}</span>
                          </div>
                        )}
                        {receiptAmount !== null && (
                          <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <span className="text-[12px] text-gray-400">Amount</span>
                            <span className="text-[12px] font-mono font-semibold text-forest-600">{fmt$(Number(receiptAmount))}</span>
                          </div>
                        )}
                        {receiptStatus && (
                          <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                            <span className="text-[12px] text-gray-400">Status</span>
                            <span className="text-[12px] text-gray-600 capitalize">{String(receiptStatus)}</span>
                          </div>
                        )}
                        {receiptUrl ? (
                          <a href={String(receiptUrl)} target="_blank" rel="noopener noreferrer"
                            className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 px-4 py-2.5 rounded-xl transition-all w-full">
                            <Download className="w-3.5 h-3.5" /> Download Receipt (PDF)
                          </a>
                        ) : (
                          <p className="text-[11px] text-gray-400 pt-1">PDF download not available for this payout.</p>
                        )}
                      </div>
                    );
                  })()}
                  {!receiptLoading && !receiptError && !receipt && (
                    <p className="text-[12px] text-gray-400 py-2">Receipt will be available once the payout is completed.</p>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </Drawer>

    </motion.div>
  );
}

/* ═══ Module-scope helpers (stable references — no hydration mismatch) ══════ */

function ColHeader({ field, activeField, activeDir, onClick, label, align = "left" }: {
  field: string; activeField: string; activeDir: SortDir; onClick: () => void; label: string; align?: string;
}) {
  const active = field === activeField;
  return (
    <th onClick={onClick} className="cursor-pointer select-none transition-colors"
      style={{ padding: "11px 16px", textAlign: align as React.CSSProperties["textAlign"], fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase",
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
