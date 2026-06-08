"use client";

/**
 * Rate card detail — single-column record view.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, Pencil, Search } from "lucide-react";
import {
  getRateCardMock,
  rateCardOverlay,
  type RateCardDetail,
} from "@/lib/enterprise/mocks/rate-cards";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { DashboardSection } from "@/components/meridian/dashboard";
import { RateCardDetailSkeleton } from "@/components/enterprise/page-skeletons";
import {
  CardFactsSection,
  effectiveLabel,
  RateRowsSection,
  SegmentRatesSection,
  statusPillCls,
} from "./components/detail-sections";
import { NewRateCardDrawer } from "../components/new-rate-card-drawer";
import { cn } from "@/lib/utils/cn";

export default function RateCardDetailPage() {
  const params = useParams<{ cardId: string }>();
  const cardId = params?.cardId ?? "";
  const overlayVersion = useOverlayVersion(rateCardOverlay as never);
  const [rateSearch, setRateSearch] = React.useState("");
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);

  const card: RateCardDetail | undefined = React.useMemo(
    () => (cardId ? getRateCardMock(cardId) : undefined),
    [cardId, overlayVersion],
  );

  if (!card) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            Rate card not found
            {cardId ? (
              <span className="block mt-1 font-mono text-[11px] opacity-80">{cardId}</span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  const matchedRows = card.rows.filter((row) => {
    const needle = rateSearch.trim().toLowerCase();
    if (!needle) return true;
    return `${row.role} ${row.skill} ${row.level} ${row.region}`.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Finance · Rate card · {card.id}
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {card.name}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold capitalize",
              statusPillCls(card.status),
            )}
          >
            {card.status}
          </span>
          <span aria-hidden>·</span>
          <span className="font-medium text-text-secondary">{card.scopeLabel}</span>
          <span aria-hidden>·</span>
          <span className="font-mono tabular-nums">{card.currency}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{effectiveLabel(card)}</span>
          <span aria-hidden>·</span>
          <span>
            {card.rowCount} rate row{card.rowCount === 1 ? "" : "s"}
          </span>
        </div>
        <RecordLinks onEdit={() => setEditDrawerOpen(true)} />
      </header>

      {card.status === "draft" && (
        <ContextBanner tone="brand" title="Draft — not in use for payouts">
          Activate this card to apply rates to new payout computations. Edit to review rows and publish.
        </ContextBanner>
      )}

      {card.status === "expired" && (
        <ContextBanner tone="neutral" title="Expired rate card">
          This card is historical only — active payouts use cards with a current effective period.
        </ContextBanner>
      )}

      {card.status === "active" && (
        <ContextBanner tone="neutral" title="Active pricing in force">
          Rates below apply to contributor payouts for work under this scope during the effective period.
        </ContextBanner>
      )}

      <DashboardSection title="Card details" description="Scope and validity">
        <CardFactsSection card={card} />
      </DashboardSection>

      <DashboardSection
        title="Rates per hour"
        description={
          rateSearch.trim()
            ? `${matchedRows.length} of ${card.rows.length} rows`
            : `${card.rows.length} role · skill · level combinations`
        }
        actions={
          <div className="relative w-44">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={rateSearch}
              onChange={(e) => setRateSearch(e.target.value)}
              placeholder="Filter rates…"
              className={cn(
                "w-full h-8 pl-8 pr-2 rounded-md border border-stroke bg-surface",
                "font-body text-[12px] text-foreground placeholder:text-text-disabled",
                "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
              )}
            />
          </div>
        }
      >
        <RateRowsSection card={card} search={rateSearch} />
      </DashboardSection>

      {card.bySegment && (
        <DashboardSection
          title="Segment rates"
          description="Platform pricing segments · per hour overrides"
        >
          <SegmentRatesSection card={card} />
        </DashboardSection>
      )}

      <NewRateCardDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        editCardId={cardId}
        onSaved={() => setEditDrawerOpen(false)}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/billing/rate-cards"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to rate cards
    </Link>
  );
}

function RecordLinks({ onEdit }: { onEdit: () => void }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/billing"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Billing overview
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/billing/payouts"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Payouts
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        <Pencil className="h-3 w-3" strokeWidth={2} aria-hidden />
        Edit rate card
      </button>
    </p>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "brand" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "brand"
          ? "border-brand/30 bg-brand-subtle/20"
          : "border-stroke-subtle bg-bg-subtle/50",
      )}
    >
      <p className="font-body text-[13px] font-semibold text-foreground flex items-center gap-1.5">
        {tone === "brand" && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2} aria-hidden />
        )}
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
