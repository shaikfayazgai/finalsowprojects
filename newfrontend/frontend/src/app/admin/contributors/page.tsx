"use client";

import * as React from "react";
import { ContributorsWorkspace } from "./components/contributors-workspace";
import { ContributorsSkeleton } from "./components/contributors-skeleton";

export default function AdminContributorsPage() {
  return (
    <React.Suspense fallback={<ContributorsSkeleton />}>
      <ContributorsWorkspace />
    </React.Suspense>
  );
}
