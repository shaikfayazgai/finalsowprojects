/**
 * Contributor Portal V2 — AI suggestion derivation.
 *
 * Replaces static AI suggestion text with functions that read live
 * task state and produce contextual hints. Used by Workroom AI panel,
 * Revision flow AI panel, Dashboard AI productivity card.
 *
 * Each derivation returns observation-grade suggestions:
 *   - "supportive" tone
 *   - confidence is computed (not handed in)
 *   - source is the field/state inspected
 */

import type { Task } from "@/lib/stores/contributor-tasks-store";

export interface DerivedAiSuggestion {
  id: string;
  kind: "next_step" | "evidence" | "submission_check" | "fix_suggestion" | "workflow_tip";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
  cta?: string;
}

/**
 * Derive AI suggestions for a single task. Returns 0–4 suggestions
 * ordered by relevance.
 */
export function deriveTaskAiSuggestions(task: Task): DerivedAiSuggestion[] {
  const out: DerivedAiSuggestion[] = [];

  // 1) Revision-state corrections take priority
  const corrections = task.mentorFeedback?.requiredCorrections ?? [];
  const unresolved = corrections.filter(
    (c) => !task.resolvedCorrections.includes(c.id),
  );

  if (task.state === "revision_requested" && unresolved.length > 0) {
    const first = unresolved[0];
    out.push({
      id: `ai-fix-${first.id}`,
      kind: "fix_suggestion",
      title: `Start with "${first.criterion}"`,
      detail:
        unresolved.length === 1
          ? `One correction remaining: ${first.description}`
          : `${unresolved.length} corrections to address · this one is highest-severity.`,
      confidence: first.severity === "blocker" ? "high" : "medium",
      source: `Mentor feedback · ${task.mentor.name}`,
      cta: "Open revision flow",
    });
  }

  // 2) Readiness gap
  if (
    task.state === "in_progress" ||
    task.state === "accepted" ||
    task.state === "ready_for_submission"
  ) {
    if (task.readinessScore >= 90) {
      out.push({
        id: "ai-submit",
        kind: "submission_check",
        title: "Readiness is ≥ 90% — you can submit",
        detail:
          "Coverage looks complete and the draft notes read well. Submission is yours to make.",
        confidence: "high",
        source: `Readiness ${task.readinessScore}%`,
        cta: "Open submission",
      });
    } else if (task.readinessScore >= 70) {
      const eta = Math.max(15, task.estimatedMinutesRemaining || 45);
      out.push({
        id: "ai-eta",
        kind: "next_step",
        title: `Roughly ${eta} minutes to ready`,
        detail:
          "A few criteria still need evidence. The readiness panel in the workroom lists which ones.",
        confidence: "medium",
        source: `Readiness ${task.readinessScore}% · estimated remaining`,
      });
    } else if (task.readinessScore > 0) {
      out.push({
        id: "ai-progress",
        kind: "next_step",
        title: "Working through the spec — keep going",
        detail:
          "Acceptance criteria progress and evidence completeness both move readiness forward.",
        confidence: "low",
        source: `Readiness ${task.readinessScore}%`,
      });
    }
  }

  // 3) Evidence gap (when criteria addressed but evidence count is light)
  const requiredEvidence = task.deliverables?.filter((d) => d.required).length ?? 0;
  if (
    requiredEvidence > 0 &&
    task.evidence.length < requiredEvidence &&
    (task.state === "in_progress" || task.state === "revision_requested")
  ) {
    const missing = requiredEvidence - task.evidence.length;
    out.push({
      id: "ai-evidence",
      kind: "evidence",
      title: `${missing} required ${missing === 1 ? "deliverable" : "deliverables"} not yet uploaded`,
      detail:
        "Evidence panel in the workroom shows what's expected. Uploading lifts the readiness score directly.",
      confidence: "high",
      source: `Deliverables · ${task.evidence.length} of ${requiredEvidence} attached`,
      cta: "Open workroom",
    });
  }

  // 4) Deadline urgency
  if (task.deadlineHoursRemaining > 0 && task.deadlineHoursRemaining <= 24) {
    out.push({
      id: "ai-deadline",
      kind: "workflow_tip",
      title: "Due in the next 24 hours",
      detail:
        "The submission flow runs its own readiness check before send, so submit when you're confident rather than rushed.",
      confidence: "medium",
      source: `Deadline ${task.deadlineHoursRemaining}h away`,
    });
  }

  // 5) Awaiting-clarification supportive cue
  if (task.state === "awaiting_clarification") {
    out.push({
      id: "ai-clarify",
      kind: "workflow_tip",
      title: "SLA paused — mentor reply is the next move",
      detail:
        "Pre-draft the likely fix while you wait. When the reply lands, your readiness can jump quickly.",
      confidence: "medium",
      source: "Clarification state",
    });
  }

  // 6) Under review supportive cue
  if (task.state === "under_review") {
    out.push({
      id: "ai-under-review",
      kind: "workflow_tip",
      title: "Mentor reviewing · typical turnaround under 24h",
      detail:
        "No action needed. The dashboard surfaces a notification when the decision lands.",
      confidence: "high",
      source: "Submission lifecycle",
    });
  }

  return out;
}

