/**
 * Contributor Portal V2 — Unified Task Store.
 *
 * Single source of truth for every contributor task across the V2 ecosystem.
 *
 *   - Dashboard, Assigned Work, Workroom, Submission, Revision queue,
 *     per-task Revision, Completed Work, Profile contribution history,
 *     Progress, NextStepCard — all read from this store.
 *   - Every workflow action (Accept, Save Draft, Submit, Resolve Correction,
 *     Resubmit, Approve, Withdraw) mutates this store.
 *   - Mock-only persistence via Zustand `persist` (localStorage).
 *   - The store seeds from existing mock files at first load by merging them
 *     into one canonical Map keyed by taskId. Existing mock files remain
 *     untouched; the store is the new public API.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { acceptanceApi, AcceptanceApiError } from "@/lib/api/acceptance";
import { toast } from "@/lib/stores/toast-store";
import type {
  ContributorPriority,
  ContributorState,
  MentorCorrection,
  MentorFeedback,
} from "@/mocks/data/contributor-workspace";
import { contributorTasks } from "@/mocks/data/contributor-workspace";
import { sampleWorkroomTask } from "@/mocks/data/contributor-workroom-detail";
import type {
  InstructionStep,
  Deliverable,
  Dependency,
  Milestone,
  WorkroomArtifact,
  ReadinessSignal,
} from "@/mocks/data/contributor-workroom-detail";
import {
  revisionRows,
  type RevisionWorkflowState,
} from "@/mocks/data/contributor-revision-queue";
import { completedWork } from "@/mocks/data/contributor-completed-work";

/* ─────────────────────── Unified Task model ─────────────────────── */

export interface AcceptanceCriterion {
  id: string;
  label: string;
  addressed: boolean;
}

export interface SubmissionRecord {
  round: number;
  submittedAt: string;
  outcome: "accepted" | "revision_requested" | "withdrawn" | "pending";
  mentorNote?: string;
}

export interface Task {
  // Identity
  id: string;
  title: string;
  shortDescription: string;
  brief?: string;
  project: string;
  portfolio: string;
  priority: ContributorPriority;
  skill: string;
  skillLevel: "L1" | "L2" | "L3" | "L4";
  payoutAmount: string;

  // Lifecycle state
  state: ContributorState;
  revisionSubState?: RevisionWorkflowState;
  reworkRound: number;
  totalRounds: number;

  // Mentor
  mentor: { name: string; initials: string; role: string };

  // Time
  deadline: string;
  deadlineHoursRemaining: number;
  lastActivityAt: string;
  acceptedAt?: string;

  // Progress
  progressPct: number;
  readinessScore: number;
  estimatedMinutesRemaining: number;

  // Rich content (richer where available, lite-projection otherwise)
  instructions?: InstructionStep[];
  deliverables?: Deliverable[];
  dependencies?: Dependency[];
  milestones?: Milestone[];
  acceptanceCriteria: AcceptanceCriterion[];

  // Evidence & draft
  evidence: WorkroomArtifact[];
  draftNotes: string;
  draftSavedAt?: string;
  readinessSignals?: ReadinessSignal[];

  // Mentor feedback (present in revision/completed states)
  mentorFeedback?: MentorFeedback;
  resolvedCorrections: string[];
  whatWorked?: string;

  // Submission history
  submissions: SubmissionRecord[];

  // Completion metadata
  payoutReference?: string;
  credential?: { name: string; shareId: string };
  portfolioEligible?: boolean;
  portfolioShared?: boolean;
  firstTryAccept?: boolean;

  // Enterprise acceptance (Phase 1B Wave 2 — Enterprise Review Workspace)
  enterpriseAccepted?: boolean;
  enterpriseDecisionAt?: string;
  enterpriseDecisionNote?: string;
  enterpriseDecisionBy?: string;
  acceptanceArrivedAt?: string;

  // External
  externalLinks?: { label: string; url: string; kind: string }[];

  // Tags
  tags?: string[];
}

/* ─────────────────────── Activity ─────────────────────── */

export type ActivityKind =
  | "accepted"
  | "draft_saved"
  | "evidence_added"
  | "submitted"
  | "feedback_received"
  | "correction_resolved"
  | "resubmitted"
  | "approved"
  | "clarification_sent"
  | "clarification_replied";

export interface ActivityEvent {
  id: string;
  taskId: string;
  at: string;
  kind: ActivityKind;
  detail: string;
  mentor?: string;
}

/* ─────────────────────── Store shape ─────────────────────── */

