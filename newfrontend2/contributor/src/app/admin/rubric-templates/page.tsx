"use client";

import * as React from "react";
import { RubricTemplatesWorkspace } from "./components/rubric-templates-workspace";
import { RubricTemplatesSkeleton } from "./components/rubric-templates-skeleton";

export default function AdminRubricTemplatesPage() {
  return (
    <React.Suspense fallback={<RubricTemplatesSkeleton />}>
      <RubricTemplatesWorkspace />
    </React.Suspense>
  );
}
