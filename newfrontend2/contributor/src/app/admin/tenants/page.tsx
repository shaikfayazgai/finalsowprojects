"use client";

import * as React from "react";
import { TenantsWorkspace } from "./components/tenants-workspace";
import { TenantsSkeleton } from "./components/tenants-skeleton";

export default function AdminTenantsPage() {
  return (
    <React.Suspense fallback={<TenantsSkeleton />}>
      <TenantsWorkspace />
    </React.Suspense>
  );
}
