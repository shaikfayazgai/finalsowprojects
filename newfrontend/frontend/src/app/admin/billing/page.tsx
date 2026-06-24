"use client";

/**
 * Super-admin (Glimmora) Billing — the full money view.
 *
 * Money IN (enterprise → Glimmora) and money OUT (Glimmora → contributor),
 * margin, GST, pending vs paid. This is the Glimmora vantage point: it sees
 * everything (the enterprise portal is the one that hides contributor pay).
 */

import * as React from "react";
import { BillingWorkspace } from "./components/billing-workspace";
import { BillingSkeleton } from "./components/billing-skeleton";

export default function AdminBillingPage() {
  return (
    <React.Suspense fallback={<BillingSkeleton />}>
      <BillingWorkspace />
    </React.Suspense>
  );
}
