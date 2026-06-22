import { Skeleton } from "@/components/meridian";

export function GovernanceSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-56 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-full max-w-xs rounded-md ml-auto" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <Skeleton className="h-4 w-full max-w-lg" />
              <Skeleton className="h-3 w-2/3 max-w-sm mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Shared list/table skeleton for admin Talent pages. */
export function AdminTableSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-md" />
        ))}
      </div>
      <div className="rounded-lg border border-stroke bg-surface overflow-hidden">
        <Skeleton className="h-9 w-full rounded-none" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>
    </div>
  );
}
