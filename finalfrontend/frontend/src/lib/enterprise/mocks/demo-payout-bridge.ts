/**
 * Cross-portal demo payouts — enterprise milestone pay → contributor earnings.
 * Merges into contributor payout client; keyed by contributor email.
 */

import type { PayoutDetail, PayoutMethodDetail } from "@/lib/payouts/types";
import { getPayoutMock, listTenantPayoutsMock, payoutOverlay } from "./payouts";

/** Matching pool ids → login emails for the assignment demo. */
export const DEMO_CONTRIBUTOR_EMAIL_TO_ID: Record<string, string> = {
  "priya@glimmora.dev": "c-priya",
  "meera@glimmora.dev": "c-meera",
  "amit@glimmora.dev": "c-amit",
};

type ComputationWithEmail = PayoutDetail["computation"] & { contributorEmail?: string };

export function demoContributorIdForEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;
  return DEMO_CONTRIBUTOR_EMAIL_TO_ID[email.toLowerCase()];
}

export function listDemoPayoutsForEmail(email: string | null | undefined): PayoutDetail[] {
  if (!email || typeof window === "undefined") return [];
  const needle = email.toLowerCase();
  const id = DEMO_CONTRIBUTOR_EMAIL_TO_ID[needle];
  const { items } = listTenantPayoutsMock();
  return items.filter((p) => {
    const comp = p.computation as ComputationWithEmail;
    if (comp.contributorEmail?.toLowerCase() === needle) return true;
    if (id && p.contributorId === id) return true;
    return false;
  });
}

export function requestDemoPayoutWithdrawal(payoutId: string): PayoutDetail | undefined {
  const current = getPayoutMock(payoutId);
  if (!current || current.status !== "eligible") return undefined;
  const now = new Date().toISOString();
  payoutOverlay.patch(payoutId, {
    status: "sent",
    requestedAt: now,
    processingAt: now,
    sentAt: now,
    externalRef: `RZP-DEMO-${Date.now().toString().slice(-8)}`,
    updatedAt: now,
  });
  return getPayoutMock(payoutId);
}

export function getDemoPayoutMethods(_email: string | null | undefined): PayoutMethodDetail[] {
  return [
    {
      id: "pm-demo-bank",
      userId: "demo-contributor",
      kind: "bank_in",
      nickname: "HDFC Bank ****4821",
      isDefault: true,
      payload: { accountNumber: "****4821", ifsc: "HDFC0001234" },
      verifiedAt: new Date().toISOString(),
      verificationError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function earningsSummaryFromPayouts(items: PayoutDetail[]) {
  const withdrawableMinor = items
    .filter((p) => p.status === "eligible" || p.status === "failed")
    .reduce((s, p) => s + p.amountMinor, 0);
  const pendingMinor = items
    .filter((p) => p.status === "requested" || p.status === "processing" || p.status === "on_hold")
    .reduce((s, p) => s + p.amountMinor, 0);
  const paidMinor = items
    .filter((p) => p.status === "sent")
    .reduce((s, p) => s + p.amountMinor, 0);
  return { withdrawableMinor, pendingMinor, paidMinor, items };
}
