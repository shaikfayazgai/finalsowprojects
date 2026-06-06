"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Target,
  RefreshCw,
  ChevronDown,
  Filter,
  Search,
  Activity,
  WifiOff,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Progress } from "@/components/ui";
import { useProjectsList } from "@/lib/hooks/use-teams";
import type { ProjectDashboardItem } from "@/lib/api/teams";

/* ── Health → status presentation (drives the 4 staffing-style buckets) ── */
type HealthBucket = "fully_staffed" | "partially_staffed" | "matching_issue" | "staffing_in_progress";

const healthConfig: Record<
  HealthBucket,
  { label: string; variant: "blue" | "forest" | "gold" | "danger"; icon: React.ElementType }
> = {
  staffing_in_progress: { label: "Staffing In Progress", variant: "blue",   icon: Loader2        },
  fully_staffed:        { label: "Fully Staffed",        variant: "forest", icon: CheckCircle2   },
  partially_staffed:    { label: "Partially Staffed",    variant: "gold",   icon: Clock          },
  matching_issue:       { label: "Matching Issue",       variant: "danger", icon: AlertTriangle  },
};

function bucketFromProject(p: ProjectDashboardItem): HealthBucket {
  if (p.status === "ON_HOLD" || p.health === "BEHIND") return "matching_issue";
  if (p.health === "AT_RISK") return "partially_staffed";
  if (p.completion_pct >= 100 || p.status === "completed" || p.status === "ACCEPTED") return "fully_staffed";
  if (p.status === "BACKLOG" || p.status === "draft") return "staffing_in_progress";
  return "fully_staffed";
}

type StatusFilter = "All" | HealthBucket;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "fully_staffed", label: "Fully Staffed" },
  { value: "partially_staffed", label: "Partially Staffed" },
  { value: "matching_issue", label: "Matching Issue" },
  { value: "staffing_in_progress", label: "Staffing In Progress" },
];

type MetricFilter = "all" | "ok" | "at_risk" | "behind" | "on_hold";

