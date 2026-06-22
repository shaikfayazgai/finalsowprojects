import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function AgentDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Bar className="h-4 w-28" />
      <div className="space-y-2.5">
        <Bar className="h-3 w-24" />
        <Bar className="h-7 w-64" />
        <Bar className="h-4 w-96 max-w-full" />
      </div>

      <div className={cn(GLASS_CARD, "p-5 sm:p-6")} style={GLASS_SHADOW}>
        <Bar className="h-3 w-28 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-20" />
              <Bar className="h-7 w-12" />
            </div>
          ))}
        </div>
      </div>

      <Bar className="h-11 w-72 rounded-xl" />

      <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-white/55 space-y-1.5">
          <Bar className="h-4 w-40" />
          <Bar className="h-3 w-56" />
        </div>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Bar className="h-16 w-full" />
          <Bar className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
