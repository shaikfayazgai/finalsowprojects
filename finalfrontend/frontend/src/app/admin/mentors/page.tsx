"use client";

import * as React from "react";
import { MentorsWorkspace } from "./components/mentors-workspace";
import { MentorsSkeleton } from "./components/mentors-skeleton";

export default function AdminMentorsPage() {
  return (
    <React.Suspense fallback={<MentorsSkeleton />}>
      <MentorsWorkspace />
    </React.Suspense>
  );
}
