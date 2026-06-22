"use client";

import { Suspense } from "react";
import { KycWorkspace } from "./components/kyc-workspace";
import { KycSkeleton } from "./components/kyc-skeleton";

export default function AdminKycPage() {
  return (
    <Suspense fallback={<KycSkeleton />}>
      <KycWorkspace />
    </Suspense>
  );
}
