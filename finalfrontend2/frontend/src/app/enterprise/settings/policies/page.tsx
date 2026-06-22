"use client";

import { Suspense } from "react";
import { PoliciesWorkspace } from "./_components/policies-workspace";
import { PoliciesSkeleton } from "@/components/enterprise/page-skeletons";

export default function PoliciesPage() {
  return (
    <Suspense fallback={<PoliciesSkeleton />}>
      <PoliciesWorkspace />
    </Suspense>
  );
}