interface ContributorTasksState {
  tasksById: Record<string, Task>;
  activity: ActivityEvent[];
  hydratedAt: string;

  /* Selectors (computed views) */
  list: () => Task[];
  get: (id: string) => Task | undefined;
  byStates: (states: ContributorState[]) => Task[];

  /* Mutators */
  acceptTask: (id: string) => void;
  saveDraft: (id: string, notes: string) => void;
  addEvidence: (id: string, artifact: WorkroomArtifact) => void;
  removeEvidence: (id: string, artifactId: string) => void;
  setReadiness: (id: string, score: number) => void;
  toggleCorrectionResolved: (id: string, correctionId: string) => void;
  setRevisionSubState: (id: string, sub: RevisionWorkflowState) => void;
  submitTask: (id: string) => void;
  resubmitTask: (id: string) => void;
  /** Mock mentor decision — used by under_review setTimeout simulation
   *  and by demo "Simulate mentor reply" controls. */
  mentorRespond: (id: string, decision: "approve" | "revise", note?: string) => void;
  withdraw: (id: string) => void;
  /** Enterprise sign-off on a mentor-approved deliverable. Final acceptance. */
  enterpriseAcceptDelivery: (id: string, note?: string, deciderInitials?: string) => void;
  /** Enterprise rejects the delivery and sends it back to revision. */
  enterpriseRequestRework: (id: string, reason: string, deciderInitials?: string) => void;
  /* Demo-only helpers */
  reseed: () => void;
}

/* ─────────────────────── Seeding ─────────────────────── */

function rich<TKey extends keyof typeof sampleWorkroomTask>(key: TKey) {
  return sampleWorkroomTask[key];
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Convert a human-readable activity phrase ("5 minutes ago", "yesterday",
 * "13:42") into an ISO timestamp relative to now. Used during seed
 * building so V2 surfaces that do `new Date(lastActivityAt).getTime()`
 * compute real freshness windows instead of falling back to 0.
 *
 * Realism pass output — keeps mock seed deterministic per-load while
 * making the ecosystem feel alive over the demo lifecycle.
 */
function humanToIso(raw: string): string {
  if (!raw || raw === "—") return new Date().toISOString();
  const now = Date.now();
  const lower = raw.toLowerCase().trim();

  // "X minutes ago"
  let m = lower.match(/^(\d+)\s*minute/);
  if (m) return new Date(now - parseInt(m[1], 10) * 60_000).toISOString();
  // "30 minutes ago" handled above; "an hour ago"
  if (lower.startsWith("an hour") || lower.startsWith("1 hour"))
    return new Date(now - 60 * 60_000).toISOString();
  // "X hours ago"
  m = lower.match(/^(\d+)\s*hour/);
  if (m) return new Date(now - parseInt(m[1], 10) * 60 * 60_000).toISOString();
  // "yesterday" → ~22h ago for believable variance
  if (lower === "yesterday") return new Date(now - 22 * 60 * 60_000).toISOString();
  // "yesterday HH:MM"
  m = lower.match(/^yesterday\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
    return d.toISOString();
  }
  // "X days ago"
  m = lower.match(/^(\d+)\s*day/);
  if (m) return new Date(now - parseInt(m[1], 10) * 24 * 60 * 60_000).toISOString();
  // Pure "HH:MM" — interpret as today at that time
  m = lower.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const d = new Date();
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0);
    return d.toISOString();
  }
  // If it parses as a date directly, use that
  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) return direct.toISOString();
  // Fallback — recent activity
  return new Date(now - 30 * 60_000).toISOString();
}

/**
 * Diverse mentor pool — realism pass. Used as a deterministic fallback
 * when a task carries no mentor identity from the workspace mock. Names
 * span regions and seniority so the cohort doesn't read as cloned.
 */
const MENTOR_POOL: { name: string; initials: string; role: string }[] = [
  { name: "Rajesh Verma", initials: "RV", role: "Senior Mentor · Backend" },
  { name: "Amelia Stone", initials: "AS", role: "Lead Mentor · Accessibility" },
  { name: "Yusuf Okonkwo", initials: "YO", role: "Senior Mentor · Platform" },
  { name: "Priya Iyer", initials: "PI", role: "Lead Mentor · Design Systems" },
  { name: "Sofia Almeida", initials: "SA", role: "Senior Mentor · Mobile" },
  { name: "Daniel Park", initials: "DP", role: "Lead Mentor · Data" },
  { name: "Ines Vidal", initials: "IV", role: "Senior Mentor · Frontend" },
  { name: "Marcus Chen", initials: "MC", role: "Lead Mentor · DevX" },
];

