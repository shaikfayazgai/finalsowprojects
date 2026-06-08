/**
 * Workforce sourcing & review routing types (Decision #21–#24).
 */

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

export type MatchingPool = "organization" | "network" | "organization_first";

export interface TenantWorkforcePolicy {
  defaultSourcing?: WorkforceSourcing | "hybrid";
  allowOpenMarket?: boolean;
  requireMentorForInternal?: boolean;
}

export interface WorkforceMember {
  userId: string;
  email: string;
  displayName: string;
  department: string | null;
  contribType: string;
  primarySkills: string[];
  availability: string | null;
  employeeId: string | null;
  /** From CSV import — reporting manager work email. */
  managerEmail?: string | null;
  /** From CSV import — finance / cost allocation code. */
  costCenter?: string | null;
  /** Roster status after CSV sync. */
  status?: "active" | "inactive";
}

export interface ManualWorkforceEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  employeeId?: string;
  /** Comma-separated skill list. */
  primarySkills?: string;
  managerEmail?: string;
  costCenter?: string;
}

export interface ListWorkforceOptions {
  tenantId: string;
  search?: string;
  department?: string;
  limit?: number;
  offset?: number;
}

export interface ListWorkforceResult {
  items: WorkforceMember[];
  total: number;
}

export interface AssignTaskInput {
  taskId: string;
  contributorUserId: string;
  directAssign?: boolean;
  actorUserId: string;
}

export interface AssignTaskResult {
  taskId: string;
  contributorId: string;
  reviewPath: ReviewPath;
  workforceSourcing: WorkforceSourcing | null;
}

export interface ReassignTaskInput {
  taskId: string;
  contributorUserId: string;
  reason?: string;
  actorUserId: string;
}
