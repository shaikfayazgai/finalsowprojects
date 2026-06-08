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

export const MOCK_RUBRIC_TEMPLATES: MockRubricTemplate[] = [
  {
    id: "rt-sw",
    name: "Software default",
    appliesTo: "Code",
    usedByTenants: 12,
    version: 4,
    updatedAt: "2026-05-12T10:00:00Z",
    criteria: [
      { id: "c1", label: "Correctness",   description: "Code produces expected output for all documented inputs.", weight: 25, scaleMax: 5 },
      { id: "c2", label: "Tests",         description: "Unit + integration coverage for new logic.",                weight: 20, scaleMax: 5 },
      { id: "c3", label: "Readability",   description: "Naming, structure, and documentation aid future readers.",  weight: 15, scaleMax: 5 },
      { id: "c4", label: "Idiomatic use", description: "Solution fits the framework / language conventions.",       weight: 10, scaleMax: 5 },
      { id: "c5", label: "Security",      description: "No new security regressions; secrets handled correctly.",   weight: 10, scaleMax: 5 },
      { id: "c6", label: "Performance",   description: "Avoids needless work; meets stated latency target.",        weight: 10, scaleMax: 5 },
      { id: "c7", label: "Error handling", description: "Failures surface usefully; boundaries respected.",         weight: 5,  scaleMax: 5 },
      { id: "c8", label: "Spec adherence", description: "Matches the brief's checklist + acceptance criteria.",     weight: 5,  scaleMax: 5 },
    ],
  },
  {
    id: "rt-design",
    name: "Design default",
    appliesTo: "Design",
    usedByTenants: 14,
    version: 3,
    updatedAt: "2026-04-18T14:00:00Z",
    criteria: [
      { id: "c1", label: "Brief fit",        description: "Solution addresses the stated user + business goal.", weight: 25, scaleMax: 5 },
      { id: "c2", label: "Visual hierarchy", description: "Information priority reads correctly.",               weight: 20, scaleMax: 5 },
      { id: "c3", label: "Accessibility",    description: "Contrast, focus, alt-text, motion preferences.",      weight: 20, scaleMax: 5 },
      { id: "c4", label: "System fit",       description: "Reuses tokens + components; doesn't fork the system.", weight: 15, scaleMax: 5 },
      { id: "c5", label: "Craft",            description: "Polish: spacing, alignment, typography.",            weight: 10, scaleMax: 5 },
      { id: "c6", label: "Rationale",        description: "Decisions are documented + defendable.",              weight: 10, scaleMax: 5 },
    ],
  },
  {
    id: "rt-data",
    name: "Data default",
    appliesTo: "Data",
    usedByTenants: 8,
    version: 2,
    updatedAt: "2026-03-10T12:00:00Z",
    criteria: [
      { id: "c1", label: "Question fit",    description: "Analysis answers the brief's actual question.",     weight: 25, scaleMax: 5 },
      { id: "c2", label: "Method choice",   description: "Selected technique is appropriate for the data.",    weight: 20, scaleMax: 5 },
      { id: "c3", label: "Reproducibility", description: "Notebook + data lineage allow re-run by reviewer.",  weight: 15, scaleMax: 5 },
      { id: "c4", label: "Honest framing",  description: "Limits, caveats, and confidence stated.",            weight: 15, scaleMax: 5 },
      { id: "c5", label: "Visual clarity",  description: "Charts read at a glance; no chartjunk.",             weight: 10, scaleMax: 5 },
      { id: "c6", label: "Narrative",       description: "Reader is led to the insight, not buried in numbers.", weight: 10, scaleMax: 5 },
      { id: "c7", label: "Rigor",           description: "Statistical / sampling assumptions checked.",        weight: 5,  scaleMax: 5 },
    ],
  },
  {
    id: "rt-mktg",
    name: "Marketing default",
    appliesTo: "Marketing",
    usedByTenants: 6,
    version: 2,
    updatedAt: "2026-04-02T10:00:00Z",
    criteria: [
      { id: "c1", label: "Audience fit",    description: "Speaks to the segment in the brief.",   weight: 30, scaleMax: 5 },
      { id: "c2", label: "Message clarity", description: "Promise + reason-to-believe land fast.", weight: 25, scaleMax: 5 },
      { id: "c3", label: "Brand voice",     description: "Tone + vocabulary match the brand.",     weight: 20, scaleMax: 5 },
      { id: "c4", label: "CTA",             description: "Action + path is unambiguous.",          weight: 15, scaleMax: 5 },
      { id: "c5", label: "Channel fit",     description: "Format fits the medium it'll run in.",   weight: 10, scaleMax: 5 },
    ],
  },
  {
    id: "rt-docs",
    name: "Documentation default",
    appliesTo: "Documentation",
    usedByTenants: 9,
    version: 3,
    updatedAt: "2026-05-04T11:00:00Z",
    criteria: [
      { id: "c1", label: "Audience fit",    description: "Right level for the stated reader.",            weight: 25, scaleMax: 5 },
      { id: "c2", label: "Completeness",    description: "Covers all required journeys / surfaces.",       weight: 25, scaleMax: 5 },
      { id: "c3", label: "Accuracy",        description: "Facts + examples verifiable.",                   weight: 20, scaleMax: 5 },
      { id: "c4", label: "Findability",     description: "TOC + headings + cross-links aid scanning.",     weight: 15, scaleMax: 5 },
      { id: "c5", label: "Maintainability", description: "Written so future updates are cheap.",           weight: 15, scaleMax: 5 },
    ],
  },
];

/** Default mentor feedback snippets per rubric template — spec §5.F.2 feedback library. */
export const MOCK_RUBRIC_FEEDBACK: Record<string, MockFeedbackSnippet[]> = {
  "rt-sw": [
    { id: "fb1", criterionLabel: "Correctness", scoreRange: "1–2", text: "Several paths fail on edge cases documented in the brief. Re-run against the acceptance checklist." },
    { id: "fb2", criterionLabel: "Correctness", scoreRange: "4–5", text: "Output matches spec for all documented inputs; behaviour is predictable." },
    { id: "fb3", criterionLabel: "Tests", scoreRange: "1–2", text: "Coverage is thin on new logic; add cases for failure modes." },
  ],
  "rt-design": [
    { id: "fb1", criterionLabel: "Brief fit", scoreRange: "1–2", text: "Core user goal from the brief is not clearly addressed in the primary flow." },
    { id: "fb2", criterionLabel: "Accessibility", scoreRange: "3", text: "Contrast passes on main screens; verify focus order on modals." },
  ],
  "rt-data": [
    { id: "fb1", criterionLabel: "Question fit", scoreRange: "1–2", text: "Analysis answers a adjacent question — realign to the stated hypothesis." },
  ],
  "rt-mktg": [
    { id: "fb1", criterionLabel: "Audience fit", scoreRange: "4–5", text: "Tone and examples match the segment defined in the brief." },
  ],
  "rt-docs": [
    { id: "fb1", criterionLabel: "Completeness", scoreRange: "1–2", text: "Required setup steps and error paths are missing from the guide." },
  ],
};

export function findRubricById(id: string) {
  return MOCK_RUBRIC_TEMPLATES.find((r) => r.id === id);
}