/** Deterministic mentor pick from task id — keeps assignments stable across reloads. */
function mentorForTaskId(taskId: string): { name: string; initials: string; role: string } {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = (hash * 31 + taskId.charCodeAt(i)) >>> 0;
  }
  return MENTOR_POOL[hash % MENTOR_POOL.length];
}

function buildSeedTasks(): Record<string, Task> {
  const byId: Record<string, Task> = {};

  // 1) Base tasks from workspace mock
  for (const t of contributorTasks) {
    byId[t.id] = {
      id: t.id,
      title: t.title,
      shortDescription: t.description,
      project: t.project,
      portfolio: t.portfolio,
      priority: t.priority,
      skill: t.skill,
      skillLevel: (t.skillLevel as Task["skillLevel"]) ?? "L2",
      payoutAmount: t.payoutAmount ?? "$0",
      state: t.state,
      reworkRound: t.reworkRound ?? 1,
      totalRounds: t.totalRounds ?? 3,
      mentor: t.mentorFeedback?.mentorName
        ? {
            name: t.mentorFeedback.mentorName,
            initials: initialsOf(t.mentorFeedback.mentorName),
            role: "Mentor",
          }
        : mentorForTaskId(t.id),
      deadline: t.deadline,
      deadlineHoursRemaining: t.deadlineHoursRemaining,
      lastActivityAt: humanToIso(t.lastActivityAt),
      progressPct: t.progressPct ?? 0,
      readinessScore: t.readinessScore ?? 0,
      estimatedMinutesRemaining: t.estimatedMinutesRemaining ?? 0,
      acceptanceCriteria: (t.acceptanceCriteria ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        addressed: c.addressed,
      })),
      evidence: [],
      draftNotes: "",
      mentorFeedback: t.mentorFeedback,
      resolvedCorrections: (t.mentorFeedback?.requiredCorrections ?? [])
        .filter((c: MentorCorrection) => c.addressed)
        .map((c) => c.id),
      submissions: [],
      tags: undefined,
    };
  }

  // 2) Rich content overlay for t-4821 (date picker) from sampleWorkroomTask
  if (byId[sampleWorkroomTask.id]) {
    const base = byId[sampleWorkroomTask.id];
    byId[sampleWorkroomTask.id] = {
      ...base,
      brief: sampleWorkroomTask.brief,
      instructions: rich("instructions") as InstructionStep[],
      deliverables: rich("deliverables") as Deliverable[],
      dependencies: rich("dependencies") as Dependency[],
      milestones: rich("milestones") as Milestone[],
      acceptanceCriteria: sampleWorkroomTask.acceptanceCriteria.map((c) => ({
        id: c.id,
        label: c.label,
        addressed: c.addressed,
      })),
      evidence: [...sampleWorkroomTask.evidence.artifacts],
      draftNotes: sampleWorkroomTask.draft.notes,
      draftSavedAt: sampleWorkroomTask.draft.lastSavedAt,
      readinessSignals: sampleWorkroomTask.submissionReadiness.signals,
      externalLinks: sampleWorkroomTask.externalLinks,
      mentorFeedback: sampleWorkroomTask.mentorFeedback,
      reworkRound: sampleWorkroomTask.reworkRound ?? 2,
      totalRounds: sampleWorkroomTask.totalRounds ?? 3,
      progressPct: sampleWorkroomTask.progressPct,
      readinessScore: sampleWorkroomTask.readinessScore,
      estimatedMinutesRemaining: sampleWorkroomTask.estimatedMinutesRemaining,
      state: sampleWorkroomTask.state,
      payoutAmount: sampleWorkroomTask.payoutAmount,
      submissions: sampleWorkroomTask.history.map((h, i) => ({
        round: h.round,
        submittedAt: typeof h.when === "string" ? h.when : "—",
        outcome:
          h.outcome === "failed"
            ? "revision_requested"
            : h.outcome === "passed"
            ? "accepted"
            : "withdrawn",
        mentorNote: h.note,
      })),
      mentor: {
        name: sampleWorkroomTask.mentor.name,
        initials: sampleWorkroomTask.mentor.initials,
        role: sampleWorkroomTask.mentor.role,
      },
    };
  }

  // 3) Augment with revision queue rows (creates new tasks for IDs not in workspace)
  for (const r of revisionRows) {
    const existing = byId[r.taskId];
    const baseLite: Task = existing ?? {
      id: r.taskId,
      title: r.title,
      shortDescription: r.shortDescription,
      project: r.project,
      portfolio: r.portfolio,
      priority: r.priority,
      skill: r.skill.split(" · ")[0] ?? r.skill,
      skillLevel: ((r.skill.split(" · ")[1] as Task["skillLevel"]) ?? "L2"),
      payoutAmount: r.payoutAmount,
      state: "revision_requested",
      reworkRound: r.reworkRound,
      totalRounds: r.totalRounds,
      mentor: r.mentor,
      deadline: r.dueAt,
      deadlineHoursRemaining: r.hoursToDue,
      lastActivityAt: humanToIso(r.lastActivityAt),
      progressPct: r.readinessScore,
      readinessScore: r.readinessScore,
      estimatedMinutesRemaining: 60,
      acceptanceCriteria: [],
      evidence: [],
      draftNotes: r.draftNote ?? "",
      draftSavedAt: r.draftSavedAt,
      mentorFeedback: undefined,
      resolvedCorrections: [],
      submissions: [],
    };
    const mentorFeedback: MentorFeedback = {
      received: true,
      receivedAt: r.feedbackReceivedAt,
      mentorName: r.mentor.name,
      whatWorked: r.whatWorked,
      requiredCorrections: r.corrections.map((c) => ({
        id: c.id,
        criterion: c.criterion,
        description: c.description,
        severity: c.severity,
        addressed: c.resolved,
      })),
      suggestions: r.optionalSuggestions,
    };
    byId[r.taskId] = {
      ...baseLite,
      state: r.state === "resubmitted_under_review" ? "under_review" : r.state === "ready_for_resubmission" ? "ready_for_submission" : r.state === "awaiting_clarification" ? "awaiting_clarification" : "revision_requested",
      revisionSubState: r.state,
      reworkRound: r.reworkRound,
      totalRounds: r.totalRounds,
      mentorFeedback,
      resolvedCorrections: r.corrections.filter((c) => c.resolved).map((c) => c.id),
      readinessScore: r.readinessScore,
      mentor: r.mentor,
      draftNotes: r.draftNote ?? baseLite.draftNotes,
      draftSavedAt: r.draftSavedAt ?? baseLite.draftSavedAt,
      lastActivityAt: humanToIso(r.lastActivityAt),
      deadline: r.dueAt,
      deadlineHoursRemaining: r.hoursToDue,
      payoutAmount: r.payoutAmount,
    };
  }

  // 4) Completed work items
  for (const c of completedWork) {
    const existing = byId[c.taskId];
    const base: Task = existing ?? {
      id: c.taskId,
      title: c.title,
      shortDescription: c.shortSummary,
      project: c.project,
      portfolio: c.portfolio,
      priority: "P1",
      skill: c.skill,
      skillLevel: c.skillLevel,
      payoutAmount: c.payoutAmount,
      state: "completed",
      reworkRound: c.rounds,
      totalRounds: c.rounds,
      mentor: { name: c.mentor.name, initials: c.mentor.initials, role: "Mentor" },
      deadline: c.acceptedAt,
      deadlineHoursRemaining: -24,
      lastActivityAt: c.acceptedAt,
      progressPct: 100,
      readinessScore: 100,
      estimatedMinutesRemaining: 0,
      acceptanceCriteria: [],
      evidence: [],
      draftNotes: "",
      resolvedCorrections: [],
      submissions: [],
    };
    byId[c.taskId] = {
      ...base,
      state: "completed",
      acceptedAt: c.acceptedAt,
      payoutReference: c.payoutReference,
      credential: c.credential
        ? { name: c.credential.name, shareId: c.credential.shareId ?? c.taskId }
        : undefined,
      portfolioEligible: c.portfolioEligible,
      portfolioShared: c.portfolioShared,
      firstTryAccept: c.firstTryAccept,
      whatWorked: c.whatWorked,
      reworkRound: c.rounds,
      totalRounds: c.rounds,
      progressPct: 100,
      readinessScore: 100,
      mentor: { ...base.mentor, ...c.mentor, role: base.mentor.role },
      submissions: [
        ...base.submissions,
        {
          round: c.rounds,
          submittedAt: c.acceptedAt,
          outcome: "accepted",
          mentorNote: c.whatWorked,
        },
      ],
    };
  }

  // 5) SLA realism pass — spread acceptanceArrivedAt across freshness windows
  //
  // Realism hardening: deterministically assign acceptance-arrival timestamps
  // to completed-but-not-yet-accepted tasks so SLA math (watch/breach) has
  // believable variance instead of every delivery looking the same age.
  const pendingAcceptance = Object.values(byId).filter(
    (t) => t.state === "completed" && !t.enterpriseAccepted,
  );
  const slaWindows = [
    2 * 60 * 60_000, //   2h — fresh
    9 * 60 * 60_000, //   9h — fresh
    18 * 60 * 60_000, //  18h — fresh
    28 * 60 * 60_000, //  28h — watch window
    36 * 60 * 60_000, //  36h — watch window
    44 * 60 * 60_000, //  44h — about to breach
    54 * 60 * 60_000, //  54h — breach
    72 * 60 * 60_000, //  72h — breach
  ];
  const now = Date.now();
  pendingAcceptance
    .sort((a, b) => a.id.localeCompare(b.id)) // deterministic order
    .forEach((task, i) => {
      const ms = slaWindows[i % slaWindows.length];
      byId[task.id] = {
        ...task,
        acceptanceArrivedAt: new Date(now - ms).toISOString(),
      };
    });

  return byId;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ─────────────────────── Mock mentor reply scheduler ─────────────────────── */

