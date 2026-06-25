"use client";

/**
 * Contributor directory — browse every contributor (freelancer / women /
 * student / contributor) and open their uploaded documents for verification.
 *
 * Read-only. Data: GET /api/superadmin/contributors (full profile + every
 * uploaded file reference per contributor). Filtering, sorting and search are
 * all client-side over the fetched list — fast and responsive. The controls
 * combine with AND logic:
 *   • Status   — active / pending / inactive / rejected   (record.status)
 *   • KYC      — verified / not verified                  (record.kycStatus)
 *   • Documents— has / none                               (record.fileCount)
 *   • Type     — distinct contributor roles in the data   (record.role)
 *   • Country  — distinct countries in the data           (record.country)
 *   • Search   — ID, name, email, phone, city, skills…    (haystack)
 *   • Sort     — name / newest / oldest / id / kyc        (record fields)
 */

import * as React from "react";
import { Search, ShieldCheck, UsersRound, X, Paperclip, SearchX, SlidersHorizontal } from "lucide-react";
import { useAdminContributors } from "@/lib/hooks/use-admin-contributors";
import type { ContributorRecord, ContributorStatus } from "@/lib/api/admin-contributors";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { AuroraSelect, primaryBtnClass, primaryStyle } from "../../_shell/aurora-ui";
import { TenantEmptyState } from "../../tenants/components/tenant-empty-state";
import { ContributorDetailDrawer } from "./contributor-detail-drawer";
import { ContributorsSkeleton } from "./contributors-skeleton";

const ROWS_PER_PAGE = 12;

const STATUS_LABEL: Record<ContributorStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  rejected: "Rejected",
};

/* ─── filter + sort state ─── */

type StatusFilter = "all" | ContributorStatus;
type KycFilter = "all" | "verified" | "unverified";
type DocsFilter = "all" | "has" | "none";

type SortKey = "name_asc" | "name_desc" | "newest" | "oldest" | "id" | "kyc";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "rejected", label: "Rejected" },
];

const KYC_OPTIONS: Array<{ value: KycFilter; label: string }> = [
  { value: "all", label: "Any KYC" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Not verified" },
];

const DOCS_OPTIONS: Array<{ value: DocsFilter; label: string }> = [
  { value: "all", label: "Any documents" },
  { value: "has", label: "Has documents" },
  { value: "none", label: "No documents" },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "id", label: "ID" },
  { value: "kyc", label: "KYC status" },
];

interface Filters {
  status: StatusFilter;
  kyc: KycFilter;
  docs: DocsFilter;
  type: string; // "all" | role value
  country: string; // "all" | country value
}

const DEFAULT_FILTERS: Filters = {
  status: "all",
  kyc: "all",
  docs: "all",
  type: "all",
  country: "all",
};

/** A human label for a raw role string (e.g. "women" → "Women"). */
function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Rank used for the "KYC status" sort — verified first, then in-progress. */
const KYC_RANK: Record<string, number> = {
  verified: 0,
  pending: 1,
  rejected: 2,
  not_started: 3,
};
function kycRank(status: string): number {
  return KYC_RANK[status] ?? 4;
}

function haystack(c: ContributorRecord): string {
  return [
    c.id,
    c.name,
    c.email ?? "",
    c.phone ?? "",
    c.city ?? "",
    c.country ?? "",
    c.role ?? "",
    c.jobTitle ?? "",
    ...c.primarySkills,
    ...c.expertiseAreas,
  ]
    .join(" ")
    .toLowerCase();
}

