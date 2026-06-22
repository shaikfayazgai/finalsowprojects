/**
 * Enterprise retention rules client — MOCK MODE.
 */

import type { RetentionRuleSet } from "@/lib/retention";
import { retentionRulesMock, updateRetentionRulesMock } from "@/lib/enterprise/mocks/compliance";

export class RetentionApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public violations?: Array<{ entity: string; floorDays: number; submittedDays: number }>,
  ) {
    super(message);
    this.name = "RetentionApiError";
  }
}

function tick<T>(value: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export async function fetchRetentionRules() {
  return tick(retentionRulesMock());
}

export async function updateRetentionRules(rules: RetentionRuleSet) {
  return tick(updateRetentionRulesMock(rules));
}
