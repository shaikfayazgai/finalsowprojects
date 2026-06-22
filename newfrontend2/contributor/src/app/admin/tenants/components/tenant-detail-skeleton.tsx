import { cn } from "@/lib/utils/cn";
import { GLASS_PANEL, GLASS_PANEL_SHADOW, GLASS_HEAD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-foreground/[0.06] animate-pulse", className)} />;
}

function Panel({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn(GLASS_PANEL, "overflow-hidden", className)} style={GLASS_PANEL_SHADOW}>
      {children}
    </div>
  );
}

export function TenantDetailSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-24" />
      <div className="flex items-start gap-3.5">
        <Bar className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Bar className="h-8 w-56" />
          <Bar className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <Bar className="h-8 w-80 rounded-lg" />

      <Panel>
        <div className={cn("px-5 py-4", GLASS_HEAD)}>
          <Bar className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-5 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bar className="h-3 w-16" />
              <Bar className="h-6 w-12" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className={cn("px-5 py-4", GLASS_HEAD)}>
          <Bar className="h-4 w-20" />
        </div>
        <div className="px-5 py-4">
          <Bar className="h-9 w-72 rounded-lg" />
        </div>
      </Panel>

      <Panel className="h-36" />
    </div>
  );
}
