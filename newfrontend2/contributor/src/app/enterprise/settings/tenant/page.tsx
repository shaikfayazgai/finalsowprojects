"use client";

import { Suspense } from "react";
import { TenantWorkspace } from "./_components/tenant-workspace";
import { TenantSettingsSkeleton } from "@/components/enterprise/page-skeletons";

export default function TenantSettingsPage() {
  return (
    <Suspense fallback={<TenantSettingsSkeleton />}>
      <TenantWorkspace />
    </Suspense>
  );
}
