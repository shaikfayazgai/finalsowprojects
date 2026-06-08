import { Skeleton } from "@/components/meridian";

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      <Skeleton className="h-44 rounded-xl" />

      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>

      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
