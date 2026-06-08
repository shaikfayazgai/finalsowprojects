import { Skeleton } from "@/components/meridian";

export function CompetencyEditorSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle flex justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-none border-t border-stroke-subtle" />
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}
