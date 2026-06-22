import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-foreground/[0.06] animate-pulse", className)} />;
}

export function NewTenantSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-24" />
      <div className="space-y-2">
        <Bar className="h-7 w-40" />
        <Bar className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[264px_1fr] items-start">
        <div className={cn(DASH_CARD, "p-4 space-y-3")}>
          <Bar className="h-1 w-full rounded-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-1">
              <Bar className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bar className="h-3 w-24" />
                <Bar className="h-2.5 w-32" />
              </div>
            </div>
          ))}
        </div>

        <div className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle space-y-2">
            <Bar className="h-5 w-48" />
            <Bar className="h-4 w-full max-w-md" />
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            <Bar className="h-10 w-full" />
            <Bar className="h-10 w-full max-w-sm" />
            <Bar className="h-10 w-full max-w-sm" />
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-stroke-subtle flex justify-between">
            <Bar className="h-10 w-20 rounded-lg" />
            <Bar className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
