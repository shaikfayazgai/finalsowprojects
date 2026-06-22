"use client";

import * as React from "react";
import { RubricDetailWorkspace } from "../components/rubric-detail-workspace";
import { RubricDetailSkeleton } from "../components/rubric-detail-skeleton";

export default function AdminRubricEditorPage() {
  return (
    <React.Suspense fallback={<RubricDetailSkeleton />}>
      <RubricDetailWorkspace />
    </React.Suspense>
  );
}
