/**
 * Admin · rubric template library — spec doc 04 §5.F.
 */

export interface MockRubricCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;            // 0-100 (percent)
  scaleMax: 1 | 2 | 3 | 4 | 5;
}

export interface MockRubricTemplate {
  id: string;
  name: string;
  appliesTo: "Code" | "Design" | "Data" | "Marketing" | "Documentation";
  criteria: MockRubricCriterion[];
  usedByTenants: number;
  version: number;
  updatedAt: string;
}

export interface MockFeedbackSnippet {
  id: string;
  criterionLabel: string;
  scoreRange: string;
  text: string;
}

export const MOCK_RUBRIC_TEMPLATES: MockRubricTemplate[] = [];

/** Default mentor feedback snippets per rubric template — spec §5.F.2 feedback library. */
export const MOCK_RUBRIC_FEEDBACK: Record<string, MockFeedbackSnippet[]> = {};

export function findRubricById(id: string) {
  return MOCK_RUBRIC_TEMPLATES.find((r) => r.id === id);
}
