/**
 * Admin · payment rails — spec doc 04 §5.L.
 */

export type RailStatus = "active" | "degraded" | "paused";

export interface MockPaymentRail {
  id: string;
  provider: string;
  country: string;
  currency: string;
  method: string;
  status: RailStatus;
  errorRate1hPct: number;
  keyMask: string;            // "****1234"
  secretRotatedAt: string;
  webhookUrl: string;
  holdPolicy: "hold_when_degraded" | "continue_routing";
  pendingPayoutsCount: number;
  pendingPayoutsTotal: string;
  pendingPayoutsOldest: string;
}

export const MOCK_PAYMENT_RAILS: MockPaymentRail[] = [];

export function findRailById(id: string) { return MOCK_PAYMENT_RAILS.find((r) => r.id === id); }
