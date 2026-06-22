import { cn } from "@/lib/utils/cn";
import { LoginShell } from "./login-layout";

function Bar({ className }: { className?: string }) {
  return <div className={cn("rounded-lg bg-foreground/[0.07] animate-pulse", className)} />;
}

export function LoginLoading() {
  return (
    <LoginShell>
      <div className="space-y-4 animate-pulse">
        <div className="text-center space-y-2 mb-6">
          <Bar className="h-7 w-40 mx-auto" />
          <Bar className="h-4 w-48 mx-auto" />
        </div>
        <Bar className="h-11 w-full" />
        <Bar className="h-11 w-full" />
        <Bar className="h-11 w-full" />
        <Bar className="h-4 w-8 mx-auto my-4" />
        <div className="flex gap-2.5">
          <Bar className="h-11 flex-1" />
          <Bar className="h-11 flex-1" />
        </div>
      </div>
    </LoginShell>
  );
}
