import { Skeleton } from "@/components/meridian";

export function NotificationsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <Skeleton className="h-[88px] w-full" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle flex gap-2">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
        <div className="divide-y divide-stroke-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
