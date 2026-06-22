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

export const MOCK_PAYMENT_RAILS: MockPaymentRail[] = [
  { id: "rail-rzp-neft",  provider: "Razorpay", country: "India",  currency: "INR", method: "NEFT",    status: "active",   errorRate1hPct: 0.0, keyMask: "****8211", secretRotatedAt: "2026-03-26T00:00:00Z", webhookUrl: "https://api.glimmora.app/rails/razorpay-neft", holdPolicy: "hold_when_degraded", pendingPayoutsCount: 4,  pendingPayoutsTotal: "₹18,200",   pendingPayoutsOldest: "12 min ago" },
  { id: "rail-rzp-upi",   provider: "Razorpay", country: "India",  currency: "INR", method: "UPI",     status: "degraded", errorRate1hPct: 4.2, keyMask: "****1234", secretRotatedAt: "2026-03-26T00:00:00Z", webhookUrl: "https://api.glimmora.app/rails/razorpay-upi",  holdPolicy: "hold_when_degraded", pendingPayoutsCount: 42, pendingPayoutsTotal: "₹68,400",   pendingPayoutsOldest: "1h ago" },
  { id: "rail-rzp-wallet",provider: "Razorpay", country: "India",  currency: "INR", method: "Wallet",  status: "active",   errorRate1hPct: 0.1, keyMask: "****5599", secretRotatedAt: "2026-03-26T00:00:00Z", webhookUrl: "https://api.glimmora.app/rails/razorpay-wallet", holdPolicy: "hold_when_degraded", pendingPayoutsCount: 1, pendingPayoutsTotal: "₹2,400",    pendingPayoutsOldest: "8 min ago" },
  { id: "rail-wise",      provider: "Wise",     country: "Global", currency: "Multi", method: "SWIFT/SEPA", status: "active", errorRate1hPct: 0.0, keyMask: "****2740", secretRotatedAt: "2026-02-04T00:00:00Z", webhookUrl: "https://api.glimmora.app/rails/wise",        holdPolicy: "hold_when_degraded", pendingPayoutsCount: 6, pendingPayoutsTotal: "$11,800",   pendingPayoutsOldest: "21 min ago" },
];

export function findRailById(id: string) { return MOCK_PAYMENT_RAILS.find((r) => r.id === id); }
