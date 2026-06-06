import { Skeleton } from "@/components/meridian";

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 pb-12">
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-6 flex flex-wrap items-center gap-5">
          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-[200px]">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
        <Skeleton className="h-3 w-24 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-3 border-b border-stroke-subtle">
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stroke-subtle p-5 space-y-3">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
