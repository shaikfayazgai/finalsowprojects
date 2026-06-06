"use client";

import * as React from "react";
import { NewMentorWorkspace } from "../components/new-mentor-workspace";
import { NewMentorSkeleton } from "../components/new-mentor-skeleton";

export default function NewMentorPage() {
  return (
    <React.Suspense fallback={<NewMentorSkeleton />}>
      <NewMentorWorkspace />
    </React.Suspense>
  );
}
