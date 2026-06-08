"use client";

import * as React from "react";
import { PoolsWorkspace } from "./components/pools-workspace";
import { PoolsSkeleton } from "./components/pools-skeleton";

export default function AdminMentorPoolsPage() {
  return (
    <React.Suspense fallback={<PoolsSkeleton />}>
      <PoolsWorkspace />
    </React.Suspense>
  );
}
