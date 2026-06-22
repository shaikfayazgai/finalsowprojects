/**
 * Decomposition domain types.
 *
 * Two distinct shapes:
 *   - Input types (CreatePlanInput, UpdatePlanInput, PlanStructureInput,
 *     MilestoneInput, TaskInput, DependencyInput): what the client/AI
 *     agent sends. Tasks reference milestones + dependencies reference
 *     tasks via client-supplied stable `key` strings, since real IDs
 *     don't exist until the service writes the row.
 *
 *   - Detail types (PlanDetail, PlanSummary, MilestoneDetail, TaskDetail,
 *     DependencyDetail): what the API returns. Real cuid IDs, ISO
 *     timestamps, fully resolved relations.
 */

export type PlanStatus = "draft" | "submitted" | "approved" | "active" | "archived";

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "at_risk"
  | "blocked";

export type TaskStatus =
  | "draft"
  | "ready"
  | "matched"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "accepted"
  | "cancelled";

export type DependencyType =
  | "finish_to_start"
  | "start_to_start"
  | "finish_to_finish";

/* ─────────────────────────── Input shapes ─────────────────────────── */

export interface MilestoneInput {
  /** Client-supplied stable key. Required if any task references it. */
  key?: string;
  order: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: MilestoneStatus;
}

export type WorkforceSourcing =
  | "internal_only"
  | "internal_first"
  | "external_only"
  | "open";

export type ReviewPath =
  | "mentor"
  | "internal"
  | "mentor_then_internal"
  | "auto_accept";

/** A support file attached to a task (uploaded to blob storage). */
export interface TaskAttachment {
  name: string;
  url: string;
  sizeBytes?: number | null;
}

export interface TaskInput {
  /** Client-supplied stable key. Required if any dependency references it. */
  key?: string;
  /** References MilestoneInput.key when present. */
  milestoneKey?: string;
  externalKey?: string;
  title: string;
  description?: string;
  requiredSkills?: string[];
  estimatedHours?: number;
  acceptanceCriteria?: string;
  complexity?: string;
  order?: number;
  aiConfidence?: number;
  pmoEdited?: boolean;
  workforceSourcing?: WorkforceSourcing;
  reviewPath?: ReviewPath;
  attachments?: TaskAttachment[];
}

export interface DependencyInput {
  fromTaskKey: string;
  toTaskKey: string;
  type?: DependencyType;
}

export interface PlanStructureInput {
  milestones: MilestoneInput[];
  tasks: TaskInput[];
  dependencies: DependencyInput[];
}

export interface CreatePlanInput {
  sowId: string;
  summary?: string;
  sourceAgentInvocationId?: string;
  structure?: PlanStructureInput;
}

export interface UpdatePlanInput {
  summary?: string;
  /** When present, replaces the plan's structure atomically. Allowed
   *  only when status === 'draft'. */
  structure?: PlanStructureInput;
}

/* ─────────────────────────── Output shapes ────────────────────────── */

export interface MilestoneDetail {
  id: string;
  order: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail {
  id: string;
  milestoneId: string | null;
  externalKey: string | null;
  title: string;
  description: string | null;
  requiredSkills: string[];
  estimatedHours: number | null;
  acceptanceCriteria: string | null;
  complexity: string | null;
  order: number;
  status: TaskStatus;
  aiConfidence: number | null;
  pmoEdited: boolean;
  workforceSourcing: WorkforceSourcing | null;
  reviewPath: ReviewPath | null;
  attachments?: TaskAttachment[];
  /** Contributor pay — only present for the super admin (the pricing screen). */
  payType?: "fixed" | "hourly" | null;
  payRateMinor?: number | null;
  contributorAmountMinor?: number | null;
  payCurrency?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DependencyDetail {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  createdAt: string;
}

export interface PlanSummary {
  id: string;
  sowId: string;
  version: number;
  status: PlanStatus;
  summary: string | null;
  defaultWorkforceSourcing: string | null;
  defaultReviewPath: string | null;
  twoStageReviewEnabled: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
  activatedAt: string | null;
  archivedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Feedback from the super admin when a submitted plan is sent back for revision. */
  revisionNote?: string | null;
  /** The source SOW's title, resolved server-side for list/queue display. */
  sowTitle?: string | null;
  /** Live delivery rollup (task progress + payment buckets), computed server-side
   * from decomp_tasks. Lets the Projects/Decomposition views show real progress
   * instead of a stale stored snapshot. */
  delivery?: {
    total: number;
    delivered: number;
    paid: number;
    progressPct: number;
    paymentPhase: "in_progress" | "completed_sow" | "pending_payment" | "payment_completed";
    payoutCounts?: Record<string, number>;
    budgetMinor?: number;
    requestedMinor?: number;
    releasedMinor?: number;
    paidMinor?: number;
  } | null;
}

export interface PlanDetail extends PlanSummary {
  milestones: MilestoneDetail[];
  tasks: TaskDetail[];
  dependencies: DependencyDetail[];
}
