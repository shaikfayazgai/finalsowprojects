import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="space-y-2">
        <Bar className="h-7 w-28" />
        <Bar className="h-4 w-full max-w-md" />
      </div>

      <div className={cn(DASH_CARD, "px-4 sm:px-5 py-5 flex items-center gap-4")}>
        <Bar className="h-14 w-14 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Bar className="h-4 w-44" />
          <Bar className="h-3 w-32" />
          <Bar className="h-3 w-52" />
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle space-y-2">
            <Bar className="h-4 w-32" />
            <Bar className="h-3 w-48" />
          </div>
          <div className="px-4 sm:px-5 py-5 space-y-3">
            <Bar className="h-10 w-full" />
            {i === 2 ? <Bar className="h-10 w-full" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
