"use client";

import * as React from "react";
import { NewTenantWorkspace } from "../components/new-tenant-workspace";
import { NewTenantSkeleton } from "../components/new-tenant-skeleton";

export default function NewTenantWizardPage() {
  return (
    <React.Suspense fallback={<NewTenantSkeleton />}>
      <NewTenantWorkspace />
    </React.Suspense>
  );
}
