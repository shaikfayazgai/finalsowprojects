"use client";

import { Suspense } from "react";
import { KycDetailWorkspace } from "../components/kyc-detail-workspace";
import { KycDetailSkeleton } from "../components/kyc-detail-skeleton";

export default function AdminKycCasePage() {
  return (
    <Suspense fallback={<KycDetailSkeleton />}>
      <KycDetailWorkspace />
    </Suspense>
  );
}
