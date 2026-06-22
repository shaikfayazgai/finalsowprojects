import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

const HEAD = "border-b border-stroke-subtle";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-foreground/[0.07] animate-pulse", className)} />;
}

function Panel({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn(DASH_CARD, "overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function TenantProvisioningSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Bar className="h-4 w-40" />
      <div className="space-y-2.5">
        <Bar className="h-8 w-48" />
        <Bar className="h-4 w-96 max-w-full" />
      </div>

      <Panel>
        <div className={cn("flex justify-between gap-3 px-5 py-4", HEAD)}>
          <Bar className="h-4 w-32" />
          <Bar className="h-4 w-24" />
        </div>
        <div className="px-5 py-4">
          <Bar className="h-2 w-full rounded-full" />
        </div>
      </Panel>

      <Panel>
        <div className={cn("px-5 py-4", HEAD)}>
          <Bar className="h-4 w-40" />
        </div>
        <div className="px-5 py-4 space-y-4">
          <Bar className="h-16 w-full rounded-lg" />
          <Bar className="h-9 w-48 rounded-lg" />
        </div>
      </Panel>

      <Panel className="h-64" />
    </div>
  );
}
