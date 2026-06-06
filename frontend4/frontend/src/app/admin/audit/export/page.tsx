"use client";

import { Suspense } from "react";
import { AuditExportWorkspace } from "../components/audit-export-workspace";
import { AuditExportSkeleton } from "../components/audit-export-skeleton";

export default function AdminAuditExportPage() {
  return (
    <Suspense fallback={<AuditExportSkeleton />}>
      <AuditExportWorkspace />
    </Suspense>
  );
}
