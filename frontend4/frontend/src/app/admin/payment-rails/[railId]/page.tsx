"use client";

import { Suspense } from "react";
import { RailDetailWorkspace } from "../components/rail-detail-workspace";
import { RailDetailSkeleton } from "../components/rail-detail-skeleton";

export default function AdminPaymentRailDetailPage() {
  return (
    <Suspense fallback={<RailDetailSkeleton />}>
      <RailDetailWorkspace />
    </Suspense>
  );
}
