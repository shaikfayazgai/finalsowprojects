"use client";

/**
 * Audit log workspace — registry table.
 * Use-case: investigators scan time-ordered events, filter by severity/time,
 * narrow by actor or resource, and navigate to event detail.
 *
 * Pattern: KPI strip (total · critical · warning · unique actors) →
 *   alert → DASH_CARD { gradient-pill severity tabs + solid search + time pills
 *   + advanced filters + <table> (Timestamp · Action · Actor · Resource ·
 *   Severity · Integrity) + pagination }.
 *
 * Heuristic fixes applied:
 *   H8 Minimalist — removed the separate "Integrity" SectionCard; KPIs promoted
 *     to StatCard strip so the page has one visual hierarchy, not two.
 *   H6 Recognition — AURORA_ACCENT underline tabs → gradient-pill pattern;
 *     ghostBtnClass → secondaryBtnClass; GLASS_CARD/GLASS_SHADOW → DASH_CARD.
 *   H7 Flexibility — time-window moved into the toolbar row alongside tabs;
 *     advanced-filter inputs use solid surface (not glass).
 *   H8 again — border-white/55 → border-stroke-subtle; divide-white/60 →
 *     divide-stroke-subtle throughout.
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
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuditEvents } from "@/lib/hooks/use-audit-view";
import {
  AuditViewApiError,
  type AuditViewEvent,
  type AuditViewQuery,
} from "@/lib/api/audit-view";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  StatCard,
  TONE,
  type Tone,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

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

const SOLID_INPUT_CLS =
  "w-full h-9 px-3 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

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

function severityTone(s: AuditViewEvent["severity"]): Tone {
  switch (s) {
    case "warning":
      return "warning";
    case "critical":
      return "error";
    case "info":
    default:
      return "info";
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

  const uniqueActors = React.useMemo(() => {
    const ids = new Set(baseEvents.map((e) => e.actor.userId));
    return ids.size;
  }, [baseEvents]);

  const invalidSigs = data?.invalidSignatures ?? 0;

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
      chips.push({
        key: "q",
        label: `Search: ${search}`,
        clear: () => {
          setSearchDraft("");
          setParam({ q: null });
        },
      });
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

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Audit
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Audit log
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Tamper-evident timeline of consequential actions — filter by time, severity, actor, or resource.
        </p>
        <RecordLinks />
      </header>

      {/* Signature failure alert */}
      {data && data.invalidSignatures > 0 && (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} aria-hidden style={{ color: TONE.error.text }} />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>
            <span className="font-semibold">{data.invalidSignatures} signature failure{data.invalidSignatures === 1 ? "" : "s"}</span> — Events failed verification. Do not use this view for compliance sign-off until resolved.
          </p>
        </div>
      )}

      {/* Critical events call-to-action */}
      {counts.critical > 0 && severityFilter !== "critical" && (
        <button
          type="button"
          onClick={() => setParam({ severity: "critical" })}
          className="w-full flex items-center gap-3 rounded-lg border border-error-border bg-error-subtle/50 px-4 py-3 text-left hover:bg-error-subtle/70 transition-colors group"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-error-text" strokeWidth={2} aria-hidden />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">{counts.critical} critical event{counts.critical === 1 ? "" : "s"}</span>{" "}
            in this window — review compliance impact.
          </span>
          <span className="font-body text-[12px] font-semibold text-error-text group-hover:underline underline-offset-2">
            Show critical only
          </span>
        </button>
      )}

      {error && (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} aria-hidden style={{ color: TONE.error.text }} />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>
            {error instanceof AuditViewApiError ? error.message : "Failed to load audit events"}
          </p>
        </div>
      )}

      {/* KPI strip */}
      <section aria-label="Audit metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="In window"
          value={isLoading ? "—" : String(baseEvents.length)}
          icon={ScrollText}
          hint={timeLabel}
        />
        <StatCard
          label="Critical"
          value={isLoading ? "—" : String(counts.critical)}
          icon={ShieldAlert}
          hint={counts.critical > 0 ? "needs review" : "none"}
          hintTone={counts.critical > 0 ? "error" : "neutral"}
        />
        <StatCard
          label="Unique actors"
          value={isLoading ? "—" : String(uniqueActors)}
          icon={Users}
        />
        <StatCard
          label="Invalid sigs"
          value={isLoading || !data ? "—" : String(invalidSigs)}
          icon={invalidSigs > 0 ? ShieldAlert : ShieldCheck}
          hint={invalidSigs > 0 ? "tamper detected" : data ? "all verified" : undefined}
          hintTone={invalidSigs > 0 ? "error" : "neutral"}
        />
      </section>

      {/* Main table card */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Severity tabs */}
            <nav aria-label="Filter by severity" className="flex flex-wrap gap-1.5">
              {SEVERITY_TABS.map((tab) => {
                const active = severityFilter === tab.key;
                const count = counts[tab.key];
                const warn = tab.key === "critical" && count > 0;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setParam({ severity: tab.key === "all" ? null : tab.key })}
                    aria-current={active ? "page" : undefined}
                    style={active ? GLASS_GRADIENT : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                      active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                        active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                        tab.key === "critical" && count > 0 && !active && "text-error-text",
                        tab.key === "warning" && count > 0 && !active && "text-warning-text",
                      )}
                    >
                      {count}
                    </span>
                    {warn && !active ? (
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-error-solid)] shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Time window + search + actions */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Time pills */}
              <div
                role="group"
                aria-label="Time window"
                className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-bg-subtle border border-stroke-subtle"
              >
                {TIME_PRESETS.map((p) => {
                  const active = timePreset === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setParam({ time: p.key === "30d" ? null : p.key })}
                      style={active ? GLASS_GRADIENT : undefined}
                      className={cn(
                        "h-6 px-2.5 rounded-md font-body text-[11.5px] font-semibold transition-colors duration-fast",
                        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-surface",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative w-52 shrink-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
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
                  className={cn(SOLID_INPUT_CLS, "pl-9 pr-8")}
                />
                {searchDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDraft("");
                      setParam({ q: null });
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh events"
                className={cn(secondaryBtnClass, "h-9 w-9 px-0")}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
                  strokeWidth={2}
                  aria-hidden
                />
              </button>

              {/* Export */}
              <Link
                href="/enterprise/audit/export"
                className={cn(primaryBtnClass, "h-9 px-3.5 text-[12px]")}
                style={primaryStyle}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Export
              </Link>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Active
              </span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full bg-bg-subtle border border-stroke-subtle font-body text-[11.5px] font-medium text-foreground hover:bg-bg-subtle/80 transition-colors"
                >
                  {chip.label}
                  <X className="h-3 w-3 text-text-tertiary" strokeWidth={2} aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-body text-[11.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Advanced filters */}
          <div>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={cn(
                "inline-flex items-center gap-1.5 font-body text-[12px] font-semibold transition-colors",
                filtersOpen || actor || resourceType || resourceId || action
                  ? "text-foreground"
                  : "text-text-secondary hover:text-foreground",
              )}
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", filtersOpen && "rotate-180")}
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
                      className={cn(SOLID_INPUT_CLS, "font-mono text-[12px]")}
                    />
                  </FilterField>
                  <FilterField label="Resource type">
                    <input
                      value={resourceTypeDraft}
                      onChange={(e) => setResourceTypeDraft(e.target.value)}
                      placeholder="sow, payout…"
                      className={cn(SOLID_INPUT_CLS, "font-mono text-[12px]")}
                    />
                  </FilterField>
                  <FilterField label="Resource ID">
                    <input
                      value={resourceIdDraft}
                      onChange={(e) => setResourceIdDraft(e.target.value)}
                      placeholder="e.g. sow-1042"
                      className={cn(SOLID_INPUT_CLS, "font-mono text-[12px]")}
                    />
                  </FilterField>
                  <FilterField label="Action prefix">
                    <input
                      value={actionDraft}
                      onChange={(e) => setActionDraft(e.target.value)}
                      placeholder="e.g. sow."
                      className={cn(SOLID_INPUT_CLS, "font-mono text-[12px]")}
                    />
                  </FilterField>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" className={cn(primaryBtnClass, "h-9 px-3.5 text-[12px]")} style={primaryStyle}>
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
                      className={cn(secondaryBtnClass, "h-9 px-3.5 text-[12px]")}
                    >
                      Reset fields
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading && !data ? (
          <TableSkeleton />
        ) : events.length === 0 ? (
          <EmptyPanel onClear={clearAllFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary w-[130px]">
                      Timestamp
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Action
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary w-[150px]">
                      Actor
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary w-[180px]">
                      Resource
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary w-[90px]">
                      Severity
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary w-[80px]">
                      Integrity
                    </th>
                    <th className="w-8 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((ev) => (
                    <AuditEventRow key={ev.id} event={ev} />
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
              <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(pageIdx * ROWS_PER_PAGE, events.length)} of {events.length}{" "}
                · newest first · {timeLabel}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              )}
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function AuditEventRow({ event }: { event: AuditViewEvent }) {
  const resourceLabel = event.resource.label
    ? `${event.resource.type}:${event.resource.id} · ${event.resource.label}`
    : `${event.resource.type}:${event.resource.id}`;

  return (
    <tr
      className={cn(
        "group border-b border-stroke-subtle last:border-0 cursor-pointer transition-colors",
        "hover:bg-bg-subtle/60",
        !event.signatureValid && "bg-error-subtle/10 hover:bg-error-subtle/20",
      )}
    >
      <td className="px-4 sm:px-5 py-3">
        <Link
          href={`/enterprise/audit/${event.id}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
          tabIndex={-1}
          aria-hidden
        >
          <span className="font-mono text-[11.5px] tabular-nums text-text-secondary whitespace-nowrap">
            {fmtRelative(event.timestamp)}
          </span>
          <span className="sr-only">{fmtDateTime(event.timestamp)}</span>
        </Link>
      </td>
      <td className="px-3 py-3">
        <Link
          href={`/enterprise/audit/${event.id}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
        >
          <span className="font-mono text-[12.5px] font-medium text-foreground truncate block max-w-[280px] group-hover:text-text-link">
            {event.action}
          </span>
        </Link>
      </td>
      <td className="px-3 py-3">
        <span className="font-mono text-[11.5px] text-text-secondary truncate block max-w-[140px]">
          {event.actor.userId}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="font-body text-[11.5px] text-text-tertiary truncate block max-w-[170px]">
          {resourceLabel}
        </span>
      </td>
      <td className="px-3 py-3">
        <Chip tone={severityTone(event.severity)} className="capitalize">
          {event.severity}
        </Chip>
      </td>
      <td className="px-3 py-3">
        <span
          aria-label={event.signatureValid ? "Verified" : "Invalid signature"}
          className={cn(
            "inline-flex items-center gap-1 font-body text-[11px] font-semibold",
            event.signatureValid ? "text-success-text" : "text-error-text",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              event.signatureValid ? "bg-success-text" : "bg-error-text",
            )}
          />
          {event.signatureValid ? "OK" : "Fail"}
        </span>
      </td>
      <td className="px-2 py-3 align-middle">
        <Zap className="h-3.5 w-3.5 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} aria-hidden />
      </td>
    </tr>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Compliance
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/audit/export"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Export audit
      </Link>
    </p>
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
      <button
        type="button"
        onClick={onClear}
        className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
      >
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

function TableSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[260px]" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-[22px] w-16 rounded-full" />
          <Skeleton className="h-[22px] w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}