const PENDING_MENTOR_TIMERS = new Map<string, ReturnType<typeof setTimeout>>();
const MENTOR_REPLY_DELAY_MS = 8_000;

function scheduleMockMentorReply(taskId: string, store: () => ContributorTasksState) {
  // Cancel any prior timer for this task
  const prior = PENDING_MENTOR_TIMERS.get(taskId);
  if (prior) clearTimeout(prior);

  const t = setTimeout(() => {
    const task = store().get(taskId);
    if (!task || task.state !== "under_review") return;

    // Demo-friendly decision logic:
    //   - Final round (round >= totalRounds) → always approve. Prevents
    //     a "perpetual revision" cycle that breaks stakeholder demos.
    //   - First submission → revision_requested (shows the revision flow).
    //   - Mid-cycle resubmits → alternate by round parity.
    let decision: "approve" | "revise";
    if (task.reworkRound >= task.totalRounds) {
      decision = "approve";
    } else if (task.reworkRound === 1) {
      decision = "revise";
    } else {
      decision = task.reworkRound % 2 === 0 ? "approve" : "revise";
    }

    store().mentorRespond(taskId, decision);
  }, MENTOR_REPLY_DELAY_MS);

  PENDING_MENTOR_TIMERS.set(taskId, t);
}

/* ─────────────────────── Store ─────────────────────── */

