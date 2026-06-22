/**
 * Adapters that project the unified `Task` (from the contributor tasks
 * store) into the shapes existing surface components were originally
 * typed against. Lets us migrate to a live store without rewriting every
 * child component.
 */

import type { Task } from "@/lib/stores/contributor-tasks-store";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";
import { deriveTaskAiSuggestions } from "./derive-ai";

export function adaptTaskToWorkroom(task: Task): WorkroomTask {
  const requiredDeliverables = task.deliverables?.filter((d) => d.required) ?? [];
  return {
    id: task.id,
    title: task.title,
    shortDescription: task.shortDescription,
    brief:
      task.brief ??
      `${task.title}. ${task.shortDescription}. Deliver against the acceptance criteria below.`,
    project: task.project,
    portfolio: task.portfolio,
    priority: task.priority,
    skill: task.skill,
    skillLevel: task.skillLevel,
    deadline: task.deadline,
    deadlineHoursRemaining: task.deadlineHoursRemaining,
    state: task.state,
    progressPct: task.progressPct,
    readinessScore: task.readinessScore,
    estimatedMinutesRemaining: task.estimatedMinutesRemaining,
    payoutAmount: task.payoutAmount,
    payoutCurrency: "USD",
    mentor: task.mentor,
    reworkRound: task.reworkRound,
    totalRounds: task.totalRounds,
    instructions: task.instructions ?? defaultInstructions(task),
    deliverables: task.deliverables ?? defaultDeliverables(task),
    dependencies: task.dependencies ?? [],
    milestones: task.milestones ?? defaultMilestones(task),
    acceptanceCriteria: task.acceptanceCriteria,
    evidence: {
      artifacts: task.evidence,
      requiredCount: requiredDeliverables.length || task.acceptanceCriteria.length || 3,
      completeCount: task.evidence.length,
    },
    draft: {
      notes: task.draftNotes,
      lastSavedAt: task.draftSavedAt ?? "—",
      autosaveStatus: task.draftSavedAt ? "saved" : "unsaved",
    },
    mentorFeedback: task.mentorFeedback,
    clarification: undefined,
    aiSuggestions: deriveTaskAiSuggestions(task).map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      detail: s.detail,
      confidence: s.confidence,
      cta: s.cta,
    })),
    submissionReadiness: {
      overall: task.readinessScore,
      signals:
        task.readinessSignals ??
        defaultReadinessSignals(task),
    },
    history: task.submissions.map((s) => ({
      round: s.round,
      outcome:
        s.outcome === "accepted"
          ? "passed"
          : s.outcome === "revision_requested"
          ? "failed"
          : s.outcome === "withdrawn"
          ? "withdrawn"
          : "failed",
      when: s.submittedAt,
      note: s.mentorNote,
    })),
    externalLinks: task.externalLinks?.map((l) => ({
      label: l.label,
      url: l.url,
      kind: l.kind as "github" | "storybook" | "demo" | "doc" | "spec",
    })) ?? [],
    lastActivityAt: task.lastActivityAt,
    reviewWindowHours: 24,
  };
}

function defaultInstructions(task: Task): WorkroomTask["instructions"] {
  // Lite projection: derive simple steps from acceptance criteria
  const criteria = task.acceptanceCriteria;
  if (criteria.length === 0) {
    return [
      {
        id: "i1",
        step: 1,
        title: "Read the brief carefully",
        body: `Review the spec and confirm scope before starting on ${task.title}.`,
        status: "todo",
      },
      {
        id: "i2",
        step: 2,
        title: "Plan your approach",
        body: "List the deliverables and pick the smallest meaningful first piece.",
        status: "todo",
      },
      {
        id: "i3",
        step: 3,
        title: "Execute and capture evidence",
        body: "Attach artifacts as you go — they lift readiness automatically.",
        status: "todo",
      },
      {
        id: "i4",
        step: 4,
        title: "Run the pre-submit check",
        body: "Submission readiness scan flags gaps before send.",
        status: "todo",
      },
    ];
  }
  return criteria.map((c, idx) => ({
    id: `i-${c.id}`,
    step: idx + 1,
    title: c.label,
    body: `Address ${c.label.toLowerCase()} and attach the matching evidence.`,
    status: c.addressed ? "done" : idx === 0 ? "in_progress" : "todo",
  }));
}

function defaultDeliverables(task: Task): WorkroomTask["deliverables"] {
  return task.acceptanceCriteria.map((c, idx) => ({
    id: `d-${c.id}`,
    label: c.label,
    required: idx < 3,
    status: c.addressed ? "done" : "todo",
  }));
}

function defaultMilestones(task: Task): WorkroomTask["milestones"] {
  return [
    {
      id: "m1",
      label: "Brief understood",
      status: task.progressPct >= 20 ? "completed" : "current",
    },
    {
      id: "m2",
      label: "Core implementation",
      status: task.progressPct >= 60 ? "completed" : task.progressPct >= 20 ? "current" : "upcoming",
    },
    {
      id: "m3",
      label: "Evidence captured",
      status: task.progressPct >= 80 ? "completed" : task.progressPct >= 60 ? "current" : "upcoming",
    },
    {
      id: "m4",
      label: "Ready to submit",
      status: task.readinessScore >= 90 ? "completed" : task.progressPct >= 80 ? "current" : "upcoming",
    },
  ];
}

function defaultReadinessSignals(task: Task): WorkroomTask["submissionReadiness"]["signals"] {
  const addressed = task.acceptanceCriteria.filter((c) => c.addressed).length;
  const total = task.acceptanceCriteria.length;
  const required = task.deliverables?.filter((d) => d.required).length ?? 0;
  const corrections = task.mentorFeedback?.requiredCorrections ?? [];
  const unresolved = corrections.filter(
    (c) => !task.resolvedCorrections.includes(c.id),
  );
  return [
    {
      id: "r1",
      label: "All required deliverables uploaded",
      status:
        required === 0 ? "ok" : task.evidence.length >= required ? "ok" : "partial",
      detail: `${task.evidence.length} of ${Math.max(required, 1)} uploaded`,
    },
    {
      id: "r2",
      label: "Acceptance criteria addressed",
      status: total === 0 ? "ok" : addressed === total ? "ok" : addressed > 0 ? "partial" : "missing",
      detail: total > 0 ? `${addressed} of ${total} addressed` : "no criteria defined",
    },
    {
      id: "r3",
      label: "Submission notes drafted",
      status: task.draftNotes.length > 20 ? "ok" : task.draftNotes.length > 0 ? "partial" : "missing",
    },
    {
      id: "r4",
      label: "Mentor feedback addressed",
      status:
        corrections.length === 0
          ? "ok"
          : unresolved.length === 0
          ? "ok"
          : unresolved.length < corrections.length
          ? "partial"
          : "missing",
      detail:
        corrections.length === 0
          ? "no open feedback"
          : `${corrections.length - unresolved.length} of ${corrections.length} addressed`,
    },
  ];
}
