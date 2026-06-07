"use client";

/**
 * Commercial gate workspace — aligned with tenant registry + governance queue UX.
 *
 *   · Header + DashboardSection summary
 *   · Context banner for SLA-at-risk items
 *   · One panel: underline queue tabs + search
 *   · Scannable rows link to /admin/sow/[sowId] review page
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronRight, Inbox, Search, X } from "lucide-react";
import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminSowList } from "@/lib/hooks/use-sow-v2";
import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";
import type { SowSummary } from "@/lib/sow/types";
import { cn } from "@/lib/utils/cn";

type QueueFilter = "awaiting" | "at_risk";

const QUEUE_TABS: Array<{ key: QueueFilter; label: string }> = [
  { key: "awaiting", label: "Awaiting sign-off" },
  { key: "at_risk", label: "SLA at risk" },
];

const ROWS_PER_PAGE = 10;
const SLA_HOURS = 48;

const MSG_COPY: Record<string, string> = {
  approved: "Commercial approved — SOW advanced to Legal.",
  sent_back: "SOW sent back to Business for revision.",
  rejected: "SOW rejected at Commercial gate.",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function hoursWaiting(iso: string | null): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function isCommercialPending(s: SowSummary): boolean {
  return s.status === "approval" && s.stage === "commercial";
}

function isAtRisk(s: SowSummary): boolean {
  if (!isCommercialPending(s)) return false;
  const ref = s.submittedForApprovalAt ?? s.updatedAt;
  return hoursWaiting(ref) >= SLA_HOURS;
}

function sortQueue(items: SowSummary[]): SowSummary[] {
  return [...items].sort((a, b) => {
    const aRisk = isAtRisk(a) ? 1 : 0;
    const bRisk = isAtRisk(b) ? 1 : 0;
    if (aRisk !== bRisk) return bRisk - aRisk;
    const aT = new Date(a.submittedForApprovalAt ?? a.updatedAt).getTime();
    const bT = new Date(b.submittedForApprovalAt ?? b.updatedAt).getTime();
    return aT - bT;
  });
}

function rowMeta(s: SowSummary): string {
  const wait = timeAgo(s.submittedForApprovalAt ?? s.updatedAt);
  const parts = [s.tenantName ?? "—", s.ownerName ?? s.ownerId, `submitted ${wait}`];
  if (isAtRisk(s)) parts.push("SLA at risk");
  return parts.join(" · ");
}

export function CommercialGateWorkspace() {
  const allowed = useAdminSectionGuard("commercialGate");
  const router = useRouter();
  const searchParams = useSearchParams();

  const queue: QueueFilter =
    (searchParams.get("queue") as QueueFilter | null) ?? "awaiting";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const msg = searchParams.get("msg");

  const { data, isLoading } = useAdminSowList({ status: "approval", limit: 200 });
  const [toast, setToast] = React.useState<string | null>(
    msg && MSG_COPY[msg] ? MSG_COPY[msg] : null,
  );

  const pending = React.useMemo(
    () => (data?.items ?? []).filter(isCommercialPending),
    [data],
  );

  const atRisk = React.useMemo(() => pending.filter(isAtRisk), [pending]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    if (msg && MSG_COPY[msg]) {
      setToast(MSG_COPY[msg]);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("msg");
      const qs = next.toString();
      router.replace(qs ? `/admin/sow?${qs}` : "/admin/sow", { scroll: false });
    }
  }, [msg, router, searchParams]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/admin/sow?${qs}` : "/admin/sow", { scroll: false });
    },
    [router, searchParams],
  );

  const filtered = React.useMemo(() => {
    const base = queue === "at_risk" ? atRisk : pending;
    const needle = search.trim().toLowerCase();
    return base.filter((s) => {
      if (!needle) return true;
      const hay = [s.title, s.id, s.tenantName ?? "", s.ownerName ?? "", s.ownerId].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [pending, atRisk, queue, search]);

  const sorted = React.useMemo(() => sortQueue(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const oldestHours = pending.length
    ? Math.max(...pending.map((s) => hoursWaiting(s.submittedForApprovalAt ?? s.updatedAt)))
    : 0;

  const tenantCount = React.useMemo(
    () => new Set(pending.map((s) => s.tenantId).filter(Boolean)).size,
    [pending],
  );

  const hero = atRisk[0] ?? null;

  if (!allowed) return null;

  const loading = isLoading && !data;

  const listTitle = queue === "at_risk" ? "SLA at risk" : "Commercial queue";
  const listDescription =
    sorted.length === 0
      ? "No SOWs match"
      : `${sorted.length} SOW${sorted.length === 1 ? "" : "s"} · awaiting stage 5 (Commercial)`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-lg border border-success-border bg-success-subtle px-4 py-2 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Commercial gate
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          SOW Commercial gate
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          All enterprise gates (Finance, Legal, Security, Final sign-off) have cleared.
          Glimmora Commercial does the final confirmation of staffing viability, rate
          alignment, and scope fit — then the SOW is closed.
        </p>
      </header>

      {hero && queue !== "at_risk" && (
        <ContextBanner title={`${atRisk.length} SOW${atRisk.length === 1 ? "" : "s"} at SLA risk`}>
          <span className="font-medium text-foreground">{hero.title}</span>
          {" · "}
          {hero.tenantName ?? "—"}
          {" · waiting "}
          {timeAgo(hero.submittedForApprovalAt ?? hero.updatedAt)}.
          {" "}
          <button
            type="button"
            onClick={() => setParam({ queue: "at_risk" })}
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            Review at-risk queue
          </button>
        </ContextBanner>
      )}

      <DashboardSection title="Queue summary" description="Stage 5 · Glimmora Commercial sign-off (final gate)">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Awaiting sign-off" value={String(pending.length)} alert={pending.length > 0} />
          <SummaryStat label="SLA at risk" value={String(atRisk.length)} alert={atRisk.length > 0} />
          <SummaryStat label="Tenants in queue" value={String(tenantCount)} />
          <SummaryStat
            label="Oldest wait"
            value={pending.length ? `${Math.floor(oldestHours)}h` : "—"}
            alert={oldestHours >= SLA_HOURS}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {loading ? "Loading…" : listDescription}
              </p>
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
                placeholder="Search title, tenant, ID…"
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

          <nav aria-label="Filter by queue" className="flex flex-wrap gap-x-1 -mb-px pb-3">
            {QUEUE_TABS.map((tab) => {
              const active = queue === tab.key;
              const count = tab.key === "at_risk" ? atRisk.length : pending.length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ queue: tab.key === "awaiting" ? null : tab.key })}
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
                      tab.key === "at_risk" && count > 0 && !active && "text-warning-text font-semibold",
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
        </div>

        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            queue={queue}
            hasQuery={Boolean(search.trim())}
            onClear={() => setParam({ queue: null, q: null })}
          />
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((s) => (
                <QueueRow key={s.id} sow={s} />
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

function QueueRow({ sow }: { sow: SowSummary }) {
  const risk = isAtRisk(sow);

  return (
    <li>
      <Link
        href={`/admin/sow/${sow.id}`}
        className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-subtle/30 transition-colors group"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="font-body text-[13px] font-semibold text-foreground truncate group-hover:text-brand"
              title={sow.title}
            >
              {sow.title}
            </p>
            {risk && (
              <span className="inline-flex items-center gap-1 font-body text-[10px] font-semibold uppercase tracking-[0.06em] text-warning-text bg-warning-subtle px-1.5 py-0.5 rounded">
                <AlertTriangle className="h-3 w-3" strokeWidth={2} aria-hidden />
                SLA
              </span>
            )}
          </div>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary truncate">{rowMeta(sow)}</p>
          <p className="mt-0.5 font-mono text-[10px] text-text-tertiary tabular-nums truncate">
            {sow.id} · Enterprise gates ✓ · Stage 4/5 · Commercial pending
          </p>
        </div>
        <ChevronRight
          className="h-4 w-4 text-text-tertiary shrink-0 group-hover:text-brand transition-colors"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </li>
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
  alert = false,
}: {
  label: string;
  value: string;
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
          alert ? "text-warning-text" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-5 py-3.5">
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({
  queue,
  hasQuery,
  onClear,
}: {
  queue: QueueFilter;
  hasQuery: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <span
        aria-hidden
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-bg-subtle text-text-tertiary mb-3"
      >
        <Inbox className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <p className="font-body text-[13.5px] font-semibold text-foreground">
        {hasQuery
          ? "No SOWs match your search"
          : queue === "at_risk"
            ? "No SOWs at SLA risk"
            : "No SOWs at Commercial gate"}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        {hasQuery
          ? "Try a different title, tenant, or SOW ID."
          : queue === "at_risk"
            ? "All pending Commercial reviews are within SLA."
            : "SOWs appear here after the enterprise approves the Finance stage."}
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
