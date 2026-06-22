"use client";

import { Suspense } from "react";
import { CaseDetailWorkspace } from "../components/case-detail-workspace";
import { CaseDetailSkeleton } from "../components/case-detail-skeleton";

export default function AdminGovernanceCasePage() {
  return (
    <Suspense fallback={<CaseDetailSkeleton />}>
      <CaseDetailWorkspace />
    </Suspense>
  );
}
