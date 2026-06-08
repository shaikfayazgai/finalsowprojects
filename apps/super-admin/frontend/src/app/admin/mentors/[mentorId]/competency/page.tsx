"use client";

import * as React from "react";
import { CompetencyEditorWorkspace } from "../../components/competency-editor-workspace";
import { CompetencyEditorSkeleton } from "../../components/competency-editor-skeleton";

export default function MentorCompetencyEditorPage() {
  return (
    <React.Suspense fallback={<CompetencyEditorSkeleton />}>
      <CompetencyEditorWorkspace />
    </React.Suspense>
  );
}
