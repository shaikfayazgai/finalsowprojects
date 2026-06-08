import { Skeleton } from "@/components/meridian";

export function EmailTemplatesSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="flex gap-4 px-5 pt-3 border-b border-stroke-subtle pb-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="p-5 space-y-5">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
