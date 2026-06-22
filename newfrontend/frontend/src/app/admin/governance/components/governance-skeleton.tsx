import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function GovernanceSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-40" />
          <Bar className="h-7 w-32" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex gap-2">
          <Bar className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <Bar className="h-16 w-full rounded-xl" />

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 py-4 border-b border-white/55 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Bar className="h-9 w-44 rounded-lg" />
            <Bar className="h-9 w-44 rounded-lg" />
            <Bar className="h-9 w-60 rounded-lg ml-auto" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bar key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-6 py-3.5 border-b border-white/30 flex items-center gap-3">
            <Bar className="h-8 w-8 rounded-lg" />
            <Bar className="h-9 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
