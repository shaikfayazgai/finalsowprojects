import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function KycSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="space-y-2">
        <Bar className="h-7 w-36" />
        <Bar className="h-4 w-full max-w-xl" />
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bar key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Bar className="h-9 w-full sm:w-52 rounded-lg" />
            <Bar className="h-9 w-full sm:w-56 rounded-lg sm:ml-auto" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 sm:px-5 py-3.5 border-b border-stroke-subtle flex items-center gap-3">
            <Bar className="h-9 flex-1" />
            <Bar className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
