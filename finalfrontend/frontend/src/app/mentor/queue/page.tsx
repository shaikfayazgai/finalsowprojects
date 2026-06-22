"use client";

import * as React from "react";
import { MentorQueueWorkspace, QueuePageSkeleton } from "./_components/queue-workspace";

export default function MentorQueuePage() {
  return (
    <React.Suspense fallback={<QueuePageSkeleton />}>
      <MentorQueueWorkspace />
    </React.Suspense>
  );
}
