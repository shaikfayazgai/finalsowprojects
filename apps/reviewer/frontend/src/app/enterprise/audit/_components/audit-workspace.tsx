"use client";

/**
 * Audit log workspace — chronological feed with instant filters + active chips.
 *
 * Audit UX differs from billing lists: investigators scan time-ordered events,
 * not grouped status buckets. Severity tabs filter the feed; advanced filters
 * apply immediately (Enter or blur) and surface as removable chips.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Download,
  RefreshCw,
  ScrollText,
  Search,
  X,
} from "lucide-react";
import { useAuditEvents } from "@/lib/hooks/use-audit-view";
import {
  AuditViewApiError,
  type AuditViewEvent,
  type AuditViewQuery,
} from "@/lib/api/audit-view";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 25;

type SeverityFilter = "all" | "info" | "warning" | "critical";
type TimePreset = "24h" | "7d" | "30d" | "90d";

const SEVERITY_TABS: Array<{ key: SeverityFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

const TIME_PRESETS: Array<{ key: TimePreset; label: string; days: number }> = [
  { key: "24h", label: "24h", days: 1 },
  { key: "7d", label: "7d", days: 7 },
  { key: "30d", label: "30d", days: 30 },
  { key: "90d", label: "90d", days: 90 },
];

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function severityPillCls(s: AuditViewEvent["severity"]): string {
  switch (s) {
    case "warning":
      return "bg-warning-subtle text-warning-text";
    case "critical":
      return "bg-error-subtle text-error-text";
    case "info":
    default:
      return "bg-brand-subtle text-brand-subtle-text";
  }
}

function sortNewestFirst(items: AuditViewEvent[]): AuditViewEvent[] {
  return [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
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

export function AuditWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const severityFilter =
    (searchParams.get("severity") as SeverityFilter | null) ?? "all";
  const timePreset = (searchParams.get("time") as TimePreset | null) ?? "30d";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const actor = searchParams.get("actor") ?? "";
  const resourceType = searchParams.get("resourceType") ?? "";
  const resourceId = searchParams.get("resourceId") ?? "";
  const action = searchParams.get("action") ?? searchParams.get("actionPrefix") ?? "";

  const [searchDraft, setSearchDraft] = React.useState(search);
  const [filtersOpen, setFiltersOpen] = React.useState(
    Boolean(actor || resourceType || resourceId || action),
  );
  const [actorDraft, setActorDraft] = React.useState(actor);
  const [resourceTypeDraft, setResourceTypeDraft] = React.useState(resourceType);
  const [resourceIdDraft, setResourceIdDraft] = React.useState(resourceId);
  const [actionDraft, setActionDraft] = React.useState(action);

  React.useEffect(() => setSearchDraft(search), [search]);
  React.useEffect(() => {
    setActorDraft(actor);
    setResourceTypeDraft(resourceType);
    setResourceIdDraft(resourceId);
    setActionDraft(action);
  }, [actor, resourceType, resourceId, action]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/enterprise/audit?${qs}` : "/enterprise/audit", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam({ q: value.trim() || null });
  }, 300);

  const query = React.useMemo<AuditViewQuery>(() => {
    const preset = TIME_PRESETS.find((p) => p.key === timePreset) ?? TIME_PRESETS[2];
    const now = new Date();
    const from = new Date(now.getTime() - preset.days * 86_400_000);
    return {
      actionPrefix: action || undefined,
      actorUserId: actor || undefined,
      resourceType: resourceType || undefined,
      from: from.toISOString(),
      to: now.toISOString(),
      limit: 500,
    };
  }, [action, actor, resourceType, timePreset]);

  const { data, isLoading, error, refetch, isFetching } = useAuditEvents(query);

  const baseEvents = React.useMemo(
    () => sortNewestFirst(data?.events ?? []),
    [data],
  );

  const events = React.useMemo(() => {
    let list = baseEvents;
    if (severityFilter !== "all") {
      list = list.filter((e) => e.severity === severityFilter);
    }
    if (resourceId) {
      const needle = resourceId.toLowerCase();
      list = list.filter((e) => e.resource.id.toLowerCase().includes(needle));
    }
    const needle = search.trim().toLowerCase();
    if (needle) {
      list = list.filter((e) => {
        const hay = `${e.action} ${e.actor.userId} ${e.resource.type} ${e.resource.id} ${e.resource.label ?? ""}`.toLowerCase();
        return hay.includes(needle);
      });
    }
    return list;
  }, [baseEvents, resourceId, search, severityFilter]);

  const counts = React.useMemo(
    () => ({
      all: baseEvents.length,
      info: baseEvents.filter((e) => e.severity === "info").length,
      warning: baseEvents.filter((e) => e.severity === "warning").length,
      critical: baseEvents.filter((e) => e.severity === "critical").length,
    }),
    [baseEvents],
  );

  const totalPages = Math.max(1, Math.ceil(events.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = events.slice(
    (pageIdx - 1) * ROWS_PER_PAGE,
    pageIdx * ROWS_PER_PAGE,
  );

  const applyAdvancedFilters = () => {
    setParam({
      actor: actorDraft.trim() || null,
      resourceType: resourceTypeDraft.trim() || null,
      resourceId: resourceIdDraft.trim() || null,
      action: actionDraft.trim() || null,
    });
  };

  const clearAllFilters = () => {
    setSearchDraft("");
    setActorDraft("");
    setResourceTypeDraft("");
    setResourceIdDraft("");
    setActionDraft("");
    setParam({
      severity: null,
      q: null,
      actor: null,
      resourceType: null,
      resourceId: null,
      action: null,
      time: null,
      page: null,
    });
  };

  const activeChips = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (search.trim()) {
      chips.push({ key: "q", label: `Search: ${search}`, clear: () => { setSearchDraft(""); setParam({ q: null }); } });
    }
    if (actor) chips.push({ key: "actor", label: `Actor: ${actor}`, clear: () => setParam({ actor: null }) });
    if (resourceType) chips.push({ key: "rt", label: `Resource: ${resourceType}`, clear: () => setParam({ resourceType: null }) });
    if (resourceId) chips.push({ key: "rid", label: `ID: ${resourceId}`, clear: () => setParam({ resourceId: null }) });
    if (action) chips.push({ key: "action", label: `Action: ${action}*`, clear: () => setParam({ action: null }) });
    if (timePreset !== "30d") {
      const label = TIME_PRESETS.find((p) => p.key === timePreset)?.label ?? timePreset;
      chips.push({ key: "time", label: `Window: ${label}`, clear: () => setParam({ time: null }) });
    }
    if (severityFilter !== "all") {
      chips.push({ key: "sev", label: `Severity: ${severityFilter}`, clear: () => setParam({ severity: null }) });
    }
    return chips;
  }, [search, actor, resourceType, resourceId, action, timePreset, severityFilter, setParam]);

  const hasFilters = activeChips.length > 0;
  const timeLabel = TIME_PRESETS.find((p) => p.key === timePreset)?.label ?? "30 days";

  const listDescription = isLoading
    ? "Loading events…"
    : events.length === 0
      ? "No matches in this window"
      : `${events.length} event${events.length === 1 ? "" : "s"} · newest first · ${timeLabel}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Audit
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Audit log
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Tamper-evident timeline of consequential actions — filter by time, severity, actor, or resource.
        </p>
        <RecordLinks />
      </header>

      {data && data.invalidSignatures > 0 && (
        <ContextBanner tone="error" title={`${data.invalidSignatures} signature failure${data.invalidSignatures === 1 ? "" : "s"}`}>
          Events failed verification. Do not use this view for compliance sign-off until resolved.
        </ContextBanner>
      )}

      {counts.critical > 0 && severityFilter !== "critical" && (
        <ContextBanner tone="warning" title={`${counts.critical} critical event${counts.critical === 1 ? "" : "s"} in this window`}>
          <button
            type="button"
            onClick={() => setParam({ severity: "critical" })}
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Show critical only
          </button>
        </ContextBanner>
      )}

      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof AuditViewApiError ? error.message : "Failed to load audit events"}
          </p>
        </div>
      )}

      <DashboardSection
        title="Integrity"
        description={
          data
            ? `${data.rowCount} events in window · ${data.validSignatures} signatures verified`
            : "Verifying event signatures…"
        }
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="In window" value={isLoading ? null : String(baseEvents.length)} />
          <SummaryStat
            label="Showing"
            value={isLoading ? null : String(events.length)}
            highlight={hasFilters}
          />
          <SummaryStat
            label="Verified"
            value={isLoading || !data ? null : String(data.validSignatures)}
          />
          <SummaryStat
            label="Invalid"
            value={isLoading || !data ? null : String(data.invalidSignatures)}
            alert={Boolean(data && data.invalidSignatures > 0)}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[200px]">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Event timeline
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
            </div>

            <div className="relative w-full sm:w-56 order-last sm:order-none sm:ml-auto">
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
                placeholder="Search action, actor, resource…"
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

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh events"
                className={cn(
                  "inline-flex items-center justify-center h-8 w-8 rounded-md",
                  "bg-surface border border-stroke text-foreground",
                  "hover:bg-surface-hover transition-colors duration-fast",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                )}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
              <Link
                href="/enterprise/audit/export"
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
                  "bg-brand text-on-brand font-body text-[12px] font-semibold",
                  "hover:bg-brand-hover transition-colors duration-fast",
                )}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Export
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <nav aria-label="Filter by severity" className="flex flex-wrap gap-x-1 -mb-px">
              {SEVERITY_TABS.map((tab) => {
                const active = severityFilter === tab.key;
                const count = counts[tab.key];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setParam({ severity: tab.key === "all" ? null : tab.key })}
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
                        tab.key === "critical" && count > 0 && !active && "text-error-text font-semibold",
                        tab.key === "warning" && count > 0 && !active && "text-warning-text",
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

            <div
              role="group"
              aria-label="Time window"
              className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-bg-subtle border border-stroke-subtle"
            >
              {TIME_PRESETS.map((p) => {
                const active = timePreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setParam({ time: p.key === "30d" ? null : p.key })}
                    className={cn(
                      "h-7 px-2.5 rounded-md font-body text-[11.5px] font-semibold transition-colors duration-fast",
                      active
                        ? "bg-surface text-foreground shadow-xs"
                        : "text-text-secondary hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-3">
              <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Active
              </span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full",
                    "bg-brand-subtle/60 border border-brand/20",
                    "font-body text-[11.5px] font-medium text-foreground",
                    "hover:bg-brand-subtle transition-colors duration-fast",
                  )}
                >
                  {chip.label}
                  <X className="h-3 w-3 text-text-tertiary" strokeWidth={2} aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-body text-[11.5px] font-semibold text-text-link"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="pb-3 border-t border-stroke-subtle pt-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={cn(
                "inline-flex items-center gap-1.5 font-body text-[12px] font-semibold",
                filtersOpen || actor || resourceType || resourceId || action
                  ? "text-brand"
                  : "text-text-secondary hover:text-foreground",
              )}
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-fast", filtersOpen && "rotate-180")}
                strokeWidth={2}
                aria-hidden
              />
              Narrow by actor & resource
            </button>

            {filtersOpen && (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyAdvancedFilters();
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FilterField label="Actor">
                    <input
                      value={actorDraft}
                      onChange={(e) => setActorDraft(e.target.value)}
                      placeholder="user id"
                      className={filterInputCls}
                    />
                  </FilterField>
                  <FilterField label="Resource type">
                    <input
                      value={resourceTypeDraft}
                      onChange={(e) => setResourceTypeDraft(e.target.value)}
                      placeholder="sow, payout…"
                      className={filterInputCls}
                    />
                  </FilterField>
                  <FilterField label="Resource ID">
                    <input
                      value={resourceIdDraft}
                      onChange={(e) => setResourceIdDraft(e.target.value)}
                      placeholder="e.g. sow-1042"
                      className={filterInputCls}
                    />
                  </FilterField>
                  <FilterField label="Action prefix">
                    <input
                      value={actionDraft}
                      onChange={(e) => setActionDraft(e.target.value)}
                      placeholder="e.g. sow."
                      className={filterInputCls}
                    />
                  </FilterField>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" className={applyBtnCls}>
                    Apply
                  </button>
                  {(actorDraft || resourceTypeDraft || resourceIdDraft || actionDraft) && (
                    <button
                      type="button"
                      onClick={() => {
                        setActorDraft("");
                        setResourceTypeDraft("");
                        setResourceIdDraft("");
                        setActionDraft("");
                      }}
                      className={secondaryBtnCls}
                    >
                      Reset fields
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {isLoading && !data ? (
          <div className="divide-y divide-stroke-subtle">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-3">
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyPanel onClear={clearAllFilters} />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((ev) => (
                <AuditEventRow key={ev.id} event={ev} />
              ))}
            </ul>
            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
              <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(pageIdx * ROWS_PER_PAGE, events.length)} of {events.length}
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
          </>
        )}
      </section>
    </div>
  );
}

function AuditEventRow({ event }: { event: AuditViewEvent }) {
  const resourceLabel = event.resource.label
    ? `${event.resource.type}:${event.resource.id} · ${event.resource.label}`
    : `${event.resource.type}:${event.resource.id}`;

  return (
    <li>
      <Link
        href={`/enterprise/audit/${event.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[48px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
          !event.signatureValid && "bg-error-subtle/20 hover:bg-error-subtle/30",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0">
            <span
              aria-label={event.signatureValid ? "Signature verified" : "Signature invalid"}
              className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                event.signatureValid ? "bg-success-text" : "bg-error-text",
              )}
            />
            <span className="font-mono text-[13px] font-medium text-foreground truncate">
              {event.action}
            </span>
          </span>
          <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
            {event.actor.userId} · {resourceLabel}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1">
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold capitalize",
              severityPillCls(event.severity),
            )}
          >
            {event.severity}
          </span>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
            {fmtRelative(event.timestamp)}
          </span>
          <span className="sr-only">{fmtDateTime(event.timestamp)}</span>
        </span>
      </Link>
    </li>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Compliance
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/audit/export"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Export audit
      </Link>
    </p>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
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
          alert ? "text-error-text" : highlight ? "text-brand" : "text-foreground",
        )}
      >
        {value === null ? <Skeleton className="h-6 w-16 rounded inline-block" /> : value}
      </dd>
    </div>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "error"
          ? "border-error-border bg-error-subtle/80"
          : "border-warning-border bg-warning-subtle/50",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold flex items-center gap-1.5",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyPanel({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <ScrollText className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">No events match</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        Widen the time window or remove filters to see more of the timeline.
      </p>
      <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-brand">
        Clear all filters
      </button>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const filterInputCls = cn(
  "w-full h-8 px-2.5 rounded-md border border-stroke bg-surface",
  "font-mono text-[12px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
);

const applyBtnCls = cn(
  "inline-flex items-center h-8 px-3 rounded-md",
  "bg-brand text-on-brand font-body text-[12px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);

const secondaryBtnCls = cn(
  "inline-flex items-center h-8 px-3 rounded-md",
  "bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);
