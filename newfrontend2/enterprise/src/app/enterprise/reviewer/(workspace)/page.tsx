"use client";

import { ReviewerQueueWorkspace } from "../_components/reviewer-queue-workspace";

export default function QaReviewOverviewPage() {
  return (
    <ReviewerQueueWorkspace
      basePath="/enterprise/reviewer"
      showGroupedPreview
      listTitle="Pending reviews"
    />
  );
}
