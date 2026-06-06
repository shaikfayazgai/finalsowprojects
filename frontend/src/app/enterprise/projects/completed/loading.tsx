import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="max-w-[1200px] mx-auto p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-beige-200/50 bg-white/70 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
