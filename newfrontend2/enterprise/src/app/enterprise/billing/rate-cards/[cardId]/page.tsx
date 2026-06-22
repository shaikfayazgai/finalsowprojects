"use client";

/**
 * Rate card detail — scorecard cockpit.
 * BackLink + identity header (DASH_CARD, GLASS_GRADIENT icon chip) +
 * 4-StatCard scorecard + tabbed DASH_CARD sections.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Hash,
  Info,
  Pencil,
  Search,
  X,
} from "lucide-react";
import {
  getRateCardMock,
  rateCardOverlay,
  type RateCardDetail,
} from "@/lib/enterprise/mocks/rate-cards";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import {
  CardFactsSection,
  effectiveLabel,
  RateRowsSection,
  SegmentRatesSection,
  STATUS_TONE,
} from "./components/detail-sections";
import { NewRateCardDrawer } from "../components/new-rate-card-drawer";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  StatCard,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  TONE,
  type Tone,
} from "@/app/admin/_shell/aurora-ui";

type TabKey = "rates" | "segments" | "details";

function fmtRateByCurrency(currency: string, minor: number): string {
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${sym}${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      {label}
    </button>
  );
}

export default function RateCardDetailPage() {
  const params = useParams<{ cardId: string }>();
  const cardId = params?.cardId ?? "";
  const overlayVersion = useOverlayVersion(rateCardOverlay as never);
  const [rateSearch, setRateSearch] = React.useState("");
  const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("rates");

  const card: RateCardDetail | undefined = React.useMemo(
    () => (cardId ? getRateCardMock(cardId) : undefined),
    [cardId, overlayVersion],
  );

  if (!card) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
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

  /* ── Alert banner logic ── */
  const alert: { tone: Tone; title: string; body: string } | null =
    card.status === "draft"
      ? { tone: "ai", title: "Draft — not in use for payouts", body: "Activate this card to apply rates to new payout computations. Edit to review rows and publish." }
      : card.status === "expired"
        ? { tone: "neutral", title: "Expired rate card", body: "This card is historical only — active payouts use cards with a current effective period." }
        : { tone: "success", title: "Active pricing in force", body: "Rates below apply to contributor payouts for work under this scope during the effective period." };

  /* ── KPI values ── */
  const effectivePeriod = effectiveLabel(card);
  const avgRate =
    card.rows.length > 0
      ? Math.round(card.rows.reduce((a, r) => a + r.rateMinorPerHour, 0) / card.rows.length)
      : 0;

  const cardCurrency = card.currency;
  const avgRateFormatted = avgRate > 0 ? fmtRateByCurrency(cardCurrency, avgRate) : "—";

  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: "rates", label: "Rates per hour" },
    ...(card.bySegment ? ([{ key: "segments", label: "Segment rates" }] as const) : []),
    { key: "details", label: "Details" },
  ];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Identity header */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span
            className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0"
            style={GLASS_GRADIENT}
            aria-hidden
          >
            <CreditCard className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
              Finance · Rate card · {card.id}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none truncate">
                {card.name}
              </h1>
              <Chip tone={STATUS_TONE[card.status]} dot={false} className="capitalize">
                {card.status}
              </Chip>
            </div>
            <p className="mt-2 font-body text-[12px] text-text-tertiary">
              {card.scopeLabel} · <span className="font-mono">{card.currency}</span> · {effectivePeriod}
            </p>
            <RecordLinks onEdit={() => setEditDrawerOpen(true)} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditDrawerOpen(true)}
          className={cn(secondaryBtnClass, "shrink-0 px-4")}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Edit card
        </button>
      </header>

      {/* Alert */}
      {alert && (
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
          style={{ background: TONE[alert.tone].soft, borderColor: TONE[alert.tone].border }}
        >
          {card.status === "draft" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
          ) : card.status === "active" ? (
            <Info className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.success.text }} aria-hidden />
          ) : (
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-text-tertiary" strokeWidth={2} aria-hidden />
          )}
          <p className="font-body text-[12.5px] text-text-secondary">
            <span className="font-semibold text-foreground">{alert.title}</span> — {alert.body}
          </p>
        </div>
      )}

      {/* Scorecard */}
      <section aria-label="Rate card metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Rate rows"
          value={card.rowCount}
          icon={Hash}
          hint="role · skill · level combinations"
        />
        <StatCard
          label="Avg rate / hour"
          value={avgRateFormatted}
          icon={CreditCard}
          hint={`${card.currency} minor units`}
        />
        <StatCard
          label="Scope"
          value={card.scopeLabel}
          icon={Info}
          hint="applies to"
        />
        <StatCard
          label="Effective from"
          value={new Date(card.effectiveFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
          icon={CalendarDays}
          hint={card.effectiveTo ? `until ${new Date(card.effectiveTo).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}` : "no expiry"}
        />
      </section>

      {/* Tabbed sections */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Rate card sections" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <TabPill
                key={t.key}
                label={t.label}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
              />
            ))}
          </nav>

          {tab === "rates" && card.rows.length > 3 && (
            <div className="relative w-44">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                placeholder="Filter rates…"
                className="w-full h-8 pl-9 pr-2 rounded-lg bg-surface border border-stroke-subtle font-body text-[12px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
              />
              {rateSearch && (
                <button
                  type="button"
                  onClick={() => setRateSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-5">
          {tab === "rates" && (
            <>
              {rateSearch.trim() && (
                <p className="mb-3 font-body text-[11.5px] text-text-tertiary">
                  {card.rows.filter((r) => `${r.role} ${r.skill} ${r.level} ${r.region}`.toLowerCase().includes(rateSearch.toLowerCase())).length} of {card.rows.length} rows
                </p>
              )}
              <RateRowsSection card={card} search={rateSearch} />
            </>
          )}
          {tab === "segments" && <SegmentRatesSection card={card} />}
          {tab === "details" && <CardFactsSection card={card} />}
        </div>
      </div>

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
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Rate cards
    </Link>
  );
}

function RecordLinks({ onEdit }: { onEdit: () => void }) {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/billing"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Billing overview
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/billing/payouts"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Payouts
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        <Pencil className="h-3 w-3" strokeWidth={2} aria-hidden />
        Edit
      </button>
    </p>
  );
}