export default function TeamsPage() {
  const [activeFilter, setActiveFilter] = React.useState<MetricFilter>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data, isLoading, isError, error, refetch } = useProjectsList();
  const projects = React.useMemo(() => data?.projects ?? [], [data]);

  /* Summary metrics from real fields */
  const total = projects.length;
  const okCount = projects.filter((p) => p.health === "OK").length;
  const atRiskCount = projects.filter((p) => p.health === "AT_RISK").length;
  const behindCount = projects.filter((p) => p.health === "BEHIND").length;
  const onHoldCount = projects.filter((p) => p.status === "ON_HOLD").length;

  const filtered = projects.filter((p) => {
    if (searchQuery.length >= 3) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.summary ?? "").toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
    }
    if (selectedStatus !== "All" && bucketFromProject(p) !== selectedStatus) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "ok") return p.health === "OK";
    if (activeFilter === "at_risk") return p.health === "AT_RISK";
    if (activeFilter === "behind") return p.health === "BEHIND";
    if (activeFilter === "on_hold") return p.status === "ON_HOLD";
    return true;
  });

  const hasActiveFilters = activeFilter !== "all" || selectedStatus !== "All" || searchQuery.length >= 3;

  const metrics: { key: MetricFilter; label: string; value: number; icon: React.ElementType; color: string }[] = [
    { key: "all",     label: "Total Projects",  value: total,         icon: Target,         color: "from-brown-400 to-brown-600" },
    { key: "ok",      label: "On Track",        value: okCount,       icon: CheckCircle2,   color: "from-forest-400 to-forest-600" },
    { key: "at_risk", label: "At Risk",         value: atRiskCount,   icon: Clock,          color: "from-gold-400 to-gold-600" },
    { key: "behind",  label: "Behind",          value: behindCount,   icon: AlertTriangle,  color: "from-danger to-danger-dark" },
    { key: "on_hold", label: "On Hold",         value: onHoldCount,   icon: Activity,       color: "from-blue-400 to-blue-600" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brown-500 to-brown-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brown-200/40">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">Project Teams</h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Track contributor assignment status across your active projects. Contributor identities are anonymised.
          </p>
        </div>
      </motion.div>

      {/* Anonymisation notice */}
      <motion.div variants={fadeUp} className="rounded-xl bg-teal-50 border border-teal-200/60 p-3 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-teal-700">
          Contributor identities are anonymised. You see assignment outcomes and skill match quality — not personal details.
        </p>
      </motion.div>

      {/* Error */}
      {isError && (() => {
        const is503 = error instanceof ApiError && error.status === 503;
        return (
          <div className={cn(
            "rounded-2xl border p-6 text-center space-y-3",
            is503 ? "border-gold-300/40 bg-gold-50/60" : "border-danger/30 bg-danger/5"
          )}>
            {is503
              ? <WifiOff className="w-6 h-6 text-gold-500 mx-auto" />
              : <AlertTriangle className="w-6 h-6 text-danger mx-auto" />
            }
            <p className={cn("text-sm font-medium", is503 ? "text-gold-700" : "text-danger")}>
              {is503 ? "Service is starting up…" : "Failed to load projects"}
            </p>
            <p className="text-beige-500 text-xs">
              {is503
                ? "The backend is waking from sleep. This usually takes 15–30 seconds."
                : error instanceof Error ? error.message : "Unknown error"
              }
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-brown-100 text-brown-700 hover:bg-brown-200"
            >
              <RefreshCw className="w-3 h-3" /> {is503 ? "Try Again" : "Retry"}
            </button>
          </div>
        );
      })()}

      {!isLoading && !isError && (
        <>
          {/* Health Summary metrics */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {metrics.map((s) => (
              <motion.button
                key={s.key}
                variants={scaleIn}
                onClick={() => setActiveFilter(activeFilter === s.key ? "all" : s.key)}
                className={cn(
                  "rounded-2xl border bg-white/70 backdrop-blur-sm p-4 flex items-center gap-3 text-left transition-all cursor-pointer",
                  activeFilter === s.key
                    ? "border-brown-300 ring-2 ring-brown-200/50 shadow-md"
                    : "border-beige-200/50 hover:border-beige-300/60 hover:shadow-sm"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0", s.color)}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">{s.value}</p>
                  <p className="text-[10px] text-beige-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Filter bar */}
          <motion.div variants={fadeUp} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className={cn(
                    "w-full rounded-xl border bg-white/80 backdrop-blur-sm pl-9 pr-3 py-2 text-[12px] font-medium text-brown-800 placeholder:text-beige-400 transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-brown-200/50 focus:border-brown-300",
                    searchQuery.length >= 3 ? "border-brown-300 shadow-sm" : "border-beige-200/60 hover:border-beige-300"
                  )}
                />
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                  className={cn(
                    "appearance-none rounded-xl border bg-white/80 backdrop-blur-sm pl-3 pr-8 py-2 text-[12px] font-medium text-brown-800 transition-all cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-brown-200/50 focus:border-brown-300",
                    selectedStatus !== "All" ? "border-brown-300 shadow-sm" : "border-beige-200/60 hover:border-beige-300"
                  )}
                >
                  {statusFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.value === "All" ? "Status: All" : opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-beige-400 pointer-events-none" />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-beige-400" />
                <span className="text-[11px] text-beige-500">
                  {searchQuery.length >= 3 && (
                    <>Search: <span className="font-semibold text-brown-700">&ldquo;{searchQuery}&rdquo;</span></>
                  )}
                  {searchQuery.length >= 3 && (activeFilter !== "all" || selectedStatus !== "All") && <span className="mx-1 text-beige-300">·</span>}
                  {activeFilter !== "all" && (
                    <>Metric: <span className="font-semibold text-brown-700">{metrics.find((m) => m.key === activeFilter)?.label}</span></>
                  )}
                  {activeFilter !== "all" && selectedStatus !== "All" && <span className="mx-1 text-beige-300">·</span>}
                  {selectedStatus !== "All" && (
                    <>Status: <span className="font-semibold text-brown-700">{healthConfig[selectedStatus].label}</span></>
                  )}
                </span>
                <button
                  onClick={() => { setActiveFilter("all"); setSelectedStatus("All"); setSearchQuery(""); }}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>

          {/* Project Table */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1fr] gap-4 px-5 py-3 border-b border-beige-200/40 text-[11px] font-semibold text-beige-500 uppercase tracking-wider">
              <span>Project</span>
              <span>Status</span>
              <span>Health</span>
              <span>Completion</span>
              <span>Action</span>
            </div>

            {filtered.map((p) => {
              const bucket = bucketFromProject(p);
              const cfg = healthConfig[bucket];
              const pct = Math.round(p.completion_pct);

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1fr] gap-4 px-5 py-4 border-b border-beige-100/60 last:border-b-0 hover:bg-beige-50/40 transition-colors items-center"
                >
                  <div>
                    <Link
                      href={`/enterprise/team/${encodeURIComponent(p.id)}`}
                      className="text-[13px] font-semibold text-brown-900 hover:text-teal-700 transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-[10px] text-beige-400 mt-0.5 truncate">
                      {p.summary ?? p.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.variant} size="sm" dot>{cfg.label}</Badge>
                  </div>

                  <div>
                    <span className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide",
                      p.health === "OK" && "text-forest-600",
                      p.health === "AT_RISK" && "text-gold-700",
                      p.health === "BEHIND" && "text-danger",
                    )}>
                      {(p.health ?? "").replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[13px] font-semibold text-brown-800">{pct}%</span>
                    <Progress value={pct} className="h-1.5" />
                  </div>

                  <div>
                    <Link
                      href={`/enterprise/team/${encodeURIComponent(p.id)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all bg-brown-100 text-brown-700 hover:bg-brown-200"
                    >
                      View Team
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-beige-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-beige-400" />
                </div>
                <h3 className="text-[15px] font-bold text-brown-800">
                  {hasActiveFilters ? "No projects match the current filters" : "No projects yet"}
                </h3>
                <p className="text-[13px] text-beige-500 mt-1 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? "Try selecting a different status or clear the filters."
                    : "Projects appear here after a SOW is approved and a plan is confirmed."}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