/**
 * Derive cross-task AI insights for the workload as a whole. Used by
 * dashboard and revisions workspace cross-AI helper.
 */
export function deriveWorkloadAiInsights(tasks: Task[]): DerivedAiSuggestion[] {
  const out: DerivedAiSuggestion[] = [];

  const urgent = tasks.filter(
    (t) =>
      t.deadlineHoursRemaining > 0 &&
      t.deadlineHoursRemaining <= 24 &&
      t.state !== "completed" &&
      t.state !== "approved",
  );
  if (urgent.length > 0) {
    const first = urgent.sort((a, b) => a.deadlineHoursRemaining - b.deadlineHoursRemaining)[0];
    out.push({
      id: "wl-urgent",
      kind: "next_step",
      title: `${urgent.length} task${urgent.length === 1 ? "" : "s"} due in 24h`,
      detail: `Start with ${first.title} · ${first.deadlineHoursRemaining}h to deadline.`,
      confidence: "high",
      source: "Deadline scan",
    });
  }

  const inRevision = tasks.filter((t) => t.state === "revision_requested");
  if (inRevision.length > 0) {
    const totalUnresolved = inRevision.reduce((acc, t) => {
      const corrections = t.mentorFeedback?.requiredCorrections ?? [];
      const unresolved = corrections.filter((c) => !t.resolvedCorrections.includes(c.id));
      return acc + unresolved.length;
    }, 0);
    out.push({
      id: "wl-revisions",
      kind: "fix_suggestion",
      title: `${inRevision.length} revision${inRevision.length === 1 ? "" : "s"} active · ${totalUnresolved} unresolved corrections`,
      detail:
        "Address them in severity order — blockers first. The revisions workspace shows the full picture.",
      confidence: "medium",
      source: "Revision state",
      cta: "Open revisions",
    });
  }

  const ready = tasks.filter((t) => t.state === "ready_for_submission");
  if (ready.length > 0) {
    out.push({
      id: "wl-ready",
      kind: "submission_check",
      title: `${ready.length} task${ready.length === 1 ? " is" : "s are"} ready to send`,
      detail: "Send when you're confident — the submission flow runs one more readiness check.",
      confidence: "high",
      source: "Readiness scan",
    });
  }

  const underReview = tasks.filter((t) => t.state === "under_review");
  if (underReview.length > 0) {
    out.push({
      id: "wl-pending",
      kind: "workflow_tip",
      title: `${underReview.length} submission${underReview.length === 1 ? "" : "s"} with mentor`,
      detail:
        "No action on your side. The dashboard updates when mentor decisions land.",
      confidence: "high",
      source: "Submission lifecycle",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "wl-clear",
      kind: "workflow_tip",
      title: "Workload is calm",
      detail: "Browse assigned work to pick something new, or take a beat.",
      confidence: "medium",
      source: "Workload scan",
    });
  }

  return out;
}
