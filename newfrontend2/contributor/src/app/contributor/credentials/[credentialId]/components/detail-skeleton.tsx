import { Skeleton } from "@/components/meridian";

/**
 * Skeleton — 2-column credential detail (matches Completed detail).
 */

export function CredentialDetailSkeleton() {
  return (
    <div className="pb-12 animate-fade-in">
      <Skeleton className="h-4 w-40 rounded mb-6" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <div className="border-b border-stroke-subtle pb-5 space-y-3">
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-7 w-2/3 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>

          <div className="rounded-xl border border-stroke-subtle overflow-hidden">
            <Skeleton className="h-44 w-full rounded-none" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-stroke-subtle">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-none bg-surface" />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-stroke-subtle p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        </div>

        <aside className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stroke-subtle p-5 space-y-3">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
