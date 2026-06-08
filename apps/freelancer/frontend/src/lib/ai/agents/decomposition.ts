/**
 * Decomposition Assistant — suggests milestones + tasks for an approved SOW.
 *
 * Spec: SOW §3.1.MVP.2 + doc 02 §5.D.2
 */

import type { AgentHandler } from "../types";

export interface DecompositionInput {
  sowSummary: string;
  sponsorConstraints?: string;
}

export interface DecompositionOutput {
  milestones: Array<{
    name: string;
    tasks: Array<{
      title: string;
      brief: string;
      skillTags: string[];
      level: "L1" | "L2" | "L3" | "L4";
      estimateHours: number;
      dependsOn: string[];
    }>;
  }>;
  missingTaskFlags: string[];
}

export const decompositionHandler: AgentHandler<
  DecompositionInput,
  DecompositionOutput
> = async ({ variables }) => {
  // Phase 1 mock — return a small canonical decomposition.
  const summaryLen = variables.sowSummary?.length ?? 0;
  const confidence = summaryLen > 500 ? 0.72 : 0.5;

  return {
    output: {
      milestones: [
        {
          name: "Foundation",
          tasks: [
            {
              title: "Set up project scaffolding",
              brief: "Initialize repo, CI, environments",
              skillTags: ["devops"],
              level: "L2",
              estimateHours: 8,
              dependsOn: [],
            },
            {
              title: "Define acceptance criteria",
              brief: "Translate SOW deliverables into testable criteria",
              skillTags: ["pm", "qa"],
              level: "L3",
              estimateHours: 12,
              dependsOn: [],
            },
          ],
        },
        {
          name: "Build",
          tasks: [
            {
              title: "Implement primary feature",
              brief: "Per SOW deliverable D1",
              skillTags: ["engineering"],
              level: "L3",
              estimateHours: 24,
              dependsOn: ["Set up project scaffolding"],
            },
          ],
        },
      ],
      missingTaskFlags:
        summaryLen < 300
          ? ["sow_too_brief_review_manually", "no_security_review_task"]
          : ["no_security_review_task"],
    },
    confidence,
    sources: [
      { kind: "task_field", reference: "sowSummary" },
    ],
    coverageGaps:
      summaryLen < 300 ? ["short_sow_summary"] : ["sponsor_constraints_not_parsed"],
    riskFlags: [],
  };
};
