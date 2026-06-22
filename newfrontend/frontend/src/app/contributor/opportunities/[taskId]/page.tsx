"use client";

/**
 * Opportunity detail — the full brief for ONE published task, opened by clicking
 * an opportunity. Shows description, acceptance criteria, effort + interest
 * deadline, skills, the uploaded files (attachments) and the up-front price, so a
 * contributor can review everything BEFORE expressing interest.
 * Backed by GET /api/contributor/opportunities/{taskId}.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Sparkles, Check, Clock, Paperclip, CalendarClock, Gauge, FileText, ListChecks,
} from "lucide-react";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { toast } from "@/lib/stores/toast-store";

interface Attachment {
  name?: string;
  url?: string;
  size?: number;
}

interface OpportunityDetail {
  taskId: string;
  planId: string;
  sowId?: string | null;
  title: string;
  projectName: string;
  description: string;
  acceptanceCriteria?: string | string[] | null;
  requiredSkills: string[];
  matchedSkills: string[];
  skillMatch: boolean;
  estimatedHours: number;
  complexity?: string | null;
  attachments: Attachment[];
  payCurrency: string;
  payGrossMinor: number;
  payNetMinor: number;
  myStatus: "interested" | "withdrawn" | "selected" | null;
  closesAt?: string | null;
}

function inr(minor: number): string {
  return `₹${Math.round((minor || 0) / 100).toLocaleString("en-IN")}`;
}

function formatDeadline(iso?: string | null): { label: string; urgent: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  const days = Math.floor(ms / 86_400_000);
  const hrs = Math.floor(ms / 3_600_000);
  const date = d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (ms <= 0) return { label: `Closed ${date}`, urgent: true };
  if (hrs < 24) return { label: `Closes in ${hrs}h · ${date}`, urgent: true };
  return { label: `Closes in ${days}d · ${date}`, urgent: days <= 1 };
}

export default function OpportunityDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const taskId = params?.taskId ?? "";

  const q = useQuery({
    queryKey: ["contributor", "opportunity", taskId],
    queryFn: async (): Promise<OpportunityDetail> => {
      const res = await fetch(`/api/contributor/opportunities/${taskId}`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.detail || "Failed to load opportunity");
      return res.json();
    },
    enabled: !!taskId,
    staleTime: 0,
  });

  const t = q.data;

  const mutate = useMutation({
    mutationFn: async (act: "interest" | "withdraw") => {
      const res = await fetch(`/api/contributor/opportunities/${taskId}/${act}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: t?.planId }),
      });
      if (!res.ok) throw new Error("Action failed");
    },
    onMutate: async (act) => {
      await qc.cancelQueries({ queryKey: ["contributor", "opportunity", taskId] });
      const prev = qc.getQueryData<OpportunityDetail>(["contributor", "opportunity", taskId]);
      qc.setQueryData<OpportunityDetail>(["contributor", "opportunity", taskId], (old) =>
        old ? { ...old, myStatus: act === "interest" ? "interested" : "withdrawn" } : old,
      );
      toast.success(
        act === "interest" ? "Interest registered" : "Withdraw request submitted",
        act === "interest"
          ? "The enterprise will pick from interested contributors."
          : "You've been removed from the interested pool.",
      );
      return { prev };
    },
    onError: (_e, _act, ctx) => {
      if (ctx?.prev) qc.setQueryData(["contributor", "opportunity", taskId], ctx.prev);
      toast.error("Couldn't update interest", "Please try again.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["contributor", "opportunity", taskId] });
      qc.invalidateQueries({ queryKey: ["contributor", "opportunities"] });
    },
  });

  const back = (
    <button
      type="button"
      onClick={() => router.push("/contributor/opportunities")}
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-medium text-text-secondary hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> Back to opportunities
    </button>
  );

  if (q.isLoading && !t) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        {back}
        <Skeleton className="h-8 w-full max-w-md rounded" />
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (q.error || !t) {
    return (
      <div className="space-y-4 animate-fade-in">
        {back}
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 font-body text-[13px] text-error-text">
          {q.error instanceof Error ? q.error.message : "This opportunity is no longer available."}
        </div>
      </div>
    );
  }

  const interested = t.myStatus === "interested";
  const deadline = formatDeadline(t.closesAt);
  const criteria: string[] = Array.isArray(t.acceptanceCriteria)
    ? t.acceptanceCriteria.filter(Boolean)
    : t.acceptanceCriteria
      ? [t.acceptanceCriteria]
      : [];

  return (
    <div className="space-y-5 pb-16 animate-fade-in">
      {back}

      {/* Header */}
      <header className="border-b border-stroke-subtle pb-5">
        <p className="font-body text-[11.5px] font-medium text-text-tertiary uppercase tracking-[0.06em]">
          {t.projectName}
        </p>
        <h1 className="mt-1 font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {t.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-body text-[12px] text-text-secondary">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden /> {t.estimatedHours}h estimated</span>
          {t.complexity ? <span className="inline-flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" aria-hidden /> {t.complexity}</span> : null}
          {deadline ? (
            <span className={cn("inline-flex items-center gap-1.5 font-medium", deadline.urgent ? "text-warning-text" : "text-text-secondary")}>
              <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {deadline.label}
            </span>
          ) : null}
          {t.skillMatch ? (
            <span className="inline-flex items-center gap-1 text-brand font-semibold">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> {t.matchedSkills.length}/{t.requiredSkills.length} skills match
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
        {/* Main: brief + criteria + files */}
        <div className="space-y-5">
          <section className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <h2 className="flex items-center gap-2 font-body text-[13px] font-semibold text-foreground">
              <FileText className="h-4 w-4 text-text-tertiary" aria-hidden /> Description
            </h2>
            <p className="mt-2 font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
              {t.description?.trim() || "No description was provided for this task."}
            </p>
          </section>

          {criteria.length > 0 && (
            <section className="rounded-xl border border-stroke-subtle bg-surface p-5">
              <h2 className="flex items-center gap-2 font-body text-[13px] font-semibold text-foreground">
                <ListChecks className="h-4 w-4 text-text-tertiary" aria-hidden /> Acceptance criteria
              </h2>
              <ul className="mt-2 space-y-1.5">
                {criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-[13px] text-text-secondary leading-relaxed">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-text" strokeWidth={2.5} aria-hidden />
                    <span className="whitespace-pre-wrap">{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Uploaded files / attachments */}
          <section className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <h2 className="flex items-center gap-2 font-body text-[13px] font-semibold text-foreground">
              <Paperclip className="h-4 w-4 text-text-tertiary" aria-hidden /> Attached files
              {t.attachments.length > 0 ? (
                <span className="font-normal text-text-tertiary">· {t.attachments.length}</span>
              ) : null}
            </h2>
            {t.attachments.length === 0 ? (
              <p className="mt-2 font-body text-[12.5px] text-text-tertiary">No files were attached to this task.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {t.attachments.map((a, i) => (
                  <li key={i}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2 font-body text-[12.5px] text-text-link hover:bg-surface-hover hover:underline max-w-full"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-text-tertiary" aria-hidden />
                      <span className="truncate">{a.name || a.url || `File ${i + 1}`}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Skills */}
          <section className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <h2 className="font-body text-[13px] font-semibold text-foreground">Skills required</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.requiredSkills.length === 0 ? (
                <span className="font-body text-[12.5px] text-text-tertiary">No specific skills listed.</span>
              ) : (
                t.requiredSkills.map((s) => {
                  const hit = t.matchedSkills.includes(s);
                  return (
                    <span
                      key={s}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-mono text-[11px] font-semibold border",
                        hit
                          ? "bg-brand-subtle text-brand-subtle-text border-brand/20"
                          : "bg-bg-subtle text-text-tertiary border-stroke-subtle",
                      )}
                    >
                      {hit ? <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden /> : null}
                      {s}
                    </span>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Sidebar: price + interest action (sticky) */}
        <aside className="xl:sticky xl:top-4 space-y-4">
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <p className="font-body text-[11.5px] font-medium text-text-tertiary uppercase tracking-[0.06em]">
              Estimated payout
            </p>
            <p className="mt-1 font-body text-[24px] font-semibold text-foreground tabular-nums leading-tight">
              {inr(t.payNetMinor)}
            </p>
            <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">Paid in full — no deductions.</p>

            {deadline ? (
              <p className={cn("mt-3 inline-flex items-center gap-1.5 font-body text-[11.5px] font-medium", deadline.urgent ? "text-warning-text" : "text-text-secondary")}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {deadline.label}
              </p>
            ) : null}

            <div className="mt-4">
              {interested ? (
                <div className="space-y-2">
                  <span className="flex items-center justify-center gap-1.5 h-9 rounded-md bg-brand-subtle font-body text-[12.5px] font-semibold text-brand">
                    <Clock className="h-4 w-4" strokeWidth={2} aria-hidden /> Interested · awaiting selection
                  </span>
                  <button
                    type="button"
                    disabled={mutate.isPending}
                    onClick={() => mutate.mutate("withdraw")}
                    className="w-full h-9 rounded-md border border-stroke font-body text-[12px] font-semibold text-text-secondary hover:text-error-text disabled:opacity-50"
                  >
                    Withdraw interest
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={mutate.isPending}
                  onClick={() => mutate.mutate("interest")}
                  className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors duration-fast"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden /> I&apos;m interested
                </button>
              )}
            </div>
            <p className="mt-3 font-body text-[11px] text-text-tertiary leading-relaxed">
              Review the brief and files above before expressing interest. The enterprise selects one
              contributor from the interested pool.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
