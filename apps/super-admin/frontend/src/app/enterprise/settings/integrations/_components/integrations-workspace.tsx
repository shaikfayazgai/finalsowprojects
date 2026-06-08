"use client";

/**
 * Integrations workspace — connected systems catalog with status filters.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  KeyRound,
  Landmark,
  Plug,
  Search,
  Webhook,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  computeIntegrationsSummary,
  getIntegrationsMock,
  type IntegrationMock,
} from "@/lib/settings/settings-mock";
import { cn } from "@/lib/utils/cn";

type StatusFilter = "all" | "connected" | "available";

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "connected", label: "Connected" },
  { key: "available", label: "Available" },
];

const INTEGRATION_ICONS: Record<string, LucideIcon> = {
  sso: KeyRound,
  webhooks: Webhook,
  erp: Landmark,
};

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number,
): T {
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs],
  ) as T;
}

export function IntegrationsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";

  const [searchDraft, setSearchDraft] = React.useState(search);

  React.useEffect(() => setSearchDraft(search), [search]);

  const integrations = React.useMemo(() => getIntegrationsMock(), []);
  const summary = React.useMemo(() => computeIntegrationsSummary(integrations), [integrations]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(
        qs ? `/enterprise/settings/integrations?${qs}` : "/enterprise/settings/integrations",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam({ q: value.trim() || null });
  }, 300);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return integrations.filter((item) => {
      if (statusFilter === "connected" && !item.connected) return false;
      if (statusFilter === "available" && item.connected) return false;
      if (needle) {
        const hay = `${item.name} ${item.category} ${item.description} ${item.connectedDetail ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [integrations, statusFilter, search]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, IntegrationMock[]>();
    for (const item of filtered) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const hasActiveFilters = statusFilter !== "all" || !!search.trim();

  const statusCount = (key: StatusFilter) => {
    if (key === "all") return summary.total;
    if (key === "connected") return summary.connected;
    return summary.available;
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Settings · Integrations
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Integrations
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Connect identity, HR, project tools, and finance systems to this workspace. Each integration is configured separately.
        </p>
        <RecordLinks />
      </header>

      <OverviewCard summary={summary} />

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[180px]">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Connected systems
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {filtered.length === 0
                  ? "No integrations match your filters"
                  : `${filtered.length} of ${summary.total} integrations`}
              </p>
            </div>

            <div className="relative w-full sm:w-52 order-last sm:order-none sm:ml-auto">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => {
                  setSearchDraft(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
                placeholder="Search integrations…"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft("");
                    setParam({ q: null });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter by connection status" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key;
              const count = statusCount(tab.key);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    active ? "text-foreground" : "text-text-secondary hover:text-foreground",
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
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {hasActiveFilters && (
          <div className="px-5 py-2.5 flex flex-wrap items-center gap-2 border-b border-stroke-subtle">
            <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              Active filters
            </span>
            {statusFilter !== "all" && (
              <ActiveChip
                label={STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}
                onRemove={() => setParam({ status: null })}
              />
            )}
            {search.trim() && (
              <ActiveChip
                label={`"${search.trim()}"`}
                onRemove={() => {
                  setSearchDraft("");
                  setParam({ q: null });
                }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                setParam({ q: null, status: null });
              }}
              className="font-body text-[11.5px] font-semibold text-brand hover:opacity-80"
            >
              Clear all
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyPanel onClear={() => setParam({ q: null, status: null })} />
        ) : (
          <div className="divide-y divide-stroke-subtle">
            {grouped.map(([category, items]) => (
              <div key={category}>
                <div className="px-5 py-2 border-b border-stroke-subtle">
                  <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
                    {category}
                  </p>
                </div>
                <ul>
                  {items.map((item) => (
                    <IntegrationRow key={item.id} item={item} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewCard({ summary }: { summary: ReturnType<typeof computeIntegrationsSummary> }) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle">
        <div className="flex items-start gap-3 px-5 py-4 min-w-0 flex-1">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
            <Plug className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[15px] font-semibold text-foreground">Workspace integrations</p>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {summary.connected} connected · {summary.available} available to set up
            </p>
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              SSO and webhooks are managed by your IT admin. ERP requires additional setup.
              Import internal employees from{" "}
              <Link href="/enterprise/workforce" className="font-semibold text-brand hover:opacity-80">
                Delivery → Workforce
              </Link>
              .
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 sm:w-[280px] shrink-0 divide-x divide-stroke-subtle">
          {[
            { label: "Total", value: summary.total },
            { label: "Connected", value: summary.connected, tone: "brand" as const },
            { label: "Available", value: summary.available },
          ].map((stat) => (
            <div key={stat.label} className="px-3 py-3 text-center">
              <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                {stat.label}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-body text-[18px] font-semibold tabular-nums",
                  stat.tone === "brand" ? "text-brand" : "text-foreground",
                )}
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function IntegrationRow({ item }: { item: IntegrationMock }) {
  const Icon = INTEGRATION_ICONS[item.id] ?? Plug;
  const href = `/enterprise/settings/integrations/${item.id}`;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 px-5 py-3 min-h-[60px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25",
        )}
      >
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border shrink-0",
            item.connected
              ? "border-success-border text-success-text bg-surface"
              : "border-stroke-subtle bg-surface text-text-secondary",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-[13px] font-semibold text-foreground">{item.name}</span>
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold",
                item.connected
                  ? "bg-success-subtle text-success-text"
                  : "border border-stroke-subtle text-text-tertiary",
              )}
            >
              {item.connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary truncate">
            {item.connected ? item.connectedDetail : item.description}
          </p>
          {item.connected && item.lastSyncAt && (
            <p className="mt-0.5 font-body text-[11px] text-text-tertiary">
              Last sync {fmtRelative(item.lastSyncAt)}
            </p>
          )}
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 h-7 px-2.5 rounded-md shrink-0",
            "font-body text-[11.5px] font-semibold transition-colors duration-fast",
            item.connected
              ? "border border-stroke bg-surface text-foreground group-hover:border-stroke-strong"
              : "bg-brand text-on-brand group-hover:bg-brand-hover",
          )}
        >
          {item.connected ? "Manage" : "Connect"}
          {item.connected ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
        </span>
      </Link>
    </li>
  );
}

function ActiveChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 min-h-8 pl-3 pr-2 py-1.5 rounded-full bg-brand-subtle text-brand-subtle-text border border-brand/20 font-body text-[12px] font-medium leading-none">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/settings/tenant"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Tenant & roles
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/security"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Security
      </Link>
    </p>
  );
}

function EmptyPanel({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <Plug className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">No integrations match</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        Try clearing filters or search for SSO, webhooks, or ERP.
      </p>
      <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-brand">
        Clear filters
      </button>
    </div>
  );
}
