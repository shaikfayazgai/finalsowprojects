"use client";

/**
 * Mentor registry — aligned with tenant registry + governance queue UX.
 *
 *   · Header + DashboardSection summary
 *   · Context banner for pending first sign-in
 *   · One panel: underline status tabs + role chips + search
 *   · Grouped preview on All; flat paginated list when filtered
 *   · Scannable rows (not wide data grid)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Plus, Search, UsersRound, X } from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminMentorsList, useAdminPoolsList } from "@/lib/hooks/use-admin-mentors";
import type { AdminMentorStatus, MockAdminMentor } from "@/mocks/admin/mentors";
import { isMentorAdminSetupComplete } from "@/lib/admin/mocks/mentors-service";
import { cn } from "@/lib/utils/cn";

type StatusFilter = "all" | AdminMentorStatus;
type RoleFilter = "all" | "senior" | "lead";

const STATUS_LABEL: Record<AdminMentorStatus, string> = {
  active: "Active",
  pending: "Pending",
  paused: "Paused",
  suspended: "Suspended",
  closed: "Closed",
};

const STATUS_TABS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "paused", label: "Paused" },
  { key: "suspended", label: "Suspended" },
];

const ROLE_CHIPS: Array<{ key: RoleFilter; label: string }> = [
  { key: "all", label: "All roles" },
  { key: "senior", label: "Senior" },
  { key: "lead", label: "Lead" },
];

const GROUP_ORDER: AdminMentorStatus[] = ["pending", "active", "paused", "suspended", "closed"];
const PREVIEW_PER_GROUP = 5;
const ROWS_PER_PAGE = 10;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function hasRole(m: MockAdminMentor, role: RoleFilter): boolean {
  if (role === "all") return true;
  if (role === "senior") return m.roles.includes("mentor.senior");
  return m.roles.includes("mentor.lead");
}

function sortMentors(items: MockAdminMentor[]): MockAdminMentor[] {
  return [...items].sort((a, b) => {
    const rank = (s: AdminMentorStatus) => {
      if (s === "pending") return 0;
      if (s === "suspended") return 1;
      if (s === "paused") return 2;
      if (s === "active") return 3;
      return 4;
    };
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return a.name.localeCompare(b.name);
  });
}

function groupMentors(items: MockAdminMentor[]) {
  const buckets = new Map<AdminMentorStatus, MockAdminMentor[]>();
  for (const s of GROUP_ORDER) buckets.set(s, []);
  for (const m of sortMentors(items)) buckets.get(m.status)?.push(m);
  return GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    rows: buckets.get(status) ?? [],
  })).filter((g) => g.rows.length > 0);
}

function primaryRoleLabel(roles: MockAdminMentor["roles"]): string | null {
  if (roles.includes("mentor.lead")) return "Lead";
  if (roles.includes("mentor.senior")) return "Senior";
  if (roles.includes("mentor")) return "Mentor";
  return null;
}

function rowMeta(m: MockAdminMentor, poolLabel: string): string {
  const parts = [m.country];
  const role = primaryRoleLabel(m.roles);
  if (role) parts.push(role);
  if (m.pools.length > 0) parts.push(`${m.pools.length} pool${m.pools.length === 1 ? "" : "s"}`);
  else parts.push("Unassigned");

  if (m.status === "pending") {
    parts.push(`Joined ${daysSince(m.activeSince)}d ago`);
    return parts.join(" · ");
  }
  if (m.status === "active") {
    parts.push(`${m.reviews30d} reviews (30d)`);
    return parts.join(" · ");
  }
  if (m.status === "paused" || m.status === "suspended") {
    if (poolLabel !== "—") parts.push(poolLabel);
    return parts.join(" · ");
  }
  return parts.join(" · ");
}

export function MentorsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seedMentors = useAdminMentorsList();
  const pools = useAdminPoolsList();

  // The mentor list is hydrated from a localStorage overlay, so counts differ
  // between SSR and the client. Gate count-dependent UI behind a mounted flag
  // to avoid a hydration mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Merge REAL provisioned mentor accounts (deduped by email) so the registry +
  // counts reflect actual mentors, not just the mock/overlay seed.
  const [realMentors, setRealMentors] = React.useState<MockAdminMentor[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/superadmin/mentors", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          mentors?: Array<{ id: string; name: string; email: string; role: string }>;
        };
        if (cancelled) return;
        setRealMentors(
          (data.mentors ?? []).map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            country: "—",
            roles: [m.role.includes(".") ? m.role : "mentor"],
            status: "active",
            pools: [],
            reviews30d: 0,
            slaHitRate: null,
            joinedAt: new Date().toISOString(),
          } as unknown as MockAdminMentor)),
        );
      } catch {
        // keep seed-only on failure
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Registry shows ONLY real provisioned mentors (the mock seed roster is hidden).
  // seedMentors is still referenced so the hook keeps running, but not displayed.
  const mentors = React.useMemo(() => {
    void seedMentors;
    return realMentors;
  }, [realMentors, seedMentors]);

  const statusFilter: StatusFilter =
    (searchParams.get("status") as StatusFilter | null) ?? "all";
  const roleFilter: RoleFilter =
    (searchParams.get("role") as RoleFilter | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const poolName = React.useCallback(
    (id: string) => pools.find((p) => p.id === id)?.name.replace(/ pool$/i, "") ?? id,
    [pools],
  );

  const poolLabel = React.useCallback(
    (m: MockAdminMentor) =>
      m.pools.length === 0 ? "—" : m.pools.map(poolName).join(", "),
    [poolName],
  );

  const counts = React.useMemo(
    () => ({
      all: mentors.length,
      active: mentors.filter((m) => m.status === "active").length,
      pending: mentors.filter((m) => m.status === "pending").length,
      paused: mentors.filter((m) => m.status === "paused").length,
      suspended: mentors.filter((m) => m.status === "suspended").length,
      closed: mentors.filter((m) => m.status === "closed").length,
      senior: mentors.filter((m) => m.roles.includes("mentor.senior")).length,
      lead: mentors.filter((m) => m.roles.includes("mentor.lead")).length,
    }),
    [mentors],
  );

  const pendingHero = React.useMemo(
    () => mentors.find((m) => m.status === "pending"),
    [mentors],
  );

  const pendingNeedingSetup = React.useMemo(
    () =>
      mentors.filter(
        (m) => m.status === "pending" && !isMentorAdminSetupComplete(m),
      ),
    [mentors],
  );

  const setupHero = pendingNeedingSetup[0];

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

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return mentors.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!hasRole(m, roleFilter)) return false;
      if (needle) {
        const hay = [
          m.name,
          m.email,
          m.country,
          m.id,
          ...m.roles,
          poolLabel(m),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [mentors, statusFilter, roleFilter, search, poolLabel]);

  const sorted = React.useMemo(() => sortMentors(filtered), [filtered]);
  const showGrouped = statusFilter === "all" && roleFilter === "all" && !search.trim();
  const groups = showGrouped ? groupMentors(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = showGrouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const listTitle = statusFilter === "all" ? "Mentor registry" : STATUS_LABEL[statusFilter];
  const listDescription =
    sorted.length === 0
      ? "No mentors match"
      : showGrouped
        ? `${sorted.length} mentor${sorted.length === 1 ? "" : "s"} · grouped by status`
        : `${sorted.length} mentor${sorted.length === 1 ? "" : "s"}`;

  const avgPools =
    mentors.length > 0
      ? (mentors.reduce((n, m) => n + m.pools.length, 0) / mentors.length).toFixed(1)
      : "—";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Talent
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            Mentors
          </h1>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
            Global mentor roster, pool assignments, and lifecycle across all tenants.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/admin/mentors/pools"
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
              "bg-surface border border-stroke",
              "font-body text-[13px] font-semibold text-text-secondary",
              "hover:text-foreground hover:border-stroke-strong transition-colors duration-fast",
            )}
          >
            <UsersRound className="h-4 w-4" strokeWidth={2} aria-hidden />
            Mentor pools
          </Link>
          <Link
            href="/admin/mentors/new"
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
              "bg-brand text-on-brand font-body text-[13px] font-semibold shadow-xs",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            New mentor
          </Link>
        </div>
      </header>

      {mounted && pendingHero && statusFilter !== "pending" && counts.pending > 0 && (
        <ContextBanner
          title={
            setupHero
              ? `${pendingNeedingSetup.length} mentor${pendingNeedingSetup.length === 1 ? "" : "s"} need setup`
              : `${counts.pending} mentor${counts.pending === 1 ? "" : "s"} pending first sign-in`
          }
        >
          {setupHero ? (
            <>
              <span className="font-medium text-foreground">{setupHero.name}</span>
              {" · "}
              invited {daysSince(setupHero.activeSince)}d ago.
              {" "}
              <Link
                href={`/admin/mentors/${setupHero.id}`}
                className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
              >
                Complete setup
              </Link>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{pendingHero.name}</span>
              {" · "}
              invited {daysSince(pendingHero.activeSince)}d ago — admin setup complete, awaiting sign-in.
            </>
          )}
          {counts.pending > 1 && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => setParam({ status: "pending" })}
                className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
              >
                View all pending
              </button>
            </>
          )}
        </ContextBanner>
      )}

      <DashboardSection title="Registry summary" description="Lifecycle counts across the platform">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="All mentors" value={String(counts.all)} />
          <SummaryStat label="Active" value={String(counts.active)} highlight={counts.active > 0} />
          <SummaryStat
            label="Pending sign-in"
            value={String(counts.pending)}
            alert={counts.pending > 0}
          />
          <SummaryStat label="Avg pools / mentor" value={avgPools} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
            </div>
            <div className="relative w-full sm:w-56 shrink-0">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search name, email, pool…"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setParam({ q: null })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px pb-2">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key;
              const count =
                tab.key === "all" ? counts.all : counts[tab.key as AdminMentorStatus];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
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
                      active
                        ? "bg-brand-subtle text-brand-subtle-text"
                        : "text-text-tertiary",
                      tab.key === "pending" && count > 0 && !active && "text-warning-text font-semibold",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div
            aria-label="Filter by role"
            className="flex flex-wrap items-center gap-1.5 pb-3 border-t border-stroke-subtle pt-3"
          >
            <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mr-1">
              Role
            </span>
            {ROLE_CHIPS.map((chip) => {
              const active = roleFilter === chip.key;
              const count =
                chip.key === "all" ? counts.all : counts[chip.key as "senior" | "lead"];
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setParam({ role: chip.key === "all" ? null : chip.key })}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
                    active
                      ? "bg-foreground text-surface border-foreground"
                      : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle",
                  )}
                >
                  {chip.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums",
                      active ? "text-surface/70" : "text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel
            hasQuery={Boolean(search.trim()) || statusFilter !== "all" || roleFilter !== "all"}
            onClear={() => setParam({ status: null, role: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <MentorGroup
                key={group.status}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/admin/mentors?status=${group.status}`}
                poolLabel={poolLabel}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((m) => (
                <li key={m.id}>
                  <MentorRow mentor={m} poolsText={poolLabel(m)} />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
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
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MentorGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  poolLabel,
}: {
  label: string;
  rows: MockAdminMentor[];
  previewLimit: number;
  filterHref: string;
  poolLabel: (m: MockAdminMentor) => string;
}) {
  const preview = rows.slice(0, previewLimit);
  const overflow = rows.length - preview.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {label}
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {rows.length}
          </span>
        </p>
        <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
          View all
        </Link>
      </div>
      <ul role="list">
        {preview.map((m) => (
          <li key={m.id} className="border-t border-stroke-subtle">
            <MentorRow mentor={m} poolsText={poolLabel(m)} bare />
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-5 py-2 border-t border-stroke-subtle">
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
            + {overflow} more
          </Link>
        </div>
      )}
    </div>
  );
}

function MentorRow({
  mentor: m,
  poolsText,
  bare,
}: {
  mentor: MockAdminMentor;
  poolsText: string;
  bare?: boolean;
}) {
  const meta = rowMeta(m, poolsText);
  const roleBadge = primaryRoleLabel(m.roles);
  const isPending = m.status === "pending";
  const isSuspended = m.status === "suspended";

  return (
    <Link
      href={`/admin/mentors/${m.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
        "hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        isPending && "bg-brand-subtle/10 hover:bg-brand-subtle/20",
        isSuspended && "opacity-85",
        bare && "min-h-[44px] py-2.5",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-body text-[13px] font-medium text-foreground truncate">{m.name}</span>
          {roleBadge && roleBadge !== "Mentor" && <RoleBadge label={roleBadge} />}
        </span>
        <span className="font-mono text-[11px] text-text-tertiary block mt-0.5 truncate">{m.email}</span>
        <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">{meta}</span>
        {poolsText !== "—" && (
          <span className="font-body text-[10.5px] text-text-secondary truncate block mt-0.5">
            {poolsText}
          </span>
        )}
      </span>
      <span className="shrink-0 text-right flex flex-col items-end gap-1">
        <MentorStatusBadge status={m.status} />
        {m.status === "active" && m.slaHitPct > 0 && (
          <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
            {m.slaHitPct}% SLA
          </span>
        )}
      </span>
    </Link>
  );
}

function MentorStatusBadge({ status }: { status: AdminMentorStatus }) {
  const map: Record<
    AdminMentorStatus,
    "success" | "pending" | "warning" | "error" | "neutral"
  > = {
    active: "success",
    pending: "pending",
    paused: "warning",
    suspended: "error",
    closed: "neutral",
  };
  return (
    <StatusChip status={map[status]} size="sm" showDot>
      {STATUS_LABEL[status]}
    </StatusChip>
  );
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold bg-bg-subtle text-text-secondary border border-stroke-subtle">
      {label}
    </span>
  );
}

function ContextBanner({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
      <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight = false,
  alert = false,
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
          alert ? "text-warning-text" : highlight ? "text-brand-emphasis" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyPanel({ hasQuery, onClear }: { hasQuery: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-body text-[13.5px] font-semibold text-foreground">No mentors found</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        {hasQuery
          ? "Try clearing filters or adjusting your search."
          : "Provision mentors from New mentor or assign them to pools."}
      </p>
      {hasQuery && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 font-body text-[12px] font-semibold text-text-link"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
