import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function CommercialGateSkeleton() {
  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <div className="space-y-2">
        <Bar className="h-8 w-52" />
        <Bar className="h-4 w-full max-w-xl" />
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle flex flex-wrap gap-3 sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Bar className="h-4 w-24" />
            <Bar className="h-3 w-56" />
          </div>
          <Bar className="h-9 w-56 rounded-lg" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-stroke-subtle flex gap-4">
            <Bar className="h-4 w-40" />
            <Bar className="h-4 w-24" />
            <Bar className="h-4 w-24" />
            <Bar className="h-4 w-16" />
            <Bar className="h-6 w-20 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
