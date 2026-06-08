"use client";

import { Suspense } from "react";
import { PayoutsLedgerWorkspace } from "../_components/payouts-ledger-workspace";
import { PayoutsSkeleton } from "@/components/enterprise/page-skeletons";

export default function PayoutsLedgerPage() {
  return (
    <Suspense fallback={<PayoutsSkeleton />}>
      <PayoutsLedgerWorkspace />
    </Suspense>
  );
}
