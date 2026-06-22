"use client";

import { Suspense } from "react";
import { AuditWorkspace } from "./components/audit-workspace";
import { AuditSkeleton } from "./components/audit-skeleton";

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditWorkspace />
    </Suspense>
  );
}
