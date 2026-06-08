"use client";

import * as React from "react";
import { NewPoolWorkspace } from "../components/new-pool-workspace";
import { NewPoolSkeleton } from "../components/new-pool-skeleton";

export default function NewMentorPoolPage() {
  return (
    <React.Suspense fallback={<NewPoolSkeleton />}>
      <NewPoolWorkspace />
    </React.Suspense>
  );
}
