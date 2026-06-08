"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NewTicketView } from "./components/new-ticket-view";

function NewTicketPageInner() {
  const params = useSearchParams();
  const taskId = params.get("taskId") ?? "";
  return <NewTicketView taskId={taskId} />;
}

export default function NewTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="pb-12 space-y-4">
          <div className="h-48 rounded-xl border border-stroke-subtle bg-surface animate-pulse" />
        </div>
      }
    >
      <NewTicketPageInner />
    </Suspense>
  );
}
