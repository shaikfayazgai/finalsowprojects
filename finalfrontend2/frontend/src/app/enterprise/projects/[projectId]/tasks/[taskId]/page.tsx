"use client";

/**
 * Project task drill-in — spec doc 02 §5.E.5.
 *
 * Read-only view of a task from the enterprise perspective. Mock-backed
 * until /api/projects ships.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProjectTaskMock } from "@/lib/projects/projects-mock";
import { Chip, SectionCard, type Tone } from "@/app/admin/_shell/aurora-ui";

export default function ProjectTaskDetailPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const projectId = params?.projectId ?? "";
  const taskId = params?.taskId ?? "";

  const result = projectId && taskId ? getProjectTaskMock(projectId, taskId) : undefined;

  if (!result) {
    return (
      <div className="space-y-5 pb-12">
        <Link
          href="/enterprise/projects"
          className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Back to projects
        </Link>
        <SectionCard>
          <p className="px-5 sm:px-6 py-10 text-center font-body text-[13px] font-semibold text-foreground">
            Task not found
          </p>
        </SectionCard>
      </div>
    );
  }

  const { project, task } = result;

  const stateTone: Tone =
    task.state === "blocked"
      ? "error"
      : task.state === "submitted" || task.state === "reviewed"
        ? "warning"
        : task.state === "accepted"
          ? "success"
          : "neutral";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 font-body text-[12.5px] text-text-tertiary"
      >
        <Link
          href={`/enterprise/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          <span>{project.name}</span>
        </Link>
        <span aria-hidden className="opacity-60">
          /
        </span>
        <span className="font-mono text-text-secondary">{task.id}</span>
      </nav>

      <header>
        <p className="font-body text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-tertiary mb-2">
          Project · {project.name} · {task.milestone}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[24px] sm:text-[26px] font-semibold text-foreground tracking-[-0.025em] leading-none">
            {task.title}
          </h1>
          <Chip tone={stateTone}>{task.state.replace(/_/g, " ")}</Chip>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 font-body text-[13px] text-text-secondary">
          <span>Assignee: <span className="text-foreground font-medium">{task.assignee}</span></span>
          <span aria-hidden className="opacity-50">·</span>
          <span className="font-mono tabular-nums">{task.effortHours}h</span>
        </p>
      </header>

      <SectionCard title="Read-only view">
        <p className="px-5 sm:px-6 py-4 font-body text-[12.5px] text-text-tertiary italic">
          Brief, acceptance criteria, contributor evidence, reviewer activity,
          and payout status appear here once the projects backend ships. The
          enterprise view is read-only — edits happen in the decomposition
          workspace.
        </p>
      </SectionCard>
    </div>
  );
}
