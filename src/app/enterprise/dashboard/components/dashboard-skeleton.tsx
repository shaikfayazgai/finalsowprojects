"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true" aria-busy="true">
      {/* Zone 1 — Header Strip */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-10 w-20 ml-4" />
        </div>
      </div>

      {/* Zone 2 — Metric Tiles */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Zone 3 — Attention + Pipeline */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      {/* Zone 4 — Financial + Activity */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
