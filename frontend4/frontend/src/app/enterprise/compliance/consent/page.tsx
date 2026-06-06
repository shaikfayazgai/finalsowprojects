"use client";

import { Suspense } from "react";
import { ConsentWorkspace } from "./_components/consent-workspace";
import { ConsentSkeleton } from "@/components/enterprise/page-skeletons";

export default function ConsentInventoryPage() {
  return (
    <Suspense fallback={<ConsentSkeleton />}>
      <ConsentWorkspace />
    </Suspense>
  );
}
