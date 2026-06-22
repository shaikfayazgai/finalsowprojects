"use client";

/**
 * Rate cards workspace — underline tabs, search, grouped scannable rows.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Plus, Search, X } from "lucide-react";
import {
  listRateCardsMock,
  rateCardOverlay,
  type RateCardStatus,
  type RateCardSummary,
} from "@/lib/enterprise/mocks/rate-cards";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { Skeleton } from "@/components/meridian";
import { NewRateCardDrawer } from "../components/new-rate-card-drawer";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT, ACCENT_TEXT } from "@/app/admin/_shell/aurora";
import {
  SectionCard,
  Chip,
  type Tone,
  primaryBtnClass,
  primaryStyle,
  GLASS_FIELD_STYLE,
} from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 10;
const PREVIEW_PER_GROUP = 4;

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
  return `${from} → ${to}`;
}

function rowMeta(card: RateCardSummary): string {
  return [
    card.scopeLabel,
    card.currency,
    effectiveLabel(card),
    `${card.rowCount} rate row${card.rowCount === 1 ? "" : "s"}`,
  ].join(" · ");
}

const STATUS_TONE: Record<RateCardStatus, Tone> = {
  active: "success",
  draft: "ai",
  expired: "neutral",
};

function groupCards(items: RateCardSummary[]) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
  );
  const active = sorted.filter((c) => c.status === "active");
  const draft = sorted.filter((c) => c.status === "draft");
  const expired = sorted.filter((c) => c.status === "expired");

  const groups: Array<{ key: FilterKey; label: string; rows: RateCardSummary[] }> = [];
  if (active.length) groups.push({ key: "active", label: "Active", rows: active });
  if (draft.length) groups.push({ key: "draft", label: "Draft", rows: draft });
  if (expired.length) groups.push({ key: "expired", label: "Expired", rows: expired });
  return groups;
}

export function RateCardsWorkspace() {
  const overlayVersion = useOverlayVersion(rateCardOverlay as never);

  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const all = React.useMemo(() => listRateCardsMock(), [overlayVersion]);

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

  const grouped = activeFilter === "all" && !search.trim();
  const groups = grouped ? groupCards(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = grouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

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
      : grouped
        ? `${sorted.length} rate card${sorted.length === 1 ? "" : "s"} · grouped by status`
        : `${sorted.length} rate card${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance · Rate cards
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Rate cards
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Effective and historical pricing across tenant, project, and SOW scope — drives contributor payout rates.
        </p>
        <RecordLinks />
      </header>

      {counts.draft > 0 && (
        <ContextBanner title={`${counts.draft} draft rate card${counts.draft === 1 ? "" : "s"}`}>
          Draft cards are not used for payout computation until activated. Review and publish from the card detail.
        </ContextBanner>
      )}

      <SectionCard
        title="Coverage summary"
        description="Active cards in force for this tenant"
      >
        <div className="px-5 sm:px-6 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
            <SummaryStat label="Active cards" value={String(counts.active)} highlight={counts.active > 0} />
            <SummaryStat label="Draft cards" value={String(counts.draft)} />
            <SummaryStat
              label="Rate rows (active)"
              value={String(counts.activeRows)}
              caption="Across all active cards"
            />
          </dl>
        </div>
      </SectionCard>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 pt-4 pb-0 border-b border-white/55">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                All rate cards
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={cn(primaryBtnClass, "h-8 px-3 text-[12px]")}
              style={primaryStyle}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              New rate card
            </button>
            <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search name, scope…"
                style={GLASS_FIELD_STYLE}
                className="w-full h-8 pl-8 pr-8 rounded-xl backdrop-blur-md font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setParam({ q: null })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter rate cards" className="flex flex-wrap gap-x-1 -mb-px">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setParam({ status: tab.key === "all" ? null : tab.key })
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
                      active
                        ? "bg-white/70 text-foreground"
                        : "text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      style={{ backgroundImage: AURORA_ACCENT }}
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                    />
                  )}
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
        ) : groups ? (
          <div className="divide-y divide-white/60">
            {groups.map((group) => (
              <CardGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/enterprise/billing/rate-cards?status=${group.key}`}
                emphasize={group.key === "draft"}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-white/60">
              {pageRows.map((card) => (
                <RateCardRow key={card.id} card={card} />
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex items-center justify-between px-5 py-3 border-t border-white/55">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
                    }
                    className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
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
                    className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
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
        onSaved={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function CardGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  emphasize,
}: {
  label: string;
  rows: RateCardSummary[];
  previewLimit: number;
  filterHref: string;
  emphasize?: boolean;
}) {
  const preview = rows.slice(0, previewLimit);
  const overflow = rows.length - preview.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5">
        <p
          className={cn(
            "font-body text-[11px] font-semibold uppercase tracking-[0.1em]",
            "text-text-tertiary",
          )}
        >
          {label}
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {rows.length}
          </span>
        </p>
        {rows.length > previewLimit && (
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-secondary hover:text-foreground">
            View all
          </Link>
        )}
      </div>
      <ul className="divide-y divide-white/60 border-t border-white/55">
        {preview.map((card) => (
          <li key={card.id}>
            <RateCardRow card={card} emphasize={emphasize} />
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-5 py-2 border-t border-white/55">
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-secondary hover:text-foreground">
            + {overflow} more
          </Link>
        </div>
      )}
    </div>
  );
}

function RateCardRow({
  card,
  emphasize,
}: {
  card: RateCardSummary;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={`/enterprise/billing/rate-cards/${card.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="font-body text-[13px] font-medium text-foreground truncate block">
          {card.name}
        </span>
        <span
          className={cn(
            "font-body text-[11px] truncate block mt-0.5",
            emphasize ? "text-text-secondary font-medium" : "text-text-tertiary",
          )}
        >
          {rowMeta(card)}
        </span>
      </span>
      <Chip tone={STATUS_TONE[card.status]} dot={false} className="capitalize">
        {card.status}
      </Chip>
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 font-body text-[12px]">
      <Link
        href="/enterprise/billing/payouts"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Payouts
      </Link>
      <span aria-hidden className="text-text-disabled mx-2">
        ·
      </span>
      <Link
        href="/enterprise/billing/invoices"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Invoices
      </Link>
    </p>
  );
}

function SummaryStat({
  label,
  value,
  caption,
  highlight,
}: {
  label: string;
  value: string;
  caption?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className="mt-1 font-display text-[20px] font-semibold tabular-nums tracking-tight"
        style={highlight ? ACCENT_TEXT : { color: "var(--color-foreground)" }}
      >
        {value}
      </dd>
      {caption && (
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{caption}</p>
      )}
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 backdrop-blur"
      style={{ background: "var(--color-ai-surface)", borderColor: "var(--color-ai-border)" }}
    >
      <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
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
    <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <div className="px-5 pt-4 pb-3 border-b border-white/55 space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      <div className="divide-y divide-white/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-3">
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
