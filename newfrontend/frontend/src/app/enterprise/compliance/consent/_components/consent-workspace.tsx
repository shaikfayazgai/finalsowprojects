"use client";

/**
 * Consent inventory — registry table.
 *   Use-case: compliance officer scans, filters, and exports the full contributor
 *             consent matrix to check coverage and identify gaps.
 *   Layout: KPI strip (total · complete · missing · rate) → overdue alert →
 *           DASH_CARD { gradient-pill tabs + solid search + export →
 *           <table> + pagination }.
 *
 *   De-glassed: DASH_CARD, GLASS_GRADIENT pills, solid inputs, no backdrop-blur.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  useConsentInventory,
  useDownloadConsentCsv,
} from "@/lib/hooks/use-enterprise-consent";
import type { ConsentRow } from "@/lib/api/enterprise-consent";
import { ConsentApiError } from "@/lib/api/enterprise-consent";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, secondaryBtnClass, TONE } from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 15;

type FilterTab = "all" | "complete" | "missing";

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "complete", label: "Complete" },
  { key: "missing", label: "Missing required" },
];

const FLAG_COLUMNS: Array<{
  key: keyof Pick<
    ConsentRow,
    | "ndaAccepted"
    | "acceptTos"
    | "acceptCoc"
    | "acceptPrivacy"
    | "acceptFee"
    | "acceptAhp"
    | "marketingOptIn"
  >;
  label: string;
  short: string;
  required: boolean;
}> = [
  { key: "acceptTos", label: "Terms & conditions", short: "T&Cs", required: true },
  { key: "acceptPrivacy", label: "Privacy policy", short: "Privacy", required: true },
  { key: "acceptCoc", label: "Code of conduct", short: "CoC", required: true },
  { key: "ndaAccepted", label: "NDA", short: "NDA", required: true },
  { key: "acceptFee", label: "Fee schedule", short: "Fee", required: false },
  { key: "acceptAhp", label: "AHP", short: "AHP", required: false },
  { key: "marketingOptIn", label: "Marketing", short: "Mktg", required: false },
];

const MISSING_LABEL: Record<string, string> = {
  acceptTos: "T&Cs",
  acceptPrivacy: "Privacy",
  acceptCoc: "CoC",
  ndaAccepted: "NDA",
  acceptFee: "Fee",
  acceptAhp: "AHP",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

export function ConsentWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterTab =
    (searchParams.get("filter") as FilterTab | null) ??
    (searchParams.get("missing") === "1" ? "missing" : "all");
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  React.useEffect(() => setSearchDraft(search), [search]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      next.delete("missing");
      const qs = next.toString();
      router.replace(
        qs ? `/enterprise/compliance/consent?${qs}` : "/enterprise/compliance/consent",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam({ q: value.trim() || null });
  }, 300);

  const { data, isLoading, error } = useConsentInventory({
    search: search || undefined,
  });
  const csvMut = useDownloadConsentCsv();

  const filteredRows = React.useMemo(() => {
    if (!data) return [];
    if (filterTab === "complete") return data.rows.filter((r) => r.isComplete);
    if (filterTab === "missing") return data.rows.filter((r) => !r.isComplete);
    return data.rows;
  }, [data, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filteredRows.slice(
    (pageIdx - 1) * ROWS_PER_PAGE,
    pageIdx * ROWS_PER_PAGE,
  );

  const completionPct =
    data && data.total > 0 ? Math.round((data.complete / data.total) * 100) : 0;

  const listDescription = isLoading
    ? "Loading contributors…"
    : filteredRows.length === 0
      ? "No matches"
      : `${filteredRows.length} contributor${filteredRows.length === 1 ? "" : "s"}`;

  const exportQuery = {
    search: search || undefined,
    missing: filterTab === "missing" ? true : undefined,
  };

  const tabCount = (k: FilterTab) =>
    k === "all"
      ? data?.total ?? 0
      : k === "complete"
        ? data?.complete ?? 0
        : data?.missing ?? 0;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Page header */}
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Compliance · Consent
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Consent inventory
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Contributors × consent flags captured at registration. Required: T&Cs, Privacy, Code of Conduct, and NDA.
        </p>
        <RecordLinks />
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof ConsentApiError ? error.message : "Failed to load consent inventory"}
          </p>
        </div>
      )}

      {/* Missing consent alert */}
      {data && data.missing > 0 && filterTab !== "missing" && (
        <button
          type="button"
          onClick={() => setParam({ filter: "missing" })}
          className="w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left hover:opacity-90 transition-opacity"
          style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0"
            strokeWidth={2}
            style={{ color: TONE.warning.text }}
            aria-hidden
          />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">
              {data.missing} contributor{data.missing === 1 ? "" : "s"} missing required consent
            </span>{" "}
            — click to filter.
          </span>
        </button>
      )}

      {/* KPI strip */}
      <section aria-label="Consent coverage" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total contributors"
          value={isLoading || !data ? "—" : String(data.total)}
          icon={Users}
        />
        <StatCard
          label="Complete"
          value={isLoading || !data ? "—" : String(data.complete)}
          icon={CheckCircle2}
          hint={data && data.complete === data.total ? "all consents on file" : undefined}
          hintTone={data && data.complete === data.total ? "success" : "neutral"}
        />
        <StatCard
          label="Missing required"
          value={isLoading || !data ? "—" : String(data.missing)}
          icon={AlertTriangle}
          hint={data && data.missing > 0 ? "blocks task assignment" : undefined}
          hintTone={data && data.missing > 0 ? "error" : "neutral"}
        />
        <StatCard
          label="Completion rate"
          value={isLoading || !data ? "—" : `${completionPct}%`}
          icon={ShieldCheck}
          hint="required consents on file"
          hintTone={completionPct >= 95 ? "success" : completionPct >= 80 ? "warning" : "error"}
        />
      </section>

      {/* Registry table */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Table toolbar */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter by consent status" className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = filterTab === tab.key;
              const count = tabCount(tab.key);
              const warn = tab.key === "missing" && count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ filter: tab.key === "all" ? null : tab.key })}
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
                      warn && !active ? "text-error-text" : "",
                    )}
                  >
                    {isLoading ? "—" : count}
                  </span>
                  {warn && !active ? (
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-solid)] shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
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
                placeholder="Search name or email…"
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
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
            <button
              type="button"
              onClick={() => csvMut.mutate(exportQuery)}
              disabled={csvMut.isPending || isLoading || !data}
              className={cn(secondaryBtnClass, "h-9 px-3 text-[12.5px] shrink-0")}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {csvMut.isPending ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Table content */}
        {isLoading && !data ? (
          <TableSkeleton />
        ) : filteredRows.length === 0 ? (
          <EmptyPanel filter={filterTab} onClear={() => setParam({ q: null, filter: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Contributor
                    </th>
                    {FLAG_COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        className="px-3 py-2.5 text-center font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary whitespace-nowrap"
                      >
                        {c.short}
                        {c.required && (
                          <span className="text-error-text ml-0.5" aria-hidden>
                            *
                          </span>
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary whitespace-nowrap">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <ConsentRowItem key={row.contributorId} row={row} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, filteredRows.length)} of{" "}
                  {filteredRows.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
                    }
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors duration-fast"
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
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors duration-fast"
                  >
                    Next
                  </button>
                </div>
              </footer>
            ) : null}
          </>
        )}

        {/* Legend footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-stroke-subtle bg-bg-subtle/40">
          <p className="font-body text-[11px] text-text-tertiary">
            <span className="font-semibold text-text-secondary">Required *</span> — T&Cs, Privacy, CoC,
            NDA. Source:{" "}
            <code className="font-mono text-[10px]">ContributorProfile</code> flags at registration.
            Versioned consent ledger lands in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── sub-components ─── */

function ConsentRowItem({ row }: { row: ConsentRow }) {
  return (
    <tr
      className={cn(
        "group border-b border-stroke-subtle last:border-0 transition-colors duration-fast hover:bg-bg-subtle/60",
        !row.isComplete && "bg-[rgba(var(--color-warning-rgb,251,146,60),0.04)]",
      )}
    >
      {/* Contributor identity */}
      <td className="px-4 sm:px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-[13px] font-medium text-foreground truncate max-w-[200px]">
            {row.name || row.email}
          </span>
          <StatusPill complete={row.isComplete} />
        </div>
        <span className="font-mono text-[10.5px] text-text-tertiary truncate block mt-0.5 max-w-[220px]">
          {row.email}
        </span>
        {!row.isComplete && row.missingRequired.length > 0 && (
          <span className="font-body text-[11px] text-error-text block mt-0.5">
            Missing: {row.missingRequired.map((k) => MISSING_LABEL[k] ?? k).join(", ")}
          </span>
        )}
      </td>

      {/* Flag columns */}
      {FLAG_COLUMNS.map((c) => (
        <td key={c.key} className="px-3 py-3.5 text-center">
          <ConsentChip label={c.short} on={!!row[c.key]} required={c.required} />
        </td>
      ))}

      {/* Updated */}
      <td className="px-4 py-3.5 text-right font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
        {fmtDate(row.profileUpdatedAt)}
      </td>
    </tr>
  );
}

function ConsentChip({
  label,
  on,
  required,
}: {
  label: string;
  on: boolean;
  required: boolean;
}) {
  const missingRequired = !on && required;
  return (
    <span
      title={`${label}: ${on ? "given" : missingRequired ? "missing (required)" : "not given"}`}
      className={cn(
        "inline-flex items-center justify-center rounded-md h-7 min-w-[2.5rem] px-2",
        "font-body text-[10.5px] font-semibold tabular-nums",
        on
          ? "bg-success-subtle text-success-text"
          : missingRequired
            ? "bg-error-subtle text-error-text ring-1 ring-error-border/40"
            : "bg-bg-subtle border border-stroke-subtle text-text-tertiary",
      )}
    >
      {on ? "✓" : "✕"}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function StatusPill({ complete }: { complete: boolean }) {
  return (
    <Chip
      tone={complete ? "success" : "error"}
      dot={false}
      className="h-[20px] text-[10px] normal-case tracking-normal"
    >
      {complete ? "Complete" : "Missing"}
    </Chip>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-52 max-w-[35%]" />
          <div className="flex items-center gap-3">
            {Array.from({ length: 7 }).map((__, j) => (
              <Skeleton key={j} className="h-7 w-9 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({
  filter,
  onClear,
}: {
  filter: FilterTab;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <Users className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">No contributors match</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {filter === "missing"
          ? "No missing required consents in this view — coverage looks complete."
          : filter === "complete"
            ? "No fully complete profiles match your search."
            : "Try clearing search or switching tabs."}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/compliance"
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to compliance
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance/retention"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Data retention
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/audit"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit log
      </Link>
    </p>
  );
}