const STORAGE_KEY = "contributor-tasks-store-v1";

/** Seeded historical activity backlog — gives the demo a believable past
 * before the contributor mutates anything. Newest first. */
function buildSeedActivity(): ActivityEvent[] {
  return [];
}

export const useContributorTasksStore = create<ContributorTasksState>()(
  persist(
    (set, get) => ({
      tasksById: buildSeedTasks(),
      activity: buildSeedActivity(),
      hydratedAt: nowIso(),

      list: () => Object.values(get().tasksById),
      get: (id) => get().tasksById[id],
      byStates: (states) =>
        Object.values(get().tasksById).filter((t) => states.includes(t.state)),

      acceptTask: (id) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t || (t.state !== "assigned" && t.state !== "accepted")) return s;
          return mutateTask(s, id, {
            state: "accepted",
            acceptedAt: new Date().toLocaleString(),
            lastActivityAt: "just now",
          }, {
            kind: "accepted",
            detail: `Accepted ${t.title}`,
          });
        }),

      saveDraft: (id, notes) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          // Auto-advance accepted → in_progress on first draft save
          const nextState: ContributorState =
            t.state === "accepted" || t.state === "assigned" ? "in_progress" : t.state;
          return mutateTask(
            s,
            id,
            {
              draftNotes: notes,
              draftSavedAt: "just now",
              lastActivityAt: "just now",
              state: nextState,
            },
            {
              kind: "draft_saved",
              detail: `Saved draft notes for ${t.title}`,
            }
          );
        }),

      addEvidence: (id, artifact) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          return mutateTask(
            s,
            id,
            {
              evidence: [artifact, ...t.evidence],
              lastActivityAt: "just now",
            },
            {
              kind: "evidence_added",
              detail: `Uploaded ${artifact.name} to ${t.title}`,
            }
          );
        }),

      removeEvidence: (id, artifactId) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          return mutateTask(s, id, {
            evidence: t.evidence.filter((a) => a.id !== artifactId),
            lastActivityAt: "just now",
          });
        }),

      setReadiness: (id, score) =>
        set((s) => mutateTask(s, id, { readinessScore: Math.max(0, Math.min(100, score)) })),

      toggleCorrectionResolved: (id, correctionId) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          const has = t.resolvedCorrections.includes(correctionId);
          const nextResolved = has
            ? t.resolvedCorrections.filter((c) => c !== correctionId)
            : [...t.resolvedCorrections, correctionId];

          // Auto-advance revision sub-state when all corrections resolved
          const allCorrections = t.mentorFeedback?.requiredCorrections ?? [];
          const allResolvedNow = allCorrections.every((c) =>
            nextResolved.includes(c.id)
          );
          let nextSub = t.revisionSubState;
          let nextState = t.state;
          if (t.state === "revision_requested" || t.state === "ready_for_submission") {
            if (allResolvedNow && allCorrections.length > 0) {
              nextSub = "ready_for_resubmission";
              nextState = "ready_for_submission";
            } else if (nextResolved.length > 0) {
              nextSub = "in_correction";
              nextState = "revision_requested";
            } else {
              nextSub = "feedback_received";
              nextState = "revision_requested";
            }
          }
          return mutateTask(
            s,
            id,
            {
              resolvedCorrections: nextResolved,
              revisionSubState: nextSub,
              state: nextState,
              lastActivityAt: "just now",
              readinessScore: Math.min(
                100,
                Math.max(t.readinessScore, allResolvedNow ? 95 : t.readinessScore + 5)
              ),
            },
            !has
              ? {
                  kind: "correction_resolved",
                  detail: `Marked correction addressed on ${t.title}`,
                }
              : undefined
          );
        }),

      setRevisionSubState: (id, sub) =>
        set((s) => mutateTask(s, id, { revisionSubState: sub })),

      submitTask: (id) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          const round = t.reworkRound || 1;
          const next = mutateTask(
            s,
            id,
            {
              state: "under_review",
              revisionSubState: "resubmitted_under_review",
              lastActivityAt: "just now",
              progressPct: 100,
              submissions: [
                ...t.submissions,
                {
                  round,
                  submittedAt: new Date().toLocaleString(),
                  outcome: "pending",
                },
              ],
            },
            {
              kind: "submitted",
              detail: `Submitted ${t.title} (round ${round})`,
            }
          );
          // Schedule mock mentor reply
          setTimeout(() => scheduleMockMentorReply(id, get), 0);
          return next;
        }),

      resubmitTask: (id) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          const round = (t.reworkRound || 1) + 1;
          const next = mutateTask(
            s,
            id,
            {
              state: "under_review",
              revisionSubState: "resubmitted_under_review",
              reworkRound: round,
              lastActivityAt: "just now",
              progressPct: 100,
              submissions: [
                ...t.submissions,
                {
                  round,
                  submittedAt: new Date().toLocaleString(),
                  outcome: "pending",
                },
              ],
            },
            {
              kind: "resubmitted",
              detail: `Resubmitted ${t.title} (round ${round})`,
            }
          );
          setTimeout(() => scheduleMockMentorReply(id, get), 0);
          return next;
        }),

      mentorRespond: (id, decision, note) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;

          // Mark last submission's outcome
          const submissions = [...t.submissions];
          const last = submissions[submissions.length - 1];
          if (last && last.outcome === "pending") {
            submissions[submissions.length - 1] = {
              ...last,
              outcome: decision === "approve" ? "accepted" : "revision_requested",
              mentorNote: note,
            };
          }

          if (decision === "approve") {
            return mutateTask(
              s,
              id,
              {
                state: "completed",
                revisionSubState: undefined,
                acceptedAt: new Date().toLocaleString(),
                payoutReference: `TRX-${Math.floor(3000 + Math.random() * 999)}`,
                whatWorked:
                  note ??
                  t.mentorFeedback?.whatWorked ??
                  "Clean submission. Tests are thorough and evidence is complete.",
                firstTryAccept: t.firstTryAccept ?? t.reworkRound === 1,
                portfolioEligible: t.portfolioEligible ?? true,
                lastActivityAt: "just now",
                submissions,
              },
              {
                kind: "approved",
                detail: `Mentor accepted ${t.title}`,
                mentor: t.mentor.name,
              }
            );
          }

          // Revision requested
          const newFeedback: MentorFeedback = t.mentorFeedback ?? {
            received: true,
            receivedAt: "just now",
            mentorName: t.mentor.name,
            whatWorked:
              "Strong submission overall — a couple of targeted fixes will close this out.",
            requiredCorrections: [
              {
                id: `fc-${id}-${t.reworkRound}-1`,
                criterion: "Polish",
                description: "Tighten evidence on the most-visible criteria before resubmission.",
                severity: "major",
                addressed: false,
              },
            ],
            suggestions: [],
          };
          return mutateTask(
            s,
            id,
            {
              state: "revision_requested",
              revisionSubState: "feedback_received",
              mentorFeedback: newFeedback,
              resolvedCorrections: [],
              lastActivityAt: "just now",
              readinessScore: Math.max(50, t.readinessScore - 20),
              submissions,
            },
            {
              kind: "feedback_received",
              detail: `Mentor sent revision feedback on ${t.title}`,
              mentor: t.mentor.name,
            }
          );
        }),

      withdraw: (id) =>
        set((s) => {
          const t = s.tasksById[id];
          if (!t) return s;
          const submissions = [...t.submissions];
          const last = submissions[submissions.length - 1];
          if (last && last.outcome === "pending") {
            submissions[submissions.length - 1] = { ...last, outcome: "withdrawn" };
          }
          return mutateTask(s, id, {
            state: "in_progress",
            revisionSubState: undefined,
            lastActivityAt: "just now",
            submissions,
          });
        }),

      enterpriseAcceptDelivery: (id, note, deciderInitials) => {
        // Snapshot for potential rollback if persistence fails.
        const previousTask = get().tasksById[id];
        if (!previousTask) return;
        if (
          previousTask.state !== "completed" &&
          previousTask.state !== "approved"
        )
          return;

        // 1) Optimistic update — user sees the result instantly.
        set((s) =>
          mutateTask(
            s,
            id,
            {
              state: "approved",
              enterpriseAccepted: true,
              enterpriseDecisionAt: new Date().toLocaleString(),
              enterpriseDecisionNote: note,
              enterpriseDecisionBy: deciderInitials ?? "EN",
              lastActivityAt: "just now",
            },
            {
              kind: "approved",
              detail: `Enterprise accepted delivery of ${previousTask.title}`,
              mentor: previousTask.mentor.name,
            },
          ),
        );

        // 2) Persist the audit-grade decision record to Postgres.
        // 3) On failure, roll back the optimistic update + show error toast.
        //
        // Note on recipientUserId: omitted intentionally — the task store
        // tasks are mock data whose `contributorId` is a display name,
        // not a real User.id. When M9 (Task model in Postgres) lands,
        // the route resolves the recipient server-side from
        // `task.contributorUserId` and this caller stops needing it.
        // taskTitle still flows through so audit + notification copy are
        // human-readable today.
        void persistDecisionWithRollback({
          taskId: id,
          previousTask,
          run: () =>
            acceptanceApi.accept(id, {
              note,
              deciderInitials,
              taskTitle: previousTask.title,
            }),
          rollbackToastTitle: "Acceptance could not be saved",
        });
      },

      enterpriseRequestRework: (id, reason, deciderInitials) => {
        const previousTask = get().tasksById[id];
        if (!previousTask) return;
        if (
          previousTask.state !== "completed" &&
          previousTask.state !== "approved"
        )
          return;

        // 1) Optimistic update.
        set((s) => applyReworkLocally(s, id, reason, deciderInitials));

        // 2) Persist + rollback on failure.
        void persistDecisionWithRollback({
          taskId: id,
          previousTask,
          run: () =>
            acceptanceApi.rework(id, {
              reason,
              deciderInitials,
              taskTitle: previousTask.title,
            }),
          rollbackToastTitle: "Rework request could not be saved",
        });
      },

      reseed: () =>
        set({
          tasksById: buildSeedTasks(),
          activity: buildSeedActivity(),
          hydratedAt: nowIso(),
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasksById: state.tasksById,
        activity: state.activity,
        hydratedAt: state.hydratedAt,
      }),
      // Bumped to v4 during Enterprise Review Workspace V2 (Phase 1B Wave 2)
      // to seed enterpriseAccepted/acceptanceArrivedAt fields on Task. Forces
      // clean re-seed for stakeholders carrying older state.
      version: 4,
      // On rehydration, re-arm the mock mentor reply scheduler for any task
      // that's mid-flight in `under_review`. Without this, reloading mid-flow
      // strands tasks in under_review indefinitely (lifecycle-validation D-1).
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const underReview = Object.values(state.tasksById).filter(
          (t) => t.state === "under_review",
        );
        for (const t of underReview) {
          // Defer so the store is fully ready before we read it.
          setTimeout(() => scheduleMockMentorReply(t.id, () => useContributorTasksStore.getState()), 0);
        }
      },
    }
  )
);

