"use client";

/**
 * Pool detail — aligned with mentor detail + commercial review page patterns.
 *
 *   · Top-level DashboardSection (pool health) above tabs
 *   · URL-synced tabs (?tab=overview|members|history)
 *   · Overview: capacity, lead card, member preview, profile
 *   · Scannable member + history rows
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  UserCog,
  UsersRound,
} from "lucide-react";
import { StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { ChangePoolLeadModal } from "@/app/admin/mentors/pools/components/pool-change-lead-modal";
import {
  useAdminMentorsList,
  useAdminPool,
  usePoolReassignHistory,
} from "@/lib/hooks/use-admin-mentors";
import { setPoolLead } from "@/lib/admin/mocks/mentors-service";
import type {
  AdminMentorStatus,
  MockAdminMentor,
  MockMentorPool,
  PoolReassignEvent,
} from "@/mocks/admin/mentors";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "members" | "history";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "members", label: "Members" },
  { key: "history", label: "History" },
];

const STATUS_CHIP: Record<
  AdminMentorStatus,
  "success" | "pending" | "warning" | "error" | "neutral"
> = {
  active: "success",
  pending: "pending",
  paused: "warning",
  suspended: "error",
  closed: "neutral",
};

function fmtRelative(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d < 1) return "today";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function loadStatus(loadPct: number): "success" | "warning" | "error" {
  if (loadPct > 85) return "error";
  if (loadPct > 70) return "warning";
  return "success";
}

function loadLabel(loadPct: number): string {
  if (loadPct > 85) return "Critical";
  if (loadPct > 70) return "Elevated";
  return "Healthy";
}

function roleLabel(roles: MockAdminMentor["roles"]): string {
  if (roles.includes("mentor.lead")) return "Lead";
  if (roles.includes("mentor.senior")) return "Senior";
  return "Mentor";
}

function sortMembers(pool: MockMentorPool, members: MockAdminMentor[]): MockAdminMentor[] {
  return [...members].sort((a, b) => {
    if (a.id === pool.leadMentorId) return -1;
    if (b.id === pool.leadMentorId) return 1;
    return b.reviews30d - a.reviews30d || a.name.localeCompare(b.name);
  });
}

function poolStats(members: MockAdminMentor[]) {
  const active = members.filter((m) => m.status === "active");
  const reviews30d = members.reduce((n, m) => n + m.reviews30d, 0);
  const withSla = active.filter((m) => m.slaHitPct > 0);
  const avgSla =
    withSla.length > 0
      ? Math.round(withSla.reduce((n, m) => n + m.slaHitPct, 0) / withSla.length)
      : null;
  return { active: active.length, reviews30d, avgSla };
}

export function PoolDetailWorkspace() {
  const params = useParams<{ poolId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const pool = useAdminPool(params.poolId);
  const allMentors = useAdminMentorsList();
  const history = usePoolReassignHistory(params.poolId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const [leadModalOpen, setLeadModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(() => {
    if (searchParams.get("created") === "1") return "Pool created.";
    return null;
  });

  React.useEffect(() => {
    if (searchParams.get("created") === "1") setToast("Pool created.");
  }, [searchParams]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      nextParams.delete("created");
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/mentors/pools/${params.poolId}?${qs}` : `/admin/mentors/pools/${params.poolId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.poolId],
  );

  if (!pool) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/mentors/pools"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Mentor pools
        </Link>
        <p className="font-body text-[13px] text-text-secondary">Pool not found.</p>
      </div>
    );
  }

  const members = allMentors.filter((m) => m.pools.includes(pool.id));
  const sortedMembers = sortMembers(pool, members);
  const stats = poolStats(members);
  const lead = allMentors.find((m) => m.id === pool.leadMentorId);
  const leadCandidates = members.length
    ? members
    : allMentors.filter((m) => m.status === "active");
  const leadInPool = members.some((m) => m.id === pool.leadMentorId);

  function saveLead(mentorId: string) {
    setPoolLead(pool!.id, mentorId);
    setLeadModalOpen(false);
    setToast("Pool lead updated.");
  }

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

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/mentors/pools"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> <span>Mentor pools</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary truncate">{pool.name}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Pool
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {pool.name}
            </h1>
            <ScopeBadge scope={pool.scope} />
            <StatusChip status={loadStatus(pool.loadPct)} size="sm" showDot>
              {pool.loadPct}% load
            </StatusChip>
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            <span className="font-mono text-[12px]">{pool.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {pool.scope === "tenant" ? pool.tenantName : "Cross-tenant"}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Lead{" "}
            {lead ? (
              <Link
                href={`/admin/mentors/${lead.id}`}
                className="font-medium text-foreground hover:text-brand-emphasis transition-colors duration-fast"
              >
                {lead.name}
              </Link>
            ) : (
              "—"
            )}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {pool.scope === "tenant" && pool.tenantId && (
            <Link href={`/admin/tenants/${pool.tenantId}`} className={actionBtnCls}>
              <Building2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Tenant
            </Link>
          )}
          <button type="button" onClick={() => setLeadModalOpen(true)} className={actionBtnCls}>
            <UserCog className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Change lead
          </button>
        </div>
      </header>

      {pool.loadPct > 75 && activeTab !== "members" && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            High load — {pool.loadPct}% capacity
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            {members.length === 0
              ? "No mentors assigned yet — add members before routing reviews."
              : "Consider adding mentors or rebalancing assignments."}
            {" "}
            <button
              type="button"
              onClick={() => setTab("members")}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              View members
            </button>
          </p>
        </div>
      )}

      {members.length === 0 && (
        <div className="rounded-xl border border-brand-border/50 bg-brand-subtle/20 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-foreground flex items-center gap-1.5">
            <UsersRound className="h-3.5 w-3.5 shrink-0 text-brand-emphasis" strokeWidth={2} aria-hidden />
            No mentors assigned
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            Assign mentors from the{" "}
            <Link href="/admin/mentors" className="font-semibold text-brand underline underline-offset-2">
              mentor registry
            </Link>
            {" "}using Change pools on each mentor profile.
          </p>
        </div>
      )}

      {!leadInPool && lead && members.length > 0 && (
        <div className="rounded-xl border border-warning-border/60 bg-warning-subtle/30 px-4 py-3">
          <p className="font-body text-[12px] font-semibold text-warning-text flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Lead not in pool
          </p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
            {lead.name} is designated lead but not assigned to this pool.
            {" "}
            <button
              type="button"
              onClick={() => setLeadModalOpen(true)}
              className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
            >
              Reassign lead
            </button>
          </p>
        </div>
      )}

      <DashboardSection title="Pool health" description="Capacity and member activity (30d)">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Load"
            value={`${pool.loadPct}%`}
            alert={pool.loadPct > 75}
            highlight={pool.loadPct <= 70}
          />
          <SummaryStat label="Members" value={String(members.length)} />
          <SummaryStat label="Active mentors" value={String(stats.active)} />
          <SummaryStat
            label="Reviews (30d)"
            value={String(stats.reviews30d)}
            highlight={stats.reviews30d > 0}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Pool sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "members" ? members.length : t.key === "history" ? history.length : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {badge != null && badge > 0 && (
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active ? "bg-brand-subtle text-brand-subtle-text" : "text-text-tertiary",
                    )}
                  >
                    {badge}
                  </span>
                )}
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

        <div className={activeTab === "overview" ? "p-5 space-y-5" : undefined}>
          {activeTab === "overview" && (
            <>
              <DashboardSection bare title="Capacity" description={loadLabel(pool.loadPct)}>
                <CapacityBar loadPct={pool.loadPct} />
              </DashboardSection>

              {lead && (
                <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                  <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                        Pool lead
                      </h2>
                      <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                        Coordinates routing and escalation
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLeadModalOpen(true)}
                      className="font-body text-[12px] font-semibold text-text-link"
                    >
                      Change lead
                    </button>
                  </header>
                  <Link
                    href={`/admin/mentors/${lead.id}`}
                    className={cn(
                      "flex items-center justify-between gap-4 px-5 py-4",
                      "hover:bg-bg-subtle/60 transition-colors duration-fast",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="font-body text-[14px] font-medium text-foreground">
                        {lead.name}
                      </span>
                      <span className="font-mono text-[11px] text-text-tertiary block mt-0.5">
                        {lead.email}
                      </span>
                      <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5">
                        {roleLabel(lead.roles)}
                        {leadInPool ? " · Pool member" : " · Not in pool"}
                        {lead.reviews30d > 0 && ` · ${lead.reviews30d} reviews (30d)`}
                      </span>
                    </span>
                    <StatusChip status={STATUS_CHIP[lead.status]} size="sm" showDot>
                      {lead.status}
                    </StatusChip>
                  </Link>
                </section>
              )}

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                      Members preview
                    </h2>
                    <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                      {members.length === 0
                        ? "No mentors assigned"
                        : `${members.length} mentor${members.length === 1 ? "" : "s"} in pool`}
                    </p>
                  </div>
                  {members.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("members")}
                      className="font-body text-[12px] font-semibold text-text-link"
                    >
                      View all →
                    </button>
                  )}
                </header>
                {sortedMembers.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="font-body text-[13px] text-text-secondary">No members yet</p>
                    <Link
                      href="/admin/mentors"
                      className="mt-2 inline-block font-body text-[12px] font-semibold text-text-link"
                    >
                      Open mentor registry →
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-stroke-subtle">
                    {sortedMembers.slice(0, 5).map((m) => (
                      <li key={m.id}>
                        <MemberRow mentor={m} pool={pool} compact />
                      </li>
                    ))}
                  </ul>
                )}
                {sortedMembers.length > 5 && (
                  <footer className="px-5 py-3 border-t border-stroke-subtle">
                    <button
                      type="button"
                      onClick={() => setTab("members")}
                      className="font-body text-[11.5px] font-medium text-text-link"
                    >
                      + {sortedMembers.length - 5} more members
                    </button>
                  </footer>
                )}
              </section>

              <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
                <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Pool profile
                  </h2>
                </header>
                <dl className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <DetailRow label="Pool ID" value={pool.id} mono />
                  <DetailRow
                    label="Scope"
                    value={pool.scope === "tenant" ? "Tenant-scoped" : "Cross-tenant"}
                  />
                  {pool.scope === "tenant" && (
                    <>
                      <DetailRow label="Tenant" value={pool.tenantName ?? "—"} />
                      <DetailRow label="Tenant ID" value={pool.tenantId ?? "—"} mono />
                    </>
                  )}
                  <DetailRow label="Lead mentor" value={lead?.name ?? "—"} />
                  <DetailRow label="Members" value={String(members.length)} />
                  {stats.avgSla != null && (
                    <DetailRow label="Avg SLA (active)" value={`${stats.avgSla}%`} />
                  )}
                </dl>
              </section>
            </>
          )}

          {activeTab === "members" && (
            <MembersPanel pool={pool} members={sortedMembers} />
          )}
          {activeTab === "history" && (
            <HistoryPanel history={history} mentors={allMentors} />
          )}
        </div>
      </section>

      <ChangePoolLeadModal
        open={leadModalOpen}
        poolName={pool.name}
        currentLeadId={pool.leadMentorId}
        candidates={leadCandidates}
        onClose={() => setLeadModalOpen(false)}
        onConfirm={saveLead}
      />
    </div>
  );
}

function CapacityBar({ loadPct }: { loadPct: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <span className="font-body text-[32px] font-semibold tabular-nums text-foreground leading-none">
          {loadPct}%
        </span>
        <StatusChip status={loadStatus(loadPct)} size="md" showDot>
          {loadLabel(loadPct)}
        </StatusChip>
      </div>
      <div className="h-2.5 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-fast",
            loadPct > 85 ? "bg-error" : loadPct > 70 ? "bg-warning" : "bg-brand",
          )}
          style={{ width: `${Math.min(loadPct, 100)}%` }}
        />
      </div>
      <p className="font-body text-[11.5px] text-text-tertiary">
        Routing load based on open reviews assigned to pool members.
      </p>
    </div>
  );
}

function MemberRow({
  mentor: m,
  pool,
  compact,
}: {
  mentor: MockAdminMentor;
  pool: MockMentorPool;
  compact?: boolean;
}) {
  const isLead = m.id === pool.leadMentorId;
  return (
    <Link
      href={`/admin/mentors/${m.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 hover:bg-bg-subtle/60 transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        compact ? "py-2.5 min-h-[44px]" : "py-3 min-h-[52px]",
      )}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-body text-[13px] font-medium text-foreground">{m.name}</span>
          {isLead && <LeadBadge />}
          <RoleBadge label={roleLabel(m.roles)} />
        </span>
        {!compact && (
          <span className="font-mono text-[11px] text-text-tertiary block mt-0.5">{m.email}</span>
        )}
        <span className="font-body text-[11.5px] text-text-tertiary block mt-0.5">
          {m.reviews30d} reviews (30d)
          {m.avgReviewMin > 0 && ` · ${m.avgReviewMin} min avg`}
          {m.slaHitPct > 0 && ` · ${m.slaHitPct}% SLA`}
        </span>
      </span>
      <StatusChip status={STATUS_CHIP[m.status]} size="sm" showDot>
        {m.status}
      </StatusChip>
    </Link>
  );
}

function MembersPanel({
  pool,
  members,
}: {
  pool: MockMentorPool;
  members: MockAdminMentor[];
}) {
  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Pool members
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Assign mentors via Change pools on each mentor profile
          </p>
        </div>
        <Link href="/admin/mentors" className="font-body text-[12px] font-semibold text-text-link">
          Mentor registry →
        </Link>
      </header>
      {members.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">No mentors in this pool yet.</p>
          <Link
            href="/admin/mentors"
            className="mt-2 inline-block font-body text-[12px] font-semibold text-text-link"
          >
            Open mentor registry →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-stroke-subtle">
          {members.map((m) => (
            <li key={m.id}>
              <MemberRow mentor={m} pool={pool} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function HistoryPanel({
  history,
  mentors,
}: {
  history: PoolReassignEvent[];
  mentors: MockAdminMentor[];
}) {
  return (
    <>
      <header className="px-5 pt-4 pb-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
          Lead reassign history
        </h2>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary">
          Recorded when pool lead changes via admin action
        </p>
      </header>
      {history.length === 0 ? (
        <p className="px-5 py-10 text-center font-body text-[13px] text-text-secondary">
          No lead changes recorded.
        </p>
      ) : (
        <ol className="divide-y divide-stroke-subtle">
          {history.map((h) => {
            const from = h.fromMentorId
              ? mentors.find((m) => m.id === h.fromMentorId)?.name ?? h.fromMentorId
              : "Initial";
            const to = mentors.find((m) => m.id === h.toMentorId)?.name ?? h.toMentorId;
            return (
              <li
                key={h.id}
                className="px-5 py-3 min-h-[48px] hover:bg-bg-subtle/40 transition-colors duration-fast"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                    {fmtRelative(h.at)}
                  </span>
                  <StatusChip status="info" size="sm" showDot={false}>
                    Lead change
                  </StatusChip>
                </div>
                <p className="mt-1 font-body text-[13px] text-foreground">
                  {from} → <strong>{to}</strong>
                </p>
                {h.note && (
                  <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">{h.note}</p>
                )}
                <p className="mt-0.5 font-body text-[11px] text-text-tertiary">by {h.by}</p>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function ScopeBadge({ scope }: { scope: MockMentorPool["scope"] }) {
  return (
    <span
      className={cn(
        "inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold border",
        scope === "cross-tenant"
          ? "bg-info-subtle text-info-text border-info-border"
          : "bg-bg-subtle text-text-secondary border-stroke-subtle",
      )}
    >
      {scope === "cross-tenant" ? "Global" : "Tenant"}
    </span>
  );
}

function LeadBadge() {
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold bg-brand-subtle text-brand-subtle-text border border-brand-border/40">
      Lead
    </span>
  );
}

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex px-1.5 py-0.5 rounded font-body text-[10px] font-semibold bg-bg-subtle text-text-secondary border border-stroke-subtle">
      {label}
    </span>
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

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-bg-subtle transition-colors duration-fast",
);
