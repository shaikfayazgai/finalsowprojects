import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

/** Legacy export route redirects to list modal — skeleton matches list layout. */
export function AuditExportSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="space-y-2">
        <Bar className="h-7 w-32" />
        <Bar className="h-4 w-80" />
      </div>
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 sm:px-5 py-3.5 border-b border-stroke-subtle">
            <Bar className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
