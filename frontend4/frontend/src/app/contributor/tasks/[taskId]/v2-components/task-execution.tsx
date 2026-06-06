"use client";

import * as React from "react";
import {
  FileText,
  CheckCircle2,
  Circle,
  ListChecks,
  GitBranch,
  Milestone as MilestoneIcon,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Github,
  Play,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import {
  deliverableProgress,
  type Dependency,
  type Milestone,
  type WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

interface TaskExecutionProps {
  task: WorkroomTask;
}

/**
 * Task Execution Panel — left work pane.
 *
 * The work itself. Brief, numbered instructions, deliverables checklist,
 * dependencies, milestones, the contributor's own notes draft. Focused
 * hierarchy: brief at top, action items below, milestones at bottom.
 */
export function TaskExecution({ task }: TaskExecutionProps) {
  return (
    <div className="space-y-4">
      <Brief task={task} />
      <ExternalLinks task={task} />
      <Instructions task={task} />
      <DeliverablesChecklist task={task} />
      <DependenciesList task={task} />
      <MilestoneTrack task={task} />
      <WorkNotes task={task} />
    </div>
  );
}

/* ─────────────────────── Brief ─────────────────────── */

function Brief({ task }: { task: WorkroomTask }) {
  const [expanded, setExpanded] = React.useState(false);
  const paragraphs = task.brief.split(/\n\n+/);
  const visible = expanded ? paragraphs : paragraphs.slice(0, 1);

  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Task brief"
        caption={`${task.skill} ${task.skillLevel} · ${task.project} · estimated ${Math.round(
          task.estimatedMinutesRemaining / 60 * 10
        ) / 10}h remaining`}
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10px] font-semibold text-beige-700">
            <FileText className="h-3 w-3" />
            Spec
          </span>
        }
      />
      <p className="text-[13.5px] font-semibold text-brown-950 mt-1">{task.shortDescription}</p>
      <div className="mt-3 space-y-2 text-[13px] text-brown-900 leading-relaxed">
        {visible.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {paragraphs.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-teal-700 hover:text-teal-800"
        >
          {expanded ? "Show less" : "Show full brief"}
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      )}
    </ContributorCard>
  );
}

/* ─────────────────────── External links ─────────────────────── */

const linkIcon: Record<string, LucideIcon> = {
  github: Github,
  storybook: ExternalLink,
  demo: Play,
  doc: FileText,
  spec: FileText,
};

function ExternalLinks({ task }: { task: WorkroomTask }) {
  if (task.externalLinks.length === 0) return null;
  return (
    <ContributorCard padded={false} className="p-4">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700 mb-2">
        Working references
      </p>
      <ul className="flex flex-wrap gap-2">
        {task.externalLinks.map((l) => {
          const Icon = linkIcon[l.kind] ?? ExternalLink;
          return (
            <li key={l.label}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 py-1 text-[11.5px] font-semibold text-brown-900 hover:bg-beige-50/60"
              >
                <Icon className="h-3.5 w-3.5 text-beige-600" />
                {l.label}
                <ExternalLink className="h-3 w-3 text-beige-400" />
              </a>
            </li>
          );
        })}
      </ul>
    </ContributorCard>
  );
}

/* ─────────────────────── Instructions ─────────────────────── */

function Instructions({ task }: { task: WorkroomTask }) {
  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Execution steps"
        caption="Work through these in order — each builds on the previous."
      />
      <ol className="space-y-3">
        {task.instructions.map((s) => (
          <li
            key={s.id}
            className={cn(
              "rounded-lg border px-3.5 py-3 transition-colors",
              s.status === "done"
                ? "border-forest-200 bg-forest-50/30"
                : s.status === "in_progress"
                ? "border-teal-300 bg-teal-50/50"
                : "border-beige-200 bg-white"
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg border font-bold text-[11px] tabular-nums",
                  s.status === "done"
                    ? "border-forest-200 bg-forest-50 text-forest-700"
                    : s.status === "in_progress"
                    ? "border-teal-300 bg-teal-100 text-teal-800"
                    : "border-beige-200 bg-beige-50 text-beige-700"
                )}
              >
                {s.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.step}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={cn(
                      "text-[13px] font-semibold",
                      s.status === "done"
                        ? "text-forest-800 line-through decoration-forest-300"
                        : "text-brown-950"
                    )}
                  >
                    {s.title}
                  </p>
                  {s.status === "in_progress" && (
                    <span className="inline-flex items-center rounded-full border border-teal-300 bg-white px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider text-teal-800">
                      Working on this
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-brown-800 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </ContributorCard>
  );
}

/* ─────────────────────── Deliverables ─────────────────────── */

function DeliverablesChecklist({ task }: { task: WorkroomTask }) {
  const progress = deliverableProgress(task);
  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Deliverables"
        caption={`${progress.done} of ${progress.total} required deliverables ready`}
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10px] font-semibold text-teal-700">
            <ListChecks className="h-3 w-3" />
            {progress.pct}%
          </span>
        }
      />
      <ul className="space-y-1.5">
        {task.deliverables.map((d) => (
          <li
            key={d.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-3 py-2",
              d.status === "done"
                ? "border-forest-200 bg-forest-50/30"
                : d.status === "in_progress"
                ? "border-teal-200 bg-teal-50/40"
                : "border-beige-200 bg-white"
            )}
          >
            {d.status === "done" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-forest-600 shrink-0" />
            ) : d.status === "in_progress" ? (
              <Circle className="h-4 w-4 mt-0.5 text-teal-600 shrink-0 fill-teal-200" />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 text-beige-400 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[12.5px] font-medium",
                  d.status === "done" ? "text-forest-800 line-through" : "text-brown-900"
                )}
              >
                {d.label}
              </p>
              {d.evidenceRef && (
                <p className="text-[10.5px] text-beige-600 mt-0.5">Linked · {d.evidenceRef}</p>
              )}
            </div>
            {!d.required && (
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-beige-500">Optional</span>
            )}
            {d.required && d.status !== "done" && (
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-beige-600">Required</span>
            )}
          </li>
        ))}
      </ul>
    </ContributorCard>
  );
}

