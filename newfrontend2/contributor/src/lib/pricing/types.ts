/**
 * Pricing domain — three-price marketplace model.
 *
 * Three prices, strict role-gated visibility:
 *   - contributorPayout : what the worker receives.
 *   - clientPrice        : what the enterprise pays Glimmora (excl. GST).
 *   - marginAmount       : clientPrice − actualCost. Platform-admin only.
 *
 * Markup model (locked): enterprise sees one price, never the breakdown.
 * Gross margin (locked): GST is pass-through and sits OUTSIDE the margin.
 *
 * Amounts here are in MAJOR currency units (rupees), as integers.
 * Milestone `amountMinor` in projects-mock.ts is still in minor (paise) —
 * use `formatINRMinor` when reading those, `formatINR` for everything here.
 */

export const GST_RATE = 0.18;

export type Currency = "INR";

/** How the client price is set on a SOW. */
export type PricingMode = "manual" | "ai";

/** How a contributor is paid for a task. */
export type PayoutMode = "hourly" | "fixed";

/** Manual mode inputs — enterprise proposes a value, Glimmora adds a fee. */
export interface ManualPricingInput {
  /** What the enterprise considers fair work value (excl. fee, excl. GST). */
  enterpriseProposed: number;
  /** Glimmora platform fee in absolute rupees (kept absolute for auditability). */
  platformFeeAmount: number;
}

/** AI mode inputs — auditable named components, not a black-box quote. */
export interface AiPricingInput {
  /** AI's base estimate from scope/effort. */
  aiBasePrice: number;
  /** AI parsing / processing cost. */
  sowProcessingCost: number;
  /** Platform margin uplift component. */
  uplift: number;
}

/**
 * SOW-level pricing. Persisted inside `SowVersionDetail.payload.pricing`
 * (not yet a top-level column — keeps the wire format stable).
 *
 * Phase 5 will set `lockedAt` when SOW reaches `approved`; after that,
 * `clientPrice` and inputs must not change.
 */
export interface SowPricing {
  mode: PricingMode;
  currency: Currency;
  /** What the enterprise sees (excl. GST). */
  clientPrice: number;
  /** Mode-specific breakdown. Exactly one is present. */
  manual?: ManualPricingInput;
  ai?: AiPricingInput;
  /**
   * Glimmora's true cost basis — typically Σ(contributorPayout) over tasks
   * decomposed from this SOW. Platform-admin only.
   */
  actualCost: number;
  /** clientPrice − actualCost. Platform-admin only. */
  marginAmount: number;
  /** 0..100, percentage. Platform-admin only. */
  marginPct: number;
  /** ISO timestamp when pricing was frozen at SOW approval. */
  lockedAt: string | null;
}

/**
 * Task-level pricing — drives the contributor's view.
 * Persisted on marketplace tasks and on assigned demo tasks.
 *
 * Phase 5 will set `lockedAt` when the enterprise selects a contributor;
 * after that, `contributorPayout` must not change.
 */
export interface TaskPricing {
  payoutMode: PayoutMode;
  currency: Currency;
  /** Hourly mode. */
  hourlyRate?: number;
  estimatedHours?: number;
  /** Fixed mode. */
  fixedAmount?: number;
  /** Computed: hourly → rate × est. hours; fixed → fixedAmount. */
  contributorPayout: number;
  /** ISO timestamp when contributor was selected and payout frozen. */
  lockedAt: string | null;
}
