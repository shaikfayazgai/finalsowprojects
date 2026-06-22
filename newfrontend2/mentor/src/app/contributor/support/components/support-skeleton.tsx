import { Skeleton } from "@/components/meridian";

export function SupportSkeleton() {
  return (
    <div className="space-y-4 pb-12">
      <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
        <Skeleton className="h-4 w-32 rounded mb-1" />
        <Skeleton className="h-3 w-64 rounded mb-5" />
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
          <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-8 w-56 rounded-md" />
            </div>
            <nav aria-hidden className="flex flex-wrap gap-x-1 -mb-px pb-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[38px] w-24 rounded-t-sm" />
              ))}
            </nav>
          </div>
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stroke-subtle p-5 space-y-2">
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
