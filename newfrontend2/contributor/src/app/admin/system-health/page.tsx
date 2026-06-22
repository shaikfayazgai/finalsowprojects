"use client";

import { Suspense } from "react";
import { SystemHealthWorkspace } from "./components/system-health-workspace";
import { SystemHealthSkeleton } from "./components/system-health-skeleton";

export default function AdminSystemHealthPage() {
  return (
    <Suspense fallback={<SystemHealthSkeleton />}>
      <SystemHealthWorkspace />
    </Suspense>
  );
}
