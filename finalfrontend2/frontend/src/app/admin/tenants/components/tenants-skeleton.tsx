import { cn } from "@/lib/utils/cn";
import { GLASS_PANEL, GLASS_PANEL_SHADOW, GLASS_HEAD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-foreground/[0.06] animate-pulse", className)} />;
}

export function TenantsSkeleton() {
  return (
    <div className="space-y-5 pb-4">
      <header className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="space-y-2">
          <Bar className="h-8 w-32" />
          <Bar className="h-4 w-80" />
        </div>
        <Bar className="h-10 w-32 rounded-xl" />
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(GLASS_PANEL, "h-[112px] p-4")} style={GLASS_PANEL_SHADOW}>
            <div className="flex items-center justify-between">
              <Bar className="h-3 w-16" />
              <Bar className="h-7 w-7 rounded-lg" />
            </div>
            <Bar className="h-7 w-14 mt-3" />
            <Bar className="h-3 w-20 mt-2" />
          </div>
        ))}
      </div>

      <div className={cn(GLASS_PANEL, "overflow-hidden")} style={GLASS_PANEL_SHADOW}>
        <div className={cn("flex flex-col sm:flex-row sm:justify-between gap-3 px-5 py-3.5", GLASS_HEAD)}>
          <Bar className="h-8 w-72 rounded-lg" />
          <Bar className="h-9 w-56 rounded-lg" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-white/45 last:border-0">
            <Bar className="h-5 w-full max-w-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
