import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function PromptsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-28" />
      <div className="space-y-2.5">
        <Bar className="h-3 w-24" />
        <Bar className="h-7 w-48" />
        <Bar className="h-4 w-full max-w-lg" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-24" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55">
          <Bar className="h-4 w-28" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 sm:px-6 py-4 border-b border-white/30 last:border-0 flex items-center gap-3">
            <Bar className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Bar className="h-4 w-40" />
              <Bar className="h-3 w-56 max-w-full" />
            </div>
            <Bar className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
