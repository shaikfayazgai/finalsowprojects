"use client";

/**
 * Work pane V3 — the actual workspace.
 *
 * Four stacked sections in priority order:
 *   1. Brief (collapsed-by-default beyond first paragraph)
 *   2. Acceptance criteria checklist
 *   3. Working notes (textarea — autosave)
 *   4. Evidence (drop zone + uploaded files)
 *
 * Reviewer feedback is rendered between (2) and (3) ONLY when present —
 * sectioned by criterion so the contributor sees feedback right next to
 * the deliverable it concerns. See <ReviewerFeedbackInline>.
 */

import * as React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  FileText,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface WorkPaneProps {
  task: WorkroomTask;
  draftNotes: string;
  onNotesChange: (next: string) => void;
}

export function WorkPane({ task, draftNotes, onNotesChange }: WorkPaneProps) {
  return (
    <div className="space-y-4">
      <BriefSection task={task} />
      <AcceptanceCriteriaSection task={task} />
      {task.mentorFeedback?.received && task.state === "revision_requested" && (
        <ReviewerFeedbackInline task={task} />
      )}
      <NotesSection notes={draftNotes} onChange={onNotesChange} />
      <EvidenceSection task={task} />
    </div>
  );
}

/* ───────── Section primitive ───────── */

function Section({
  title,
  caption,
  trailing,
  children,
}: {
  title: string;
  caption?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-5 py-3.5 border-b border-stroke-subtle flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-body text-[14px] font-semibold text-foreground leading-tight">
            {title}
          </h2>
          {caption && (
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary leading-snug">
              {caption}
            </p>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}

/* ───────── 1 · Brief ───────── */

function BriefSection({ task }: { task: WorkroomTask }) {
  const paragraphs = task.brief.split(/\n\n+/).filter(Boolean);
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? paragraphs : paragraphs.slice(0, 1);

  return (
    <Section
      title="Task brief"
      caption={`Estimated ${Math.round((task.estimatedMinutesRemaining / 60) * 10) / 10}h of focused work`}
    >
      <div className="px-5 py-4">
        <p className="font-body text-[13.5px] font-semibold text-foreground leading-snug">
          {task.shortDescription}
        </p>
        <div className="mt-3 space-y-2 font-body text-[13px] text-foreground leading-relaxed">
          {visible.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {paragraphs.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-[var(--color-brand)] hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>
                Show less <ChevronDown className="h-3 w-3" strokeWidth={2} aria-hidden />
              </>
            ) : (
              <>
                Show full brief
                <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden />
              </>
            )}
          </button>
        )}
      </div>
    </Section>
  );
}

/* ───────── 2 · Acceptance criteria ───────── */

function AcceptanceCriteriaSection({ task }: { task: WorkroomTask }) {
  const items = task.acceptanceCriteria ?? [];
  const done = items.filter((c) => c.addressed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Section
      title="Acceptance criteria"
      caption={`${done} of ${total} addressed`}
      trailing={
        <span className="inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none bg-bg-subtle text-text-secondary tabular-nums">
          {pct}%
        </span>
      }
    >
      <ul className="divide-y divide-stroke-subtle">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--state-hover)] transition-colors"
          >
            <span
              aria-hidden
              className={cn(
                "shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full mt-px",
                c.addressed
                  ? "bg-success-subtle text-success-text"
                  : "ring-1 ring-stroke-strong text-text-tertiary",
              )}
            >
              {c.addressed ? (
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              ) : (
                <Circle className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
              )}
            </span>
            <p
              className={cn(
                "font-body text-[12.5px] leading-snug",
                c.addressed ? "text-text-tertiary line-through" : "text-foreground",
              )}
            >
              {c.label}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ───────── Reviewer feedback (inline, sectioned by criterion) ───────── */

function ReviewerFeedbackInline({ task }: { task: WorkroomTask }) {
  const feedback = task.mentorFeedback;
  if (!feedback?.received) return null;
  const corrections = feedback.requiredCorrections ?? [];

  return (
    <section className="rounded-xl bg-warning-subtle/30 ring-1 ring-warning-subtle overflow-hidden">
      <header className="px-5 py-3.5 border-b border-warning-subtle">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-warning-text leading-none">
          Reviewer requested changes
        </p>
        <h2 className="mt-1 font-body text-[14px] font-semibold text-foreground leading-tight">
          {feedback.mentorName ? `${feedback.mentorName} ` : "Mentor "}
          asked for {corrections.length} change{corrections.length === 1 ? "" : "s"}
        </h2>
        {feedback.whatWorked && (
          <p className="mt-2 font-body text-[12.5px] text-text-secondary leading-snug">
            <span className="font-semibold text-success-text">What worked: </span>
            {feedback.whatWorked}
          </p>
        )}
      </header>
      <ul className="divide-y divide-warning-subtle">
        {corrections.map((c) => (
          <li
            key={c.id}
            className="px-5 py-3 flex items-start gap-3 hover:bg-warning-subtle/50 transition-colors"
          >
            <span
              className={cn(
                "shrink-0 inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none mt-px",
                c.severity === "blocker"
                  ? "bg-error-subtle text-error-text"
                  : c.severity === "major"
                    ? "bg-warning-subtle text-warning-text"
                    : "bg-info-subtle text-info-text",
              )}
            >
              {c.severity}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body text-[12.5px] font-semibold text-foreground leading-snug">
                {c.criterion}
              </p>
              <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-snug">
                {c.description}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full mt-px",
                c.addressed
                  ? "bg-success-subtle text-success-text"
                  : "ring-1 ring-stroke-strong text-text-tertiary",
              )}
              aria-label={c.addressed ? "Addressed" : "Open"}
            >
              {c.addressed ? (
                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              ) : (
                <Circle className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── 3 · Notes ───────── */

function NotesSection({
  notes,
  onChange,
}: {
  notes: string;
  onChange: (next: string) => void;
}) {
  return (
    <Section
      title="Working notes"
      caption="Private to you — autosaved as you type."
    >
      <div className="px-5 py-4">
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder="Sketch your approach, jot blockers, list questions for the reviewer…"
          className="w-full bg-bg-subtle/50 ring-1 ring-stroke-subtle focus:ring-stroke-focus focus:bg-surface rounded-md px-3 py-2.5 font-body text-[13px] text-foreground placeholder:text-text-tertiary leading-relaxed resize-y focus:outline-none transition-colors"
        />
      </div>
    </Section>
  );
}

/* ───────── 4 · Evidence ───────── */

function EvidenceSection({ task }: { task: WorkroomTask }) {
  const artifacts = task.evidence?.artifacts ?? [];

  return (
    <Section
      title="Evidence"
      caption={
        artifacts.length === 0
          ? "Attach files, links, screenshots that prove the criteria above."
          : `${artifacts.length} file${artifacts.length === 1 ? "" : "s"} attached`
      }
    >
      <div className="px-5 py-4 space-y-3">
        {/* Drop zone */}
        <button
          type="button"
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 py-7 rounded-lg",
            "bg-bg-subtle/40 ring-1 ring-dashed ring-stroke-subtle",
            "hover:bg-bg-subtle hover:ring-stroke-strong",
            "transition-colors duration-fast",
          )}
        >
          <span
            aria-hidden
            className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-surface ring-1 ring-stroke-subtle text-text-secondary"
          >
            <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <p className="font-body text-[12.5px] font-semibold text-foreground">
            Drop files or click to attach
          </p>
          <p className="font-body text-[11px] text-text-tertiary">
            PDF, DOCX, PNG, MP4, ZIP — up to 50 MB each
          </p>
        </button>

        {artifacts.length > 0 && (
          <ul className="space-y-1.5">
            {artifacts.map((a: typeof artifacts[number]) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-bg-subtle/50 ring-1 ring-stroke-subtle"
              >
                <span
                  aria-hidden
                  className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md bg-surface ring-1 ring-stroke-subtle text-text-tertiary"
                >
                  {iconFor(a.kind)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight truncate">
                    {a.name}
                  </p>
                  <p className="font-body text-[10.5px] text-text-tertiary leading-snug tabular-nums">
                    {a.size} · {a.uploadedAt}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none",
                    a.status === "uploaded"
                      ? "bg-success-subtle text-success-text"
                      : a.status === "uploading"
                        ? "bg-info-subtle text-info-text"
                        : "bg-error-subtle text-error-text",
                  )}
                >
                  {a.status === "uploaded" ? "ok" : a.status}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${a.name}`}
                  className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md text-text-tertiary hover:text-foreground hover:bg-[var(--state-hover)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

function iconFor(kind: string) {
  switch (kind) {
    case "code":
    case "doc":
      return <FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />;
    case "link":
      return <Paperclip className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />;
    default:
      return <FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />;
  }
}
