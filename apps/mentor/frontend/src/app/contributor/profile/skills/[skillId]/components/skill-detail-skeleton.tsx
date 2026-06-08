import { Skeleton } from "@/components/meridian";

export function SkillDetailSkeleton() {
  return (
    <div className="space-y-4 pb-12">
      <Skeleton className="h-4 w-48 rounded" />

      <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
              <div className="px-5 py-3 border-b border-stroke-subtle">
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-stroke-subtle p-5 space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
