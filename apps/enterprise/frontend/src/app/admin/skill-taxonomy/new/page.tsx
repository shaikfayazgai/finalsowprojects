"use client";

import * as React from "react";
import { NewSkillWorkspace } from "../components/new-skill-workspace";
import { NewSkillSkeleton } from "../components/new-skill-skeleton";

export default function NewSkillPage() {
  return (
    <React.Suspense fallback={<NewSkillSkeleton />}>
      <NewSkillWorkspace />
    </React.Suspense>
  );
}
