"use client";

import * as React from "react";
import { CommercialReviewWorkspace } from "../components/commercial-review-workspace";
import { CommercialReviewSkeleton } from "../components/commercial-review-skeleton";

export default function AdminSowReviewPage() {
  return (
    <React.Suspense fallback={<CommercialReviewSkeleton />}>
      <CommercialReviewWorkspace />
    </React.Suspense>
  );
}
