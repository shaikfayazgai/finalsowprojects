"use client";

import { Suspense } from "react";
import { UniversityDetailWorkspace } from "../components/university-detail-workspace";
import { UniversityDetailSkeleton } from "../components/university-detail-skeleton";

export default function AdminUniversityDetailPage() {
  return (
    <Suspense fallback={<UniversityDetailSkeleton />}>
      <UniversityDetailWorkspace />
    </Suspense>
  );
}
