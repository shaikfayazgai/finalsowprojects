"use client";

/**
 * Super-admin (Glimmora) task detail — the FULL task brief (description,
 * acceptance criteria, skills, uploaded files) PLUS the contributor price
 * Glimmora set. Reached by clicking "View details" on a task row in the
 * work-pricing page. Glimmora is the only role that sees the price here; pricing
 * EDITS still live on the pricing page (this is a read view). Back button returns
 * to the pricing page.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Paperclip, ExternalLink, Lock } from "lucide-react";
import { usePlan } from "@/lib/hooks/use-decomposition-v2";
import { deliveryLabel } from "@/lib/delivery/status-matrix";
import { Skeleton } from "@/components/meridian";

function inr(minor: number): string {
  return `₹${Math.round((minor || 0) / 100).toLocaleString("en-IN")}`;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminTaskDetailPage() {
  const params = useParams<{ planId: string; taskId: string }>();
  const planId = params?.planId ?? "";
  const taskId = params?.taskId ?? "";
  const { data: plan, isLoading, error } = usePlan(planId);
  const backHref = `/admin/decomposition/${planId}`;

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

  // Price — Glimmora-only. Fixed = the amount; hourly = rate × estimated hours.
  const isHourly = task.payType === "hourly" && task.payRateMinor != null;
  const lineMinor = isHourly
    ? Math.round((task.payRateMinor ?? 0) * (task.estimatedHours ?? 0))
    : (task.contributorAmountMinor ?? 0);
  const priced = lineMinor > 0;

  return (
    <div className="pb-12 animate-fade-in">
      <BackLink href={backHref} />

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        {/* Main: task brief */}
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
            <Section title={`Attached files (${attachments.length})`}>
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
        </div>

        {/* Side: contributor price — Glimmora-only */}
        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start space-y-3">
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
              Contributor pay · Glimmora-set
            </p>
            <p className="mt-1 font-body text-[24px] font-semibold text-foreground tabular-nums leading-tight">
              {priced ? inr(lineMinor) : "Not priced"}
            </p>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              {isHourly
                ? `₹${Math.round((task.payRateMinor ?? 0) / 100).toLocaleString("en-IN")}/hr × ${task.estimatedHours ?? 0}h`
                : "Fixed price · paid in full"}
            </p>
            <p className="mt-3 inline-flex items-start gap-1.5 font-body text-[11px] text-text-tertiary leading-relaxed">
              <Lock className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
              Hidden from the enterprise, mentor and reviewer. Only Glimmora sees the contributor pay.
            </p>
            <Link
              href={backHref}
              className="mt-4 inline-flex items-center gap-1.5 font-body text-[12px] font-semibold text-text-link hover:underline"
            >
              Edit pricing on the plan page
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" aria-hidden />
            </Link>
          </div>
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
      Back to pricing
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

function TaskSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] pb-12">
      <div className="space-y-5">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-8 w-80 max-w-full rounded" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <Skeleton className="h-56 w-full rounded-xl hidden xl:block" />
    </div>
  );
}
