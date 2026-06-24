"use client";

/**
 * Dedicated task page — full task overview (main column) + the Source / Assign
 * side panel (publish for interest, the interested-contributor pool with each
 * person's PUBLIC track record, select → assign). Reached by clicking a task
 * row on the decomposition plan page; all sourcing controls live here.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Paperclip, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePlan } from "@/lib/hooks/use-decomposition-v2";
import { deliveryLabel } from "@/lib/delivery/status-matrix";
import { TaskSourcePanel } from "../../../_components/task-controls";
import { Skeleton } from "@/components/meridian";

interface TimelineEvent {
  at: string;
  kind: string;
  label: string;
  meta?: { note?: string };
}

const EVENT_COLOR: Record<string, string> = {
  created: "var(--color-text-tertiary, #71717a)",
  interest: "#7c5cf6",
  assigned: "#7c5cf6",
  submitted: "var(--color-info-text, #2563eb)",
  accepted: "var(--color-success-text, #15803d)",
  revision: "var(--color-warning-text, #b45309)",
  rejected: "var(--color-error-text, #dc2626)",
  rating: "#f59e0b",
  payment: "var(--color-warning-text, #b45309)",
  paid: "var(--color-success-text, #15803d)",
};

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

/** Absolute date + time, e.g. "23 Jun 2026, 10:50 AM". */
function absTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return iso;
  }
}

function TaskActivityTimeline({ planId, taskId }: { planId: string; taskId: string }) {
  const q = useQuery({
    queryKey: ["decomposition", "task-timeline", planId, taskId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      const res = await fetch(`/api/decomposition/plans/${planId}/tasks/${taskId}/timeline`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      const body = await res.json();
      const items = body.items ?? body.data?.items ?? [];
      return Array.isArray(items) ? items : [];
    },
    refetchInterval: 15_000,
  });
  const items = q.data ?? [];
  return (
    <Section title="Activity timeline">
      {q.isLoading ? (
        <p className="font-body text-[12.5px] text-text-tertiary italic">Loading activity…</p>
      ) : items.length === 0 ? (
        <p className="font-body text-[12.5px] text-text-tertiary italic">
          No activity yet. It will appear here as the task is published, sourced, submitted and reviewed.
        </p>
      ) : (
        <ol className="max-h-[340px] overflow-y-auto overscroll-y-contain space-y-3 pr-1 -mr-1">
          {items.map((e, i) => {
            const color = EVENT_COLOR[e.kind] ?? "var(--color-text-tertiary, #71717a)";
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex flex-col items-center shrink-0">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
                  {i < items.length - 1 ? <span className="mt-1 w-px flex-1 min-h-[14px] bg-stroke-subtle" aria-hidden /> : null}
                </span>
                <div className="min-w-0 flex-1 pb-0.5">
                  <p className="font-body text-[12.5px] text-foreground leading-snug">{e.label}</p>
                  {e.meta?.note ? (
                    <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {e.meta.note}
                    </p>
                  ) : null}
                  <p className="mt-0.5 font-body text-[11px] text-text-tertiary tabular-nums">{absTime(e.at)} · {relTime(e.at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

export default function TaskDetailPage() {
  const params = useParams<{ planId: string; taskId: string }>();
  const planId = params?.planId ?? "";
  const taskId = params?.taskId ?? "";
  const { data: plan, isLoading, error } = usePlan(planId);

  const backHref = `/enterprise/decomposition/${planId}`;

  if (isLoading && !plan) return <TaskSkeleton />;

  const task = plan?.tasks.find((t) => t.id === taskId) ?? null;
  const milestone = task ? (plan?.milestones.find((m) => m.id === task.milestoneId) ?? null) : null;

  if (error || !plan || !task) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink href={backHref} />
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 font-body text-[12.5px] text-error-text">
          {error ? (error as Error).message : "Task not found."}
        </div>
      </div>
    );
  }

  const statusLabel = deliveryLabel(task.status, "enterprise");
  const skills = task.requiredSkills ?? [];
  const criteria = (task.acceptanceCriteria ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const attachments = task.attachments ?? [];

  return (
    <div className="pb-12 animate-fade-in">
      <BackLink href={backHref} />

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        {/* Main: task overview */}
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-center gap-2 font-body text-[11px] text-text-tertiary">
              <span className="font-mono tabular-nums">T{task.order}</span>
              {milestone ? (
                <>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>{milestone.name}</span>
                </>
              ) : null}
            </div>
            <h1 className="mt-1.5 font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {task.title}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full bg-bg-subtle px-2.5 py-0.5 font-body text-[11.5px] font-semibold text-text-secondary">
                {statusLabel}
              </span>
              {task.estimatedHours != null ? (
                <span className="font-body text-[12px] text-text-tertiary tabular-nums">{task.estimatedHours}h est.</span>
              ) : null}
              {task.complexity ? (
                <span className="font-body text-[12px] text-text-tertiary capitalize">{task.complexity}</span>
              ) : null}
            </div>
          </header>

          {skills.length > 0 && (
            <Section title="Skills required">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-md bg-brand-subtle px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-subtle-text border border-brand/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {task.description ? (
            <Section title="Description">
              <p className="font-body text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </Section>
          ) : null}

          {criteria.length > 0 && (
            <Section title="Acceptance criteria">
              <ul className="space-y-1.5">
                {criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-[13px] text-foreground">
                    <Check className="h-3.5 w-3.5 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {attachments.length > 0 && (
            <Section title={`Reference files (${attachments.length})`}>
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-subtle transition-colors">
                    <Paperclip className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 font-body text-[12.5px] font-medium text-text-link hover:underline truncate"
                    >
                      {a.name}
                    </a>
                    {a.sizeBytes ? (
                      <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">{fmtSize(a.sizeBytes)}</span>
                    ) : null}
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-tertiary hover:text-foreground shrink-0"
                      title="View file"
                      aria-label={`View ${a.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {!task.description && criteria.length === 0 && skills.length === 0 && attachments.length === 0 ? (
            <p className="font-body text-[12.5px] text-text-tertiary italic">No extra task details captured.</p>
          ) : null}

          <TaskActivityTimeline planId={planId} taskId={taskId} />
        </div>

        {/* Side: Source + Assign (all controls live here) */}
        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start space-y-3">
          <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-foreground">Source &amp; assign</p>
          <TaskSourcePanel planId={planId} task={task} />
        </aside>
      </div>
    </div>
  );
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to plan
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary mb-2">{title}</p>
      {children}
    </section>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TaskSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] pb-12">
      <div className="space-y-5">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-8 w-80 max-w-full rounded" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl hidden xl:block" />
    </div>
  );
}
