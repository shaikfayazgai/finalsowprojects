/**
 * Decomposition v2 API client — MOCK MODE.
 *
 * Reads/writes via src/lib/enterprise/mocks/decompositions.ts so the
 * enterprise portal runs end-to-end on mock data for client demos +
 * backend-dev handoff. Original REST contract preserved in comments.
 */

import type {
  CreatePlanInput,
  PlanDetail,
  PlanStatus,
  PlanSummary,
  UpdatePlanInput,
} from "@/lib/decomposition/types";
import {
  activatePlanMock,
  approvePlanMock,
  archivePlanMock,
  copyPlanMock,
  createPlanMock,
  getPlanMock,
  listPlansMock,
  updatePlanMock,
} from "@/lib/enterprise/mocks/decompositions";

export class DecompositionApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public reason?: string,
    public issues?: unknown,
  ) {
    super(message);
    this.name = "DecompositionApiError";
  }
}

export interface ListPlansParams {
  sowId?: string;
  status?: PlanStatus | PlanStatus[];
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}

export interface PlanListResult {
  items: PlanSummary[];
  nextCursor: string | null;
}

function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function listPlans(params: ListPlansParams = {}): Promise<PlanListResult> {
  return tick(listPlansMock(params));
}

export async function getPlan(planId: string): Promise<PlanDetail> {
  const plan = getPlanMock(planId);
  if (!plan) throw new DecompositionApiError(`Plan ${planId} not found`, 404, "not_found");
  return tick(plan);
}

export async function createPlan(input: CreatePlanInput): Promise<PlanDetail> {
  return tick(createPlanMock(input));
}

export async function updatePlan(planId: string, input: UpdatePlanInput): Promise<PlanDetail> {
  return tick(updatePlanMock(planId, input));
}

export async function approvePlan(planId: string): Promise<PlanDetail> {
  return tick(approvePlanMock(planId));
}

export async function activatePlan(planId: string): Promise<PlanDetail> {
  return tick(activatePlanMock(planId));
}

export async function archivePlan(planId: string): Promise<PlanDetail> {
  return tick(archivePlanMock(planId));
}

export async function copyPlan(planId: string): Promise<PlanDetail> {
  return tick(copyPlanMock(planId));
}
