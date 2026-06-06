"use client";

import { Suspense } from "react";
import { AuditWorkspace } from "./_components/audit-workspace";
import { AuditSkeleton } from "@/components/enterprise/page-skeletons";

export default function EnterpriseAuditPage() {
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditWorkspace />
    </Suspense>
  );
}
