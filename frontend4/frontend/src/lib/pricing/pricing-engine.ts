/**
 * GTPROJECT pricing engine — the locked margin model.
 *
 * Costing base: actualCost = hours × RATE_PER_HOUR (the true delivery cost,
 * = what the contributor is paid before GST).
 *
 * Two enterprise pricing modes per task:
 *   • manual — enterprise types a price; Glimmora adds a markup % + flat fee →
 *     that is the final DEAL price the enterprise pays.
 *   • ai     — AI price = actualCost × AI_FACTOR. Enterprise SEES the AI price;
 *     Glimmora sees both actualCost and AI price → knows profit %.
 *
 * Contributor is paid the actualCost (shown hourly + as a fixed total), with
 * GST deducted on their side. The enterprise invoice also carries GST.
 *
 * Money flow (simulated, not a real gateway):
 *   enterprise pays final (incl GST) → Glimmora → Glimmora pays contributor
 *   (actualCost − GST). Glimmora keeps (enterprisePrice − actualCost).
 *
 * All amounts are in MINOR units (paise) to avoid float drift. Helpers return
 * a fully-broken-down quote so every surface shows consistent numbers.
 */

export const RATE_PER_HOUR = 1200; //            ₹/h costing rate (== contributor rate)
export const MINOR = 100; //                     paise per rupee
export const GST_RATE = 0.18; //                 18%
export const MANUAL_MARKUP_PCT = 0.15; //        +15% on manual price
export const MANUAL_FLAT_FEE_MINOR = 2000 * MINOR; // +₹2,000 flat
export const AI_FACTOR = 1.5; //                 AI price = actualCost × 1.5

export type PriceMode = "manual" | "ai";

export interface PriceQuote {
  mode: PriceMode;
  hours: number;

  /** True delivery cost = contributor gross = hours × rate. */
  actualCostMinor: number;

  /** Price the ENTERPRISE is shown (pre-GST deal price). */
  enterprisePriceMinor: number;
  /** GST added on the enterprise invoice. */
  enterpriseGstMinor: number;
  /** What the enterprise actually pays Glimmora (deal + GST). */
  enterpriseTotalMinor: number;

  /** Contributor gross (= actualCost), the GST cut, and net payout. */
  contributorGrossMinor: number;
  contributorGstMinor: number;
  contributorNetMinor: number;
  /** Hourly rate shown to the contributor. */
  contributorHourlyMinor: number;

  /** Glimmora margin = enterprise price − contributor gross (pre-GST). */
  glimmoraMarginMinor: number;
  /** Profit % over actual cost. */
  profitPct: number;

  /** Manual-mode inputs (echoed for display); null in AI mode. */
  manualBaseMinor?: number;
  markupMinor?: number;
  flatFeeMinor?: number;
}

function round(n: number): number {
  return Math.round(n);
}

/**
 * Build a full price quote.
 *  - manual mode: pass `manualPriceMinor` (the enterprise's typed base price).
 *  - ai mode: AI price is derived from hours × rate × AI_FACTOR.
 */
export function quote(opts: {
  mode: PriceMode;
  hours: number;
  manualPriceMinor?: number;
}): PriceQuote {
  const hours = Math.max(0, opts.hours || 0);
  const actualCostMinor = round(hours * RATE_PER_HOUR * MINOR);

  let enterprisePriceMinor: number;
  let manualBaseMinor: number | undefined;
  let markupMinor: number | undefined;
  let flatFeeMinor: number | undefined;

  if (opts.mode === "manual") {
    manualBaseMinor = Math.max(0, round(opts.manualPriceMinor ?? actualCostMinor));
    markupMinor = round(manualBaseMinor * MANUAL_MARKUP_PCT);
    flatFeeMinor = MANUAL_FLAT_FEE_MINOR;
    // Final deal price the enterprise pays = base + markup + flat fee.
    enterprisePriceMinor = manualBaseMinor + markupMinor + flatFeeMinor;
  } else {
    // AI price = actual cost × factor.
    enterprisePriceMinor = round(actualCostMinor * AI_FACTOR);
  }

  const enterpriseGstMinor = round(enterprisePriceMinor * GST_RATE);
  const enterpriseTotalMinor = enterprisePriceMinor + enterpriseGstMinor;

  // Contributor is paid the actual cost; GST deducted on their side.
  const contributorGrossMinor = actualCostMinor;
  const contributorGstMinor = round(contributorGrossMinor * GST_RATE);
  const contributorNetMinor = contributorGrossMinor - contributorGstMinor;

  const glimmoraMarginMinor = enterprisePriceMinor - contributorGrossMinor;
  const profitPct =
    contributorGrossMinor > 0
      ? Math.round((glimmoraMarginMinor / contributorGrossMinor) * 100)
      : 0;

  return {
    mode: opts.mode,
    hours,
    actualCostMinor,
    enterprisePriceMinor,
    enterpriseGstMinor,
    enterpriseTotalMinor,
    contributorGrossMinor,
    contributorGstMinor,
    contributorNetMinor,
    contributorHourlyMinor: RATE_PER_HOUR * MINOR,
    glimmoraMarginMinor,
    profitPct,
    manualBaseMinor,
    markupMinor,
    flatFeeMinor,
  };
}

/** ₹ formatter from minor units. */
export function inr(minor: number): string {
  return `₹${(minor / MINOR).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
