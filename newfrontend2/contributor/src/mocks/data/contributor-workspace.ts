/**
 * Contributor Portal V2 — workspace mock data.
 *
 * Productivity-first shape. Built around the 11-state contributor lifecycle:
 *   assigned · accepted · in_progress · blocked · awaiting_clarification ·
 *   ready_for_submission · under_review · revision_requested · approved ·
 *   completed · escalated
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

export type ContributorState =
  | "assigned"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "awaiting_clarification"
  | "ready_for_submission"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "completed"
  | "escalated";

export type ContributorPriority = "P0" | "P1" | "P2";

export interface AcceptanceCriterion {
  id: string;
  label: string;
  addressed: boolean;
}

export interface MentorCorrection {
  id: string;
  criterion: string;
  description: string;
  severity: "blocker" | "major" | "nit";
  addressed: boolean;
}

export interface MentorFeedback {
  received: boolean;
  receivedAt?: string;
  mentorName?: string;
  whatWorked?: string;
  requiredCorrections?: MentorCorrection[];
  suggestions?: string[];
}

export interface ContributorTask {
  id: string;
  title: string;
  description: string;
  project: string;
  portfolio: string;
  priority: ContributorPriority;
  skill: string;
  skillLevel: string;
  deadline: string;
  deadlineHoursRemaining: number;
  state: ContributorState;
  progressPct: number;
  estimatedMinutesRemaining: number;
  payoutAmount: string;
  acceptanceCriteria: AcceptanceCriterion[];
  evidenceCompleteness: number;
  readinessScore: number;
  blockers?: { reason: string; expectedResolution?: string }[];
  mentorFeedback?: MentorFeedback;
  reworkRound?: number;
  totalRounds?: number;
  aiCue?: string;
  aiNextAction?: string;
  lastActivityAt: string;
  reviewWindowHours?: number;
  nextAction: string;
}

/* ─────────────────────── Tasks ─────────────────────── */

