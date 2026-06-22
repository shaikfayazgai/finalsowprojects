"use client";

import { Suspense } from "react";
import { IntegrationsWorkspace } from "./_components/integrations-workspace";
import { IntegrationsSkeleton } from "@/components/enterprise/page-skeletons";

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<IntegrationsSkeleton />}>
      <IntegrationsWorkspace />
    </Suspense>
  );
}
