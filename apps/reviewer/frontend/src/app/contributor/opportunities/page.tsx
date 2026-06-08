"use client";

/**
 * Contributor opportunities — the "price-visible → I'm interested" board.
 *
 * Lists every PUBLISHED task across projects with its details (description,
 * technologies, price shown first, deadline, hours). Contributors click
 * "I'm interested"; the enterprise later selects one interested contributor.
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, Clock, IndianRupee, Layers } from "lucide-react";
import type { PublishedTask } from "@/lib/projects/projects-mock";
import { useTaskInterestStore } from "@/lib/stores/task-interest-store";
import { quote as priceQuote, inr } from "@/lib/pricing/pricing-engine";
import { cn } from "@/lib/utils/cn";

function formatINR(minor: number): string {
  return `₹${(minor / 100).toLocaleString("en-IN")}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ContributorOpportunitiesPage() {
  const { data: session } = useSession();
  const user = session?.user as
    | { id?: string; name?: string; email?: string }
    | undefined;
  const contributorId = user?.id ?? user?.email ?? "me";
  const contributorName = user?.name ?? user?.email ?? "Contributor";

  const expressInterest = useTaskInterestStore((s) => s.expressInterest);
  const withdrawInterest = useTaskInterestStore((s) => s.withdrawInterest);
  const interestsByTask = useTaskInterestStore((s) => s.interestsByTask);
  const selectedByTask = useTaskInterestStore((s) => s.selectedByTask);

  // No published-tasks API yet — render the empty state until the endpoint ships.
  const [tasks] = React.useState<PublishedTask[]>([]);

  const hasInterest = (taskId: string) =>
    (interestsByTask[taskId] ?? []).some((x) => x.contributorId === contributorId);

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
          Review the details and price, then express interest. The enterprise
          selects one contributor per task.
        </p>
      </header>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-stroke bg-surface px-5 py-10 text-center">
          <p className="font-body text-[13px] text-text-secondary">
            No open tasks right now. Check back soon.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((t) => {
            const interested = hasInterest(t.taskId);
            const interestCount = (interestsByTask[t.taskId] ?? []).length;
            const selected = selectedByTask[t.taskId];
            const isMineSelected = selected === contributorId;
            const isClosed = !!selected;
            // Contributor-facing pay: the actual cost (cheaper than the
            // enterprise price), shown as a fixed total with GST deducted.
            const q = priceQuote({ mode: "ai", hours: t.effortHours });

            return (
              <li
                key={t.taskId}
                className="rounded-xl border border-stroke bg-surface shadow-xs p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                      {t.projectName} · {t.milestone}
                    </p>
                    <h2 className="mt-0.5 font-body text-[15px] font-semibold text-foreground leading-snug">
                      {t.title}
                    </h2>
                  </div>
                  {/* Contributor payout shown FIRST/prominently — net of GST */}
                  <div className="shrink-0 text-right">
                    <p className="inline-flex items-center gap-0.5 font-body text-[16px] font-bold text-brand-emphasis tabular-nums">
                      <IndianRupee className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                      {(q.contributorNetMinor / 100).toLocaleString("en-IN")}
                    </p>
                    <p className="font-body text-[10.5px] text-text-tertiary">
                      net payout · {inr(q.contributorHourlyMinor)}/h
                    </p>
                    <p className="font-body text-[10px] text-text-tertiary">
                      {inr(q.contributorGrossMinor)} − {inr(q.contributorGstMinor)} GST
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
                    {t.effortHours}h
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Due {formatDate(t.deadline)}
                  </span>
                  {interestCount > 0 && (
                    <span>{interestCount} interested</span>
                  )}
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
                        onClick={() => withdrawInterest(t.taskId, contributorId)}
                        className="font-body text-[12px] text-text-tertiary hover:text-foreground hover:underline underline-offset-2"
                      >
                        Withdraw
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        expressInterest(t.taskId, {
                          contributorId,
                          name: contributorName,
                          email: user?.email,
                          at: new Date().toISOString(),
                        })
                      }
                      className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
                    >
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
