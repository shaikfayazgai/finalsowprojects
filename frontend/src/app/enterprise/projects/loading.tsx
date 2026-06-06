import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Summary stats — 6 cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-4 flex items-center gap-3">
            <Skeleton className="w-3 h-3 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Project cards — 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-2 w-8" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-10 rounded-md" />
            </div>
            <div className="pt-3 border-t border-beige-100/80 flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
