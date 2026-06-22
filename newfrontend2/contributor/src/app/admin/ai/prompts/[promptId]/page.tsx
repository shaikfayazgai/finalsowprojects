"use client";

import { Suspense } from "react";
import { PromptDetailWorkspace } from "../../components/prompt-detail-workspace";
import { PromptDetailSkeleton } from "../../components/prompt-detail-skeleton";

export default function AdminPromptEditorPage() {
  return (
    <Suspense fallback={<PromptDetailSkeleton />}>
      <PromptDetailWorkspace />
    </Suspense>
  );
}
