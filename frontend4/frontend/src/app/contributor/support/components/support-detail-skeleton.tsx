import { Skeleton } from "@/components/meridian";

export function SupportDetailSkeleton() {
  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="border-b border-stroke-subtle pb-5 space-y-3">
            <Skeleton className="h-3 w-48 rounded" />
            <Skeleton className="h-7 w-3/4 max-w-md rounded" />
            <Skeleton className="h-4 w-56 rounded" />
          </div>
          <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <Skeleton className="h-4 w-36 rounded" />
            </div>
            <div className="p-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
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
