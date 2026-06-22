"use client";

import * as React from "react";
import { TenantProvisioningWorkspace } from "../../components/tenant-provisioning-workspace";
import { TenantProvisioningSkeleton } from "../../components/tenant-provisioning-skeleton";

export default function TenantProvisioningPage() {
  return (
    <React.Suspense fallback={<TenantProvisioningSkeleton />}>
      <TenantProvisioningWorkspace />
    </React.Suspense>
  );
}
