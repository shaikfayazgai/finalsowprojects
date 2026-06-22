import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function PaymentRailsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2.5">
        <Bar className="h-3 w-32" />
        <Bar className="h-7 w-44" />
        <Bar className="h-4 w-full max-w-lg" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-24 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 py-4 border-b border-white/55 space-y-2">
          <Bar className="h-4 w-28" />
          <Bar className="h-3 w-40" />
        </div>
        <div className="px-3 sm:px-4 py-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/30 px-4 py-3">
              <Bar className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-48" />
                <Bar className="h-3 w-60" />
              </div>
              <Bar className="h-[22px] w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
