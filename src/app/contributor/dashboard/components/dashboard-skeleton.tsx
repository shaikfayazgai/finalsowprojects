import { Skeleton } from "@/components/ui/skeleton";

export function ContributorDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true" aria-busy="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <Skeleton className="h-3.5 w-28" />
      </div>

      {/* KPI Row — 4 tiles */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Active Tasks (3/5) + Notifications (2/5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <Skeleton className="lg:col-span-3 h-64 rounded-xl" />
        <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
      </div>

      {/* Skills + Earnings + Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>

      {/* Learning Recommendations */}
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}
