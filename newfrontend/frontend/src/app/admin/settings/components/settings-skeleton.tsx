import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="space-y-2">
        <Bar className="h-7 w-28" />
        <Bar className="h-4 w-full max-w-lg" />
      </div>

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle space-y-2">
            <Bar className="h-4 w-44" />
            <Bar className="h-3 w-64" />
          </div>
          <div className="px-4 sm:px-5 py-5 space-y-4">
            {Array.from({ length: i === 0 ? 4 : 2 }).map((_, j) => (
              <Bar key={j} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Bar className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}
