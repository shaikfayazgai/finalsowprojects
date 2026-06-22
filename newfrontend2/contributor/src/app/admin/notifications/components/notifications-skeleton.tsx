import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-7 w-40" />
          <Bar className="h-4 w-64" />
        </div>
        <Bar className="h-9 w-32 rounded-lg" />
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bar key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 sm:px-5 py-4 border-b border-stroke-subtle flex items-center gap-3">
            <Bar className="h-8 w-8 rounded-lg shrink-0" />
            <Bar className="h-10 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
