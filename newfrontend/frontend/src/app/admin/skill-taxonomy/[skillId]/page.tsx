"use client";

import * as React from "react";
import { SkillDetailWorkspace } from "../components/skill-detail-workspace";
import { SkillDetailSkeleton } from "../components/skill-detail-skeleton";

export default function AdminSkillDetailPage() {
  return (
    <React.Suspense fallback={<SkillDetailSkeleton />}>
      <SkillDetailWorkspace />
    </React.Suspense>
  );
}
