/**
 * Review Assistant — pre-fills mentor rubric scores from evidence.
 *
 * Spec: SOW §3.1.MVP.7 + doc 03 §5.D.1
 */

import type { AgentHandler } from "../types";

export interface ReviewAssistantInput {
  taskBrief: string;
  criteria: Array<{ id: string; label: string }>;
  evidence: Array<{ name: string; size: number }>;
  contributorDigitalTwin?: {
    acceptanceRate?: number;
    skillsMatched?: string[];
  };
}

export interface ReviewAssistantOutput {
  suggestions: Array<{
    criterionId: string;
    score: number;
    confidence: number;
    sources: string[];
  }>;
}

export const reviewAssistantHandler: AgentHandler<
  ReviewAssistantInput,
  ReviewAssistantOutput
> = async ({ variables }) => {
  const hasEvidence = (variables.evidence?.length ?? 0) > 0;
  const contributorBoost = variables.contributorDigitalTwin?.acceptanceRate
    ? Math.min(0.15, (variables.contributorDigitalTwin.acceptanceRate - 0.7) * 0.5)
    : 0;

  // Phase 1 mock — deterministic per-criterion suggestions.
  const baseScore = hasEvidence ? 4 : 3;
  const baseConfidence = hasEvidence ? 0.78 : 0.55;

  const suggestions = (variables.criteria ?? []).map((c) => ({
    criterionId: c.id,
    score: baseScore,
    confidence: Math.min(0.95, baseConfidence + contributorBoost),
    sources: hasEvidence
      ? variables.evidence.slice(0, 2).map((e) => e.name)
      : ["task_brief"],
  }));

  // Overall confidence = mean of per-criterion (which are all the same here).
  const overall = suggestions.length > 0 ? suggestions[0].confidence : 0.5;

  return {
    output: { suggestions },
    confidence: overall,
    sources: [
      { kind: "task_field", reference: "taskBrief" },
      ...variables.evidence.slice(0, 3).map((e) => ({
        kind: "evidence_file" as const,
        reference: e.name,
      })),
    ],
    coverageGaps: hasEvidence
      ? []
      : ["no_evidence_attached_scores_are_brief_only"],
    riskFlags: [],
  };
};