/* ─────────────────────── Internal helpers ─────────────────────── */

/**
 * Build the local state mutation that applies an enterprise rework
 * request. Extracted from the inline body so the optimistic update
 * path and the rollback fixture both have a single definition.
 */
function applyReworkLocally(
  s: ContributorTasksState,
  id: string,
  reason: string,
  deciderInitials?: string,
): Partial<ContributorTasksState> {
  const t = s.tasksById[id];
  if (!t) return s;

  const reworkRound = (t.reworkRound ?? 1) + 1;
  const synthesizedFeedback: MentorFeedback = {
    received: true,
    receivedAt: "just now",
    mentorName: `Enterprise rework · ${deciderInitials ?? "EN"}`,
    whatWorked:
      t.whatWorked ??
      "Submission cleared mentor review; enterprise requesting refinement before final acceptance.",
    requiredCorrections: [
      {
        id: `er-${id}-${reworkRound}`,
        criterion: "Enterprise acceptance refinement",
        description: reason,
        severity: "major" as const,
        addressed: false,
      },
    ],
    suggestions: [],
  };

  return mutateTask(
    s,
    id,
    {
      state: "revision_requested",
      revisionSubState: "feedback_received",
      mentorFeedback: synthesizedFeedback,
      resolvedCorrections: [],
      enterpriseAccepted: false,
      enterpriseDecisionAt: new Date().toLocaleString(),
      enterpriseDecisionNote: reason,
      enterpriseDecisionBy: deciderInitials ?? "EN",
      reworkRound,
      readinessScore: Math.max(50, t.readinessScore - 30),
      lastActivityAt: "just now",
    },
    {
      kind: "feedback_received",
      detail: `Enterprise requested rework on ${t.title}`,
    },
  );
}

