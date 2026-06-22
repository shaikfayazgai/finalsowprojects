import { Skeleton } from "@/components/meridian";

export function DigitalTwinSkeleton() {
  return (
    <div className="space-y-4 pb-12">
      <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
        <Skeleton className="h-3 w-32 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
            <Skeleton className="h-4 w-40 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stroke-subtle p-5 space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