/* ─────────────────────── Dependencies ─────────────────────── */

function DependenciesList({ task }: { task: WorkroomTask }) {
  if (task.dependencies.length === 0) return null;
  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="What you'll need"
        caption="Resources and tools — confirmed ready when you start."
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10px] font-semibold text-beige-700">
            <GitBranch className="h-3 w-3" />
            Dependencies
          </span>
        }
      />
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {task.dependencies.map((d) => (
          <li key={d.label}>
            <DependencyRow dep={d} />
          </li>
        ))}
      </ul>
    </ContributorCard>
  );
}

function DependencyRow({ dep }: { dep: Dependency }) {
  const tone =
    dep.status === "ready"
      ? "border-forest-200 bg-forest-50/30 text-forest-800"
      : dep.status === "blocked"
      ? "border-beige-300 bg-beige-100 text-beige-800"
      : "border-gold-200 bg-gold-50/40 text-gold-800";
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11.5px]", tone)}>
      {dep.status === "ready" ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{dep.label}</p>
        {dep.detail && <p className="text-[10.5px] opacity-80 mt-0.5">{dep.detail}</p>}
      </div>
      <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-80">{dep.status}</span>
    </div>
  );
}

/* ─────────────────────── Milestones ─────────────────────── */

function MilestoneTrack({ task }: { task: WorkroomTask }) {
  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Milestones"
        caption="Your path through this task — quietly tracked as you go."
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10px] font-semibold text-teal-700">
            <MilestoneIcon className="h-3 w-3" />
            {task.milestones.filter((m) => m.status === "completed").length} of {task.milestones.length}
          </span>
        }
      />
      <ol className="relative">
        <span aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-beige-200" />
        {task.milestones.map((m) => (
          <li key={m.id} className="relative flex items-start gap-3 py-2">
            <MilestoneDot status={m.status} />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[12.5px] font-semibold",
                  m.status === "current"
                    ? "text-teal-800"
                    : m.status === "completed"
                    ? "text-forest-800"
                    : "text-beige-700"
                )}
              >
                {m.label}
              </p>
              {m.completedAt && (
                <p className="text-[10.5px] text-beige-600 mt-0.5">completed {m.completedAt}</p>
              )}
              {m.status === "current" && (
                <p className="text-[10.5px] text-teal-700 mt-0.5">You're here</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </ContributorCard>
  );
}

function MilestoneDot({ status }: { status: Milestone["status"] }) {
  if (status === "completed") {
    return (
      <span className="relative z-10 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest-50 border border-forest-200 ring-4 ring-white">
        <CheckCircle2 className="h-3.5 w-3.5 text-forest-700" />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="relative z-10 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 border-2 border-teal-500 ring-4 ring-white">
        <span className="h-2 w-2 rounded-full bg-teal-500" />
      </span>
    );
  }
  return (
    <span className="relative z-10 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white border border-beige-200 ring-4 ring-white">
      <span className="h-1.5 w-1.5 rounded-full bg-beige-300" />
    </span>
  );
}

/* ─────────────────────── Work notes ─────────────────────── */

function WorkNotes({ task }: { task: WorkroomTask }) {
  const [notes, setNotes] = React.useState(task.draft.notes);
  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Working notes"
        caption="Your scratch space — autosaved as you type. Optional to share with mentor on submit."
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Notes-to-self · decisions you're making · things to come back to…"
        className="w-full rounded-lg border border-beige-200 bg-white px-3.5 py-2.5 text-[12.5px] text-brown-900 leading-relaxed placeholder:text-beige-500 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
      />
      <div className="mt-2 flex items-center justify-between text-[10.5px] text-beige-600">
        <span>
          Autosaved · last saved {task.draft.lastSavedAt}
        </span>
        <label className="inline-flex items-center gap-1.5 text-beige-700">
          <input type="checkbox" className="accent-teal-600" />
          Share notes with mentor on submit
        </label>
      </div>
    </ContributorCard>
  );
}
