"use client";

import { ReviewerQueueWorkspace } from "../_components/reviewer-queue-workspace";

export default function ReviewerQueuePage() {
  return (
    <ReviewerQueueWorkspace
      basePath="/enterprise/reviewer/queue"
      showGroupedPreview={false}
      listTitle="Review queue"
    />
  );
}
