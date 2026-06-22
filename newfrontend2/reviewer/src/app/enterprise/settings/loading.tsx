import { Skeleton } from "@/components/meridian";

export default function SettingsLoading() {
  return (
    <div className="space-y-5 pb-12">
      <Skeleton className="h-6 w-48 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
