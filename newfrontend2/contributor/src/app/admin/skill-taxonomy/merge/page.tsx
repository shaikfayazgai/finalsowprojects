"use client";

import * as React from "react";
import { MergeSkillsWorkspace } from "../components/merge-skills-workspace";
import { MergeSkillsSkeleton } from "../components/merge-skills-skeleton";

export default function MergeSkillsPage() {
  return (
    <React.Suspense fallback={<MergeSkillsSkeleton />}>
      <MergeSkillsWorkspace />
    </React.Suspense>
  );
}
