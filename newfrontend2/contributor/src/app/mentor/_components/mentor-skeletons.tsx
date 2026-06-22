"use client";

import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { MentorPage } from "./mentor-ui";

export function MentorDashboardSkeleton() {
  return (
    <MentorPage>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-72" />
      </div>
      <DashboardSection title="Next review" bare>
        <Skeleton className="h-[148px] rounded-xl border border-stroke-subtle" />
      </DashboardSection>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </MentorPage>
  );
}

export function MentorListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-stroke-subtle">
        <Skeleton className="h-4 w-40" />
      </div>
      <ul>
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="px-5 py-3 border-b border-stroke-subtle last:border-b-0 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-3 w-12" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MentorDetailSkeleton() {
  return (
    <MentorPage>
      <Skeleton className="h-3 w-48" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[120px] rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </MentorPage>
  );
}
