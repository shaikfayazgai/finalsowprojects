"use client";

import * as React from "react";
import type {
  DependencyDetail,
  MilestoneDetail,
  PlanDetail,
  TaskDetail,
} from "@/lib/decomposition/types";
import { Badge } from "@/components/ui/badge";
import { PlanStatusBadge, TaskStatusBadge } from "./plan-status-badge";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PlanDetailCard({ plan }: { plan: PlanDetail }) {
  // Group tasks by milestone for display
  const tasksByMilestone = React.useMemo(() => {
    const map = new Map<string | null, TaskDetail[]>();
    for (const t of plan.tasks) {
      const key = t.milestoneId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [plan.tasks]);

  // For each task, count incoming + outgoing deps
  const depCounts = React.useMemo(() => {
    const out = new Map<string, { incoming: number; outgoing: number }>();
    for (const t of plan.tasks) out.set(t.id, { incoming: 0, outgoing: 0 });
    for (const d of plan.dependencies) {
      out.get(d.fromTaskId)!.outgoing++;
      out.get(d.toTaskId)!.incoming++;
    }
    return out;
  }, [plan.tasks, plan.dependencies]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[18px] font-semibold text-foreground">
              Plan v{plan.version}
            </h1>
            <p className="mt-1 font-mono text-[11.5px] text-text-tertiary truncate">
              {plan.id} · SOW {plan.sowId}
            </p>
          </div>
          <PlanStatusBadge status={plan.status} />
        </div>
        {plan.summary && (
          <p className="font-body text-[13px] text-text-secondary">{plan.summary}</p>
        )}
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
          <Field label="Milestones" value={String(plan.milestones.length)} />
          <Field label="Tasks" value={String(plan.tasks.length)} />
          <Field label="Dependencies" value={String(plan.dependencies.length)} />
          <Field label="Approved" value={formatDateTime(plan.approvedAt)} />
          <Field label="Activated" value={formatDateTime(plan.activatedAt)} />
          <Field label="Archived" value={formatDateTime(plan.archivedAt)} />
          <Field label="Created" value={formatDateTime(plan.createdAt)} />
          <Field label="Updated" value={formatDateTime(plan.updatedAt)} />
        </dl>
      </div>

      {/* Milestones + tasks */}
      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-4">
        <h2 className="font-display text-[14px] font-semibold text-foreground">
          Milestones + tasks
        </h2>
        {plan.milestones.length === 0 && plan.tasks.length === 0 ? (
          <p className="font-body text-[12.5px] text-text-tertiary">
            Plan has no structure yet.
          </p>
        ) : (
          <div className="space-y-4">
            {plan.milestones.map((m) => (
              <MilestoneSection
                key={m.id}
                milestone={m}
                tasks={tasksByMilestone.get(m.id) ?? []}
                depCounts={depCounts}
              />
            ))}
            {tasksByMilestone.get(null) && (
              <UnlinkedTasksSection
                tasks={tasksByMilestone.get(null)!}
                depCounts={depCounts}
              />
            )}
          </div>
        )}
      </div>

      {/* Dependency edges */}
      {plan.dependencies.length > 0 && (
        <DependencyTrail plan={plan} />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-body text-[10.5px] uppercase tracking-wide text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-0.5 font-body text-foreground">{value}</dd>
    </div>
  );
}

function MilestoneSection({
  milestone,
  tasks,
  depCounts,
}: {
  milestone: MilestoneDetail;
  tasks: TaskDetail[];
  depCounts: Map<string, { incoming: number; outgoing: number }>;
}) {
  return (
    <div className="rounded-lg ring-1 ring-stroke-subtle bg-surface-muted/20 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-body text-[13px] font-semibold text-foreground">
            {milestone.order}. {milestone.name}
          </h3>
          {milestone.description && (
            <p className="font-body text-[12px] text-text-secondary mt-0.5">
              {milestone.description}
            </p>
          )}
        </div>
        <Badge variant="brown" size="sm">
          {milestone.status}
        </Badge>
      </div>
      {tasks.length === 0 ? (
        <p className="font-body text-[11.5px] text-text-tertiary italic">
          No tasks in this milestone.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} depCount={depCounts.get(t.id)!} />
          ))}
        </ul>
      )}
    </div>
  );
}

function UnlinkedTasksSection({
  tasks,
  depCounts,
}: {
  tasks: TaskDetail[];
  depCounts: Map<string, { incoming: number; outgoing: number }>;
}) {
  return (
    <div className="rounded-lg ring-1 ring-dashed ring-stroke-subtle bg-surface-muted/10 p-3 space-y-2">
      <h3 className="font-body text-[13px] font-semibold text-text-tertiary">
        Unlinked tasks
      </h3>
      <ul className="space-y-1.5">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} depCount={depCounts.get(t.id)!} />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  depCount,
}: {
  task: TaskDetail;
  depCount: { incoming: number; outgoing: number };
}) {
  return (
    <li className="rounded-md bg-surface ring-1 ring-stroke-subtle p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[12.5px] font-semibold text-foreground">
            {task.externalKey ? `${task.externalKey} · ` : ""}
            {task.title}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-text-tertiary">
            {task.estimatedHours !== null && <span>{task.estimatedHours}h</span>}
            {task.complexity && <span>· {task.complexity}</span>}
            {task.aiConfidence !== null && (
              <span>· AI {task.aiConfidence}%</span>
            )}
            {task.pmoEdited && <span>· PMO-edited</span>}
            {depCount.incoming > 0 && <span>· ← {depCount.incoming} dep</span>}
            {depCount.outgoing > 0 && <span>· {depCount.outgoing} dep →</span>}
          </div>
          {task.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="inline-block rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] text-teal-700"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <TaskStatusBadge status={task.status} />
      </div>
    </li>
  );
}

function DependencyTrail({ plan }: { plan: PlanDetail }) {
  const taskById = React.useMemo(() => {
    const m = new Map<string, TaskDetail>();
    for (const t of plan.tasks) m.set(t.id, t);
    return m;
  }, [plan.tasks]);

  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle p-5 space-y-3">
      <h2 className="font-display text-[14px] font-semibold text-foreground">
        Dependency edges
      </h2>
      <ul className="space-y-1">
        {plan.dependencies.map((d: DependencyDetail) => {
          const from = taskById.get(d.fromTaskId);
          const to = taskById.get(d.toTaskId);
          return (
            <li
              key={d.id}
              className="font-body text-[12px] text-text-secondary"
            >
              <span className="font-semibold text-foreground">
                {from?.externalKey ?? from?.title ?? d.fromTaskId}
              </span>{" "}
              →{" "}
              <span className="font-semibold text-foreground">
                {to?.externalKey ?? to?.title ?? d.toTaskId}
              </span>{" "}
              <span className="text-text-tertiary">({d.type})</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
