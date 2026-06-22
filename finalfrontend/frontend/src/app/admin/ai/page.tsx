"use client";

import { Suspense } from "react";
import { AiAgentsWorkspace } from "./components/ai-agents-workspace";
import { AiAgentsSkeleton } from "./components/ai-agents-skeleton";

export default function AdminAIAgentsPage() {
  return (
    <Suspense fallback={<AiAgentsSkeleton />}>
      <AiAgentsWorkspace />
    </Suspense>
  );
}
