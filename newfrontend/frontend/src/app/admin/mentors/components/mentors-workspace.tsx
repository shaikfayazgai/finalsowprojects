"use client";

/**
 * Mentor registry — browse and manage mentors across all tenants.
 *
 * Workflow:
 *   1. Onboard a mentor     → New mentor
 *   2. Finish setup         → Pending tab → row → detail
 *   3. Operate day-to-day   → search or browse → row → detail
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Plus, Search, UserRound, X } from "lucide-react";
import { SearchX } from "lucide-react";
import { useAdminMentors } from "@/lib/hooks/use-admin-mentors";
import type { AdminMentorStatus, MockAdminMentor } from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryBtnClass, primaryStyle } from "../../_shell/aurora-ui";
import { TenantEmptyState } from "../../tenants/components/tenant-empty-state";

import { NewMentorModal } from "./new-mentor-modal";
import { MentorsSkeleton } from "./mentors-skeleton";

type StatusFilter = "all" | "active" | "pending" | "paused";

const STATUS_LABEL: Record<AdminMentorStatus, string> = {
  active: "Active",
  pending: "Pending",
  paused: "Paused",
  suspended: "Suspended",
  closed: "Closed",
};

const FILTER_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "paused", label: "Paused" },
];

const ROWS_PER_PAGE = 12;

function primaryRoleLabel(roles: MockAdminMentor["roles"]): string {
  if (roles.includes("mentor.lead")) return "Lead";
  if (roles.includes("mentor.senior")) return "Senior";
  return "Mentor";
}

function matchesFilter(status: AdminMentorStatus, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "paused") return status === "paused" || status === "suspended" || status === "closed";
  return status === filter;
}

export function MentorsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mentors: liveMentors, loading, error, refresh } = useAdminMentors();
  const mentors = liveMentors ?? [];
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const statusFilter: StatusFilter = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const counts = React.useMemo(
    () => ({
      all: mentors.length,
      active: mentors.filter((m) => m.status === "active").length,
      pending: mentors.filter((m) => m.status === "pending").length,
      paused: mentors.filter((m) => m.status === "paused" || m.status === "suspended" || m.status === "closed").length,
    }),
    [mentors],
  );

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/mentors?${qs}` : "/admin/mentors", { scroll: false });
    },
    [router, searchParams],
  );

  React.useEffect(() => {
    if (searchParams.get("new") === "1") {
      setInviteOpen(true);
      setParam({ new: null });
    }
  }, [searchParams, setParam]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return mentors
      .filter((m) => matchesFilter(m.status, statusFilter))
      .filter((m) => {
        if (!needle) return true;
        const hay = [m.name, m.email, m.country, m.id, primaryRoleLabel(m.roles)].join(" ").toLowerCase();
        return hay.includes(needle);
      })
      .sort((a, b) => {
        if (statusFilter === "pending" && a.status === "pending" && b.status !== "pending") return -1;
        if (statusFilter === "pending" && b.status === "pending" && a.status !== "pending") return 1;
        return a.name.localeCompare(b.name);
      });
  }, [mentors, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  // First load (no data yet) → skeleton, no mock flash.
  if (loading && liveMentors === null) return <MentorsSkeleton />;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
            Mentors
          </h1>
          <p className="mt-1.5 font-body text-[14px] text-text-secondary">
            Global mentor roster — roles, pools, and lifecycle across tenants.
          </p>
        </div>
        <InviteButton onClick={() => setInviteOpen(true)} />
      </header>

      <NewMentorModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={() => refresh()}
      />

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <StatusTabs
            value={statusFilter}
            counts={counts}
            onChange={(key) => setParam({ status: key === "all" ? null : key })}
          />

          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setParam({ q: e.target.value })}
              placeholder="Search name or email…"
              className={cn(
                "w-full h-9 pl-9 pr-8 rounded-lg border border-stroke-subtle bg-surface",
                "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setParam({ q: null })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>

        {statusFilter === "pending" && counts.pending > 0 ? (
          <div className="px-4 sm:px-5 py-3 bg-info-subtle/50 border-b border-stroke-subtle">
            <p className="font-body text-[13px] text-text-secondary">
              <span className="font-semibold text-foreground">Onboarding queue.</span> Open a pending mentor to assign
              pools, competency, and activate their account.
            </p>
          </div>
        ) : null}

        {error && liveMentors === null ? (
          <TenantEmptyState
            icon={SearchX}
            title="Couldn't load mentors"
            description="The mentor service is unavailable right now. Your mentors are safe — this is a connection issue. Try again in a moment."
            action={
              <button type="button" onClick={refresh} className={primaryBtnClass} style={primaryStyle}>
                Retry
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            filter={statusFilter}
            hasSearch={Boolean(search.trim())}
            onClear={() => setParam({ status: null, q: null })}
            onInvite={() => setInviteOpen(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Mentor</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Status</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Role</th>
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((m) => (
                    <MentorRow key={m.id} mentor={m} />
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
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function InviteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg shrink-0",
        "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 transition-opacity",
      )}
      style={primaryStyle}
    >
      <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      New mentor
    </button>
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
      {FILTER_TABS.map((tab) => {
        const active = value === tab.key;
        const needsAttention = tab.key === "pending" && counts.pending > 0;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg font-body text-[13px] font-medium transition-colors",
              active
                ? "admin-tab-on"
                : "text-text-secondary hover:text-foreground hover:bg-bg-subtle/60",
            )}
          >
            {tab.label}
            <span className={cn("font-mono text-[11px] tabular-nums", active ? "text-text-tertiary" : "text-text-disabled")}>
              {counts[tab.key]}
            </span>
            {needsAttention && !active ? (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-info-solid shrink-0" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function MentorRow({ mentor: m }: { mentor: MockAdminMentor }) {
  const router = useRouter();
  const href = `/admin/mentors/${m.id}`;
  const role = primaryRoleLabel(m.roles);

  return (
    <tr
      onClick={() => router.push(href)}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="block min-w-0 max-w-[240px]"
        >
          <span className="block font-body text-[13.5px] font-semibold text-foreground truncate group-hover:text-text-link">
            {m.name}
          </span>
          <span className="block font-mono text-[11px] text-text-tertiary truncate">{m.email}</span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <StatusChip status={m.status} />
      </td>
      <td className="px-3 py-3.5 font-body text-[13px] text-text-secondary">{role}</td>
      <td className="px-4 sm:px-5 py-3.5 font-body text-[13px] text-text-secondary truncate max-w-[140px]">{m.country}</td>
    </tr>
  );
}

function StatusChip({ status }: { status: AdminMentorStatus }) {
  const toneClass =
    status === "active"
      ? "text-success-text bg-success-subtle"
      : status === "pending"
        ? "text-info-text bg-info-subtle"
        : status === "paused"
          ? "text-warning-text bg-warning-subtle"
          : status === "suspended"
            ? "text-warning-text bg-warning-subtle"
            : "text-text-secondary bg-bg-subtle";

  return (
    <span className={cn("inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium", toneClass)}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function EmptyState({
  filter,
  hasSearch,
  onClear,
  onInvite,
}: {
  filter: StatusFilter;
  hasSearch: boolean;
  onClear: () => void;
  onInvite: () => void;
}) {
  if (filter === "pending" && !hasSearch) {
    return (
      <TenantEmptyState
        icon={UserRound}
        title="No mentors awaiting setup"
        description="When you invite a mentor, they appear here until pools and competency are configured."
        action={<InviteButton onClick={onInvite} />}
      />
    );
  }

  return (
    <TenantEmptyState
      icon={GraduationCap}
      title="No mentors found"
      description={
        hasSearch || filter !== "all"
          ? "Nothing matches. Clear filters or try a different search."
          : "Add your first mentor to the global roster."
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
          <InviteButton onClick={onInvite} />
        )
      }
    />
  );
}
