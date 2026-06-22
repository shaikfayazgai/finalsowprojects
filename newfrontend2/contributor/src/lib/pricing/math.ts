/**
 * Pricing math — markup model, gross margin, GST-on-top.
 *
 * Formulas (locked):
 *   clientPrice (manual) = enterpriseProposed + platformFeeAmount
 *   clientPrice (ai)     = aiBasePrice + sowProcessingCost + uplift
 *   marginAmount         = max(0, clientPrice − actualCost)
 *   marginPct            = (clientPrice − actualCost) / clientPrice * 100
 *   gstAmount            = clientPrice * 0.18
 *   enterpriseTotal      = clientPrice + gstAmount
 *
 * GST is pass-through (collected by Glimmora, remitted to govt) and is NOT
 * part of margin. Contributor-side GST is handled at payout settlement and
 * does not affect the markup-side margin computation here.
 */

import {
  AiPricingInput,
  GST_RATE,
  ManualPricingInput,
  PayoutMode,
  SowPricing,
  TaskPricing,
} from "./types";

// ── Client price ─────────────────────────────────────────────────────────────

export function computeClientPriceFromManual(input: ManualPricingInput): number {
  const sum = (input.enterpriseProposed ?? 0) + (input.platformFeeAmount ?? 0);
  return Math.max(0, Math.round(sum));
}

export function computeClientPriceFromAi(input: AiPricingInput): number {
  const sum =
    (input.aiBasePrice ?? 0) +
    (input.sowProcessingCost ?? 0) +
    (input.uplift ?? 0);
  return Math.max(0, Math.round(sum));
}

// ── Margin (platform-admin only) ─────────────────────────────────────────────

export function computeMarginAmount(clientPrice: number, actualCost: number): number {
  return Math.max(0, Math.round(clientPrice - actualCost));
}

/** 0..100, two-decimal precision. Returns 0 when clientPrice is zero. */
export function computeMarginPct(clientPrice: number, actualCost: number): number {
  if (clientPrice <= 0) return 0;
  const pct = ((clientPrice - actualCost) / clientPrice) * 100;
  return Math.max(0, Math.round(pct * 100) / 100);
}

// ── GST (pass-through, sits OUTSIDE margin) ──────────────────────────────────

export interface GstBreakdown {
  base: number;
  gst: number;
  total: number;
}

/** Apply 18% GST on top of a base amount. */
export function gstOnTop(base: number): GstBreakdown {
  const safe = Math.max(0, Math.round(base));
  const gst = Math.round(safe * GST_RATE);
  return { base: safe, gst, total: safe + gst };
}

/** Inverse: extract GST when the amount is already inclusive (paid total). */
export function gstInclusiveSplit(total: number): GstBreakdown {
  const safe = Math.max(0, Math.round(total));
  const base = Math.round(safe / (1 + GST_RATE));
  return { base, gst: safe - base, total: safe };
}

// ── Builders (use these in mocks / intake) ───────────────────────────────────

export function buildSowPricingManual(
  manual: ManualPricingInput,
  actualCost: number,
): SowPricing {
  const clientPrice = computeClientPriceFromManual(manual);
  return {
    mode: "manual",
    currency: "INR",
    clientPrice,
    manual,
    actualCost: Math.max(0, Math.round(actualCost)),
    marginAmount: computeMarginAmount(clientPrice, actualCost),
    marginPct: computeMarginPct(clientPrice, actualCost),
    lockedAt: null,
  };
}

export function buildSowPricingAi(
  ai: AiPricingInput,
  actualCost: number,
): SowPricing {
  const clientPrice = computeClientPriceFromAi(ai);
  return {
    mode: "ai",
    currency: "INR",
    clientPrice,
    ai,
    actualCost: Math.max(0, Math.round(actualCost)),
    marginAmount: computeMarginAmount(clientPrice, actualCost),
    marginPct: computeMarginPct(clientPrice, actualCost),
    lockedAt: null,
  };
}

/**
 * Recompute derived fields when actualCost changes (e.g. tasks decomposed,
 * contributor selected at a different payout than estimated). Will not run
 * after lock — caller must check `lockedAt` first.
 */
export function recomputeSowPricing(
  p: SowPricing,
  nextActualCost: number,
): SowPricing {
  return {
    ...p,
    actualCost: Math.max(0, Math.round(nextActualCost)),
    marginAmount: computeMarginAmount(p.clientPrice, nextActualCost),
    marginPct: computeMarginPct(p.clientPrice, nextActualCost),
  };
}

// ── Task pricing ─────────────────────────────────────────────────────────────

export function computeContributorPayout(input: {
  payoutMode: PayoutMode;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedAmount?: number;
}): number {
  if (input.payoutMode === "fixed") {
    return Math.max(0, Math.round(input.fixedAmount ?? 0));
  }
  const rate = input.hourlyRate ?? 0;
  const hrs = input.estimatedHours ?? 0;
  return Math.max(0, Math.round(rate * hrs));
}

export function buildTaskPricing(input: {
  payoutMode: PayoutMode;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedAmount?: number;
}): TaskPricing {
  return {
    payoutMode: input.payoutMode,
    currency: "INR",
    hourlyRate: input.hourlyRate,
    estimatedHours: input.estimatedHours,
    fixedAmount: input.fixedAmount,
    contributorPayout: computeContributorPayout(input),
    lockedAt: null,
  };
}