/**
 * Fire-and-forget persistence wrapper for enterprise decisions.
 *
 * Calls the persistence API in the background. On any failure
 * (network, 4xx, 5xx) rolls the optimistic local update back to the
 * snapshot the caller captured before the mutation, then surfaces a
 * toast so the operator knows the decision did not land.
 *
 * Why fire-and-forget: the mutator API remains synchronous so existing
 * call sites (`onClick={() => acceptDelivery(...)}`) do not need to
 * change. The trade-off is the user sees the optimistic state briefly
 * even when persistence fails — but rollback + toast within ~1s is
 * the right UX trade for a Phase 1B MVP without a backend yet wired.
 */
function persistDecisionWithRollback(opts: {
  taskId: string;
  previousTask: Task;
  run: () => Promise<unknown>;
  rollbackToastTitle: string;
}): void {
  opts.run().catch((err: unknown) => {
    // Roll back the optimistic update.
    useContributorTasksStore.setState((state) => ({
      tasksById: { ...state.tasksById, [opts.taskId]: opts.previousTask },
    }));

    const detail =
      err instanceof AcceptanceApiError
        ? `Server returned ${err.status}. Your local view has been reverted.`
        : "The server could not be reached. Your local view has been reverted.";
    toast.error(opts.rollbackToastTitle, detail);

    // eslint-disable-next-line no-console
    console.warn("[acceptance] rollback after persistence failure", err);
  });
}

