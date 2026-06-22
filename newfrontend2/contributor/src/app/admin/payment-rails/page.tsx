"use client";

import { Suspense } from "react";
import { PaymentRailsWorkspace } from "./components/payment-rails-workspace";
import { PaymentRailsSkeleton } from "./components/payment-rails-skeleton";

export default function AdminPaymentRailsPage() {
  return (
    <Suspense fallback={<PaymentRailsSkeleton />}>
      <PaymentRailsWorkspace />
    </Suspense>
  );
}
