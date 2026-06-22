"use client";

/**
 * Consent inventory workspace — contributor consent matrix with search,
 * filter tabs, and CSV export.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  Search,
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
import { ACCENT_TEXT, AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { SectionCard, Chip, TONE, ghostBtnClass, GLASS_FIELD_STYLE } from "@/app/admin/_shell/aurora-ui";

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

  const filterTab = (searchParams.get("filter") as FilterTab | null) ?? 
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

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Compliance · Consent
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Consent inventory
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Contributors × consent flags captured at registration. Required: T&Cs, Privacy, Code of Conduct, and NDA.
        </p>
        <RecordLinks />
      </header>

      {data && data.missing > 0 && filterTab !== "missing" && (
        <ContextBanner title={`${data.missing} contributor${data.missing === 1 ? "" : "s"} missing required consent`}>
          <button
            type="button"
            onClick={() => setParam({ filter: "missing" })}
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Show missing only
          </button>
        </ContextBanner>
      )}

      {error && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof ConsentApiError ? error.message : "Failed to load consent inventory"}
          </p>
        </div>
      )}

      <SectionCard
        title="Coverage summary"
        description={isLoading ? "Loading…" : `${data?.total ?? 0} contributors on this tenant`}
      >
        <dl className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Total"
            value={isLoading || !data ? null : String(data.total)}
          />
          <SummaryStat
            label="Complete"
            value={isLoading || !data ? null : String(data.complete)}
            highlight={Boolean(data && data.complete === data.total)}
          />
          <SummaryStat
            label="Missing required"
            value={isLoading || !data ? null : String(data.missing)}
            alert={Boolean(data && data.missing > 0)}
          />
          <SummaryStat
            label="Completion rate"
            value={isLoading || !data ? null : `${completionPct}%`}
            caption="Required consents on file"
          />
        </dl>
      </SectionCard>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-0 border-b border-white/55">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[200px]">
              <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Contributor matrix
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
                placeholder="Search name or email…"
                style={GLASS_FIELD_STYLE}
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-xl backdrop-blur-md",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
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

            <button
              type="button"
              onClick={() => csvMut.mutate(exportQuery)}
              disabled={csvMut.isPending || isLoading || !data}
              className={cn(ghostBtnClass, "h-8 px-3 text-[12px]")}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {csvMut.isPending ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {FILTER_TABS.map((tab) => {
              const active = filterTab === tab.key;
              const count =
                tab.key === "all"
                  ? data?.total ?? 0
                  : tab.key === "complete"
                    ? data?.complete ?? 0
                    : data?.missing ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ filter: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap transition-colors duration-fast",
                    active ? "text-foreground" : "text-text-secondary hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-white/70 border border-white/70",
                      tab.key === "missing" && count > 0 && !active ? "text-error-text font-semibold" : "text-text-tertiary",
                    )}
                  >
                    {isLoading ? "—" : count}
                  </span>
                  {active && (
                    <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ backgroundImage: AURORA_ACCENT }} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {isLoading && !data ? (
          <div className="divide-y divide-white/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 sm:px-6 py-3">
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyPanel filter={filterTab} onClear={() => setParam({ q: null, filter: null })} />
        ) : (
          <>
            <div className="hidden md:grid md:grid-cols-[1.4fr_repeat(7,minmax(0,0.55fr))_0.75fr] gap-2 px-5 sm:px-6 py-2 bg-white/40 border-b border-white/55 font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
              <span>Contributor</span>
              {FLAG_COLUMNS.map((c) => (
                <span key={c.key} className="text-center">
                  {c.short}
                  {c.required && <span className="text-error-text">*</span>}
                </span>
              ))}
              <span className="text-right">Updated</span>
            </div>

            <ul className="divide-y divide-white/60">
              {pageRows.map((row) => (
                <ConsentRowItem key={row.contributorId} row={row} />
              ))}
            </ul>

            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-white/55">
              <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(pageIdx * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageIdx === 1}
                  onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                  className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors duration-fast"
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
                  className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors duration-fast"
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}

        <div className="px-5 sm:px-6 py-3 border-t border-white/55 bg-white/30">
          <p className="font-body text-[11px] text-text-tertiary">
            <span className="font-semibold text-text-secondary">Required *</span> — T&Cs, Privacy, CoC, NDA.
            Source:{" "}
            <code className="font-mono text-[10px]">ContributorProfile</code> flags at registration.
            Versioned consent ledger lands in Phase 2.
          </p>
        </div>
      </section>
    </div>
  );
}

function ConsentRowItem({ row }: { row: ConsentRow }) {
  return (
    <li
      className={cn(
        "px-5 sm:px-6 py-3 min-h-[52px] transition-colors duration-fast hover:bg-white/50",
        !row.isComplete && "bg-warning-subtle/20",
      )}
    >
      <div className="md:grid md:grid-cols-[1.4fr_repeat(7,minmax(0,0.55fr))_0.75fr] md:gap-2 md:items-center">
        <div className="min-w-0 flex items-start justify-between gap-3 md:block">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[13px] font-medium text-foreground truncate">
                {row.name || row.email}
              </span>
              <StatusPill complete={row.isComplete} />
            </div>
            <span className="font-mono text-[10.5px] text-text-tertiary truncate block mt-0.5">
              {row.email}
            </span>
            {!row.isComplete && row.missingRequired.length > 0 && (
              <span className="font-body text-[11px] text-error-text block mt-1 md:hidden">
                Missing: {row.missingRequired.map((k) => MISSING_LABEL[k] ?? k).join(", ")}
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0 md:hidden">
            {fmtDate(row.profileUpdatedAt)}
          </span>
        </div>

        {FLAG_COLUMNS.map((c) => (
          <div key={c.key} className="hidden md:flex md:justify-center">
            <ConsentChip
              label={c.short}
              on={!!row[c.key]}
              required={c.required}
            />
          </div>
        ))}

        <div className="mt-2.5 flex flex-wrap gap-1.5 md:hidden">
          {FLAG_COLUMNS.map((c) => (
            <span
              key={c.key}
              title={c.label}
              className={cn(
                "inline-flex items-center gap-1 h-6 px-2 rounded-md font-body text-[10px] font-semibold",
                row[c.key]
                  ? "bg-success-subtle text-success-text"
                  : c.required
                    ? "bg-error-subtle text-error-text"
                    : "bg-white/55 border border-white/70 text-text-tertiary",
              )}
            >
              {c.short}
            </span>
          ))}
        </div>

        <span className="hidden md:block font-mono text-[10.5px] text-text-tertiary tabular-nums text-right">
          {fmtDate(row.profileUpdatedAt)}
        </span>
      </div>
    </li>
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
            : "bg-white/55 border border-white/70 text-text-tertiary",
      )}
    >
      {on ? "✓" : "✕"}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function StatusPill({ complete }: { complete: boolean }) {
  return (
    <Chip tone={complete ? "success" : "error"} dot={false} className="h-[20px] text-[10px] normal-case tracking-normal">
      {complete ? "Complete" : "Missing"}
    </Chip>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/compliance"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to compliance
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/compliance/retention"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Data retention
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/audit"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit log
      </Link>
    </p>
  );
}

function SummaryStat({
  label,
  value,
  caption,
  highlight,
  alert,
}: {
  label: string;
  value: string | null;
  caption?: string;
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
          "mt-1 font-display text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-error-text" : "text-foreground",
        )}
        style={highlight && !alert ? ACCENT_TEXT : undefined}
      >
        {value === null ? <Skeleton className="h-6 w-12 rounded inline-block" /> : value}
      </dd>
      {caption && (
        <dd className="mt-0.5 font-body text-[11px] text-text-tertiary">{caption}</dd>
      )}
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 backdrop-blur"
      style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
    >
      <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: TONE.warning.text }} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
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
      <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold" style={ACCENT_TEXT}>
        Clear filters
      </button>
    </div>
  );
}
