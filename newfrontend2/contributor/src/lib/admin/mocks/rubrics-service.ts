/**
 * Admin rubric template mock service — localStorage overlay.
 */

import { applyOverlay, createOverlayStore } from "@/lib/enterprise/mocks/overlay";
import {
  MOCK_RUBRIC_TEMPLATES,
  MOCK_RUBRIC_FEEDBACK,
  type MockRubricCriterion,
  type MockRubricTemplate,
  type MockFeedbackSnippet,
} from "@/mocks/admin/rubrics";

const rubricOverlay = createOverlayStore<MockRubricTemplate>("glimmora.mock.adminRubrics.v1");
const feedbackOverlay = createOverlayStore<{ items: MockFeedbackSnippet[] }>(
  "glimmora.mock.adminRubricFeedback.v1",
);

export const adminRubricOverlays = { rubrics: rubricOverlay, feedback: feedbackOverlay };

function listMerged(): MockRubricTemplate[] {
  return applyOverlay(MOCK_RUBRIC_TEMPLATES, rubricOverlay.read());
}

export function listAdminRubrics(): MockRubricTemplate[] {
  return listMerged();
}

export function getAdminRubric(id: string): MockRubricTemplate | undefined {
  return listMerged().find((r) => r.id === id);
}

export function findRubricById(id: string): MockRubricTemplate | undefined {
  return getAdminRubric(id);
}

export interface SaveRubricInput {
  name: string;
  appliesTo: MockRubricTemplate["appliesTo"];
  criteria: MockRubricCriterion[];
}

export class RubricValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RubricValidationError";
  }
}

function validateCriteria(criteria: MockRubricCriterion[]): void {
  if (criteria.length === 0) {
    throw new RubricValidationError("Add at least one criterion.");
  }
  const total = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  if (total !== 100) {
    throw new RubricValidationError(`Criteria weights must total 100% (currently ${total}%).`);
  }
}

export function saveAdminRubric(id: string, input: SaveRubricInput): MockRubricTemplate {
  validateCriteria(input.criteria);
  const existing = getAdminRubric(id);
  if (!existing) throw new RubricValidationError("Template not found.");

  const updated: MockRubricTemplate = {
    ...existing,
    name: input.name.trim(),
    appliesTo: input.appliesTo,
    criteria: input.criteria,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  };
  rubricOverlay.patch(id, updated);
  return updated;
}

export interface CreateRubricInput {
  name: string;
  appliesTo: MockRubricTemplate["appliesTo"];
}

export function createAdminRubric(input: CreateRubricInput): MockRubricTemplate {
  const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
  let id = `rt-${base}`;
  let n = 1;
  while (getAdminRubric(id)) id = `rt-${base}-${n++}`;

  const template: MockRubricTemplate = {
    id,
    name: input.name.trim(),
    appliesTo: input.appliesTo,
    usedByTenants: 0,
    version: 1,
    updatedAt: new Date().toISOString(),
    criteria: [
      { id: "c1", label: "Quality", description: "Overall deliverable quality.", weight: 50, scaleMax: 5 },
      { id: "c2", label: "Completeness", description: "Meets all stated requirements.", weight: 50, scaleMax: 5 },
    ],
  };
  rubricOverlay.insert(id, template);
  return template;
}

export function getRubricFeedback(templateId: string): MockFeedbackSnippet[] {
  const o = feedbackOverlay.read()[templateId];
  if (o?.items) return o.items;
  return MOCK_RUBRIC_FEEDBACK[templateId] ?? [];
}

export function saveRubricFeedback(templateId: string, items: MockFeedbackSnippet[]): void {
  if (!getAdminRubric(templateId)) throw new RubricValidationError("Template not found.");
  feedbackOverlay.patch(templateId, { items });
}
