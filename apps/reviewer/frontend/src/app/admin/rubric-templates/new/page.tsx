"use client";

import * as React from "react";
import { NewRubricWorkspace } from "../components/new-rubric-workspace";
import { NewRubricSkeleton } from "../components/new-rubric-skeleton";

export default function AdminNewRubricTemplatePage() {
  return (
    <React.Suspense fallback={<NewRubricSkeleton />}>
      <NewRubricWorkspace />
    </React.Suspense>
  );
}