export const contributorTasks: ContributorTask[] = [
  {
    id: "t-4821",
    title: "Build accessible date picker",
    description: "WCAG 2.2 AA accessible date picker for the Helios design system",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    priority: "P0",
    skill: "React",
    skillLevel: "L3",
    deadline: "2026-05-26 18:00",
    deadlineHoursRemaining: 56,
    state: "in_progress",
    progressPct: 68,
    estimatedMinutesRemaining: 90,
    payoutAmount: "$240",
    acceptanceCriteria: [
      { id: "c1", label: "Component renders with all expected props", addressed: true },
      { id: "c2", label: "Keyboard navigation works (arrow keys, tab, escape)", addressed: true },
      { id: "c3", label: "Screen reader announcements correct", addressed: true },
      { id: "c4", label: "Focus trap inside popover", addressed: false },
      { id: "c5", label: "Test coverage ≥ 80%", addressed: false },
      { id: "c6", label: "Storybook stories for 3 states", addressed: false },
    ],
    evidenceCompleteness: 65,
    readinessScore: 72,
    aiCue: "Two criteria away from ready · focus trap is the biggest remaining gap",
    aiNextAction: "Wrap popover in <FocusScope> from react-aria",
    lastActivityAt: "an hour ago",
    nextAction: "Resume in workroom",
  },
  {
    id: "t-9301",
    title: "Feature flag SDK · evaluation API",
    description: "Client SDK with timeout handling and configurable evaluation",
    project: "Acme-Helios",
    portfolio: "Platform",
    priority: "P1",
    skill: "TypeScript",
    skillLevel: "L3",
    deadline: "2026-05-25 18:00",
    deadlineHoursRemaining: 32,
    state: "in_progress",
    progressPct: 40,
    estimatedMinutesRemaining: 180,
    payoutAmount: "$180",
    acceptanceCriteria: [
      { id: "c1", label: "Evaluation API returns within 250ms p95", addressed: true },
      { id: "c2", label: "Timeout configurable per init", addressed: true },
      { id: "c3", label: "Retry logic for transient failures", addressed: false },
      { id: "c4", label: "Type definitions exported", addressed: false },
      { id: "c5", label: "Documentation with examples", addressed: false },
    ],
    evidenceCompleteness: 45,
    readinessScore: 50,
    aiCue: "Solid start · documentation will likely take the longest remaining time",
    aiNextAction: "Draft the documentation outline",
    lastActivityAt: "3 hours ago",
    nextAction: "Continue scoring",
  },
  {
    id: "t-6710",
    title: "Stripe webhook handler",
    description: "Retry + idempotency for Stripe webhook events",
    project: "Acme-Helios",
    portfolio: "Payments",
    priority: "P1",
    skill: "Node",
    skillLevel: "L3",
    deadline: "2026-05-24 18:00",
    deadlineHoursRemaining: 8,
    state: "ready_for_submission",
    progressPct: 96,
    estimatedMinutesRemaining: 10,
    payoutAmount: "$210",
    acceptanceCriteria: [
      { id: "c1", label: "Idempotency on retries", addressed: true },
      { id: "c2", label: "Test coverage ≥ 80%", addressed: true },
      { id: "c3", label: "Error path tests", addressed: true },
      { id: "c4", label: "Retry policy documented", addressed: true },
    ],
    evidenceCompleteness: 96,
    readinessScore: 92,
    aiCue: "Looking great · ready for a final review pass and submit",
    aiNextAction: "Run final coverage report and submit",
    lastActivityAt: "30 minutes ago",
    nextAction: "Review and submit",
  },
  {
    id: "t-4480",
    title: "Auth tokens rotation script",
    description: "KMS-backed token rotation with audit log",
    project: "Acme-Helios",
    portfolio: "Security",
    priority: "P1",
    skill: "Node",
    skillLevel: "L3",
    deadline: "2026-05-25 18:00",
    deadlineHoursRemaining: 24,
    state: "awaiting_clarification",
    progressPct: 55,
    estimatedMinutesRemaining: 60,
    payoutAmount: "$200",
    acceptanceCriteria: [
      { id: "c1", label: "Rotation runs on configurable schedule", addressed: true },
      { id: "c2", label: "KMS-backed key storage", addressed: true },
      { id: "c3", label: "Audit log captures every rotation", addressed: false },
    ],
    evidenceCompleteness: 55,
    readinessScore: 60,
    aiCue: "Waiting on a reply from your mentor about audit log scope",
    lastActivityAt: "8 hours ago",
    nextAction: "View thread",
  },
  {
    id: "t-3417",
    title: "Onboarding wizard rebuild",
    description: "Multi-step form with client-side validation",
    project: "Stratum-Pay",
    portfolio: "Onboarding",
    priority: "P2",
    skill: "React",
    skillLevel: "L2",
    deadline: "2026-05-26 18:00",
    deadlineHoursRemaining: 56,
    state: "revision_requested",
    progressPct: 75,
    estimatedMinutesRemaining: 90,
    payoutAmount: "$140",
    reworkRound: 1,
    totalRounds: 3,
    acceptanceCriteria: [
      { id: "c1", label: "All 5 steps render correctly", addressed: true },
      { id: "c2", label: "Validation messages clear", addressed: true },
      { id: "c3", label: "Validation tests for invalid input", addressed: false },
    ],
    evidenceCompleteness: 75,
    readinessScore: 70,
    mentorFeedback: {
      received: true,
      receivedAt: "yesterday",
      mentorName: "R. Verma",
      whatWorked:
        "Wizard structure is clear · step transitions are smooth · the field components are well-composed.",
      requiredCorrections: [
        {
          id: "fc1",
          criterion: "Testing",
          description:
            "Add validation tests for invalid input cases (empty fields, malformed email, out-of-range numbers).",
          severity: "major",
          addressed: false,
        },
      ],
      suggestions: ["Consider extracting the validation rules into a separate utility."],
    },
    aiCue: "One required correction to address · should take about 90 minutes",
    aiNextAction: "Add validation tests for invalid input cases",
    lastActivityAt: "yesterday",
    nextAction: "See what to fix",
  },
  {
    id: "t-2516",
    title: "Dashboard charting library",
    description: "Recharts-based charting with accessibility",
    project: "Atlas-Insights",
    portfolio: "Analytics",
    priority: "P2",
    skill: "React",
    skillLevel: "L2",
    deadline: "2026-05-27 18:00",
    deadlineHoursRemaining: 80,
    state: "assigned",
    progressPct: 0,
    estimatedMinutesRemaining: 180,
    payoutAmount: "$160",
    acceptanceCriteria: [
      { id: "c1", label: "Chart components (line, bar, area)", addressed: false },
      { id: "c2", label: "Accessible color palette", addressed: false },
      { id: "c3", label: "Stories for each chart", addressed: false },
    ],
    evidenceCompleteness: 0,
    readinessScore: 0,
    aiCue: "Matches your strength in React L2 · estimated 3 hours from past similar tasks",
    aiNextAction: "Review the brief and accept when ready",
    lastActivityAt: "—",
    nextAction: "Review task",
  },
  {
    id: "t-5520",
    title: "PII redaction module",
    description: "Pseudonymization with key rotation",
    project: "Helios-Vault",
    portfolio: "Privacy",
    priority: "P0",
    skill: "Node",
    skillLevel: "L3",
    deadline: "2026-05-25 18:00",
    deadlineHoursRemaining: 30,
    state: "under_review",
    progressPct: 100,
    estimatedMinutesRemaining: 0,
    payoutAmount: "$280",
    acceptanceCriteria: [
      { id: "c1", label: "Pseudonymization key rotation", addressed: true },
      { id: "c2", label: "KMS integration", addressed: true },
      { id: "c3", label: "Compliance audit log", addressed: true },
    ],
    evidenceCompleteness: 100,
    readinessScore: 95,
    reviewWindowHours: 12,
    aiCue: "Mentor is reviewing · estimated 12h review window",
    lastActivityAt: "yesterday",
    nextAction: "Awaiting mentor review",
  },
  {
    id: "t-9810",
    title: "Internal payroll connector",
    description: "Connector with field-level audit",
    project: "Stratum-Pay",
    portfolio: "Finance",
    priority: "P0",
    skill: "Node",
    skillLevel: "L3",
    deadline: "2026-05-30 18:00",
    deadlineHoursRemaining: 144,
    state: "blocked",
    progressPct: 60,
    estimatedMinutesRemaining: 120,
    payoutAmount: "$300",
    blockers: [
      {
        reason: "Awaiting customer SOW amendment confirmation",
        expectedResolution: "by 2026-05-26",
      },
    ],
    acceptanceCriteria: [
      { id: "c1", label: "Connector pulls authorized fields", addressed: true },
      { id: "c2", label: "Audit log captures access", addressed: true },
      { id: "c3", label: "Documentation for ops team", addressed: false },
    ],
    evidenceCompleteness: 60,
    readinessScore: 65,
    aiCue: "Paused while customer legal finalizes — your work is safely saved",
    lastActivityAt: "2 days ago",
    nextAction: "Paused — we'll reach out",
  },
  {
    id: "t-7128",
    title: "Permissions matrix UI",
    description: "Role/permission grid with edit-in-place",
    project: "Acme-Helios",
    portfolio: "Admin",
    priority: "P1",
    skill: "React",
    skillLevel: "L3",
    deadline: "2026-05-26 18:00",
    deadlineHoursRemaining: 56,
    state: "accepted",
    progressPct: 10,
    estimatedMinutesRemaining: 240,
    payoutAmount: "$220",
    acceptanceCriteria: [
      { id: "c1", label: "Grid renders all roles × permissions", addressed: false },
      { id: "c2", label: "Edit-in-place with confirmation", addressed: false },
      { id: "c3", label: "RBAC rules validated", addressed: false },
    ],
    evidenceCompleteness: 5,
    readinessScore: 10,
    aiCue: "Just started · here's a similar past submission for reference",
    aiNextAction: "Open workroom and review the spec",
    lastActivityAt: "5 minutes ago",
    nextAction: "Open workroom",
  },
  {
    id: "t-2114",
    title: "Mobile push notifications",
    description: "FCM + APNS adapter",
    project: "Atlas-Insights",
    portfolio: "Mobile",
    priority: "P1",
    skill: "Mobile",
    skillLevel: "L3",
    deadline: "2026-05-23 18:00",
    deadlineHoursRemaining: -16,
    state: "approved",
    progressPct: 100,
    estimatedMinutesRemaining: 0,
    payoutAmount: "$190",
    acceptanceCriteria: [
      { id: "c1", label: "FCM adapter works", addressed: true },
      { id: "c2", label: "APNS adapter works", addressed: true },
      { id: "c3", label: "Retry on transient failures", addressed: true },
    ],
    evidenceCompleteness: 100,
    readinessScore: 96,
    aiCue: "Accepted yesterday · keep the momentum going",
    lastActivityAt: "yesterday",
    nextAction: "View portfolio entry",
  },
];

