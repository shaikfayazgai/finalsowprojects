import { Skeleton } from "@/components/meridian";

export function RailDetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
