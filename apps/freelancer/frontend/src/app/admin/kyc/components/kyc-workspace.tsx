"use client";

/**
 * KYC reviews workspace — identity verification queue for contributor tracks.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Search, X } from "lucide-react";
import { Select, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminKycCasesList, useKycSummary } from "@/lib/hooks/use-admin-kyc";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { KycStatus, KycTrack, MockKycCase } from "@/mocks/admin/kyc";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 10;

type StatusFilter = "pending" | "reuploaded" | "awaiting_info" | "approved" | "rejected";
type TrackFilter = "all" | KycTrack;

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "reuploaded", label: "Re-uploaded" },
  { key: "awaiting_info", label: "Awaiting info" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_LABEL: Record<KycStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  awaiting_info: "Awaiting info",
  reuploaded: "Re-uploaded",
};

const TRACK_LABEL: Record<KycTrack, string> = {
  "Women WF": "Women workforce",
  Student: "Student",
  Freelancer: "Freelancer",
  Internal: "Internal",
};

function statusChip(s: KycStatus): "success" | "warning" | "error" | "pending" | "neutral" | "info" {
  switch (s) {
    case "pending":
      return "warning";
    case "reuploaded":
    case "awaiting_info":
      return "info";
    case "approved":
      return "success";
    case "rejected":
      return "error";
  }
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function slaRemaining(c: MockKycCase): { label: string; overdue: boolean } {
  if (c.status !== "pending" && c.status !== "reuploaded") {
    return { label: STATUS_LABEL[c.status], overdue: false };
  }
  const remain = new Date(c.submittedAt).getTime() + c.slaHours * 3_600_000 - Date.now();
  if (remain <= 0) return { label: "Overdue", overdue: true };
  return { label: `${Math.ceil(remain / 3_600_000)}h left`, overdue: false };
}

function sortNewestFirst(items: MockKycCase[]): MockKycCase[] {
  return [...items].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
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

export function KycWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("kyc");
  const allCases = useAdminKycCasesList();
  const summary = useKycSummary();

  const statusFilter = (searchParams.get("status") as StatusFilter | null) ?? "pending";
  const trackFilter = (searchParams.get("track") as TrackFilter | null) ?? "all";
  const emailFilter = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("decided") === "1" ? "Decision recorded." : null,
  );

  React.useEffect(() => setSearchDraft(search), [search]);

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(changes)) {
        if (val === null || val === "") next.delete(key);
        else next.set(key, val);
      }
      if (!("page" in changes)) next.delete("page");
      if (changes.decided === null) next.delete("decided");
      const qs = next.toString();
      router.replace(qs ? `/admin/kyc?${qs}` : "/admin/kyc", { scroll: false });
    },
    [router, searchParams],
  );

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setParam({ q: value.trim() || null });
  }, 300);

  const statusCounts = React.useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      pending: 0,
      reuploaded: 0,
      awaiting_info: 0,
      approved: 0,
      rejected: 0,
    };
    for (const c of allCases) counts[c.status as StatusFilter]++;
    return counts;
  }, [allCases]);

  const overdueCount = React.useMemo(
    () =>
      allCases.filter(
        (c) =>
          (c.status === "pending" || c.status === "reuploaded") &&
          slaRemaining(c).overdue,
      ).length,
    [allCases],
  );

  const filtered = React.useMemo(() => {
    let list = allCases.filter((c) => c.status === statusFilter);
    if (trackFilter !== "all") list = list.filter((c) => c.track === trackFilter);
    if (emailFilter) {
      list = list.filter((c) => c.contributorEmail.toLowerCase() === emailFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.contributorName.toLowerCase().includes(q) ||
          c.contributorEmail.toLowerCase().includes(q) ||
          c.track.toLowerCase().includes(q),
      );
    }
    return sortNewestFirst(list);
  }, [allCases, statusFilter, trackFilter, emailFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.min(Math.max(1, page), totalPages);
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const hasFilters =
    trackFilter !== "all" || !!emailFilter || !!search.trim();

  const activeFilters = React.useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (search.trim()) {
      chips.push({ key: "q", label: `Search: ${search}`, clear: () => setParam({ q: null }) });
    }
    if (trackFilter !== "all") {
      chips.push({
        key: "track",
        label: `Track: ${TRACK_LABEL[trackFilter]}`,
        clear: () => setParam({ track: null }),
      });
    }
    if (emailFilter) {
      chips.push({
        key: "email",
        label: `Email: ${emailFilter}`,
        clear: () => setParam({ email: null }),
      });
    }
    return chips;
  }, [search, trackFilter, emailFilter, setParam]);

  const clearAllFilters = () => {
    setSearchDraft("");
    setParam({ track: null, email: null, q: null, page: null });
  };

  const listDescription =
    filtered.length === 0
      ? "No submissions match"
      : `${filtered.length} submission${filtered.length === 1 ? "" : "s"} · newest first`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}

      {!canEdit && (
        <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-text-secondary">View-only access</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
            KYC decisions require Platform Admin or Trust &amp; Safety.
          </p>
        </div>
      )}

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Identity verification
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          KYC reviews
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Review contributor identity documents, run automated checks, and approve or reject onboarding for each track.
        </p>
        <RecordLinks />
      </header>

      {overdueCount > 0 && (statusFilter === "pending" || statusFilter === "reuploaded") && (
        <ContextBanner title={`${overdueCount} submission${overdueCount === 1 ? "" : "s"} past SLA`}>
          Cases in the current queue that exceeded the {allCases[0]?.slaHours ?? 8}h review window.
        </ContextBanner>
      )}

      <DashboardSection title="Queue summary" description="Throughput and backlog across all tracks">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Pending"
            value={String(summary.pending)}
            highlight={summary.pending > 0}
            alert={summary.pending > 0}
          />
          <SummaryStat
            label="Re-uploaded"
            value={String(summary.reuploaded)}
            highlight={summary.reuploaded > 0}
          />
          <SummaryStat label="Approved (30d)" value={String(summary.approved30d)} />
          <SummaryStat label="Rejected (30d)" value={String(summary.rejected30d)} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="min-w-0 flex-1 basis-[200px]">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Review queue
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
                placeholder="Search ID, name, email…"
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

          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key;
              const count = statusCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setParam({ status: tab.key === "pending" ? null : tab.key })
                  }
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
                      tab.key === "pending" && count > 0 && !active && "text-warning-text font-semibold",
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

          <div className="flex flex-wrap items-end gap-3 pb-3 border-t border-stroke-subtle pt-3">
            <FilterSelect
              label="Track"
              value={trackFilter}
              onChange={(v) => setParam({ track: v === "all" ? null : v })}
              options={[
                { value: "all", label: "All tracks" },
                { value: "Student", label: "Student" },
                { value: "Women WF", label: "Women workforce" },
                { value: "Freelancer", label: "Freelancer" },
                { value: "Internal", label: "Internal" },
              ]}
            />
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 pb-3 border-t border-stroke-subtle pt-3">
              <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Active
              </span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={f.clear}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-stroke-subtle bg-bg-subtle/50 font-body text-[11.5px] text-text-secondary hover:bg-bg-subtle transition-colors"
                >
                  {f.label}
                  <X className="h-3 w-3" strokeWidth={2} aria-hidden />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="font-body text-[11.5px] font-semibold text-brand hover:opacity-80"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyPanel onClear={clearAllFilters} status={statusFilter} />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((c) => (
                <KycRow key={c.id} item={c} />
              ))}
            </ul>
            <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
              <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                {Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
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

function KycRow({ item }: { item: MockKycCase }) {
  const sla = slaRemaining(item);
  const meta = [TRACK_LABEL[item.track], item.country, item.idType].join(" · ");

  return (
    <li>
      <Link
        href={`/admin/kyc/${item.id}`}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
          "hover:bg-bg-subtle/60 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
          sla.overdue && "bg-error-subtle/15 hover:bg-error-subtle/25",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-mono text-[11.5px] font-semibold text-text-tertiary tabular-nums shrink-0">
              {item.id}
            </span>
            <StatusChip status={statusChip(item.status)} size="sm">
              {STATUS_LABEL[item.status]}
            </StatusChip>
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {item.contributorName}
            </span>
          </span>
          <span className="font-body text-[12px] text-text-secondary truncate block mt-0.5">
            {item.contributorEmail}
          </span>
          <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
            {meta}
          </span>
        </span>
        <span className="shrink-0 text-right flex flex-col items-end gap-1.5">
          <StatusChip
            status={sla.overdue ? "error" : item.status === "pending" || item.status === "reuploaded" ? "warning" : "neutral"}
            size="sm"
            showDot={sla.overdue || item.status === "pending" || item.status === "reuploaded"}
          >
            {sla.label}
          </StatusChip>
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums whitespace-nowrap">
            {fmtRelative(item.submittedAt)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="min-w-[140px]">
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      <Select variant="outline" size="sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
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
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
      <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyPanel({
  onClear,
  status,
}: {
  onClear: () => void;
  status: StatusFilter;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-body text-[13px] text-text-secondary">
        No {STATUS_LABEL[status as KycStatus]?.toLowerCase() ?? status} submissions match your filters.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 font-body text-[12.5px] font-semibold text-brand hover:opacity-80"
      >
        Clear filters
      </button>
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/admin/governance"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Cases
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/admin/audit"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Platform audit
      </Link>
    </p>
  );
}
