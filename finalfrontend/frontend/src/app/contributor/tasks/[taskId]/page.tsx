"use client";

import { useParams } from "next/navigation";
import { useTaskDetail } from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError } from "@/lib/api/contributor-tasks";
import { Skeleton } from "@/components/meridian";
import { WorkroomView } from "./components/workroom-view";

export default function ContributorWorkroomPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params?.taskId ?? "";
  const { data, isLoading, error } = useTaskDetail(taskId || undefined);
  const task = data?.task;

  if (isLoading && !task) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
        <Skeleton className="h-8 w-full max-w-lg rounded" />
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 font-body text-[13px] text-error-text">
        {error instanceof ContributorApiError ? error.message : "Failed to load task"}
      </div>
    );
  }

  if (!task) return null;

  return <WorkroomView task={task} taskId={taskId} />;
}