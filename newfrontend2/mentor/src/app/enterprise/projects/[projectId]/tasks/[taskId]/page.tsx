"use client";

/**
 * Project task drill-in — scorecard cockpit. Spec doc 02 §5.E.5.
 *
 * USE-CASE: Enterprise PMO or sponsor needs to review the full task record —
 * state, assignee, effort, acceptance criteria, reviewer activity, and payout
 * status — to assess delivery health for a specific task.
 *
 * HEURISTIC EVAL:
 * H1 (Visibility): Old layout had a flat header block and a single SectionCard
 *   with italicised placeholder text — no KPI hierarchy, no task state visible
 *   at a glance.
 * H6 (Recognition): SectionCard "Read-only view" heading gave no context.
 *   A scorecard with labelled stat tiles (state, effort, milestone, assignee)
 *   provides instant recognition.
 * H7 (Flexibility): Single monolithic section gave no ability to navigate to
 *   specific concerns (brief vs evidence vs activity vs payout). Tabbed
 *   sections match the invoice-detail cockpit pattern.
 * H8 (Minimalist): SectionCard with italic placeholder was content-free but
 *   still burned vertical space. Retain placeholder copy inside the tab, not
 *   as the entire page.
 *
 * LAYOUT: Header card (gradient icon + breadcrumb + title + state chip) →
 * stat scorecard row (StatCard × 4) → tabbed DASH_CARD sections.
 * Mirrors src/app/enterprise/billing/invoices/[invoiceId]/page.tsx.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  User,
  Zap,
} from "lucide-react";
import { getProjectTaskMock } from "@/lib/projects/projects-mock";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, primaryBtnClass, primaryStyle, secondaryBtnClass, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

type TabKey = "brief" | "evidence" | "activity" | "payout";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "brief", label: "Brief" },
  { key: "evidence", label: "Evidence" },
  { key: "activity", label: "Reviewer activity" },
  { key: "payout", label: "Payout" },
];

function stateTone(state: string): Tone {
  switch (state) {
    case "blocked": return "error";
    case "submitted":
    case "reviewed": return "warning";
    case "accepted": return "success";
    case "in_progress": return "info";
    case "matched": return "ai";
    default: return "neutral";
  }
}

function stateLabel(state: string): string {
  return state.replace(/_/g, " ");
}

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      {label}
    </button>
  );
}

export default function ProjectTaskDetailPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const projectId = params?.projectId ?? "";
  const taskId = params?.taskId ?? "";
  const [tab, setTab] = React.useState<TabKey>("brief");

  const result = projectId && taskId ? getProjectTaskMock(projectId, taskId) : undefined;

  if (!result) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/enterprise/projects"
          className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Back to projects
        </Link>
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            Task not found
            {taskId ? <span className="block mt-1 font-mono text-[11px] opacity-80">{taskId}</span> : null}
          </p>
        </div>
      </div>
    );
  }

  const { project, task } = result;
  const tone = stateTone(task.state);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href={`/enterprise/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        {project.name}
      </Link>

      {/* Identity header card */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span
            className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0"
            style={GLASS_GRADIENT}
            aria-hidden
          >
            <ClipboardList className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
              Projects · {project.name} · {task.milestone}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none truncate">
                {task.title}
              </h1>
              <Chip tone={tone}>{stateLabel(task.state)}</Chip>
            </div>
            <p className="mt-2 font-body text-[12px] text-text-tertiary tabular-nums font-mono">
              {task.id}
            </p>
          </div>
        </div>
      </header>

      {/* Scorecard */}
      <section aria-label="Task scorecard" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="State"
          value={<span style={{ color: TONE[tone].text }}>{stateLabel(task.state)}</span>}
          icon={Zap}
        />
        <StatCard
          label="Effort"
          value={`${task.effortHours}h`}
          icon={Clock}
          hint="estimated"
        />
        <StatCard
          label="Assignee"
          value={task.assignee || "Unassigned"}
          icon={User}
        />
        <StatCard
          label="Milestone"
          value={task.milestone}
          icon={FileText}
        />
      </section>

      {/* Tabbed sections */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <TabPill key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
          ))}
        </div>

        <div className="px-5 sm:px-6 py-5">
          {tab === "brief" && (
            <TabPlaceholder
              title="Task brief"
              body="Acceptance criteria, scope definition, and required skills appear here once the projects backend ships. Enterprise view is read-only — edits happen in the decomposition workspace."
              links={[
                { label: "Decomposition workspace", href: project.planId ? `/enterprise/decomposition/${project.planId}` : null },
                { label: "Project detail", href: `/enterprise/projects/${project.id}` },
              ]}
            />
          )}
          {tab === "evidence" && (
            <TabPlaceholder
              title="Contributor evidence"
              body="Submitted artefacts, screenshots, pull request links, and file uploads from the contributor will appear here once the projects API ships."
            />
          )}
          {tab === "activity" && (
            <TabPlaceholder
              title="Reviewer activity"
              body="Mentor and enterprise reviewer decisions, comments, rework requests, and SLA events will appear here once the projects API ships."
            />
          )}
          {tab === "payout" && (
            <TabPlaceholder
              title="Payout status"
              body="Contributor payout eligibility, computation, and transfer status will appear here. Payout is unlocked when the enterprise reviewer accepts the deliverable."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabPlaceholder({
  title,
  body,
  links,
}: {
  title: string;
  body: string;
  links?: Array<{ label: string; href: string | null }>;
}) {
  return (
    <div className="space-y-3">
      <p className="font-display text-[14px] font-semibold text-foreground tracking-[-0.01em]">{title}</p>
      <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">{body}</p>
      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {links.filter((l) => l.href).map((l) => (
            <Link
              key={l.label}
              href={l.href!}
              className={cn(secondaryBtnClass, "h-8 px-3 text-[12.5px]")}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
