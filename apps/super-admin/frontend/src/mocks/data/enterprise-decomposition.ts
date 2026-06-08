/**
 * Enterprise Portal V2 — Decomposition Workspace mock.
 *
 * Workstream plans + task unit graphs per SOW. This is the operational
 * transformation layer between enterprise scope (SOW) and workforce
 * execution (Contributor V2 Assigned Work). Committed task units link
 * to the unified contributor task store by `taskIdInStore`.
 *
 * Mock-only. Phase 1B keeps Decomposition as a projection layer over
 * the existing unified task store — no separate Decomposition data
 * ecosystem.
 */

export type Complexity = "low" | "medium" | "high";
export type TaskUnitStatus = "proposed" | "committed" | "in_flight" | "completed";

export interface TaskUnit {
  id: string;
  label: string;
  detail: string;
  skill: string;
  skillLevel: "L1" | "L2" | "L3" | "L4";
  complexity: Complexity;
  estimatedHours: number;
  status: TaskUnitStatus;
  taskIdInStore?: string; // links to unified contributor task store
  dependsOn?: string[]; // task unit IDs within the same plan
  governanceMarkers?: string[];
}

export interface Workstream {
  id: string;
  label: string;
  description: string;
  status: "proposed" | "committed" | "in_flight" | "completed";
  taskUnits: TaskUnit[];
  riskScore: number; // 0–100
  governanceFlags: string[];
  dependsOn?: string[];
  sequenceIndex: number;
}

export interface SkillRequirement {
  skill: string;
  level: "L1" | "L2" | "L3" | "L4";
  tasksNeeding: number;
  workforceAvailable: number;
  matchPct: number; // 0–100
}

