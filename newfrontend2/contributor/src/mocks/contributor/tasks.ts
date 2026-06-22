/**
 * Mock tasks covering every lifecycle state from spec §7.1.
 *
 *   matched / accepted / in_progress / blocked / awaiting_clarification /
 *   ready_for_submission / under_review / revision_requested /
 *   accepted (completed) / rejected
 *
 * The shape matches `ContributorTaskSummary` + workroom fields so the
 * UI can read these without backend changes.
 */

export type ContributorTaskMockStatus =
  | "matched"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "awaiting_clarification"
  | "ready_for_submission"
  | "submitted"
  | "under_review"
  | "feedback_requested"
  | "resubmitted"
  | "completed"
  | "rejected";

export interface MockTask {
  id: string;
  externalKey: string;
  title: string;
  status: ContributorTaskMockStatus;
  description: string;
  acceptanceCriteria: string[];
  requiredSkills: string[];
  estimatedHours: number;
  complexity: "small" | "medium" | "large";
  agreedCurrency: "INR";
  agreedRatePerHour: number;
  assignedAt: string;
  acceptedAt: string | null;
  /** When the task hit a terminal state (completed / rejected). */
  decidedAt: string | null;
  /** SLA deadline in ISO; used by the list + workroom Due column. */
  dueAt: string;
  sow: { id: string; title: string; tenantId: string; tenantName: string };
  milestone: { id: string; name: string } | null;
  /** Mentor / reviewer assigned to this task. */
  mentor: { id: string; name: string; initials: string; role: string };
  /** Round counter for revision tracking (1-based). */
  round: number;
  totalRounds: number;
  /** Per-criterion 'addressed' flags. Same length as acceptanceCriteria. */
  criteriaAddressed: boolean[];
  /** Readiness 0–100 — visible in list + workroom footer. */
  readinessPct: number;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * 3_600_000).toISOString();

