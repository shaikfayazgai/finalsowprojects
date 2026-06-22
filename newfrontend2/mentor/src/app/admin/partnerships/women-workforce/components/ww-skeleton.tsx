import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function WWSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2.5">
          <Bar className="h-3 w-40" />
          <Bar className="h-7 w-48" />
          <Bar className="h-4 w-full max-w-lg" />
        </div>
        <Bar className="h-10 w-32 rounded-xl" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-40 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-7 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 space-y-2">
          <Bar className="h-4 w-40" />
          <Bar className="h-3 w-56" />
        </div>
        <div className="px-3 sm:px-4 py-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-white/55 bg-white/40 px-4 py-3.5">
              <Bar className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-48" />
                <Bar className="h-3 w-72" />
              </div>
              <Bar className="hidden md:block h-2 w-40 rounded-full" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