/* ─────────────────────── KPIs ─────────────────────── */

export interface ProductivityKpi {
  key: string;
  label: string;
  value: string;
  delta?: string;
  caption?: string;
  tone?: "positive" | "neutral" | "warning";
}

export const productivityKpis: ProductivityKpi[] = [
  {
    key: "active",
    label: "Active assignments",
    value: "5",
    caption: "Tasks you're working on",
  },
  {
    key: "due_soon",
    label: "Due soon",
    value: "2",
    caption: "Within 24 hours",
    tone: "warning",
  },
  {
    key: "revisions",
    label: "Pending revisions",
    value: "1",
    caption: "Action needed",
    tone: "warning",
  },
  {
    key: "completed",
    label: "Completed this week",
    value: "4",
    delta: "+1 vs last week",
    caption: "Submissions accepted",
    tone: "positive",
  },
  {
    key: "progress",
    label: "Reliability",
    value: "87",
    delta: "▲ 4 this quarter",
    caption: "Acceptance rate trend",
    tone: "positive",
  },
  {
    key: "earnings",
    label: "Earnings this week",
    value: "$640",
    delta: "$1,420 pending",
    caption: "Disbursed this week",
    tone: "positive",
  },
];

/* ─────────────────────── AI suggestions ─────────────────────── */

