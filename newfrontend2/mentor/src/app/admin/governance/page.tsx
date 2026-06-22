"use client";

import { Suspense } from "react";
import { GovernanceWorkspace } from "./components/governance-workspace";
import { GovernanceSkeleton } from "./components/governance-skeleton";

export default function AdminGovernancePage() {
  return (
    <Suspense fallback={<GovernanceSkeleton />}>
      <GovernanceWorkspace />
    </Suspense>
  );
}
