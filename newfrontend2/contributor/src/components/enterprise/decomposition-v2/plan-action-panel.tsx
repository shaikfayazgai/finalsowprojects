"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useActivatePlan,
  useApprovePlan,
  useArchivePlan,
  useCopyPlan,
} from "@/lib/hooks/use-decomposition-v2";
import { DecompositionApiError } from "@/lib/api/decomposition-v2";
import type { PlanDetail } from "@/lib/decomposition/types";

interface Props {
  plan: PlanDetail;
}

/**
 * Lifecycle action panel — surfaces the actions appropriate to the
 * plan's current status. Server-side permission gates make these
 * idempotent: if the user can't act, the API returns 403 and we
 * surface a banner.
 */
export function PlanActionPanel({ plan }: Props) {
  const router = useRouter();
  const approve = useApprovePlan(plan.id);
  const activate = useActivatePlan(plan.id);
  const archive = useArchivePlan(plan.id);
  const copy = useCopyPlan(plan.id);

  const [error, setError] = React.useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setError(null);
    try {
      const result = await fn();
      // `copy` returns a new plan — redirect to it
      if (label === "copy" && result && typeof result === "object" && "id" in result) {
        router.push(`/enterprise/decomposition/v2/${(result as PlanDetail).id}`);
      }
    } catch (e) {
      if (e instanceof DecompositionApiError) {
        setError(`${e.message}${e.reason ? ` — ${e.reason}` : ""}`);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Action failed");
      }
    }
  };

  const pending =
    approve.isPending ||
    activate.isPending ||
    archive.isPending ||
    copy.isPending;

  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-3">
      <h3 className="font-body text-[13.5px] font-semibold text-foreground">
        Plan actions
      </h3>
      <p className="font-body text-[12px] text-text-tertiary">
        Lifecycle: draft → approved → active → archived. Every transition is audited.
      </p>

      <div className="flex flex-col gap-2">
        {plan.status === "draft" && (
          <>
            <a
              href={`/enterprise/decomposition/v2/${plan.id}/edit`}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-body text-xs font-semibold tracking-wide h-8 px-4 border-[1.5px] border-brown-300 text-brown-600 bg-transparent hover:border-brown-500 hover:bg-brown-50 transition-all"
            >
              Edit structure →
            </a>
            <Button
              size="sm"
              onClick={() => run("approve", () => approve.mutateAsync())}
              disabled={pending || plan.tasks.length === 0}
              title={
                plan.tasks.length === 0
                  ? "Empty plan — add tasks before approving"
                  : undefined
              }
              className="w-full"
            >
              {approve.isPending ? "Approving…" : "Approve plan"}
            </Button>
          </>
        )}
        {plan.status === "approved" && (
          <Button
            size="sm"
            onClick={() => run("activate", () => activate.mutateAsync())}
            disabled={pending}
            className="w-full"
          >
            {activate.isPending ? "Activating…" : "Activate plan"}
          </Button>
        )}
        {plan.status !== "archived" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => run("archive", () => archive.mutateAsync())}
            disabled={pending}
            className="w-full"
          >
            {archive.isPending ? "Archiving…" : "Archive"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => run("copy", () => copy.mutateAsync())}
          disabled={pending}
          className="w-full"
        >
          {copy.isPending ? "Cloning…" : "Clone as new draft"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 ring-1 ring-red-100 px-3 py-2 font-body text-[12.5px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