function mutateTask(
  state: ContributorTasksState,
  id: string,
  patch: Partial<Task>,
  activity?: Omit<ActivityEvent, "id" | "at" | "taskId">
): Partial<ContributorTasksState> {
  const t = state.tasksById[id];
  if (!t) return state;
  const next = { ...t, ...patch };
  const updates: Partial<ContributorTasksState> = {
    tasksById: { ...state.tasksById, [id]: next },
  };
  if (activity) {
    const event: ActivityEvent = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      taskId: id,
      at: "just now",
      ...activity,
    };
    updates.activity = [event, ...state.activity].slice(0, 50);
  }
  return updates;
}

/* ─────────────────────── Public selectors ─────────────────────── */

export type TaskFilter = (t: Task) => boolean;

export const TaskSelectors = {
  active: (t: Task) =>
    ["accepted", "in_progress", "blocked", "awaiting_clarification"].includes(t.state),
  assigned: (t: Task) => t.state === "assigned",
  needsAttention: (t: Task) =>
    t.state === "revision_requested" || t.state === "blocked",
  revision: (t: Task) =>
    t.state === "revision_requested" ||
    (t.state === "awaiting_clarification" && t.revisionSubState !== undefined) ||
    (t.state === "ready_for_submission" && t.revisionSubState === "ready_for_resubmission") ||
    (t.state === "under_review" && t.revisionSubState === "resubmitted_under_review" && t.reworkRound > 1),
  underReview: (t: Task) => t.state === "under_review",
  readyToSubmit: (t: Task) => t.state === "ready_for_submission",
  completed: (t: Task) => t.state === "approved" || t.state === "completed",
} as const;
