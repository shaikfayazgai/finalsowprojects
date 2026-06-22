/**
 * Contributor Support Assistant — quiet workroom signals.
 *
 * Spec: doc 01 §5.E.1 (workroom AI signals)
 */

import type { AgentHandler } from "../types";

export interface ContributorSupportInput {
  taskState: string;
  criteria: Array<{ id: string; label: string; addressed: boolean }>;
  evidence: Array<{ name: string; size: number }>;
}

export interface ContributorSupportOutput {
  signals: string[];
}

export const contributorSupportHandler: AgentHandler<
  ContributorSupportInput,
  ContributorSupportOutput
> = async ({ variables }) => {
  const totalCriteria = variables.criteria?.length ?? 0;
  const addressed = variables.criteria?.filter((c) => c.addressed).length ?? 0;
  const remaining = totalCriteria - addressed;
  const hasEvidence = (variables.evidence?.length ?? 0) > 0;

  const signals: string[] = [];

  if (remaining > 0) {
    signals.push(
      `${remaining} criteri${remaining === 1 ? "on still" : "a still"} unaddressed — fastest path to acceptance.`,
    );
  }
  if (!hasEvidence && variables.taskState === "in_progress") {
    signals.push(
      "No evidence attached yet — reviewers expect at least one artifact per criterion.",
    );
  }
  if (totalCriteria > 0 && addressed / totalCriteria >= 0.8) {
    signals.push(
      `Readiness ${Math.round((addressed / totalCriteria) * 100)}% — close to submittable.`,
    );
  }

  return {
    output: { signals: signals.slice(0, 3) },
    // Rule-based for Phase 1 — high confidence in the rules themselves.
    confidence: 0.9,
    sources: [
      { kind: "criterion", reference: "criteria" },
      ...(hasEvidence
        ? variables.evidence.slice(0, 3).map((e) => ({
            kind: "evidence_file" as const,
            reference: e.name,
          }))
        : []),
    ],
    coverageGaps: [],
    riskFlags: [],
  };
};
