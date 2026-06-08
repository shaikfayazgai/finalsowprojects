"use client";

import * as React from "react";
import { PoolDetailWorkspace } from "../components/pool-detail-workspace";
import { PoolDetailSkeleton } from "../components/pool-detail-skeleton";

export default function AdminPoolDetailPage() {
  return (
    <React.Suspense fallback={<PoolDetailSkeleton />}>
      <PoolDetailWorkspace />
    </React.Suspense>
  );
}
