"use client";

/**
 * Commercial gate overview — platform commercial **work queue**.
 *
 * One list: every SOW waiting on Glimmora platform commercial review.
 * Urgency is per-row (Waiting + SLA columns), not a separate tab.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, Search, X } from "lucide-react";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";
import { STAGE_SLA_HOURS } from "@/lib/sow/approval-pipeline";
import type { SowSummary } from "@/lib/sow/types";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { CommercialGateSkeleton } from "./commercial-gate-skeleton";

type Tone = "warning" | "neutral";

const ROWS_PER_PAGE = 12;
const SLA_HOURS = STAGE_SLA_HOURS.platform;
const RISK_WINDOW_HOURS = 12;

const MSG_COPY: Record<string, string> = {
  approved: "Approved at the Glimmora platform gate — SOW is ready for delivery setup.",
  sent_back: "SOW returned to the enterprise sponsor for revision.",
  rejected: "SOW rejected at the Glimmora platform gate.",
};

const TONE_TEXT: Record<Tone, string> = {
  warning: "var(--color-warning-text)",
  neutral: "var(--color-text-secondary)",
};

const TONE_SOFT: Record<Tone, string> = {
  warning: "var(--color-warning-subtle)",
  neutral: "var(--color-bg-subtle)",
};

function hoursWaiting(iso: string | null): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function fmtDur(hours: number): string {
  const h = Math.max(0, hours);
  if (h >= 48) return `${Math.round(h / 24)}d`;
  if (h >= 1) return `${Math.floor(h)}h`;
  return `${Math.max(1, Math.round(h * 60))}m`;
}

type SlaLevel = "overdue" | "risk" | "ok";

interface SlaInfo {
  level: SlaLevel;
  label: string;
  tone: Tone;
}

function slaInfo(s: SowSummary): SlaInfo {
  const ref = s.submittedForApprovalAt ?? s.updatedAt;
  const waited = hoursWaiting(ref);
  const left = SLA_HOURS - waited;
  if (left <= 0) return { level: "overdue", label: `Overdue ${fmtDur(-left)}`, tone: "warning" };
  if (left <= RISK_WINDOW_HOURS) return { level: "risk", label: `${fmtDur(left)} left`, tone: "warning" };
  return { level: "ok", label: `${fmtDur(left)} left`, tone: "neutral" };
}

function isPlatformPending(s: SowSummary): boolean {
  return s.status === "approval" && s.stage === "platform";
}

function isUrgent(s: SowSummary): boolean {
  return slaInfo(s).level !== "ok";
}

function sortByUrgency(items: SowSummary[]): SowSummary[] {
  return [...items].sort(
    (a, b) => hoursWaiting(b.submittedForApprovalAt ?? b.updatedAt) - hoursWaiting(a.submittedForApprovalAt ?? a.updatedAt),
  );
}

export function CommercialGateWorkspace() {
  const allowed = useAdminSectionGuard("commercialGate");
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const msg = searchParams.get("msg");

  const { data, isLoading } = useSowList({ status: "approval", limit: 200 });
  const [toast, setToast] = React.useState<string | null>(msg && MSG_COPY[msg] ? MSG_COPY[msg] : null);

  const queue = React.useMemo(() => sortByUrgency((data?.items ?? []).filter(isPlatformPending)), [data]);
  const urgentCount = React.useMemo(() => queue.filter(isUrgent).length, [queue]);

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
      next.delete("queue");
      const qs = next.toString();
      router.replace(qs ? `/admin/sow?${qs}` : "/admin/sow", { scroll: false });
    }
  }, [msg, router, searchParams]);

  React.useEffect(() => {
    if (!searchParams.get("queue")) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("queue");
    const qs = next.toString();
    router.replace(qs ? `/admin/sow?${qs}` : "/admin/sow", { scroll: false });
  }, [router, searchParams]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      next.delete("queue");
      const qs = next.toString();
      router.replace(qs ? `/admin/sow?${qs}` : "/admin/sow", { scroll: false });
    },
    [router, searchParams],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return queue;
    return queue.filter((s) => {
      const hay = [s.title, s.id, s.tenantName ?? "", s.ownerName ?? "", s.ownerId].join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [queue, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = filtered.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  if (!allowed) return null;
  if (isLoading && !data) return <CommercialGateSkeleton />;

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      {toast ? (
        <div role="status" className="rounded-lg border border-success-border bg-success-subtle/60 px-4 py-2.5 font-body text-[13px] font-medium text-success-text">
          {toast}
        </div>
      ) : null}

      <header>
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          Commercial gate
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary max-w-2xl">
          SOWs waiting on your platform commercial decision — handed off after enterprise finance, security, and legal
          sign-off. Open a row to review and decide within {SLA_HOURS}h.
        </p>
      </header>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-body text-[13px] font-semibold text-foreground">Review queue</p>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              {queue.length === 0 ? (
                "Nothing waiting on you"
              ) : (
                <>
                  {queue.length} waiting
                  {urgentCount > 0 ? (
                    <>
                      <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
                      {urgentCount} within {RISK_WINDOW_HOURS}h of SLA or overdue
                    </>
                  ) : null}
                  <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
                  longest wait first
                </>
              )}
            </p>
          </div>

          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setParam({ q: e.target.value })}
              placeholder="Search SOW, tenant, ID…"
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

        {filtered.length === 0 ? (
          <EmptyState hasQueue={queue.length > 0} hasQuery={Boolean(search.trim())} onClear={() => setParam({ q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">SOW</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Tenant</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">Sponsor</th>
                    <th className="px-3 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      Waiting
                      <span className="block font-normal normal-case tracking-normal text-text-disabled">since handoff</span>
                    </th>
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[11px] font-medium text-text-tertiary">
                      SLA
                      <span className="block font-normal normal-case tracking-normal text-text-disabled">{SLA_HOURS}h limit</span>
                    </th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => (
                    <QueueRow key={s.id} sow={s} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[13px] font-medium text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                    {pageIdx}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[13px] font-medium text-text-secondary hover:text-foreground disabled:text-text-disabled transition-colors"
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

function QueueRow({ sow: s }: { sow: SowSummary }) {
  const router = useRouter();
  const sla = slaInfo(s);
  const waited = fmtDur(hoursWaiting(s.submittedForApprovalAt ?? s.updatedAt));
  const href = `/admin/sow/${s.id}`;

  return (
    <tr
      onClick={() => router.push(href)}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5 max-w-[260px]">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block"
          title={`${s.title} · ${s.id}`}
        >
          {s.title}
        </Link>
      </td>
      <td className="px-3 py-3.5 font-body text-[13px] text-text-secondary truncate max-w-[160px]">{s.tenantName ?? "—"}</td>
      <td className="px-3 py-3.5 font-body text-[13px] text-text-secondary truncate max-w-[160px]">{s.ownerName ?? s.ownerId}</td>
      <td className="px-3 py-3.5 font-mono text-[12px] text-text-tertiary tabular-nums whitespace-nowrap" suppressHydrationWarning>
        {waited}
      </td>
      <td className="px-4 sm:px-5 py-3.5">
        <SlaChip sla={sla} />
      </td>
      <td className="px-2 py-3.5">
        <ChevronRight
          className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 group-hover:text-text-secondary transition-all"
          strokeWidth={2}
          aria-hidden
        />
        <span className="sr-only">Review commercial gate</span>
      </td>
    </tr>
  );
}

function SlaChip({ sla }: { sla: SlaInfo }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full font-body text-[11px] font-medium whitespace-nowrap"
      style={{ color: TONE_TEXT[sla.tone], background: TONE_SOFT[sla.tone] }}
      suppressHydrationWarning
    >
      <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
      {sla.label}
    </span>
  );
}

function EmptyState({
  hasQueue,
  hasQuery,
  onClear,
}: {
  hasQueue: boolean;
  hasQuery: boolean;
  onClear: () => void;
}) {
  if (hasQuery) {
    return (
      <TenantEmptyState
        icon={Search}
        title="No SOWs match your search"
        description={hasQueue ? "Try a different title, tenant, or ID — items may still be in your queue." : "Try a different search term."}
        action={
          <button type="button" onClick={onClear} className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">
            Clear search
          </button>
        }
      />
    );
  }

  return (
    <TenantEmptyState
      icon={CheckCircle2}
      title="Queue is clear"
      description="No SOWs are waiting on platform commercial review. New handoffs from enterprise gates will appear here."
    />
  );
}
