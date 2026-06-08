import { Skeleton } from "@/components/ui/skeleton";

export function MentorDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true" aria-busy="true">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI Row — 6 tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 rounded-2xl border border-gray-200/70 bg-white/80 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Priority queue */}
      <Skeleton className="h-[420px] rounded-2xl" />

      {/* 2-col: governance + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>

      {/* Activity */}
      <Skeleton className="h-[280px] rounded-2xl" />
    </div>
  );
}
