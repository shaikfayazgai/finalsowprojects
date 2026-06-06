"use client";

import { Suspense } from "react";
import { AuditDetailWorkspace } from "../components/audit-detail-workspace";
import { AuditDetailSkeleton } from "../components/audit-detail-skeleton";

export default function AdminAuditEventPage() {
  return (
    <Suspense fallback={<AuditDetailSkeleton />}>
      <AuditDetailWorkspace />
    </Suspense>
  );
}
