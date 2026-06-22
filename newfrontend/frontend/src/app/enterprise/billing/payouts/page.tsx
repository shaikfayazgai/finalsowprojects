"use client";

/**
 * Enterprise · Payouts = SOW payments only. The enterprise pays Glimmora per SOW
 * (full or partial/manual) and never sees contributor pay, Glimmora margin, or a
 * contributor-payout ledger — those are private to Glimmora.
 */

import { BudgetReleasePanel } from "../_components/budget-release-panel";

export default function PayoutsLedgerPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[20px] font-semibold text-foreground">SOW payments</h1>
        <p className="font-body text-[13px] text-text-tertiary mt-0.5">
          Release your budget to Glimmora per SOW — pay the completed work in full or a partial amount. Click a SOW for full payment details.
        </p>
      </div>
      <BudgetReleasePanel />
    </div>
  );
}