export function ContributorsWorkspace() {
  const { contributors: live, loading, error, refresh } = useAdminContributors();
  const contributors = React.useMemo(() => live ?? [], [live]);

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortKey>("name_asc");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Distinct Type/Country option sets, derived from the loaded list so the
  // dropdowns only ever offer values that actually exist in the data.
  const typeOptions = React.useMemo(() => {
    const seen = new Map<string, string>(); // value → label
    for (const c of contributors) {
      const v = (c.role ?? "").trim();
      if (v && !seen.has(v)) seen.set(v, titleCase(v));
    }
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [contributors]);

  const countryOptions = React.useMemo(() => {
    const seen = new Set<string>();
    for (const c of contributors) {
      const v = (c.country ?? "").trim();
      if (v) seen.add(v);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [contributors]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const result = contributors.filter((c) => {
      if (filters.status !== "all" && c.status !== filters.status) return false;
      if (filters.kyc === "verified" && c.kycStatus !== "verified") return false;
      if (filters.kyc === "unverified" && c.kycStatus === "verified") return false;
      if (filters.docs === "has" && c.fileCount <= 0) return false;
      if (filters.docs === "none" && c.fileCount > 0) return false;
      if (filters.type !== "all" && (c.role ?? "") !== filters.type) return false;
      if (filters.country !== "all" && (c.country ?? "") !== filters.country) return false;
      if (needle && !haystack(c).includes(needle)) return false;
      return true;
    });

    const ts = (c: ContributorRecord) => (c.createdAt ? new Date(c.createdAt).getTime() : 0);
    result.sort((a, b) => {
      switch (sort) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "newest":
          return ts(b) - ts(a) || a.name.localeCompare(b.name);
        case "oldest":
          return ts(a) - ts(b) || a.name.localeCompare(b.name);
        case "id":
          return a.id.localeCompare(b.id, undefined, { numeric: true });
        case "kyc":
          return kycRank(a.kycStatus) - kycRank(b.kycStatus) || a.name.localeCompare(b.name);
        case "name_asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return result;
  }, [contributors, filters, sort, search]);

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.kyc !== "all" ? 1 : 0) +
    (filters.docs !== "all" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    (filters.country !== "all" ? 1 : 0);
  const isDirty = activeFilterCount > 0 || search.trim() !== "" || sort !== "name_asc";

  const clearAll = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setSort("name_asc");
  }, []);

  // Reset to page 1 whenever the filter/sort/search changes the result set.
  React.useEffect(() => {
    setPage(1);
  }, [filters, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const selected = React.useMemo(
    () => contributors.find((c) => c.id === selectedId) ?? null,
    [contributors, selectedId],
  );

  // First load (no data yet) → skeleton, no flash.
  if (loading && live === null) return <ContributorsSkeleton />;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <header className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Contributors
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary">
          Every contributor with their full profile and uploaded documents — for identity and document
          verification.
        </p>
      </header>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* ─── filter / sort / search bar ─── */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-text-tertiary shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Filters
              </span>
            </div>

            <div className="relative w-full lg:w-72 shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, name, email, city, skill…"
                className={cn(
                  "w-full h-9 pl-9 pr-8 rounded-lg border border-stroke-subtle bg-surface",
                  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                )}
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v as StatusFilter }))}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="KYC"
              value={filters.kyc}
              onChange={(v) => setFilters((f) => ({ ...f, kyc: v as KycFilter }))}
            >
              {KYC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Documents"
              value={filters.docs}
              onChange={(v) => setFilters((f) => ({ ...f, docs: v as DocsFilter }))}
            >
              {DOCS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Type"
              value={filters.type}
              onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
              disabled={typeOptions.length === 0}
            >
              <option value="all">Any type</option>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Country"
              value={filters.country}
              onChange={(v) => setFilters((f) => ({ ...f, country: v }))}
              disabled={countryOptions.length === 0}
            >
              <option value="all">Any country</option>
              {countryOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect label="Sort" value={sort} onChange={(v) => setSort(v as SortKey)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="font-body text-[12.5px] text-text-tertiary">
              <span className="font-semibold text-text-secondary tabular-nums">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "contributor" : "contributors"}
              {activeFilterCount > 0 ? (
                <span className="text-text-disabled">
                  {" "}
                  · {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
                </span>
              ) : null}
            </p>
            {isDirty ? (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {error && live === null ? (
          <TenantEmptyState
            icon={SearchX}
            title="Couldn't load contributors"
            description="The contributor service is unavailable right now. This is a connection issue — try again in a moment."
            action={
              <button type="button" onClick={refresh} className={primaryBtnClass} style={primaryStyle}>
                Retry
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <TenantEmptyState
            icon={UsersRound}
            title="No contributors found"
            description={
              isDirty
                ? "Nothing matches. Clear filters or try a different search."
                : "No contributor accounts exist yet."
            }
            action={
              isDirty ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Contributor
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">ID</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">KYC</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Location
                    </th>
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Docs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <ContributorRow key={c.id} c={c} onOpen={() => setSelectedId(c.id)} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setPage(pageIdx - 1)}
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
                    onClick={() => setPage(pageIdx + 1)}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            ) : null}
          </>
        )}
      </div>

      <ContributorDetailDrawer contributor={selected} open={selected !== null} onClose={() => setSelectedId(null)} />
    </div>
  );
}

/** Labelled compact select used across the filter bar — wraps AuroraSelect. */
function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="block font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary mb-1">
        {label}
      </span>
      <AuroraSelect
        size="sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="disabled:opacity-55 disabled:cursor-not-allowed"
        aria-label={label}
      >
        {children}
      </AuroraSelect>
    </label>
  );
}

function ContributorRow({ c, onOpen }: { c: ContributorRecord; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <div className="block min-w-0 max-w-[260px]">
          <span className="block font-body text-[13.5px] font-semibold text-foreground truncate group-hover:text-text-link">
            {c.name}
          </span>
          <span className="block font-mono text-[11px] text-text-tertiary truncate">{c.email}</span>
        </div>
      </td>
      <td className="px-3 py-3.5 font-mono text-[12px] text-text-secondary tabular-nums">{c.id}</td>
      <td className="px-3 py-3.5">
        <StatusChip status={c.status} />
      </td>
      <td className="px-3 py-3.5">
        <KycChip status={c.kycStatus} />
      </td>
      <td className="px-3 py-3.5 font-body text-[13px] text-text-secondary truncate max-w-[160px]">
        {[c.city, c.country].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-4 sm:px-5 py-3.5">
        {c.fileCount > 0 ? (
          <span className="inline-flex items-center gap-1 font-body text-[12.5px] text-text-secondary tabular-nums">
            <Paperclip className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
            {c.fileCount}
          </span>
        ) : (
          <span className="font-body text-[12.5px] text-text-disabled">—</span>
        )}
      </td>
    </tr>
  );
}

function StatusChip({ status }: { status: ContributorStatus }) {
  const toneClass =
    status === "active"
      ? "text-success-text bg-success-subtle"
      : status === "pending"
        ? "text-info-text bg-info-subtle"
        : status === "rejected"
          ? "text-warning-text bg-warning-subtle"
          : "text-text-secondary bg-bg-subtle";
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium",
        toneClass,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function KycChip({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="inline-flex h-[22px] items-center gap-1 px-2.5 rounded-full font-body text-[11px] font-medium text-success-text bg-success-subtle">
        <ShieldCheck className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        Verified
      </span>
    );
  }
  const label =
    status === "pending" ? "Pending" : status === "rejected" ? "Rejected" : "Not started";
  const tone =
    status === "pending"
      ? "text-info-text bg-info-subtle"
      : status === "rejected"
        ? "text-warning-text bg-warning-subtle"
        : "text-text-secondary bg-bg-subtle";
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium",
        tone,
      )}
    >
      {label}
    </span>
  );
}
