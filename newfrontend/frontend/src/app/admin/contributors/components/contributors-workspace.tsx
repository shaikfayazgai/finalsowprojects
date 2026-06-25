"use client";

/**
 * Contributor directory — browse every contributor (freelancer / women /
 * student / contributor) and open their uploaded documents for verification.
 *
 * Read-only. Data: GET /api/superadmin/contributors (full profile + every
 * uploaded file reference per contributor). Filtering is client-side over the
 * fetched list — fast and responsive: by ID number, name, email, city/country,
 * skills, plus status + KYC tabs.
 */

import * as React from "react";
import { Search, ShieldCheck, UsersRound, X, Paperclip, SearchX } from "lucide-react";
import { useAdminContributors } from "@/lib/hooks/use-admin-contributors";
import type { ContributorRecord, ContributorStatus } from "@/lib/api/admin-contributors";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryBtnClass, primaryStyle } from "../../_shell/aurora-ui";
import { TenantEmptyState } from "../../tenants/components/tenant-empty-state";
import { ContributorDetailDrawer } from "./contributor-detail-drawer";
import { ContributorsSkeleton } from "./contributors-skeleton";

type Tab = "all" | "active" | "pending" | "kyc_verified" | "has_files";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "kyc_verified", label: "KYC verified" },
  { key: "has_files", label: "Has documents" },
];

const ROWS_PER_PAGE = 12;

const STATUS_LABEL: Record<ContributorStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  rejected: "Rejected",
};

function matchesTab(c: ContributorRecord, tab: Tab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "active":
      return c.status === "active";
    case "pending":
      return c.status === "pending";
    case "kyc_verified":
      return c.kycStatus === "verified";
    case "has_files":
      return c.fileCount > 0;
  }
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
  const contributors = live ?? [];

  const [tab, setTab] = React.useState<Tab>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const counts = React.useMemo(
    () => ({
      all: contributors.length,
      active: contributors.filter((c) => c.status === "active").length,
      pending: contributors.filter((c) => c.status === "pending").length,
      kyc_verified: contributors.filter((c) => c.kycStatus === "verified").length,
      has_files: contributors.filter((c) => c.fileCount > 0).length,
    }),
    [contributors],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return contributors
      .filter((c) => matchesTab(c, tab))
      .filter((c) => (needle ? haystack(c).includes(needle) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contributors, tab, search]);

  // Reset to page 1 whenever the filter/search changes the result set.
  React.useEffect(() => {
    setPage(1);
  }, [tab, search]);

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
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <FilterTabs value={tab} counts={counts} onChange={setTab} />

          <div className="relative w-full sm:w-64 shrink-0">
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
              search.trim() || tab !== "all"
                ? "Nothing matches. Clear filters or try a different search."
                : "No contributor accounts exist yet."
            }
            action={
              search.trim() || tab !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTab("all");
                  }}
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

function FilterTabs({
  value,
  counts,
  onChange,
}: {
  value: Tab;
  counts: Record<Tab, number>;
  onChange: (key: Tab) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter contributors" className="flex flex-wrap gap-1">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              active ? "admin-tab-on" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {t.label}
            <span
              className={cn(
                "font-mono text-[11px] tabular-nums",
                active ? "text-text-tertiary" : "text-text-disabled",
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        );
      })}
    </div>
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
