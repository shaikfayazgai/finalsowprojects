import { Skeleton } from "@/components/meridian";

export function MergeSkillsSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-56" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-stroke-subtle space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="px-5 py-4 border-t border-stroke-subtle flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
