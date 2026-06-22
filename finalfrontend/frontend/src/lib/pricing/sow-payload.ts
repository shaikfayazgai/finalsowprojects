/**
 * Read/write `SowPricing` on a SOW version payload.
 *
 * Pricing lives at `payload.pricing` (sibling to `extraction`, `submission`,
 * `riskBreakdown` in `intake-payload.ts`). This keeps the wire format stable
 * — backend can lift it to a typed column later without a migration today.
 */

import type {
  AiPricingInput,
  ManualPricingInput,
  PricingMode,
  SowPricing,
} from "./types";

const KEY = "pricing";

/** Type guard with permissive parsing — older payloads may not have it. */
export function readSowPricing(
  payload: Record<string, unknown> | null | undefined,
): SowPricing | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as Record<string, unknown>)[KEY];
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<SowPricing>;
  if (p.mode !== "manual" && p.mode !== "ai") return null;
  if (typeof p.clientPrice !== "number") return null;
  return {
    mode: p.mode as PricingMode,
    currency: p.currency === "INR" ? "INR" : "INR",
    clientPrice: p.clientPrice,
    manual:
      p.mode === "manual" && p.manual && typeof p.manual === "object"
        ? (p.manual as ManualPricingInput)
        : undefined,
    ai:
      p.mode === "ai" && p.ai && typeof p.ai === "object"
        ? (p.ai as AiPricingInput)
        : undefined,
    actualCost: typeof p.actualCost === "number" ? p.actualCost : 0,
    marginAmount: typeof p.marginAmount === "number" ? p.marginAmount : 0,
    marginPct: typeof p.marginPct === "number" ? p.marginPct : 0,
    lockedAt: typeof p.lockedAt === "string" ? p.lockedAt : null,
  };
}

/** Returns a new payload object with pricing set. Does not mutate input. */
export function writeSowPricing(
  payload: Record<string, unknown> | null | undefined,
  pricing: SowPricing,
): Record<string, unknown> {
  return { ...(payload ?? {}), [KEY]: pricing };
}
