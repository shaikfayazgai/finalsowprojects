/**
 * Role-scoped pricing views.
 *
 * This is the enforcement seam for the three-price model. UI components
 * should never read `SowPricing.marginAmount` or `actualCost` directly;
 * instead they ask for the view their persona is allowed to see.
 *
 *   enterprise  → clientPrice + GST line, nothing else.
 *   contributor → contributorPayout + mode breakdown, nothing else.
 *   platform    → everything (margin, profit %, cost basis, breakdowns).
 *
 * If a field doesn't exist on the returned view type, the component
 * physically cannot render it. Treat that as the contract.
 */

import {
  AiPricingInput,
  Currency,
  ManualPricingInput,
  PayoutMode,
  PricingMode,
  SowPricing,
  TaskPricing,
} from "./types";
import { gstOnTop } from "./math";

// ── SOW views ────────────────────────────────────────────────────────────────

/** What the enterprise is allowed to see. */
export interface EnterpriseSowPriceView {
  clientPrice: number;
  gst: number;
  total: number;
  currency: Currency;
  locked: boolean;
}

/**
 * What Glimmora platform admin sees: enterprise view + margin breakdown
 * + the raw mode inputs (audit trail).
 */
export interface PlatformSowPriceView extends EnterpriseSowPriceView {
  mode: PricingMode;
  actualCost: number;
  marginAmount: number;
  marginPct: number;
  manual?: ManualPricingInput;
  ai?: AiPricingInput;
}

export function sowPriceForEnterprise(p: SowPricing): EnterpriseSowPriceView {
  const { gst, total } = gstOnTop(p.clientPrice);
  return {
    clientPrice: p.clientPrice,
    gst,
    total,
    currency: p.currency,
    locked: p.lockedAt != null,
  };
}

export function sowPriceForPlatform(p: SowPricing): PlatformSowPriceView {
  return {
    ...sowPriceForEnterprise(p),
    mode: p.mode,
    actualCost: p.actualCost,
    marginAmount: p.marginAmount,
    marginPct: p.marginPct,
    manual: p.manual,
    ai: p.ai,
  };
}

// ── Task views ───────────────────────────────────────────────────────────────

/** What the contributor is allowed to see. */
export interface ContributorTaskPriceView {
  payoutMode: PayoutMode;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedAmount?: number;
  contributorPayout: number;
  currency: Currency;
  locked: boolean;
}

export function taskPriceForContributor(p: TaskPricing): ContributorTaskPriceView {
  return {
    payoutMode: p.payoutMode,
    hourlyRate: p.hourlyRate,
    estimatedHours: p.estimatedHours,
    fixedAmount: p.fixedAmount,
    contributorPayout: p.contributorPayout,
    currency: p.currency,
    locked: p.lockedAt != null,
  };
}

/**
 * Adapter: build a contributor view from either typed `TaskPricing` (preferred
 * when present) or the legacy flat fields (`agreedRatePerHour`, `estimatedHours`).
 *
 * This is how Phase 4 UI surfaces stay one-line — they don't care which shape
 * the row carries.
 */
export function contributorViewFromTaskLike(input: {
  pricing?: TaskPricing | null;
  agreedRatePerHour?: number | null;
  agreedCurrency?: string | null;
  estimatedHours?: number | null;
}): ContributorTaskPriceView | null {
  if (input.pricing) return taskPriceForContributor(input.pricing);
  const rate = input.agreedRatePerHour;
  const hrs = input.estimatedHours;
  if (rate == null || hrs == null) return null;
  if (input.agreedCurrency && input.agreedCurrency !== "INR") return null;
  return {
    payoutMode: "hourly",
    hourlyRate: rate,
    estimatedHours: hrs,
    contributorPayout: Math.max(0, Math.round(rate * hrs)),
    currency: "INR",
    locked: false,
  };
}
