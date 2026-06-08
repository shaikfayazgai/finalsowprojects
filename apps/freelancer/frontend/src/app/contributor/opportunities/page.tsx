"use client";

/**
 * Contributor opportunities — the REAL "price-visible → I'm interested" board.
 *
 * Lists OPEN decomposed tasks across every enterprise plan (read from the
 * shared enterprise_plans table via the freelancer backend). Each card shows the
 * contributor's net payout (cost − GST), effort and deadline. "I'm interested"
 * persists to the shared task_interests table; the enterprise later selects one
 * interested contributor per task. No mock store — fully wired to the backend.
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, IndianRupee, Layers, Loader2 } from "lucide-react";
import {
  listOpportunities,
  expressInterest,
  withdrawInterest,
  type Opportunity,
} from "@/lib/api/contributor-opportunities";
import { getContributorAccessToken } from "@/lib/auth/contributor-access-token";
import { cn } from "@/lib/utils/cn";

function formatINRMinor(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const QK = ["contributor", "opportunities"] as const;

export default function ContributorOpportunitiesPage() {
  const { data: session } = useSession();
  const token = getContributorAccessToken(session);
  const qc = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...QK, session?.user?.email ?? ""],
    queryFn: () => listOpportunities(token as string),
    enabled: !!token,
  });

  const expressMut = useMutation({
    mutationFn: (t: Opportunity) => expressInterest(token as string, t.plan_id, t.task_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });

  const withdrawMut = useMutation({
    mutationFn: (t: Opportunity) => withdrawInterest(token as string, t.plan_id, t.task_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });

  const pendingKey = (m: typeof expressMut | typeof withdrawMut) =>
    m.isPending ? `${m.variables?.plan_id}:${m.variables?.task_id}` : null;
  const expressingKey = pendingKey(expressMut);
  const withdrawingKey = pendingKey(withdrawMut);

  const tasks = data?.items ?? [];

  return (
    <div className="space-y-5 pb-12">
      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
          Contributor · Opportunities
        </p>
        <h1 className="mt-1 font-display text-[22px] font-semibold text-foreground">
          Open tasks
        </h1>
        <p className="mt-1 font-body text-[13px] text-text-secondary">
          Review the details and your payout, then express interest. The
          enterprise selects one contributor per task.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-stroke bg-surface px-5 py-10 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-text-tertiary" aria-hidden />
          <p className="mt-2 font-body text-[13px] text-text-secondary">Loading open tasks…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-danger-border bg-danger-subtle px-5 py-6 text-center">
          <p className="font-body text-[13px] text-danger-text">
            Couldn&apos;t load opportunities{error instanceof Error ? `: ${error.message}` : "."}
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-stroke bg-surface px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            No open tasks right now. Check back soon.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((t) => {
            const key = `${t.plan_id}:${t.task_id}`;
            const interested = t.my_interest === "interested";
            const isClosed = t.selected;
            const isMineSelected = t.selected_is_me;
            const busyExpress = expressingKey === key;
            const busyWithdraw = withdrawingKey === key;

            return (
              <li
                key={key}
                className="rounded-xl border border-stroke bg-surface shadow-xs p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                      {t.project_name}
                      {t.milestone ? ` · ${t.milestone}` : ""}
                    </p>
                    <h2 className="mt-0.5 font-body text-[15px] font-semibold text-foreground leading-snug">
                      {t.title}
                    </h2>
                  </div>
                  {/* Contributor payout shown FIRST/prominently — net of GST */}
                  <div className="shrink-0 text-right">
                    <p className="inline-flex items-center gap-0.5 font-body text-[16px] font-bold text-brand-emphasis tabular-nums">
                      <IndianRupee className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      {Math.round(t.pay.contributor_net_minor / 100).toLocaleString("en-IN")}
                    </p>
                    <p className="font-body text-[10.5px] text-text-tertiary">
                      net payout · {formatINRMinor(t.pay.contributor_hourly_minor)}/h
                    </p>
                    <p className="font-body text-[10px] text-text-tertiary">
                      {formatINRMinor(t.pay.contributor_gross_minor)} −{" "}
                      {formatINRMinor(t.pay.contributor_gst_minor)} GST
                    </p>
                  </div>
                </div>

                {t.description && (
                  <p className="font-body text-[12.5px] text-text-secondary leading-relaxed line-clamp-3">
                    {t.description}
                  </p>
                )}

                {t.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {t.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded-md bg-bg-subtle px-2 py-0.5 font-body text-[11px] font-medium text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 font-body text-[11.5px] text-text-tertiary">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {t.effort_hours}h
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Due {formatDate(t.deadline)}
                  </span>
                  {t.interest_count > 0 && <span>{t.interest_count} interested</span>}
                </div>

                <div className="mt-auto pt-1">
                  {isClosed ? (
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-[12px] font-semibold",
                        isMineSelected
                          ? "bg-success-subtle text-success-text"
                          : "bg-bg-subtle text-text-tertiary",
                      )}
                    >
                      {isMineSelected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                          You were selected
                        </>
                      ) : (
                        "Closed — another contributor was selected"
                      )}
                    </div>
                  ) : interested ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-success-subtle px-3 py-1.5 font-body text-[12px] font-semibold text-success-text">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                        Interest expressed
                      </span>
                      <button
                        type="button"
                        disabled={busyWithdraw}
                        onClick={() => withdrawMut.mutate(t)}
                        className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground hover:underline underline-offset-2 disabled:opacity-50"
                      >
                        {busyWithdraw && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
                        Withdraw
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busyExpress}
                      onClick={() => expressMut.mutate(t)}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast disabled:opacity-60"
                    >
                      {busyExpress && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      I&apos;m interested
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
