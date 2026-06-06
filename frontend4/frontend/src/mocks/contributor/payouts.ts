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

export const MOCK_PAYOUTS: MockPayout[] = [
  // pending → still being processed
  {
    id: "payout-001",
    taskId: "task-008",
    taskTitle: "Decomposition unit tests",
    amountMinor: 800000,
    currency: "INR",
    status: "pending",
    eligibleAt: hoursAgo(14 * 24),
    paidAt: null,
    externalRef: null,
    failureReason: null,
  },
  // paid (recent)
  {
    id: "payout-002",
    taskId: "task-009",
    taskTitle: "Tenancy bootstrap docs",
    amountMinor: 360000,
    currency: "INR",
    status: "paid",
    eligibleAt: hoursAgo(22 * 24),
    paidAt: hoursAgo(20 * 24),
    externalRef: "TRX-9421",
    failureReason: null,
  },
  // paid (older)
  {
    id: "payout-003",
    taskId: "task-008-prev",
    taskTitle: "Audit log timestamp fix",
    amountMinor: 280000,
    currency: "INR",
    status: "paid",
    eligibleAt: hoursAgo(40 * 24),
    paidAt: hoursAgo(38 * 24),
    externalRef: "TRX-9012",
    failureReason: null,
  },
  // failed (rail rejected)
  {
    id: "payout-004",
    taskId: "task-008-misc",
    taskTitle: "Date Picker — round 1",
    amountMinor: 120000,
    currency: "INR",
    status: "failed",
    eligibleAt: hoursAgo(50 * 24),
    paidAt: null,
    externalRef: null,
    failureReason: "IFSC invalid",
  },
  // reversed (admin)
  {
    id: "payout-005",
    taskId: "task-010",
    taskTitle: "Quick-add task button",
    amountMinor: 45000,
    currency: "INR",
    status: "reversed",
    eligibleAt: hoursAgo(60 * 24),
    paidAt: hoursAgo(58 * 24),
    externalRef: "TRX-8801",
    failureReason: "Reversal — rework on round 3",
  },
  // eligible — not yet released
  {
    id: "payout-006",
    taskId: "task-007",
    taskTitle: "Notification settings panel",
    amountMinor: 75000,
    currency: "INR",
    status: "eligible",
    eligibleAt: hoursAgo(3),
    paidAt: null,
    externalRef: null,
    failureReason: null,
  },
];

export const MOCK_PAYOUT_METHODS: MockPayoutMethod[] = [
  {
    id: "method-001",
    type: "bank",
    label: "HDFC Bank ****1234",
    ifsc: "HDFC0001234",
    country: "India",
    currency: "INR",
    verifiedAt: new Date("2026-04-08").toISOString(),
    primary: true,
  },
];

export function withdrawableMinor(): number {
  return MOCK_PAYOUTS.filter((p) => p.status === "eligible").reduce((a, p) => a + p.amountMinor, 0);
}
