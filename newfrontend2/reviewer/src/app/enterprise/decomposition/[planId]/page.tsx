"use client";

/**
 * Decomposition plan detail — single-column record view aligned with SOW detail UX.
 *
 *   Back link → header (title, meta, primary action)
 *   Context banners (draft · skill gaps · delivery)
 *   Milestone progress (compact stepper)
 *   Sections: Details · Milestones & tasks · Dependencies
 */

import * as React from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Send,
  XCircle,
} from "lucide-react";
import { usePlan } from "@/lib/hooks/use-decomposition-v2";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { getProjectByPlanMock, projectOverlay } from "@/lib/projects/projects-mock";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { Skeleton } from "@/components/meridian";
import type {
  MilestoneDetail,
  TaskDetail,
  DependencyDetail,
  PlanDetail,
  PlanStatus,
  MilestoneStatus,
} from "@/lib/decomposition/types";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  TONE,
  primaryBtnClass,
  primaryStyle,
  type Tone,
} from "@/app/admin/_shell/aurora-ui";

function Section({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary truncate">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "Ready",
  approved: "Approved",
  active: "In delivery",
  archived: "Archived",
};

const PLAN_STATUS_TONE: Record<PlanStatus, Tone> = {
  draft: "info",
  approved: "success",
  active: "ai",
  archived: "neutral",
};

const MILESTONE_STATUS_TONE: Record<MilestoneStatus, Tone> = {
  pending: "neutral",
  in_progress: "info",
  completed: "success",
  at_risk: "warning",
  blocked: "error",
};

const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  at_risk: "At risk",
  blocked: "Blocked",
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ownerLabel(id: string | null | undefined): string {
  if (!id) return "—";
  if (id.includes("@")) return id.split("@")[0];
  if (id.length <= 14) return id;
  return `${id.slice(0, 12)}…`;
}

function exportPlanCsv(plan: PlanDetail, title: string): void {
  const lines: string[] = [];
  lines.push(`# Glimmora · Decomposition plan · ${title}`);
  lines.push(`# Plan ID,${plan.id}`);
  lines.push(`# SOW ID,${plan.sowId}`);
  lines.push(`# Status,${plan.status}`);
  lines.push(`# Version,${plan.version}`);
  lines.push(`# Exported,${new Date().toISOString()}`);
  lines.push("");
  lines.push("MILESTONES");
  lines.push("order,name,status,start,end,description");
  for (const m of plan.milestones) {
    lines.push(
      [m.order, csvCell(m.name), m.status, m.startDate ?? "", m.endDate ?? "", csvCell(m.description ?? "")].join(","),
    );
  }
  lines.push("");
  lines.push("TASKS");
  lines.push("key,title,milestone,status,skills,estHours,confidence");
  for (const t of plan.tasks) {
    const ms = plan.milestones.find((m) => m.id === t.milestoneId);
    lines.push(
      [
        t.externalKey ?? t.id,
        csvCell(t.title),
        csvCell(ms?.name ?? "—"),
        t.status,
        csvCell(t.requiredSkills.join("; ")),
        t.estimatedHours ?? "",
        t.aiConfidence ?? "",
      ].join(","),
    );
  }
  lines.push("");
  lines.push("DEPENDENCIES");
  lines.push("type,fromTask,toTask");
  for (const d of plan.dependencies) {
    const from = plan.tasks.find((t) => t.id === d.fromTaskId);
    const to = plan.tasks.find((t) => t.id === d.toTaskId);
    lines.push([d.type, csvCell(from?.title ?? d.fromTaskId), csvCell(to?.title ?? d.toTaskId)].join(","));
  }

  if (typeof window === "undefined") return;
  const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.id}-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(s: string): string {
  if (s == null) return "";
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function DecompositionPlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const planId = params?.planId ?? "";
  const { data: plan, isLoading, error } = usePlan(planId);
  const { data: sowData } = useSowList({ limit: 200 });

  useOverlayVersion(projectOverlay);
  const provisionedProject = planId ? getProjectByPlanMock(planId) : undefined;

  const sow = React.useMemo(() => {
    if (!plan || !sowData) return undefined;
    return sowData.items.find((s) => s.id === plan.sowId);
  }, [plan, sowData]);

  if (isLoading && !plan) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="font-body text-[13px] font-semibold text-error-text">Couldn&apos;t load this plan</p>
            <p className="mt-0.5 font-body text-[12px] text-error-text/85">
              {(error as Error).message ?? "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!plan) notFound();

  const title = sow?.title ?? `Plan ${plan.id.slice(0, 8)}`;

  return (
    <PlanDetailView
      plan={plan}
      title={title}
      sowVersion={sow?.activeVersion}
      provisionedProject={provisionedProject}
    />
  );
}

function PlanDetailView({
  plan,
  title,
  sowVersion,
  provisionedProject,
}: {
  plan: PlanDetail;
  title: string;
  sowVersion?: number;
  provisionedProject: ReturnType<typeof getProjectByPlanMock>;
}) {
  const isDraft = plan.status === "draft";
  const isActive = plan.status === "active";

  const tasksByMilestone = React.useMemo(() => {
    const map = new Map<string | null, TaskDetail[]>();
    for (const t of plan.tasks) {
      const key = t.milestoneId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [plan.tasks]);

  const orderedMilestones = React.useMemo(
    () => [...plan.milestones].sort((a, b) => a.order - b.order),
    [plan.milestones],
  );
  const orphans = tasksByMilestone.get(null) ?? [];

  const totalHours = plan.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const unskilledTasks = plan.tasks.filter((t) => t.requiredSkills.length === 0);

  const primaryAction = provisionedProject
    ? { href: `/enterprise/projects/${provisionedProject.id}`, label: "View project", icon: ChevronRight }
    : isDraft
      ? { href: `/enterprise/decomposition/${plan.id}/approve`, label: "Submit for approval", icon: Send }
      : null;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
            <Boxes className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
              Decomposition · Version {plan.version}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
                {title}
              </h1>
              <Chip tone={PLAN_STATUS_TONE[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Chip>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
              <span className="tabular-nums">
                {plan.milestones.length} milestone{plan.milestones.length === 1 ? "" : "s"}
              </span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                {plan.tasks.length} task{plan.tasks.length === 1 ? "" : "s"}
              </span>
              {totalHours > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums font-medium text-text-secondary">{totalHours}h est.</span>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <span className="tabular-nums">Updated {timeAgo(plan.updatedAt)}</span>
            </div>
            <RecordLinks plan={plan} onExport={() => exportPlanCsv(plan, title)} />
          </div>
        </div>

        {primaryAction ? (
          <Link href={primaryAction.href} style={primaryStyle} className={cn(primaryBtnClass, "h-9 px-5 shrink-0")}>
            {React.createElement(primaryAction.icon, { className: "h-4 w-4", strokeWidth: 2.25, "aria-hidden": true })}
            {primaryAction.label}
          </Link>
        ) : null}
      </header>

      {isDraft && (
        <ContextBanner tone="brand" title="Draft plan">
          Review milestones and tasks below, then submit for sponsor approval. A delivery project is
          provisioned automatically once approved.
        </ContextBanner>
      )}

      {unskilledTasks.length > 0 && (
        <ContextBanner tone="error" title={`${unskilledTasks.length} task${unskilledTasks.length === 1 ? "" : "s"} missing skill tags`}>
          Tasks without skills cannot be routed to contributors. Add skill tags before approval.
        </ContextBanner>
      )}

      {isActive && provisionedProject && (
        <ContextBanner tone="brand" title="In delivery">
          This plan is active — track execution on the provisioned project.
        </ContextBanner>
      )}

      <Section
        title="Milestone progress"
        description={orderedMilestones.map((m) => m.name).join(" → ") || "No milestones yet"}
      >
        <div className="px-5 sm:px-6 py-5">
          <MilestoneStepper milestones={orderedMilestones} />
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          <Section
            title="Milestones & tasks"
            description={
              plan.tasks.length === 0
                ? "No tasks on this plan"
                : `${orderedMilestones.length} milestones · ${plan.tasks.length} tasks`
            }
          >
            {orderedMilestones.length === 0 && orphans.length === 0 ? (
              <p className="px-5 sm:px-6 font-body text-[13px] text-text-tertiary py-5">
                No milestones yet. Decompose from an approved SOW to seed a starter plan.
              </p>
            ) : (
              <div className="space-y-6 py-2">
                {orderedMilestones.map((m) => (
                  <MilestoneGroup key={m.id} milestone={m} tasks={tasksByMilestone.get(m.id) ?? []} />
                ))}
                {orphans.length > 0 && (
                  <MilestoneGroup
                    milestone={{
                      id: "__orphans",
                      order: 0,
                      name: "Unassigned tasks",
                      description: null,
                      startDate: null,
                      endDate: null,
                      status: "pending",
                      createdAt: "",
                      updatedAt: "",
                    }}
                    tasks={orphans}
                  />
                )}
              </div>
            )}
          </Section>

          <Section
            title="Dependencies & critical path"
            description={
              plan.dependencies.length === 0
                ? "No dependencies declared"
                : `${plan.dependencies.length} link${plan.dependencies.length === 1 ? "" : "s"}`
            }
          >
            <div className="px-5 sm:px-6 py-5">
              <DependenciesContent dependencies={plan.dependencies} tasks={plan.tasks} />
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Plan details" description="Plan metadata">
            <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 gap-y-4">
              <SourceSowFact sowId={plan.sowId} title={title} version={sowVersion} />
              <Fact label="Plan ID" value={plan.id} mono />
              <Fact label="Created by" value={ownerLabel(plan.createdBy)} />
              <Fact label="Approved by" value={ownerLabel(plan.approvedBy)} />
              <Fact label="Created" value={formatDate(plan.createdAt)} mono />
              {plan.approvedAt ? <Fact label="Approved" value={formatDate(plan.approvedAt)} mono /> : null}
              {plan.activatedAt ? <Fact label="Activated" value={formatDate(plan.activatedAt)} mono /> : null}
              <Fact label="Estimated effort" value={totalHours > 0 ? `${totalHours} hours` : "—"} mono />
              <Fact label="Dependencies" value={plan.dependencies.length === 0 ? "None" : String(plan.dependencies.length)} mono />
              {plan.summary ? <Fact label="Summary" value={plan.summary} /> : null}
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/decomposition"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to decomposition
    </Link>
  );
}

function RecordLinks({
  plan,
  onExport,
}: {
  plan: PlanDetail;
  onExport: () => void;
}) {
  const auditHref = `/enterprise/audit?resourceType=plan&resourceId=${encodeURIComponent(plan.id)}&action=decomposition`;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <button
        type="button"
        onClick={onExport}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Export CSV
      </button>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href={auditHref}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit trail
      </Link>
    </p>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{
        background: tone === "error" ? TONE.error.soft : TONE.info.soft,
        borderColor: tone === "error" ? TONE.error.border : TONE.info.border,
      }}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SourceSowFact({
  sowId,
  title,
  version,
}: {
  sowId: string;
  title: string;
  version?: number;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        Source SOW
      </dt>
      <dd className="mt-1">
        <Link
          href={`/enterprise/sow/${sowId}`}
          className="font-body text-[13px] font-medium text-foreground hover:text-text-secondary underline-offset-2 hover:underline transition-colors duration-fast"
        >
          {title}
        </Link>
        {version != null ? (
          <p className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">
            v{version} · {sowId}
          </p>
        ) : (
          <p className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">{sowId}</p>
        )}
      </dd>
    </div>
  );
}

/* ─── Milestone stepper ─── */

type MilestoneStageState = "completed" | "current" | "waiting" | "at_risk" | "blocked";

function resolveMilestoneState(status: MilestoneStatus): MilestoneStageState {
  switch (status) {
    case "completed":
      return "completed";
    case "in_progress":
      return "current";
    case "at_risk":
      return "at_risk";
    case "blocked":
      return "blocked";
    case "pending":
    default:
      return "waiting";
  }
}

function MilestoneStepper({ milestones }: { milestones: MilestoneDetail[] }) {
  if (milestones.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary">
        No milestones on this plan yet.
      </p>
    );
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-2">
      {milestones.map((m, i) => {
        const state = resolveMilestoneState(m.status);
        return (
          <li key={m.id} className="relative min-w-0">
            {i < milestones.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-foreground/[0.10]"
              />
            )}
            <MilestoneNode milestone={m} state={state} />
          </li>
        );
      })}
    </ol>
  );
}

function MilestoneNode({
  milestone,
  state,
}: {
  milestone: MilestoneDetail;
  state: MilestoneStageState;
}) {
  const Icon =
    state === "completed"
      ? CheckCircle2
      : state === "current"
        ? Clock
        : state === "blocked"
          ? XCircle
          : state === "at_risk"
            ? AlertTriangle
            : Circle;

  const iconCls =
    state === "completed"
      ? "text-success-text"
      : state === "current"
        ? "text-info-text"
        : state === "blocked"
          ? "text-error-text"
          : state === "at_risk"
            ? "text-warning-text"
            : "text-text-disabled";

  const caption = MILESTONE_STATUS_LABEL[milestone.status];

  return (
    <div className="flex sm:flex-col sm:items-center gap-2 sm:gap-1.5 sm:text-center">
      <span
        className={cn(
          "grid place-items-center h-6 w-6 rounded-full border shrink-0",
          state === "current" && "border-info-border bg-info-subtle",
          state === "completed" && "border-success-border bg-success-subtle",
          state === "waiting" && "border-stroke-subtle bg-bg-subtle",
          state === "at_risk" && "border-warning-border bg-warning-subtle",
          state === "blocked" && "border-error-border bg-error-subtle",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconCls)} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="font-body text-[12px] font-semibold text-foreground truncate">{milestone.name}</p>
        <p
          className={cn(
            "font-body text-[10.5px] truncate",
            state === "current" ? "text-info-text font-medium" : "text-text-tertiary",
          )}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}

/* ─── Milestone groups (flat, always visible) ─── */

function MilestoneGroup({
  milestone,
  tasks,
}: {
  milestone: MilestoneDetail;
  tasks: TaskDetail[];
}) {
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const timeline =
    milestone.startDate && milestone.endDate
      ? `${formatDate(milestone.startDate)} → ${formatDate(milestone.endDate)}`
      : null;

  return (
    <div className="border-t border-stroke-subtle first:border-t-0 first:pt-0 pt-4 first:mt-0">
      <div className="px-5 sm:px-6 pb-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-[13px] font-semibold text-foreground">
            {milestone.order > 0 && milestone.id !== "__orphans" && (
              <span className="font-mono text-[10px] text-text-tertiary mr-2">M{milestone.order}</span>
            )}
            {milestone.name}
          </p>
          {milestone.description && (
            <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-relaxed">
              {milestone.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Chip tone={MILESTONE_STATUS_TONE[milestone.status]} dot={false}>
            {MILESTONE_STATUS_LABEL[milestone.status]}
          </Chip>
          <span className="font-body text-[11px] text-text-tertiary text-right">
            {[`${tasks.length} tasks`, totalHours > 0 ? `${totalHours}h` : null, timeline]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="px-5 sm:px-6 pb-2 font-body text-[12px] text-text-tertiary italic">No tasks</p>
      ) : (
        <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: TaskDetail }) {
  const meta = [
    task.workforceSourcing?.replace(/_/g, " ") ?? null,
    task.reviewPath?.replace(/_/g, " ") ?? null,
    task.requiredSkills.length > 0 ? task.requiredSkills.slice(0, 2).join(", ") : null,
    task.estimatedHours != null ? `${task.estimatedHours}h` : null,
    task.status.replace(/_/g, " "),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center justify-between gap-4 px-5 sm:px-6 py-2.5 min-h-[44px] hover:bg-bg-subtle transition-colors duration-fast">
      <div className="min-w-0 flex items-center gap-2">
        <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">
          T{task.order}
        </span>
        <span className="font-body text-[13px] font-medium text-foreground truncate">
          {task.title}
        </span>
        {task.requiredSkills.length === 0 && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0 rounded border border-stroke-subtle font-body text-[10px] font-semibold shrink-0"
            style={{ color: TONE.warning.text, background: TONE.warning.soft }}
            title="No skill tag — cannot route this task"
          >
            <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
            No skill
          </span>
        )}
      </div>
      <span className="font-body text-[11px] text-text-tertiary shrink-0 text-right max-w-[45%] truncate">
        {meta}
      </span>
    </li>
  );
}

/* ─── Dependencies ─── */

function computeCriticalPath(
  tasks: TaskDetail[],
  deps: DependencyDetail[],
): { pathIds: string[]; totalHours: number } {
  if (tasks.length === 0) return { pathIds: [], totalHours: 0 };

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const t of tasks) {
    incoming.set(t.id, []);
    outgoing.set(t.id, []);
  }
  for (const d of deps) {
    if (!taskMap.has(d.fromTaskId) || !taskMap.has(d.toTaskId)) continue;
    outgoing.get(d.fromTaskId)!.push(d.toTaskId);
    incoming.get(d.toTaskId)!.push(d.fromTaskId);
  }

  const queue: string[] = [];
  const indeg = new Map<string, number>();
  for (const t of tasks) {
    const n = incoming.get(t.id)!.length;
    indeg.set(t.id, n);
    if (n === 0) queue.push(t.id);
  }
  const topo: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    topo.push(id);
    for (const nx of outgoing.get(id) ?? []) {
      const k = (indeg.get(nx) ?? 0) - 1;
      indeg.set(nx, k);
      if (k === 0) queue.push(nx);
    }
  }

  const dp = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const id of topo) {
    const w = taskMap.get(id)?.estimatedHours ?? 0;
    let best = 0;
    let bestParent: string | null = null;
    for (const p of incoming.get(id) ?? []) {
      const cand = dp.get(p) ?? 0;
      if (cand > best) {
        best = cand;
        bestParent = p;
      }
    }
    dp.set(id, best + w);
    prev.set(id, bestParent);
  }

  let endId: string | null = null;
  let endVal = -1;
  for (const [id, v] of dp) {
    if (v > endVal) {
      endVal = v;
      endId = id;
    }
  }
  if (!endId) return { pathIds: [], totalHours: 0 };

  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  return { pathIds: path, totalHours: endVal };
}

function DependenciesContent({
  dependencies,
  tasks,
}: {
  dependencies: DependencyDetail[];
  tasks: TaskDetail[];
}) {
  const taskById = React.useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks],
  );
  const critical = React.useMemo(
    () => computeCriticalPath(tasks, dependencies),
    [tasks, dependencies],
  );
  const criticalSet = React.useMemo(
    () => new Set(critical.pathIds),
    [critical.pathIds],
  );
  const criticalDays = Math.ceil(critical.totalHours / 6);

  return (
    <>
      {critical.pathIds.length > 0 && (
        <div className="mb-4 pb-4 border-b border-stroke-subtle">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Critical path
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body text-[12.5px]">
            {critical.pathIds.map((id, i) => {
              const t = taskById.get(id);
              return (
                <React.Fragment key={id}>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10.5px] font-semibold whitespace-nowrap"
                    style={{ color: TONE.warning.text, background: TONE.warning.soft }}
                  >
                    {t?.externalKey ?? `T-${i + 1}`}
                  </span>
                  <span className="text-foreground truncate max-w-[180px]">{t?.title ?? "—"}</span>
                  {i < critical.pathIds.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-text-tertiary shrink-0" aria-hidden />
                  )}
                </React.Fragment>
              );
            })}
          </p>
          <p className="mt-1.5 font-mono text-[11px] text-text-tertiary tabular-nums">
            ≈ {critical.totalHours}h critical work · ~{criticalDays} working days at 6h/day
          </p>
        </div>
      )}

      {dependencies.length === 0 ? (
        <p className="font-body text-[13px] text-text-tertiary py-1">
          No dependencies declared yet.
        </p>
      ) : (
        <ul className="divide-y divide-stroke-subtle -mx-5 sm:-mx-6">
          {dependencies.map((d) => {
            const from = taskById.get(d.fromTaskId);
            const to = taskById.get(d.toTaskId);
            const onCriticalPath =
              criticalSet.has(d.fromTaskId) && criticalSet.has(d.toTaskId);
            return (
              <li
                key={d.id}
                className={cn(
                  "px-5 sm:px-6 py-2.5 flex items-center gap-2 font-body text-[12.5px] min-h-[44px] hover:bg-bg-subtle transition-colors duration-fast",
                  onCriticalPath && "bg-warning-subtle/10",
                )}
              >
                <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0">
                  {d.type.replace(/_/g, " ")}
                </span>
                <span className="text-foreground truncate min-w-0">
                  {from?.title ?? d.fromTaskId.slice(0, 8)}
                </span>
                <ChevronRight className="h-3 w-3 text-text-tertiary shrink-0" aria-hidden />
                <span className="text-foreground truncate min-w-0 flex-1">
                  {to?.title ?? d.toTaskId.slice(0, 8)}
                </span>
                {onCriticalPath && (
                  <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-warning-text shrink-0">
                    critical
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-36" />

      <div className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-6 w-56 sm:w-72" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