export interface DecompositionAiHint {
  id: string;
  kind: "segmentation" | "estimation" | "skill_match" | "dependency" | "risk" | "governance";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface DecompositionPlan {
  sowId: string;
  state: "not_started" | "drafting" | "ready_for_commit" | "committed" | "in_delivery";
  workstreams: Workstream[];
  skillRequirements: SkillRequirement[];
  governanceCheckpoints: { framework: string; status: "ready" | "needs_evidence" | "blocked"; detail?: string }[];
  aiHints: DecompositionAiHint[];
  totalEstimatedHours: number;
  totalCommittedTasks: number;
  totalProposedTasks: number;
  readinessScore: number; // 0–100 — gate for "Commit to workforce"
  notes?: string;
}

/* ─────────────────────── Canonical mocks ─────────────────────── */

export const decompositionPlans: DecompositionPlan[] = [
  /* ────── Helios Design System (Date Picker SOW) — committed ────── */
  {
    sowId: "sow-helios-2026q2",
    state: "in_delivery",
    totalEstimatedHours: 380,
    totalCommittedTasks: 22,
    totalProposedTasks: 0,
    readinessScore: 100,
    workstreams: [
      {
        id: "ws-helios-shell",
        label: "Component shell + tokens",
        description: "Headless primitives, design tokens, prop contracts.",
        status: "completed",
        sequenceIndex: 1,
        riskScore: 14,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-helios-shell-1",
            label: "Helios button system",
            detail: "Primary, secondary, ghost, destructive · loading states · tokenized variants.",
            skill: "Design Systems",
            skillLevel: "L2",
            complexity: "medium",
            estimatedHours: 24,
            status: "completed",
            taskIdInStore: "t-4711",
          },
        ],
      },
      {
        id: "ws-helios-a11y",
        label: "Accessible primitives",
        description: "WCAG 2.2 AA components — keyboard navigation, screen reader announcements, focus management.",
        status: "in_flight",
        sequenceIndex: 2,
        riskScore: 32,
        governanceFlags: ["PODL", "WCAG 2.2 AA"],
        dependsOn: ["ws-helios-shell"],
        taskUnits: [
          {
            id: "tu-helios-a11y-1",
            label: "Accessible date picker",
            detail: "Keyboard nav · focus trap · aria-live announcements · JAWS verification.",
            skill: "React",
            skillLevel: "L3",
            complexity: "high",
            estimatedHours: 48,
            status: "in_flight",
            taskIdInStore: "t-4821",
            governanceMarkers: ["WCAG 2.2 AA"],
          },
          {
            id: "tu-helios-a11y-2",
            label: "Auth modal · keyboard nav",
            detail: "Full keyboard reachability + focus trap on open.",
            skill: "React",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 16,
            status: "completed",
            taskIdInStore: "t-4912",
          },
        ],
      },
      {
        id: "ws-helios-visual",
        label: "Visual + supporting assets",
        description: "Empty states, illustrations, supporting visual primitives.",
        status: "completed",
        sequenceIndex: 3,
        riskScore: 18,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-helios-visual-1",
            label: "Empty-state illustrations · set",
            detail: "Eight illustrations · WCAG AA contrast on error variants.",
            skill: "Design",
            skillLevel: "L2",
            complexity: "medium",
            estimatedHours: 32,
            status: "completed",
            taskIdInStore: "t-4622",
          },
        ],
      },
      {
        id: "ws-helios-docs",
        label: "Documentation + adoption",
        description: "Storybook stories, adoption pilot prep, downstream consumer onboarding.",
        status: "proposed",
        sequenceIndex: 4,
        riskScore: 22,
        governanceFlags: [],
        dependsOn: ["ws-helios-a11y", "ws-helios-visual"],
        taskUnits: [
          {
            id: "tu-helios-docs-1",
            label: "Component documentation system",
            detail: "Per-component MDX templates with accessibility notes + code examples.",
            skill: "Documentation",
            skillLevel: "L2",
            complexity: "medium",
            estimatedHours: 24,
            status: "proposed",
          },
          {
            id: "tu-helios-docs-2",
            label: "Adoption pilot kit",
            detail: "Onboarding playbook for two pilot teams · migration guide · live-support window.",
            skill: "Documentation",
            skillLevel: "L1",
            complexity: "low",
            estimatedHours: 12,
            status: "proposed",
          },
        ],
      },
    ],
    skillRequirements: [
      { skill: "React", level: "L3", tasksNeeding: 8, workforceAvailable: 6, matchPct: 75 },
      { skill: "Design Systems", level: "L2", tasksNeeding: 6, workforceAvailable: 5, matchPct: 83 },
      { skill: "Accessibility", level: "L3", tasksNeeding: 5, workforceAvailable: 3, matchPct: 60 },
      { skill: "Design", level: "L2", tasksNeeding: 4, workforceAvailable: 4, matchPct: 100 },
      { skill: "Documentation", level: "L1", tasksNeeding: 2, workforceAvailable: 4, matchPct: 100 },
    ],
    governanceCheckpoints: [
      { framework: "WCAG 2.2 AA", status: "ready", detail: "Verification artifacts attached to each a11y task" },
      { framework: "PODL", status: "ready", detail: "Documented contributor pool" },
      { framework: "SOC2", status: "ready" },
    ],
    aiHints: [
      {
        id: "h-helios-1",
        kind: "segmentation",
        title: "Component shell workstream sequenced first · correct order",
        detail: "Token foundation must land before accessible primitives consume tokens. Current sequencing is optimal.",
        confidence: "high",
        source: "Workstream dependency graph",
      },
      {
        id: "h-helios-2",
        kind: "skill_match",
        title: "L3 React + L3 accessibility match is tight",
        detail: "60% workforce match on L3 accessibility — recommend one additional senior contributor before committing the Documentation workstream.",
        confidence: "medium",
        source: "Skill-by-level workforce comparison",
      },
    ],
  },

  /* ────── Stratum-Pay onboarding — in delivery ────── */
  {
    sowId: "sow-stratum-onboarding",
    state: "in_delivery",
    totalEstimatedHours: 160,
    totalCommittedTasks: 7,
    totalProposedTasks: 0,
    readinessScore: 100,
    workstreams: [
      {
        id: "ws-stratum-wizard",
        label: "Wizard scaffolding",
        description: "Multi-step shell, step transitions, navigation gating.",
        status: "in_flight",
        sequenceIndex: 1,
        riskScore: 22,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-stratum-wiz-1",
            label: "Onboarding wizard rebuild",
            detail: "5-step shell + validation surface + tour integration.",
            skill: "React",
            skillLevel: "L2",
            complexity: "medium",
            estimatedHours: 32,
            status: "in_flight",
            taskIdInStore: "t-3417",
          },
        ],
      },
      {
        id: "ws-stratum-validation",
        label: "Validation flows",
        description: "Field-level validation, error states, validation rule utility.",
        status: "committed",
        sequenceIndex: 2,
        riskScore: 18,
        governanceFlags: ["GDPR"],
        dependsOn: ["ws-stratum-wizard"],
        taskUnits: [
          {
            id: "tu-stratum-val-1",
            label: "Validation rule utility",
            detail: "Reusable validation rule library with locale support.",
            skill: "TypeScript",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 20,
            status: "committed",
          },
        ],
      },
      {
        id: "ws-stratum-tour",
        label: "Product tour + tooltips",
        description: "Sequenced onboarding tour, dismissal, returning-user detection.",
        status: "committed",
        sequenceIndex: 3,
        riskScore: 12,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-stratum-tour-1",
            label: "Onboarding tooltips",
            detail: "Sequenced product tour with Esc to skip + analytics events.",
            skill: "React",
            skillLevel: "L2",
            complexity: "low",
            estimatedHours: 18,
            status: "completed",
            taskIdInStore: "t-3970",
          },
        ],
      },
    ],
    skillRequirements: [
      { skill: "React", level: "L2", tasksNeeding: 4, workforceAvailable: 8, matchPct: 100 },
      { skill: "TypeScript", level: "L3", tasksNeeding: 3, workforceAvailable: 5, matchPct: 100 },
      { skill: "Testing", level: "L2", tasksNeeding: 2, workforceAvailable: 4, matchPct: 100 },
    ],
    governanceCheckpoints: [
      { framework: "GDPR", status: "ready", detail: "Personal-data flows audited in validation layer" },
      { framework: "SOC2", status: "ready" },
    ],
    aiHints: [
      {
        id: "h-stratum-1",
        kind: "estimation",
        title: "Scope is well-bounded · estimates conservative",
        detail: "Total 160 hours across 3 workstreams. Conservative buffer present in validation workstream.",
        confidence: "high",
        source: "Hours-vs-complexity ratio analysis",
      },
    ],
  },

  /* ────── Lighthouse-Ops reporting — pending decomposition ────── */
  {
    sowId: "sow-lighthouse-reporting",
    state: "drafting",
    totalEstimatedHours: 260,
    totalCommittedTasks: 0,
    totalProposedTasks: 14,
    readinessScore: 55,
    workstreams: [
      {
        id: "ws-lighthouse-telemetry",
        label: "Rate-limit telemetry",
        description: "Per-route telemetry capture, time-series storage, dashboard surface.",
        status: "proposed",
        sequenceIndex: 1,
        riskScore: 38,
        governanceFlags: ["GDPR"],
        taskUnits: [
          {
            id: "tu-lh-tel-1",
            label: "Telemetry capture pipeline",
            detail: "Capture per-route request counts + latency + error rates.",
            skill: "TypeScript",
            skillLevel: "L3",
            complexity: "high",
            estimatedHours: 40,
            status: "proposed",
          },
          {
            id: "tu-lh-tel-2",
            label: "Rate-limit dashboard surface",
            detail: "Per-route visualization with thresholds + alert overlays.",
            skill: "React",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 28,
            status: "proposed",
            dependsOn: ["tu-lh-tel-1"],
          },
        ],
      },
      {
        id: "ws-lighthouse-export",
        label: "Export pipeline",
        description: "CSV / PDF export with locale formatting and filter respect.",
        status: "proposed",
        sequenceIndex: 2,
        riskScore: 52,
        governanceFlags: ["GDPR", "Data residency"],
        dependsOn: ["ws-lighthouse-telemetry"],
        taskUnits: [
          {
            id: "tu-lh-exp-1",
            label: "CSV export with filters",
            detail: "Respect current view filters · locale-aware date and currency formatting.",
            skill: "TypeScript",
            skillLevel: "L3",
            complexity: "high",
            estimatedHours: 36,
            status: "proposed",
            governanceMarkers: ["GDPR cross-region scrutiny"],
          },
          {
            id: "tu-lh-exp-2",
            label: "PDF export pipeline",
            detail: "Server-side rendering of analytics dashboards as PDFs.",
            skill: "TypeScript",
            skillLevel: "L3",
            complexity: "high",
            estimatedHours: 44,
            status: "proposed",
            dependsOn: ["tu-lh-exp-1"],
          },
        ],
      },
      {
        id: "ws-lighthouse-locale",
        label: "Locale + i18n",
        description: "Locale-aware formatting across reporting outputs.",
        status: "proposed",
        sequenceIndex: 3,
        riskScore: 28,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-lh-locale-1",
            label: "Reporting locale infrastructure",
            detail: "Locale source resolution + format inheritance across reports.",
            skill: "TypeScript",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 22,
            status: "proposed",
          },
        ],
      },
    ],
    skillRequirements: [
      { skill: "TypeScript", level: "L3", tasksNeeding: 9, workforceAvailable: 5, matchPct: 56 },
      { skill: "React", level: "L3", tasksNeeding: 4, workforceAvailable: 6, matchPct: 100 },
      { skill: "Data viz", level: "L2", tasksNeeding: 3, workforceAvailable: 2, matchPct: 67 },
    ],
    governanceCheckpoints: [
      { framework: "GDPR", status: "needs_evidence", detail: "DPIA for cross-region aggregation required before committing export workstream" },
      { framework: "SOC2", status: "ready" },
      { framework: "ISO27001", status: "ready" },
    ],
    aiHints: [
      {
        id: "h-lh-1",
        kind: "governance",
        title: "Export workstream gated on GDPR DPIA",
        detail: "Cross-region aggregation in the CSV export triggers GDPR scrutiny. Cannot commit the export workstream until DPIA evidence is attached.",
        confidence: "high",
        source: "Governance framework cross-check",
      },
      {
        id: "h-lh-2",
        kind: "skill_match",
        title: "L3 TypeScript workforce 56% match",
        detail: "9 tasks need L3 TypeScript · 5 available. Consider deferring the PDF export workstream until additional L3 capacity is freed from Atlas-Insights delivery.",
        confidence: "medium",
        source: "Skill-by-level workforce comparison",
      },
      {
        id: "h-lh-3",
        kind: "dependency",
        title: "Sequence dependency chain spans 3 workstreams",
        detail: "Telemetry → Export · cannot parallelize. PDF export depends on CSV export utility. Sequencing reads correct.",
        confidence: "high",
        source: "Dependency graph walk",
      },
    ],
    notes: "Cannot commit Export workstream until DPIA cleared. Recommend committing Telemetry + Locale first.",
  },

  /* ────── Atlas-Insights mobile — in delivery ────── */
  {
    sowId: "sow-atlas-mobile",
    state: "in_delivery",
    totalEstimatedHours: 520,
    totalCommittedTasks: 18,
    totalProposedTasks: 2,
    readinessScore: 90,
    workstreams: [
      {
        id: "ws-atlas-push",
        label: "Push notification infrastructure",
        description: "FCM + APNS adapters, retry policy, observability.",
        status: "completed",
        sequenceIndex: 1,
        riskScore: 24,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-atlas-push-1",
            label: "Mobile push notifications",
            detail: "FCM + APNS adapter with retry on transient failures.",
            skill: "Mobile",
            skillLevel: "L3",
            complexity: "high",
            estimatedHours: 60,
            status: "completed",
            taskIdInStore: "t-2114",
          },
        ],
      },
      {
        id: "ws-atlas-notif-center",
        label: "Notification center",
        description: "In-app notification feed with read/unread state + optimistic updates.",
        status: "completed",
        sequenceIndex: 2,
        riskScore: 18,
        governanceFlags: [],
        dependsOn: ["ws-atlas-push"],
        taskUnits: [
          {
            id: "tu-atlas-nc-1",
            label: "Notification center",
            detail: "Real-time feed with read/unread + optimistic rollback.",
            skill: "React",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 36,
            status: "completed",
            taskIdInStore: "t-3711",
          },
        ],
      },
      {
        id: "ws-atlas-engagement",
        label: "Engagement metrics",
        description: "Dashboards + per-user engagement aggregations.",
        status: "in_flight",
        sequenceIndex: 3,
        riskScore: 28,
        governanceFlags: ["GDPR"],
        dependsOn: ["ws-atlas-notif-center"],
        taskUnits: [
          {
            id: "tu-atlas-eng-1",
            label: "Engagement metrics dashboard",
            detail: "Per-user engagement aggregations with privacy-respecting bucketing.",
            skill: "TypeScript",
            skillLevel: "L3",
            complexity: "high",
            estimatedHours: 48,
            status: "in_flight",
            taskIdInStore: "t-3601",
          },
        ],
      },
      {
        id: "ws-atlas-beta",
        label: "Beta release pipeline",
        description: "Beta release tooling, distribution, feedback collection.",
        status: "proposed",
        sequenceIndex: 4,
        riskScore: 34,
        governanceFlags: [],
        dependsOn: ["ws-atlas-engagement"],
        taskUnits: [
          {
            id: "tu-atlas-beta-1",
            label: "Beta distribution pipeline",
            detail: "TestFlight + Play Console upload automation + feedback channel.",
            skill: "Mobile",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 28,
            status: "proposed",
          },
          {
            id: "tu-atlas-beta-2",
            label: "Beta feedback dashboard",
            detail: "Tester feedback aggregation + triage surface.",
            skill: "React",
            skillLevel: "L2",
            complexity: "medium",
            estimatedHours: 20,
            status: "proposed",
            dependsOn: ["tu-atlas-beta-1"],
          },
        ],
      },
    ],
    skillRequirements: [
      { skill: "Mobile", level: "L3", tasksNeeding: 6, workforceAvailable: 4, matchPct: 67 },
      { skill: "React", level: "L3", tasksNeeding: 8, workforceAvailable: 6, matchPct: 75 },
      { skill: "TypeScript", level: "L3", tasksNeeding: 5, workforceAvailable: 5, matchPct: 100 },
    ],
    governanceCheckpoints: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready", detail: "Engagement metrics use privacy-respecting bucketing" },
      { framework: "HIPAA", status: "ready", detail: "Not applicable for this scope" },
    ],
    aiHints: [
      {
        id: "h-atlas-1",
        kind: "estimation",
        title: "Beta pipeline workstream sequenced late · correct",
        detail: "Beta release should follow engagement metrics for instrumentation continuity. Current sequencing reads optimal.",
        confidence: "high",
        source: "Sequence walk",
      },
    ],
  },

  /* ────── Helios-Core search — completed ────── */
  {
    sowId: "sow-helios-core-search",
    state: "committed",
    totalEstimatedHours: 80,
    totalCommittedTasks: 4,
    totalProposedTasks: 0,
    readinessScore: 100,
    workstreams: [
      {
        id: "ws-search-shortcuts",
        label: "Cmd-K + keyboard nav",
        description: "Invocation pattern, arrow navigation, recent searches caching.",
        status: "completed",
        sequenceIndex: 1,
        riskScore: 12,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-search-1",
            label: "Search shortcuts · v2",
            detail: "Cmd-K invocation + arrow navigation + recent searches caching.",
            skill: "React",
            skillLevel: "L3",
            complexity: "medium",
            estimatedHours: 32,
            status: "completed",
            taskIdInStore: "t-4188",
          },
        ],
      },
    ],
    skillRequirements: [
      { skill: "React", level: "L3", tasksNeeding: 4, workforceAvailable: 6, matchPct: 100 },
      { skill: "Accessibility", level: "L3", tasksNeeding: 2, workforceAvailable: 3, matchPct: 100 },
    ],
    governanceCheckpoints: [
      { framework: "WCAG 2.2 AA", status: "ready" },
      { framework: "SOC2", status: "ready" },
    ],
    aiHints: [
      {
        id: "h-search-1",
        kind: "estimation",
        title: "Reference decomposition · landed on time and budget",
        detail: "Use as template for future search-pattern SOWs.",
        confidence: "high",
        source: "Historical SOW outcome analysis",
      },
    ],
  },

  /* ────── Acme onboarding helpers — fully AI-proposed ────── */
  {
    sowId: "sow-acme-onboarding-helpers",
    state: "drafting",
    totalEstimatedHours: 60,
    totalCommittedTasks: 0,
    totalProposedTasks: 5,
    readinessScore: 72,
    workstreams: [
      {
        id: "ws-acme-tour-content",
        label: "Tour content + sequencing",
        description: "Content authoring + tour step sequencing.",
        status: "proposed",
        sequenceIndex: 1,
        riskScore: 18,
        governanceFlags: [],
        taskUnits: [
          {
            id: "tu-acme-1",
            label: "Tour content authoring",
            detail: "Copy + sequencing for 6 tour steps.",
            skill: "UX Writing",
            skillLevel: "L2",
            complexity: "low",
            estimatedHours: 12,
            status: "proposed",
          },
        ],
      },
      {
        id: "ws-acme-tour-platform",
        label: "Tour platform integration",
        description: "Tooltip primitive integration, returning-user detection, analytics.",
        status: "proposed",
        sequenceIndex: 2,
        riskScore: 16,
        governanceFlags: [],
        dependsOn: ["ws-acme-tour-content"],
        taskUnits: [
          {
            id: "tu-acme-2",
            label: "Tooltip primitive integration",
            detail: "Wire tour content into the Helios tooltip primitive.",
            skill: "React",
            skillLevel: "L2",
            complexity: "low",
            estimatedHours: 14,
            status: "proposed",
            dependsOn: ["tu-acme-1"],
          },
          {
            id: "tu-acme-3",
            label: "Returning-user detection",
            detail: "Local storage + analytics hook to suppress re-prompts.",
            skill: "React",
            skillLevel: "L2",
            complexity: "low",
            estimatedHours: 10,
            status: "proposed",
            dependsOn: ["tu-acme-2"],
          },
        ],
      },
      {
        id: "ws-acme-analytics",
        label: "Tour analytics",
        description: "Tour completion + drop-off analytics.",
        status: "proposed",
        sequenceIndex: 3,
        riskScore: 14,
        governanceFlags: [],
        dependsOn: ["ws-acme-tour-platform"],
        taskUnits: [
          {
            id: "tu-acme-4",
            label: "Tour analytics events",
            detail: "Per-step completion + drop-off + skip events.",
            skill: "TypeScript",
            skillLevel: "L2",
            complexity: "low",
            estimatedHours: 10,
            status: "proposed",
          },
          {
            id: "tu-acme-5",
            label: "Analytics dashboard tile",
            detail: "Onboarding-tour outcomes tile on the Acme product analytics page.",
            skill: "React",
            skillLevel: "L2",
            complexity: "low",
            estimatedHours: 14,
            status: "proposed",
            dependsOn: ["tu-acme-4"],
          },
        ],
      },
    ],
    skillRequirements: [
      { skill: "React", level: "L2", tasksNeeding: 5, workforceAvailable: 8, matchPct: 100 },
      { skill: "TypeScript", level: "L2", tasksNeeding: 2, workforceAvailable: 6, matchPct: 100 },
      { skill: "UX Writing", level: "L2", tasksNeeding: 1, workforceAvailable: 2, matchPct: 100 },
    ],
    governanceCheckpoints: [
      { framework: "SOC2", status: "ready" },
      { framework: "GDPR", status: "ready", detail: "Returning-user detection uses anonymous identifier" },
    ],
    aiHints: [
      {
        id: "h-acme-1",
        kind: "segmentation",
        title: "Three-workstream decomposition reads clean",
        detail: "Content authoring → platform integration → analytics. Linear sequencing matches the dependency graph perfectly.",
        confidence: "high",
        source: "Segmentation heuristics",
      },
      {
        id: "h-acme-2",
        kind: "estimation",
        title: "Total 60 hours · matches L2 capacity envelope",
        detail: "Sized for one L2-L3 contributor over 2 weeks part-time. Low risk, low complexity throughout.",
        confidence: "high",
        source: "Hours vs workforce envelope",
      },
      {
        id: "h-acme-3",
        kind: "governance",
        title: "All governance gates ready · safe to commit",
        detail: "No compliance evidence pending. Ready to move state from `drafting` → `ready_for_commit`.",
        confidence: "high",
        source: "Governance gate scan",
      },
    ],
  },
];