export interface AiSuggestion {
  id: string;
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  cta: string;
  kind: "next_task" | "submission_check" | "revision_help" | "workflow_tip";
  relatedTaskId?: string;
}

export const aiSuggestions: AiSuggestion[] = [
  {
    id: "ai-1",
    title: "Stripe webhook handler is ready to submit",
    detail:
      "You're at 92% readiness with all criteria addressed. Quick final review and you can submit confidently.",
    confidence: "high",
    cta: "Review and submit",
    kind: "submission_check",
    relatedTaskId: "t-6710",
  },
  {
    id: "ai-2",
    title: "Wrap your date picker popover in FocusScope",
    detail:
      "Two criteria from acceptance — focus trap is the biggest remaining gap. react-aria's FocusScope is a clean fit.",
    confidence: "high",
    cta: "Open workroom",
    kind: "workflow_tip",
    relatedTaskId: "t-4821",
  },
  {
    id: "ai-3",
    title: "Onboarding wizard revision · here's a starting point",
    detail:
      "For the validation tests correction, a similar pattern was used in your accepted submission from May 10.",
    confidence: "medium",
    cta: "View revision",
    kind: "revision_help",
    relatedTaskId: "t-3417",
  },
  {
    id: "ai-4",
    title: "Charting library task matches your strength",
    detail:
      "Recharts + accessibility lines up well with your React L2 work. Most contributors finish this in 3 hours.",
    confidence: "high",
    cta: "Review task",
    kind: "next_task",
    relatedTaskId: "t-2516",
  },
];

/* ─────────────────────── Momentum ─────────────────────── */

export interface MomentumSignals {
  acceptedThisWeek: number;
  acceptedLastWeek: number;
  streak: number;
  reliability: number;
  reliabilityTrend: number;
  skillProgress: { skill: string; level: string; nextLevelProgress: number }[];
  recentWins: { taskTitle: string; acceptedAt: string; payout: string }[];
}

export const momentumSignals: MomentumSignals = {
  acceptedThisWeek: 4,
  acceptedLastWeek: 3,
  streak: 6,
  reliability: 87,
  reliabilityTrend: 4,
  skillProgress: [
    { skill: "React", level: "L3", nextLevelProgress: 62 },
    { skill: "TypeScript", level: "L3", nextLevelProgress: 48 },
    { skill: "A11y", level: "L2", nextLevelProgress: 81 },
    { skill: "Node", level: "L3", nextLevelProgress: 55 },
  ],
  recentWins: [
    { taskTitle: "Mobile push notifications", acceptedAt: "yesterday", payout: "$190" },
    { taskTitle: "Auth modal redesign · v1", acceptedAt: "2 days ago", payout: "$220" },
    { taskTitle: "Analytics SQL schema", acceptedAt: "3 days ago", payout: "$150" },
  ],
};

/* ─────────────────────── State display canon ─────────────────────── */

export const contributorStateLabel: Record<ContributorState, string> = {
  assigned: "New",
  accepted: "Accepted",
  in_progress: "In progress",
  blocked: "Paused",
  awaiting_clarification: "Awaiting reply",
  ready_for_submission: "Ready to submit",
  under_review: "Under review",
  revision_requested: "Action needed",
  approved: "Accepted",
  completed: "Completed",
  escalated: "Under platform review",
};

export const priorityLabel: Record<ContributorPriority, string> = {
  P0: "High priority",
  P1: "Standard",
  P2: "Flexible",
};

/* ─────────────────────── Helpers ─────────────────────── */

export function formatHoursToDeadline(hours: number): string {
  if (hours < 0) return `${Math.abs(hours)}h past deadline`;
  if (hours === 0) return "due now";
  if (hours < 24) return `${hours}h left`;
  const d = Math.floor(hours / 24);
  return `${d}d ${hours % 24}h left`;
}

export function isUrgent(task: ContributorTask): boolean {
  return (
    task.deadlineHoursRemaining <= 12 &&
    task.state !== "approved" &&
    task.state !== "completed" &&
    task.state !== "under_review"
  );
}

export function isActive(task: ContributorTask): boolean {
  return ["accepted", "in_progress", "awaiting_clarification", "ready_for_submission"].includes(
    task.state
  );
}
