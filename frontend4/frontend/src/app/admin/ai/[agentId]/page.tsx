"use client";

import { Suspense } from "react";
import { AgentDetailWorkspace } from "../components/agent-detail-workspace";
import { AgentDetailSkeleton } from "../components/agent-detail-skeleton";

export default function AdminAgentDetailPage() {
  return (
    <Suspense fallback={<AgentDetailSkeleton />}>
      <AgentDetailWorkspace />
    </Suspense>
  );
}
