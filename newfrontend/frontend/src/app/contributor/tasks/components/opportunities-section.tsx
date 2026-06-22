"use client";

/**
 * Open opportunities — real, priced decomposition tasks published to the pool.
 * Contributors see the PRICE (their net take-home) first, then express interest;
 * the enterprise sources one of the interested contributors. Backed by
 * /api/contributor/opportunities (+ /interest, /withdraw) → task_interests.
 */

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Check, Clock, ChevronRight, CalendarClock } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";

interface Opportunity {
  taskId: string;
  planId: string;
  sowId?: string | null;
  title: string;
  projectName: string;
  requiredSkills: string[];
  matchedSkills: string[];
  skillMatch: boolean;
  estimatedHours: number;
  payCurrency: string;
  payGrossMinor: number;
  payNetMinor: number;
  myStatus: "interested" | "withdrawn" | "selected" | null;
  closesAt?: string | null;
}

function inr(minor: number): string {
  return `₹${Math.round((minor || 0) / 100).toLocaleString("en-IN")}`;
}

function deadlineLabel(iso?: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return { label: "Interest closed", urgent: true };
  const hrs = Math.floor(ms / 3_600_000);
  if (hrs < 24) return { label: `Closes in ${hrs}h`, urgent: true };
  return { label: `Closes in ${Math.floor(hrs / 24)}d`, urgent: Math.floor(hrs / 24) <= 1 };
}

export function OpportunitiesSection({ standalone = false }: { standalone?: boolean } = {}) {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["contributor", "opportunities"],
    queryFn: async (): Promise<Opportunity[]> => {
      const res = await fetch("/api/contributor/opportunities", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load opportunities");
      const json = await res.json();
      return Array.isArray(json.items) ? json.items : [];
    },
    // Poll so a task the enterprise publishes while this page is open appears
    // within seconds — without it the feed looked "empty/broken" until a manual
    // reload (it had cached the pre-publish result).
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const mutate = useMutation({
    mutationFn: async (vars: { taskId: string; planId: string; act: "interest" | "withdraw" }) => {
      const res = await fetch(`/api/contributor/opportunities/${vars.taskId}/${vars.act}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: vars.planId }),
      });
      if (!res.ok) throw new Error("Action failed");
    },
    // Optimistic: flip the row instantly + confirm immediately, so the action feels
    // instant even when the gateway/DB round-trip is slow. Reconciled in onSettled.
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["contributor", "opportunities"] });
      const prev = qc.getQueryData<Opportunity[]>(["contributor", "opportunities"]);
      qc.setQueryData<Opportunity[]>(["contributor", "opportunities"], (old) =>
        (old ?? []).map((o) =>
          o.taskId === vars.taskId
            ? { ...o, myStatus: vars.act === "interest" ? "interested" : "withdrawn" }
            : o,
        ),
      );
      toast.success(
        vars.act === "interest" ? "Interest registered" : "Withdraw request submitted",
        vars.act === "interest"
          ? "The enterprise will pick from interested contributors."
          : "You've been removed from the interested pool.",
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["contributor", "opportunities"], ctx.prev);
      toast.error("Couldn't update interest", "Please try again.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["contributor", "opportunities"] });
    },
  });

  const items = q.data ?? [];
  // Hide ones the contributor was passed over on; keep interested/open/withdrawn.
  const visible = items.filter((t) => t.myStatus !== "selected");
  // Embedded (inside Assigned): hide entirely when empty. Standalone (own page):
  // always render so the section shows its loading + empty states.
  if (!standalone && (q.isLoading || visible.length === 0)) return null;

  return (
    <DashboardSection
      title={standalone ? "Available now" : "Open opportunities"}
      description="Published to skilled contributors — review the price, then show interest. The enterprise selects one."
    >
      {q.isLoading ? (
        <p className="px-5 py-10 text-center font-body text-[12.5px] text-text-tertiary">
          Loading opportunities…
        </p>
      ) : visible.length === 0 ? (
        <p className="px-5 py-10 text-center font-body text-[12.5px] text-text-tertiary">
          No open opportunities right now. When an enterprise publishes a task you&apos;re a fit for,
          it&apos;ll show up here — and you&apos;ll get a notification.
        </p>
      ) : (
       <>
      <ul className="divide-y divide-stroke-subtle -mx-5">
        {visible.map((t) => {
          const interested = t.myStatus === "interested";
          const busy = mutate.isPending && mutate.variables?.taskId === t.taskId;
          const dl = deadlineLabel(t.closesAt);
          return (
            <li key={t.taskId} className="px-5 py-3 flex items-center justify-between gap-4 min-h-[56px]">
              <Link href={`/contributor/opportunities/${t.taskId}`} className="min-w-0 flex-1 group block">
                <p className="font-body text-[13px] font-medium text-foreground truncate group-hover:text-brand group-hover:underline">{t.title}</p>
                <p className="mt-0.5 font-body text-[11px] text-text-tertiary truncate">
                  {t.projectName} · {t.estimatedHours}h
                  {t.skillMatch ? (
                    <span className="ml-1 text-brand font-semibold">
                      · {t.matchedSkills.length}/{t.requiredSkills.length} skills match
                    </span>
                  ) : null}
                </p>
                {dl ? (
                  <p className={cn("mt-0.5 inline-flex items-center gap-1 font-body text-[10.5px] font-medium", dl.urgent ? "text-warning-text" : "text-text-tertiary")}>
                    <CalendarClock className="h-3 w-3" aria-hidden /> {dl.label}
                  </p>
                ) : null}
                {/* skill chips — matched ones highlighted */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {t.requiredSkills.map((s) => {
                    const hit = t.matchedSkills.includes(s);
                    return (
                      <span
                        key={s}
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold border",
                          hit
                            ? "bg-brand-subtle text-brand-subtle-text border-brand/20"
                            : "bg-bg-subtle text-text-tertiary border-stroke-subtle",
                        )}
                      >
                        {hit ? <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden /> : null}
                        {s}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-1 font-body text-[12px] font-semibold text-foreground">
                  Estimated payout: {inr(t.payNetMinor)}{" "}
                  <span className="font-normal text-text-tertiary">(paid in full)</span>
                </p>
                <span className="mt-1 inline-flex items-center gap-0.5 font-body text-[11px] font-medium text-brand">
                  View full details <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
              <div className="shrink-0">
                {interested ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-body text-[11.5px] font-medium text-brand">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Interested · awaiting selection
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => mutate.mutate({ taskId: t.taskId, planId: t.planId, act: "withdraw" })}
                      className="h-7 px-2.5 rounded-md border border-stroke font-body text-[11px] font-semibold text-text-secondary hover:text-error-text disabled:opacity-50"
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => mutate.mutate({ taskId: t.taskId, planId: t.planId, act: "interest" })}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md disabled:opacity-50",
                      "bg-brand text-on-brand font-body text-[11.5px] font-semibold hover:bg-brand-hover transition-colors duration-fast",
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                    I&apos;m interested
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 px-5 font-body text-[11px] text-text-tertiary inline-flex items-center gap-1">
        <Check className="h-3 w-3" strokeWidth={2} aria-hidden />
        Price is always shown before you express interest.
      </p>
       </>
      )}
    </DashboardSection>
  );
}
