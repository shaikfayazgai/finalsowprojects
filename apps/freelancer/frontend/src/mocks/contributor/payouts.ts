/**
 * Mock payouts — spec §5.L.
 *
 * Lifecycle (§7.3): eligible → pending → paid · failed → retry · reversed.
 * Amounts in minor units (paise) to match the existing payouts schema.
 */

export type PayoutStatus = "eligible" | "pending" | "paid" | "failed" | "reversed";

export interface MockPayout {
  id: string;
  taskId: string;
  taskTitle: string;
  amountMinor: number;
  currency: "INR";
  status: PayoutStatus;
  eligibleAt: string;
  paidAt: string | null;
  externalRef: string | null;
  failureReason: string | null;
}

export interface MockPayoutMethod {
  id: string;
  type: "bank" | "upi" | "razorpay";
  label: string; // human-readable e.g. "HDFC Bank ****1234"
  ifsc?: string;
  country: "India";
  currency: "INR";
  verifiedAt: string | null;
  primary: boolean;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const MOCK_PAYOUTS: MockPayout[] = [];

export const MOCK_PAYOUT_METHODS: MockPayoutMethod[] = [];

export function withdrawableMinor(): number {
  return MOCK_PAYOUTS.filter((p) => p.status === "eligible").reduce((a, p) => a + p.amountMinor, 0);
}
