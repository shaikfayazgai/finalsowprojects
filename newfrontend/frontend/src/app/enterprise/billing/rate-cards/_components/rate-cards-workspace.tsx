"use client";

/**
 * Rate cards workspace — KPI strip + gradient-pill tabs + solid search + table + pagination.
 * Registry pattern (billing-invoices-panel exemplar).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, KeyRound, Plus, Search, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listRateCards } from "@/lib/api/enterprise-rate-cards";
import type {
  RateCardStatus,
  RateCardSummary,
} from "@/lib/enterprise/mocks/rate-cards";
import { Skeleton } from "@/components/meridian";
import { NewRateCardDrawer } from "../components/new-rate-card-drawer";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  StatCard,
  Chip,
  type Tone,
  primaryBtnClass,
  primaryStyle,
} from "@/app/admin/_shell/aurora-ui";
import { CreditCard, Hash, LayoutGrid } from "lucide-react";

const ROWS_PER_PAGE = 10;

type FilterKey = "all" | RateCardStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "draft", label: "Draft" },
  { key: "expired", label: "Expired" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function effectiveLabel(card: RateCardSummary): string {
  const from = fmtDate(card.effectiveFrom);
  const to = card.effectiveTo ? fmtDate(card.effectiveTo) : "No expiry";
  return `${from} – ${to}`;
}

const STATUS_TONE: Record<RateCardStatus, Tone> = {
  active: "success",
  draft: "ai",
  expired: "neutral",
};

export function RateCardsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const activeFilter: FilterKey =
    (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const ratecardsQ = useQuery({
    queryKey: ["enterprise", "rate-cards"],
    queryFn: listRateCards,
  });
  const all = React.useMemo(() => ratecardsQ.data ?? [], [ratecardsQ.data]);

  const counts = React.useMemo(() => {
    const c = { active: 0, draft: 0, expired: 0 } as Record<RateCardStatus, number>;
    let totalRows = 0;
    for (const card of all) {
      c[card.status]++;
      if (card.status === "active") totalRows += card.rowCount;
    }
    return { all: all.length, ...c, activeRows: totalRows };
  }, [all]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((card) => {
      if (activeFilter !== "all" && card.status !== activeFilter) return false;
      if (needle) {
        const hay = `${card.name} ${card.scopeLabel} ${card.id}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, activeFilter, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
      ),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/enterprise/billing/rate-cards?${qs}` : "/enterprise/billing/rate-cards", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const listDescription =
    sorted.length === 0
      ? "No matches"
      : `${sorted.length} rate card${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance · Rate cards
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Rate cards
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-secondary">
          Effective and historical pricing — drives contributor payout rates.
        </p>
      </header>

      {/* KPI strip */}
      <section aria-label="Rate card summary" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Active cards"
          value={counts.active}
          icon={CreditCard}
          hint="in force for payouts"
          hintTone={counts.active > 0 ? "success" : "neutral"}
        />
        <StatCard
          label="Draft cards"
          value={counts.draft}
          icon={LayoutGrid}
          hint={counts.draft > 0 ? "pending activation" : "none pending"}
          hintTone={counts.draft > 0 ? "ai" : "neutral"}
        />
        <StatCard
          label="Rate rows (active)"
          value={counts.activeRows}
          icon={Hash}
          hint="across active cards"
        />
      </section>

      {/* Registry card */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Header: title + action + search */}
        <div className="px-4 sm:px-5 pt-4 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
            <div className="min-w-0">
              <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
                All rate cards
              </h2>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{listDescription}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-52 shrink-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setParam({ q: e.target.value })}
                  placeholder="Search name, scope…"
                  className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setParam({ q: null })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={cn(primaryBtnClass, "h-9 px-3.5 text-[13px]")}
                style={primaryStyle}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                New rate card
              </button>
            </div>
          </div>

          {/* Gradient-pill tabs */}
          <nav aria-label="Filter rate cards" className="flex flex-wrap gap-1.5 pb-4">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel
            isEmpty={all.length === 0}
            onClear={() => setParam({ status: null, q: null })}
            onCreate={() => setDrawerOpen(true)}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse" aria-label="Rate cards">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Name
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Scope
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary hidden sm:table-cell">
                      Effective period
                    </th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary hidden md:table-cell">
                      Rows
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Status
                    </th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((card) => (
                    <RateCardRow key={card.id} card={card} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
                    }
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
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>

      <NewRateCardDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setDrawerOpen(false);
          void queryClient.invalidateQueries({ queryKey: ["enterprise", "rate-cards"] });
        }}
      />
    </div>
  );
}

function RateCardRow({ card }: { card: RateCardSummary }) {
  const href = `/enterprise/billing/rate-cards/${card.id}`;
  return (
    <tr
      onClick={() => { window.location.href = href; }}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[220px]"
          title={card.name}
        >
          {card.name}
        </Link>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{card.id}</span>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary whitespace-nowrap">
        {card.scopeLabel}
      </td>
      <td className="px-3 py-3.5 font-body text-[12px] text-text-tertiary whitespace-nowrap hidden sm:table-cell tabular-nums">
        {effectiveLabel(card)}
      </td>
      <td className="px-3 py-3.5 font-mono text-[12px] text-text-secondary tabular-nums text-right whitespace-nowrap hidden md:table-cell">
        {card.rowCount}
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={STATUS_TONE[card.status]} dot={false} className="capitalize">
          {card.status}
        </Chip>
      </td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight
          className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth={2}
          aria-hidden
        />
      </td>
    </tr>
  );
}

function EmptyPanel({
  isEmpty,
  onClear,
  onCreate,
}: {
  isEmpty: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <KeyRound className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">
        {isEmpty ? "No rate cards yet" : "No matches"}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {isEmpty
          ? "Create a rate card to define contributor pricing by role, skill, and level."
          : "Try a different filter or search term."}
      </p>
      {isEmpty ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
        >
          New rate card
        </button>
      ) : (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export function RateCardsPanelSkeleton() {
  return (
    <div className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="divide-y divide-stroke-subtle">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5">
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
