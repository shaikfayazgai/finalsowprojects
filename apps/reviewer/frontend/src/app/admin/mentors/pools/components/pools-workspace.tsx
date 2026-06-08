"use client";

/**
 * Mentor pools registry — aligned with mentors list + tenant registry UX.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Plus, Search, X } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminMentorsList, useAdminPoolsList } from "@/lib/hooks/use-admin-mentors";
import type { MockMentorPool } from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";

type ScopeFilter = "all" | "tenant" | "cross-tenant";

const SCOPE_TABS: Array<{ key: ScopeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "tenant", label: "Tenant-scoped" },
  { key: "cross-tenant", label: "Cross-tenant" },
];

const ROWS_PER_PAGE = 10;

function sortPools(items: MockMentorPool[]): MockMentorPool[] {
  return [...items].sort((a, b) => b.loadPct - a.loadPct || a.name.localeCompare(b.name));
}

function loadStatus(loadPct: number): "success" | "warning" | "error" {
  if (loadPct > 85) return "error";
  if (loadPct > 70) return "warning";
  return "success";
}

export function PoolsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pools = useAdminPoolsList();
  const mentors = useAdminMentorsList();

  const scopeFilter: ScopeFilter =
    (searchParams.get("scope") as ScopeFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const leadName = React.useCallback(
    (id: string) => mentors.find((m) => m.id === id)?.name ?? "—",
    [mentors],
  );

  const counts = React.useMemo(
    () => ({
      all: pools.length,
      tenant: pools.filter((p) => p.scope === "tenant").length,
      "cross-tenant": pools.filter((p) => p.scope === "cross-tenant").length,
      highLoad: pools.filter((p) => p.loadPct > 75).length,
      mentors: pools.reduce((n, p) => n + p.mentors, 0),
      avgLoad:
        pools.length > 0
          ? Math.round(pools.reduce((n, p) => n + p.loadPct, 0) / pools.length)
          : 0,
    }),
    [pools],
  );

  const highLoadHero = React.useMemo(
    () => sortPools(pools).find((p) => p.loadPct > 75),
    [pools],
  );

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/mentors/pools?${qs}` : "/admin/mentors/pools", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return pools.filter((p) => {
      if (scopeFilter !== "all" && p.scope !== scopeFilter) return false;
      if (needle) {
        const hay = [p.name, p.tenantName, p.id, leadName(p.leadMentorId)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [pools, scopeFilter, search, leadName]);

  const sorted = React.useMemo(() => sortPools(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const listTitle =
    scopeFilter === "all"
      ? "Pool registry"
      : scopeFilter === "tenant"
        ? "Tenant-scoped pools"
        : "Cross-tenant pools";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Talent
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Mentor pools
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Review routing pools across tenants — scope, lead mentors, and load balancing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href="/admin/mentors" className={secondaryBtnCls}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Mentors
          </Link>
          <Link href="/admin/mentors/pools/new" className={primaryBtnCls}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            New pool
          </Link>
        </div>
      </header>

      {highLoadHero && scopeFilter === "all" && !search.trim() && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {counts.highLoad} pool{counts.highLoad === 1 ? "" : "s"} above 75% load
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            <span className="font-medium text-foreground">{highLoadHero.name}</span>
            {" · "}
            {highLoadHero.loadPct}% capacity.
            {" "}
            <Link
              href={`/admin/mentors/pools/${highLoadHero.id}`}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Review pool
            </Link>
          </p>
        </div>
      )}

      <DashboardSection title="Pool summary" description="Capacity across the platform">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="All pools" value={String(counts.all)} />
          <SummaryStat label="Mentors assigned" value={String(counts.mentors)} />
          <SummaryStat label="Avg load" value={`${counts.avgLoad}%`} />
          <SummaryStat
            label="High load (>75%)"
            value={String(counts.highLoad)}
            alert={counts.highLoad > 0}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {sorted.length === 0
                  ? "No pools match"
                  : `${sorted.length} pool${sorted.length === 1 ? "" : "s"} · sorted by load`}
              </p>
            </div>
            <div className="relative w-full sm:w-56 shrink-0">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search pool, tenant, lead…"
                className={searchCls}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setParam({ q: null })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter by scope" className="flex flex-wrap gap-x-1 -mb-px pb-2">
            {SCOPE_TABS.map((tab) => {
              const active = scopeFilter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ scope: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel
            hasQuery={Boolean(search.trim()) || scopeFilter !== "all"}
            onClear={() => setParam({ scope: null, q: null })}
          />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((p) => (
                <li key={p.id}>
                  <PoolRow pool={p} leadName={leadName(p.leadMentorId)} />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function PoolRow({ pool, leadName }: { pool: MockMentorPool; leadName: string }) {
  const isHighLoad = pool.loadPct > 75;
  return (
    <Link
      href={`/admin/mentors/pools/${pool.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
        "hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        isHighLoad && "bg-warning-subtle/10 hover:bg-warning-subtle/20",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-body text-[13px] font-medium text-foreground truncate">
            {pool.name}
          </span>
          <ScopeBadge scope={pool.scope} />
        </span>
        <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5 truncate">
          {pool.scope === "tenant" ? pool.tenantName : "Cross-tenant"}
          {" · "}
          Lead {leadName}
          {" · "}
          {pool.mentors} mentor{pool.mentors === 1 ? "" : "s"}
        </span>
      </span>
      <span className="shrink-0 text-right flex flex-col items-end gap-1">
        <StatusChip status={loadStatus(pool.loadPct)} size="sm" showDot>
          {pool.loadPct}% load
        </StatusChip>
      </span>
    </Link>
  );
}

function ScopeBadge({ scope }: { scope: MockMentorPool["scope"] }) {
  return (
    <span
      className={cn(
        "inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold border",
        scope === "cross-tenant"
          ? "bg-info-subtle text-info-text border-info-border"
          : "bg-bg-subtle text-text-secondary border-stroke-subtle",
      )}
    >
      {scope === "cross-tenant" ? "Global" : "Tenant"}
    </span>
  );
}

function SummaryStat({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-warning-text" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyPanel({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-body text-[13.5px] font-semibold text-foreground">No pools found</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        {hasQuery
          ? "Try clearing filters or adjusting your search."
          : "Create a pool to start routing reviews to mentors."}
      </p>
      {hasQuery ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 font-body text-[12px] font-semibold text-text-link"
        >
          Clear filters
        </button>
      ) : (
        <Link
          href="/admin/mentors/pools/new"
          className="mt-3 inline-block font-body text-[12px] font-semibold text-text-link"
        >
          New pool →
        </Link>
      )}
    </div>
  );
}

const searchCls = cn(
  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const secondaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
  "hover:bg-brand-hover transition-colors duration-fast",
);
