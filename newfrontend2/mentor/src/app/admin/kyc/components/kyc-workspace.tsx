"use client";

/**
 * KYC reviews — identity verification work queue.
 *
 * Workflow:
 *   1. Triage pending / re-uploaded submissions (SLA in table)
 *   2. Open case → review evidence → record decision
 *   3. Browse closed outcomes in Approved / Rejected tabs
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShieldCheck, X } from "lucide-react";
import { useAdminKycCasesList } from "@/lib/hooks/use-admin-kyc";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import type { KycStatus, KycTrack, MockKycCase } from "@/mocks/admin/kyc";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

type StatusFilter = "pending" | "reuploaded" | "awaiting_info" | "approved" | "rejected";
type TrackFilter = "all" | KycTrack;
type Risk = "high" | "medium" | "low";

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

const RISK_LABEL: Record<Risk, string> = { high: "High", medium: "Medium", low: "Low" };

const ROWS_PER_PAGE = 12;

function caseRisk(c: MockKycCase): Risk {
  if (c.autoChecks.some((chk) => chk.state === "fail")) return "high";
  if (c.autoChecks.some((chk) => chk.state === "warn")) return "medium";
  return "low";
}

function fmtRelative(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function slaInfo(c: MockKycCase): { label: string; tone: "warning" | "neutral" | "success" } {
  if (c.status !== "pending" && c.status !== "reuploaded") {
    return { label: STATUS_LABEL[c.status], tone: "neutral" };
  }
  const remain = new Date(c.submittedAt).getTime() + c.slaHours * 3_600_000 - Date.now();
  if (remain <= 0) return { label: "Overdue", tone: "warning" };
  const h = Math.ceil(remain / 3_600_000);
  if (h <= 2) return { label: `${h}h left`, tone: "warning" };
  return { label: `${h}h left`, tone: "neutral" };
}

export function KycWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canEdit = useAdminSectionCanEdit("kyc");
  const allCases = useAdminKycCasesList();

  const statusFilter: StatusFilter = (searchParams.get("status") as StatusFilter | null) ?? "pending";
  const trackFilter: TrackFilter = (searchParams.get("track") as TrackFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("decided") === "1" ? "Decision recorded." : null,
  );

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

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allCases
      .filter((c) => c.status === statusFilter)
      .filter((c) => trackFilter === "all" || c.track === trackFilter)
      .filter((c) => {
        if (!needle) return true;
        const hay = [c.id, c.contributorName, c.contributorEmail, c.track].join(" ").toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (statusFilter === "pending" || statusFilter === "reuploaded") {
          const sa = new Date(a.submittedAt).getTime() + a.slaHours * 3_600_000;
          const sb = new Date(b.submittedAt).getTime() + b.slaHours * 3_600_000;
          if (sa !== sb) return sa - sb;
        }
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }, [allCases, statusFilter, trackFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const actionQueue = statusFilter === "pending" || statusFilter === "reuploaded";
  const overdueInView = filtered.filter(
    (c) => (c.status === "pending" || c.status === "reuploaded") && slaInfo(c).label === "Overdue",
  ).length;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text"
        >
          {toast}
        </div>
      ) : null}

      <header className="min-w-0">
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          KYC reviews
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary">
          Review contributor identity documents and approve or reject onboarding by track.
        </p>
      </header>

      {!canEdit ? (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3">
          <p className="font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">View-only access.</span> KYC decisions require Platform
            Admin or Trust &amp; Safety.
          </p>
        </div>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <StatusTabs
            value={statusFilter}
            counts={statusCounts}
            onChange={(key) => setParam({ status: key === "pending" ? null : key })}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TrackSelect value={trackFilter} onChange={(v) => setParam({ track: v === "all" ? null : v })} />
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search name or ID…"
                className={cn(
                  "w-full h-9 pl-9 pr-8 rounded-lg border border-stroke-subtle bg-surface",
                  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
                )}
              />
              {search ? (
                <button type="button" onClick={() => setParam({ q: null })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground" aria-label="Clear search">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {actionQueue && filtered.length > 0 ? (
          <div className="px-4 sm:px-5 py-3 bg-info-subtle/40 border-b border-stroke-subtle">
            <p className="font-body text-[13px] text-text-secondary">
              <span className="font-semibold text-foreground">Review queue.</span>{" "}
              {filtered.length} submission{filtered.length === 1 ? "" : "s"}
              {overdueInView > 0 ? ` · ${overdueInView} past SLA` : ""} · oldest SLA first
            </p>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            status={statusFilter}
            hasSearch={Boolean(search.trim()) || trackFilter !== "all"}
            onClear={() => setParam({ track: null, q: null })}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Applicant</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Track</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Risk</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">ID type</th>
                    <th className="px-4 sm:px-5 py-2.5 text-right font-body text-[11px] font-medium text-text-tertiary">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <KycRow key={c.id} item={c} />
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" disabled={pageIdx === 1} onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled">Previous</button>
                  <span className="font-mono text-[11px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                  <button type="button" disabled={pageIdx >= totalPages} onClick={() => setParam({ page: String(pageIdx + 1) })} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled">Next</button>
                </div>
              </footer>
            ) : null}
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
  value: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (key: StatusFilter) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1">
      {STATUS_TABS.map((tab) => {
        const active = value === tab.key;
        const needsAttention = (tab.key === "pending" || tab.key === "reuploaded") && counts[tab.key] > 0;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              active ? "admin-tab-on" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {tab.label}
            <span className={cn("font-mono text-[11px] tabular-nums", active ? "text-text-tertiary" : "text-text-disabled")}>{counts[tab.key]}</span>
            {needsAttention && !active ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-info-solid shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}

function TrackSelect({ value, onChange }: { value: TrackFilter; onChange: (v: TrackFilter) => void }) {
  return (
    <div className="relative w-full sm:w-52">
      <select
        aria-label="Filter by track"
        value={value}
        onChange={(e) => onChange(e.target.value as TrackFilter)}
        className={cn(
          "w-full h-9 pl-3 pr-10 rounded-lg border border-stroke-subtle bg-surface appearance-none cursor-pointer",
          "font-body text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
        )}
      >
        <option value="all">All tracks</option>
        <option value="Student">Student</option>
        <option value="Women WF">Women workforce</option>
        <option value="Freelancer">Freelancer</option>
        <option value="Internal">Internal</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[10px]">▼</span>
    </div>
  );
}

function KycRow({ item: c }: { item: MockKycCase }) {
  const router = useRouter();
  const href = `/admin/kyc/${c.id}`;
  const sla = slaInfo(c);
  const risk = caseRisk(c);
  const riskClass =
    risk === "high" ? "text-warning-text bg-warning-subtle" : risk === "medium" ? "text-warning-text bg-warning-subtle/60" : "text-success-text bg-success-subtle";

  return (
    <tr onClick={() => router.push(href)} className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors">
      <td className="px-4 sm:px-5 py-3.5">
        <Link href={href} onClick={(e) => e.stopPropagation()} className="block min-w-0 max-w-[260px]">
          <span className="block font-body text-[13.5px] font-semibold text-foreground truncate group-hover:text-text-link">{c.contributorName}</span>
          <span className="block font-mono text-[11px] text-text-tertiary truncate">{c.id} · {c.contributorEmail}</span>
        </Link>
      </td>
      <td className="px-3 py-3.5 font-body text-[13px] text-text-secondary">{TRACK_LABEL[c.track]}</td>
      <td className="px-3 py-3.5">
        <span className={cn("inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium", riskClass)}>{RISK_LABEL[risk]}</span>
      </td>
      <td className="px-3 py-3.5 font-body text-[13px] text-text-secondary whitespace-nowrap">{c.idType}</td>
      <td className="px-4 sm:px-5 py-3.5 text-right">
        <span className={cn("inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium", sla.tone === "warning" ? "text-warning-text bg-warning-subtle" : sla.tone === "success" ? "text-success-text bg-success-subtle" : "text-text-secondary bg-bg-subtle")}>
          {sla.label}
        </span>
        <span className="block mt-0.5 font-mono text-[10px] text-text-tertiary tabular-nums" suppressHydrationWarning>{fmtRelative(c.submittedAt)}</span>
      </td>
    </tr>
  );
}

function EmptyState({ status, hasSearch, onClear }: { status: StatusFilter; hasSearch: boolean; onClear: () => void }) {
  return (
    <TenantEmptyState
      icon={ShieldCheck}
      title="No submissions found"
      description={
        hasSearch
          ? "Nothing matches. Clear filters or try a different search."
          : `No ${STATUS_LABEL[status as KycStatus]?.toLowerCase() ?? status} submissions in this queue.`
      }
      action={
        hasSearch ? (
          <button type="button" onClick={onClear} className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">Clear filters</button>
        ) : undefined
      }
    />
  );
}