export const MOCK_TASKS: MockTask[] = [
  // ── matched (just assigned, needs Accept/Decline) ────────────────────
  {
    id: "task-001",
    externalKey: "TSK-001",
    title: "Date Picker · FocusScope sketch",
    status: "matched",
    description:
      "Implement focus management for the date picker overlay. Trap focus on open and restore on close. WCAG 2.1 AA, keyboard nav, two months visible.",
    acceptanceCriteria: [
      "Focus trap on open",
      "ESC closes and restores focus",
      "TAB cycles within picker",
      "SHIFT-TAB reverses cycle",
      "Screen reader announces month change",
      "Mobile touch outside dismisses",
    ],
    requiredSkills: ["React", "TypeScript", "Accessibility"],
    estimatedHours: 8,
    complexity: "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: 1500,
    assignedAt: hoursAgo(3),
    acceptedAt: null,
    decidedAt: null,
    dueAt: hoursFromNow(72),
    sow: { id: "sow-helios", title: "Helios Design System", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: { id: "ms-001", name: "Picker components" },
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 3,
    criteriaAddressed: [false, false, false, false, false, false],
    readinessPct: 0,
  },

  // ── accepted (just accepted, not started) ────────────────────────────
  {
    id: "task-002",
    externalKey: "TSK-002",
    title: "Search shortcuts",
    status: "accepted",
    description: "Add keyboard shortcuts to the global search modal (⌘K, /).",
    acceptanceCriteria: [
      "⌘K opens search anywhere",
      "/ shortcut works on text-input-free pages",
      "ESC closes",
    ],
    requiredSkills: ["React", "TypeScript"],
    estimatedHours: 4,
    complexity: "small",
    agreedCurrency: "INR",
    agreedRatePerHour: 1500,
    assignedAt: hoursAgo(18),
    acceptedAt: hoursAgo(16),
    decidedAt: null,
    dueAt: hoursFromNow(48),
    sow: { id: "sow-helios", title: "Helios Design System", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 2,
    criteriaAddressed: [false, false, false],
    readinessPct: 5,
  },

  // ── in_progress (active draft) ───────────────────────────────────────
  {
    id: "task-003",
    externalKey: "TSK-003",
    title: "CSV export endpoint",
    status: "in_progress",
    description: "Streaming CSV export. Signed-URL delivery. No memory buffering.",
    acceptanceCriteria: [
      "Streams without loading whole result in memory",
      "Signed URL valid for 1h",
      "Authorization checked on signed URL fetch",
    ],
    requiredSkills: ["Python", "FastAPI"],
    estimatedHours: 12,
    complexity: "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: 1800,
    assignedAt: hoursAgo(48),
    acceptedAt: hoursAgo(46),
    decidedAt: null,
    dueAt: hoursFromNow(20),
    sow: { id: "sow-rep", title: "Reporting V2 platform", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: { id: "ms-002", name: "Phase 1 export" },
    mentor: { id: "mentor-karthik", name: "Karthik Iyer", initials: "KI", role: "Staff · Data" },
    round: 1,
    totalRounds: 2,
    criteriaAddressed: [true, true, false],
    readinessPct: 50,
  },

  // ── blocked ─────────────────────────────────────────────────────────
  {
    id: "task-004",
    externalKey: "TSK-004",
    title: "Tenancy bootstrap CLI",
    status: "blocked",
    description: "CLI to scaffold a new tenant with default rate cards and consent records.",
    acceptanceCriteria: [
      "Single command",
      "Idempotent",
      "Logs every step",
    ],
    requiredSkills: ["TypeScript", "Prisma"],
    estimatedHours: 10,
    complexity: "large",
    agreedCurrency: "INR",
    agreedRatePerHour: 2200,
    assignedAt: hoursAgo(72),
    acceptedAt: hoursAgo(70),
    decidedAt: null,
    dueAt: hoursFromNow(12),
    sow: { id: "sow-rep", title: "Reporting V2 platform", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 1,
    criteriaAddressed: [true, false, false],
    readinessPct: 30,
  },

  // ── awaiting_clarification (Q&A open) ────────────────────────────────
  {
    id: "task-005",
    externalKey: "TSK-005",
    title: "ETL spec — events table v2",
    status: "awaiting_clarification",
    description: "Spec + migration notes for the new partitioning scheme.",
    acceptanceCriteria: [
      "Includes rollback plan",
      "Index strategy documented",
    ],
    requiredSkills: ["Postgres", "SQL"],
    estimatedHours: 6,
    complexity: "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: 2000,
    assignedAt: hoursAgo(96),
    acceptedAt: hoursAgo(94),
    decidedAt: null,
    dueAt: hoursFromNow(36),
    sow: { id: "sow-rep", title: "Reporting V2 platform", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-karthik", name: "Karthik Iyer", initials: "KI", role: "Staff · Data" },
    round: 1,
    totalRounds: 2,
    criteriaAddressed: [false, false],
    readinessPct: 40,
  },

  // ── feedback_requested (revision) ────────────────────────────────────
  {
    id: "task-006",
    externalKey: "TSK-006",
    title: "Auth modal UX polish",
    status: "feedback_requested",
    description: "Tighten validation states + animation timing.",
    acceptanceCriteria: [
      "No layout shift on error",
      "Reduce focus jumps",
      "Mobile haptic on success",
    ],
    requiredSkills: ["React", "Framer Motion"],
    estimatedHours: 4,
    complexity: "small",
    agreedCurrency: "INR",
    agreedRatePerHour: 1500,
    assignedAt: hoursAgo(120),
    acceptedAt: hoursAgo(118),
    decidedAt: null,
    dueAt: hoursFromNow(6),
    sow: { id: "sow-helios", title: "Helios Design System", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 2,
    totalRounds: 3,
    criteriaAddressed: [true, true, false],
    readinessPct: 65,
  },

  // ── under_review (submitted, waiting on mentor) ──────────────────────
  {
    id: "task-007",
    externalKey: "TSK-007",
    title: "Notification settings panel",
    status: "under_review",
    description: "Per-channel toggle grid (in-app / email / SMS × event type).",
    acceptanceCriteria: [
      "Critical row locked on",
      "Marketing row default off",
      "Saves debounced 500ms",
    ],
    requiredSkills: ["React", "TypeScript"],
    estimatedHours: 5,
    complexity: "small",
    agreedCurrency: "INR",
    agreedRatePerHour: 1500,
    assignedAt: hoursAgo(96),
    acceptedAt: hoursAgo(94),
    decidedAt: null,
    dueAt: hoursAgo(2), // submitted late but ok
    sow: { id: "sow-helios", title: "Helios Design System", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 1,
    criteriaAddressed: [true, true, true],
    readinessPct: 100,
  },

  // ── completed (accepted) ─────────────────────────────────────────────
  {
    id: "task-008",
    externalKey: "TSK-008",
    title: "Decomposition unit tests",
    status: "completed",
    description: "Add unit coverage for the dependency-resolver edge cases.",
    acceptanceCriteria: [
      "All resolver branches covered",
      "CI green",
    ],
    requiredSkills: ["Jest", "TypeScript"],
    estimatedHours: 5,
    complexity: "small",
    agreedCurrency: "INR",
    agreedRatePerHour: 1600,
    assignedAt: hoursAgo(20 * 24),
    acceptedAt: hoursAgo(20 * 24 - 1),
    decidedAt: hoursAgo(14 * 24),
    dueAt: hoursAgo(15 * 24),
    sow: { id: "sow-rep", title: "Reporting V2 platform", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-karthik", name: "Karthik Iyer", initials: "KI", role: "Staff · Data" },
    round: 1,
    totalRounds: 1,
    criteriaAddressed: [true, true],
    readinessPct: 100,
  },

  // ── completed (older, for archive) ───────────────────────────────────
  {
    id: "task-009",
    externalKey: "TSK-009",
    title: "Tenancy bootstrap docs",
    status: "completed",
    description: "Docs for the tenant scaffold script.",
    acceptanceCriteria: ["Step-by-step guide", "Screenshots"],
    requiredSkills: ["Documentation"],
    estimatedHours: 3,
    complexity: "small",
    agreedCurrency: "INR",
    agreedRatePerHour: 1200,
    assignedAt: hoursAgo(28 * 24),
    acceptedAt: hoursAgo(28 * 24 - 1),
    decidedAt: hoursAgo(22 * 24),
    dueAt: hoursAgo(23 * 24),
    sow: { id: "sow-rep", title: "Reporting V2 platform", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 1,
    criteriaAddressed: [true, true],
    readinessPct: 100,
  },

  // ── resubmitted (round 2 in queue) ───────────────────────────────────
  {
    id: "task-011",
    externalKey: "TSK-011",
    title: "SSO redirect hardening",
    status: "resubmitted",
    description: "Fix open-redirect guard on OAuth callback and add regression tests.",
    acceptanceCriteria: [
      "Only allowlisted redirect hosts",
      "State param validated",
      "Tests cover bypass attempts",
    ],
    requiredSkills: ["TypeScript", "OAuth"],
    estimatedHours: 6,
    complexity: "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: 1900,
    assignedAt: hoursAgo(80),
    acceptedAt: hoursAgo(78),
    decidedAt: null,
    dueAt: hoursFromNow(18),
    sow: { id: "sow-rep", title: "Reporting V2 platform", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: { id: "ms-003", name: "Auth hardening" },
    mentor: { id: "mentor-karthik", name: "Karthik Iyer", initials: "KI", role: "Staff · Data" },
    round: 2,
    totalRounds: 3,
    criteriaAddressed: [true, true, false],
    readinessPct: 90,
  },

  // ── submitted (mentor queue, not picked up yet) ──────────────────────
  {
    id: "task-012",
    externalKey: "TSK-012",
    title: "Rate-card import wizard",
    status: "submitted",
    description: "CSV import for contributor rate cards with validation preview.",
    acceptanceCriteria: [
      "Dry-run preview before commit",
      "Row-level error report",
      "Rollback on partial failure",
    ],
    requiredSkills: ["React", "CSV"],
    estimatedHours: 8,
    complexity: "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: 1700,
    assignedAt: hoursAgo(60),
    acceptedAt: hoursAgo(58),
    decidedAt: null,
    dueAt: hoursFromNow(30),
    sow: { id: "sow-nova", title: "Nova Analytics", tenantId: "tenant-nova", tenantName: "Nova" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 2,
    criteriaAddressed: [true, true, true],
    readinessPct: 100,
  },

  // ── matched (second tenant — project filter) ─────────────────────────
  {
    id: "task-013",
    externalKey: "TSK-013",
    title: "Dashboard KPI tiles",
    status: "matched",
    description: "Build reusable KPI tile component for Nova executive dashboard.",
    acceptanceCriteria: [
      "Responsive 2×2 grid",
      "Skeleton loading state",
      "Accessible trend indicators",
    ],
    requiredSkills: ["React", "Recharts"],
    estimatedHours: 10,
    complexity: "medium",
    agreedCurrency: "INR",
    agreedRatePerHour: 1600,
    assignedAt: hoursAgo(5),
    acceptedAt: null,
    decidedAt: null,
    dueAt: hoursFromNow(96),
    sow: { id: "sow-nova", title: "Nova Analytics", tenantId: "tenant-nova", tenantName: "Nova" },
    milestone: { id: "ms-nova-1", name: "Executive views" },
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 1,
    totalRounds: 2,
    criteriaAddressed: [false, false, false],
    readinessPct: 0,
  },

  // ── rejected ─────────────────────────────────────────────────────────
  {
    id: "task-010",
    externalKey: "TSK-010",
    title: "Quick-add task button",
    status: "rejected",
    description: "Floating Quick-add button on dashboard.",
    acceptanceCriteria: [
      "Keyboard-accessible",
      "Doesn't overlap critical CTAs",
    ],
    requiredSkills: ["React"],
    estimatedHours: 3,
    complexity: "small",
    agreedCurrency: "INR",
    agreedRatePerHour: 1500,
    assignedAt: hoursAgo(10 * 24),
    acceptedAt: hoursAgo(10 * 24 - 1),
    decidedAt: hoursAgo(7 * 24),
    dueAt: hoursAgo(8 * 24),
    sow: { id: "sow-helios", title: "Helios Design System", tenantId: "tenant-helios", tenantName: "Helios" },
    milestone: null,
    mentor: { id: "mentor-priya", name: "Priya Iyer", initials: "PI", role: "Lead · Design Systems" },
    round: 2,
    totalRounds: 2,
    criteriaAddressed: [true, false],
    readinessPct: 70,
  },
];

export function getMockTask(id: string): MockTask | undefined {
  return MOCK_TASKS.find((t) => t.id === id);
}
