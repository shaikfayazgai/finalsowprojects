"use client";

import { Suspense } from "react";
import { WWDetailWorkspace } from "../components/ww-detail-workspace";
import { WWDetailSkeleton } from "../components/ww-detail-skeleton";

export default function AdminWWPartnerDetailPage() {
  return (
    <Suspense fallback={<WWDetailSkeleton />}>
      <WWDetailWorkspace />
    </Suspense>
  );
}
