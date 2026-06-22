"use client";

import { Suspense } from "react";
import { AssignedTasksWorkspace } from "../components/assigned-workspace";
import { AssignedTasksSkeleton } from "../components/assigned-tasks-skeleton";

export default function ContributorTasksPage() {
  return (
    <Suspense fallback={<AssignedTasksSkeleton />}>
      <AssignedTasksWorkspace />
    </Suspense>
  );
}