/* ─────────────────────── Selectors ─────────────────────── */

export function getDecompositionPlan(sowId: string): DecompositionPlan | undefined {
  return decompositionPlans.find((p) => p.sowId === sowId);
}

export function decompositionStateLabel(s: DecompositionPlan["state"]): string {
  switch (s) {
    case "not_started":
      return "Not started";
    case "drafting":
      return "Drafting plan";
    case "ready_for_commit":
      return "Ready to commit";
    case "committed":
      return "Committed";
    case "in_delivery":
      return "In delivery";
  }
}

export function decompositionStateTone(
  s: DecompositionPlan["state"],
): { chip: string; dot: string; label: string } {
  switch (s) {
    case "not_started":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", dot: "bg-beige-400", label: "Not started" };
    case "drafting":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", dot: "bg-gold-500", label: "Drafting" };
    case "ready_for_commit":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", dot: "bg-teal-600", label: "Ready to commit" };
    case "committed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500", label: "Committed" };
    case "in_delivery":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", dot: "bg-brown-500", label: "In delivery" };
  }
}

export function workstreamStatusTone(
  s: Workstream["status"],
): { chip: string; dot: string; label: string } {
  switch (s) {
    case "proposed":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", dot: "bg-beige-400", label: "Proposed" };
    case "committed":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", dot: "bg-teal-600", label: "Committed" };
    case "in_flight":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", dot: "bg-brown-500", label: "In flight" };
    case "completed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500", label: "Completed" };
  }
}

export function complexityTone(c: Complexity): { chip: string; label: string } {
  switch (c) {
    case "low":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Low" };
    case "medium":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Medium" };
    case "high":
      return { chip: "border-brown-300 bg-brown-50 text-brown-800", label: "High" };
  }
}

export function taskUnitStatusTone(s: TaskUnitStatus): { chip: string; label: string } {
  switch (s) {
    case "proposed":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Proposed" };
    case "committed":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "Committed" };
    case "in_flight":
      return { chip: "border-brown-200 bg-brown-50 text-brown-800", label: "In flight" };
    case "completed":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Completed" };
  }
}

export function skillMatchTone(pct: number): { bar: string; tint: string } {
  if (pct >= 90) return { bar: "bg-forest-500", tint: "text-forest-700" };
  if (pct >= 70) return { bar: "bg-teal-500", tint: "text-teal-700" };
  if (pct >= 50) return { bar: "bg-gold-500", tint: "text-gold-700" };
  return { bar: "bg-brown-500", tint: "text-brown-700" };
}
