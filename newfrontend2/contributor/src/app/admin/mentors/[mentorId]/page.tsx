"use client";

import * as React from "react";
import { MentorDetailWorkspace } from "../components/mentor-detail-workspace";
import { MentorDetailSkeleton } from "../components/mentor-detail-skeleton";

export default function AdminMentorDetailPage() {
  return (
    <React.Suspense fallback={<MentorDetailSkeleton />}>
      <MentorDetailWorkspace />
    </React.Suspense>
  );
}
