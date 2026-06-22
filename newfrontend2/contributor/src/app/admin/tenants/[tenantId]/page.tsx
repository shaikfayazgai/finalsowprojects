"use client";

import * as React from "react";
import { TenantDetailWorkspace } from "../components/tenant-detail-workspace";
import { TenantDetailSkeleton } from "../components/tenant-detail-skeleton";

export default function TenantDetailPage() {
  return (
    <React.Suspense fallback={<TenantDetailSkeleton />}>
      <TenantDetailWorkspace />
    </React.Suspense>
  );
}
