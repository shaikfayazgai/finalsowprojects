"use client";

/**
 * Tenant registry — Journey A entry point (Platform Admin §5.C.1).
 *
 * Workflow:
 *   1. Stand up a new enterprise  → New tenant
 *   2. Follow up onboarding       → Provisioning tab → row → provisioning steps
 *   3. Operate a live customer    → search or browse → row → tenant detail
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronRight, FileText, Loader2, Plus, Search, Users, X } from "lucide-react";
import {
  MOCK_PROVISIONING_STEPS,
  type MockTenant,
  type ProvisioningStep,
  type TenantStatus,
} from "@/mocks/admin/tenants";
import { mergeTenantLists, resolveProvisioningSteps } from "@/lib/admin/tenant-registry";
import { useAdminProvisioningHydrated } from "@/lib/hooks/use-admin-provisioning-hydrated";
import { useAdminProvisioningStore, type ProvisionedTenantRecord } from "@/lib/stores/admin-provisioning-store";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "../../_shell/aurora";
import { Chip, StatCard, ProgressBar, primaryBtnClass, primaryStyle, type Tone } from "../../_shell/aurora-ui";
import { TenantsSkeleton } from "./tenants-skeleton";
import { TenantEmptyState } from "./tenant-empty-state";

type Filter = "all" | "active" | "provisioning" | "paused";

const STATUS_LABEL: Record<TenantStatus, string> = {
  active: "Active",
  provisioning: "Provisioning",
  paused: "Paused",
  draft: "Draft",
  closed: "Closed",
};

const STATUS_TONE: Record<TenantStatus, Tone> = {
  active: "success",
  provisioning: "info",
  paused: "warning",
  draft: "neutral",
  closed: "neutral",
};

const FILTER_TABS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "provisioning", label: "Provisioning" },
  { key: "paused", label: "Paused" },
];

const ROWS_PER_PAGE = 12;

function stepsFor(tenantId: string, dynamic: ProvisionedTenantRecord[]): ProvisioningStep[] {
  const steps = resolveProvisioningSteps(tenantId, dynamic);
  return steps.length ? steps : (MOCK_PROVISIONING_STEPS[tenantId] ?? []);
}

function provisioningPct(tenantId: string, dynamic: ProvisionedTenantRecord[]): number | null {
  const steps = stepsFor(tenantId, dynamic);
  if (!steps.length) return null;
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

function rowHref(t: MockTenant): string {
  return t.status === "provisioning"
    ? `/admin/tenants/${t.id}/provisioning`
    : `/admin/tenants/${t.id}`;
}

export function TenantsWorkspace() {
  const hydrated = useAdminProvisioningHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dynamicTenants = useAdminProvisioningStore((s) => s.tenants);
  const tenantOverrides = useAdminProvisioningStore((s) => s.tenantOverrides);

  const filter: Filter = (searchParams.get("status") as Filter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const allTenants = React.useMemo(
    () => mergeTenantLists(dynamicTenants, tenantOverrides),
    [dynamicTenants, tenantOverrides],
  );

  const counts = React.useMemo(
    () => ({
      all: allTenants.length,
      active: allTenants.filter((t) => t.status === "active").length,
      provisioning: allTenants.filter((t) => t.status === "provisioning").length,
      paused: allTenants.filter((t) => t.status === "paused").length,
    }),
    [allTenants],
  );

  // Portfolio totals — operator situational awareness (not duplicated by tabs).
  const totals = React.useMemo(
    () => ({
      users: allTenants.reduce((sum, t) => sum + (t.users ?? 0), 0),
      sows: allTenants.reduce((sum, t) => sum + (t.sows ?? 0), 0),
    }),
    [allTenants],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    let rows = allTenants.filter((t) => filter === "all" || t.status === filter);
    if (needle) {
      rows = rows.filter((t) => {
        const hay = [t.name, t.domain, t.msaRef, t.id, t.tier, t.region].join(" ").toLowerCase();
        return hay.includes(needle);
      });
    }
    return [...rows].sort((a, b) => {
      if (filter === "provisioning" || (filter === "all" && a.status === "provisioning" && b.status === "provisioning")) {
        const pa = provisioningPct(a.id, dynamicTenants) ?? 0;
        const pb = provisioningPct(b.id, dynamicTenants) ?? 0;
        if (pa !== pb) return pa - pb;
      }
      if (a.status === "provisioning" && b.status !== "provisioning") return -1;
      if (b.status === "provisioning" && a.status !== "provisioning") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allTenants, filter, search, dynamicTenants]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/tenants?${qs}` : "/admin/tenants", { scroll: false });
    },
    [router, searchParams],
  );

  if (!hydrated) return <TenantsSkeleton />;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] sm:text-[32px] font-bold tracking-[-0.03em] text-foreground leading-none">
            Tenants
          </h1>
          <p className="mt-2 font-body text-[14px] text-text-secondary">
            Provision and operate enterprise customers on the platform.
          </p>
        </div>
        <Link href="/admin/tenants/new" className={primaryBtnClass} style={primaryStyle}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          New tenant
        </Link>
      </header>

      {/* Portfolio summary — at-a-glance system status */}
      <section aria-label="Portfolio summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tenants" value={counts.all} icon={Building2} hint={`${counts.active} active`} hintTone="success" />
        <StatCard label="Users" value={totals.users.toLocaleString()} icon={Users} />
        <StatCard label="Active SOWs" value={totals.sows} icon={FileText} />
        <StatCard
          label="In onboarding"
          value={counts.provisioning}
          icon={Loader2}
          hint={counts.provisioning > 0 ? "needs follow-up" : "all set up"}
          hintTone={counts.provisioning > 0 ? "info" : "neutral"}
        />
      </section>

      {/* Registry — spec §5.C.1: status tabs + table */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <StatusTabs
            value={filter}
            counts={counts}
            onChange={(key) => setParam({ status: key === "all" ? null : key })}
          />

          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setParam({ q: e.target.value })}
              placeholder="Search name or domain…"
              className={cn(
                "w-full h-9 pl-9 pr-8 rounded-lg bg-white border border-stroke-subtle",
                "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_12px_-6px_rgba(15,23,42,0.12)]",
                "font-body text-[13px] text-foreground placeholder:text-text-secondary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.30)] focus-visible:border-[var(--c-violet-400)]",
              )}
            />
            {search && (
              <button
                type="button"
                onClick={() => setParam({ q: null })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {filter === "provisioning" && counts.provisioning > 0 && (
          <div className="px-4 sm:px-5 py-3 bg-info-subtle/40 border-b border-stroke-subtle">
            <p className="font-body text-[13px] text-text-secondary">
              <span className="font-semibold text-foreground">Onboarding queue.</span> Open a tenant to see provisioning
              steps — admin sign-in, first SOW, HRIS sync.
            </p>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState filter={filter} hasSearch={Boolean(search.trim())} onClear={() => setParam({ status: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Name</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Domain</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">State</th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Users</th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">SOWs</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <TenantRow key={t.id} tenant={t} dynamicTenants={dynamicTenants} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusTabs({
  value,
  counts,
  onChange,
}: {
  value: Filter;
  counts: Record<Filter, number>;
  onChange: (key: Filter) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter by state" className="flex flex-wrap gap-1">
      {FILTER_TABS.map((tab) => {
        const active = value === tab.key;
        const needsAttention = tab.key === "provisioning" && counts.provisioning > 0;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            style={active ? GLASS_GRADIENT : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold transition-colors",
              active
                ? "text-white"
                : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
              )}
            >
              {counts[tab.key]}
            </span>
            {needsAttention && !active && (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-info-solid shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TenantRow({ tenant: t, dynamicTenants }: { tenant: MockTenant; dynamicTenants: ProvisionedTenantRecord[] }) {
  const router = useRouter();
  const href = rowHref(t);
  const pct = t.status === "provisioning" ? provisioningPct(t.id, dynamicTenants) : null;

  return (
    <tr
      onClick={() => router.push(href)}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[220px]"
        >
          {t.name}
        </Link>
      </td>
      <td className="px-3 py-3.5 font-mono text-[12px] text-text-secondary truncate max-w-[160px]">{t.domain}</td>
      <td className="px-3 py-3.5">
        <StateCell status={t.status} pct={pct} />
      </td>
      <td className="px-3 py-3.5 text-right font-mono text-[13px] tabular-nums text-foreground">{t.users}</td>
      <td className="px-3 py-3.5 text-right font-mono text-[13px] tabular-nums text-text-secondary">{t.sows}</td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight
          className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth={2}
          aria-hidden
        />
      </td>
    </tr>
  );
}

function StateCell({ status, pct }: { status: TenantStatus; pct: number | null }) {
  return (
    <div className="min-w-[140px]">
      <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
      {status === "provisioning" && pct != null && (
        <div className="mt-1.5 max-w-[148px]">
          <ProgressBar pct={pct} height="h-1.5" />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  filter,
  hasSearch,
  onClear,
}: {
  filter: Filter;
  hasSearch: boolean;
  onClear: () => void;
}) {
  if (filter === "provisioning" && !hasSearch) {
    return (
      <TenantEmptyState
        icon={Loader2}
        title="No tenants in setup"
        description="When you provision a new enterprise, it appears here until onboarding steps finish."
        action={
          <Link href="/admin/tenants/new" className={primaryBtnClass} style={primaryStyle}>
            <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            New tenant
          </Link>
        }
      />
    );
  }

  return (
    <TenantEmptyState
      icon={Building2}
      title="No tenants found"
      description={
        hasSearch || filter !== "all"
          ? "Nothing matches. Clear filters or search for a different name."
          : "Create your first enterprise tenant to start onboarding."
      }
      action={
        hasSearch || filter !== "all" ? (
          <button
            type="button"
            onClick={onClear}
            className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
          >
            Clear filters
          </button>
        ) : (
          <Link href="/admin/tenants/new" className={primaryBtnClass} style={primaryStyle}>
            <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden />
            New tenant
          </Link>
        )
      }
    />
  );
}
