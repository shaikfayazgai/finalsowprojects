/**
 * SOW Intake Assistant — extracts structured metadata from an uploaded
 * SOW document. Phase 1 returns deterministic mock output; Phase 2
 * makes a real LLM call.
 *
 * Spec: SOW §3.1.MVP.1 + doc 02 §5.C.3
 */

import type { AgentHandler } from "../types";

export interface SowIntakeInput {
  sowDocText: string;
}

export interface SowIntakeOutput {
  title: string;
  dates: { start: string | null; end: string | null };
  sponsor: string | null;
  stakeholders: string[];
  deliverables: Array<{ id: string; title: string }>;
  clauses: {
    dependencies: string[];
    assumptions: string[];
    constraints: string[];
  };
  riskScore: {
    completeness: number;
    confidence: number;
    overall: "low" | "medium" | "high";
  };
  hallucinationFlags: string[];
}

export const sowIntakeHandler: AgentHandler<SowIntakeInput, SowIntakeOutput> =
  async ({ variables }) => {
    const docLen = variables.sowDocText?.length ?? 0;

    // Phase 1 mock: deterministic output derived from input length so
    // tests get stable values without hitting an LLM.
    const completeness = Math.min(100, Math.round((docLen / 1000) * 20));
    const confidence = docLen > 500 ? 0.78 : 0.42;
    const overall: "low" | "medium" | "high" =
      completeness >= 80 ? "low" : completeness >= 50 ? "medium" : "high";

    return {
      output: {
        title: "Extracted SOW · placeholder title",
        dates: { start: null, end: null },
        sponsor: null,
        stakeholders: [],
        deliverables: [
          { id: "d1", title: "Placeholder deliverable 1" },
          { id: "d2", title: "Placeholder deliverable 2" },
        ],
        clauses: {
          dependencies: [],
          assumptions: [],
          constraints: [],
        },
        riskScore: { completeness, confidence, overall },
        hallucinationFlags: docLen < 200 ? ["very_short_input"] : [],
      },
      confidence,
      sources: [
        { kind: "task_field", reference: "sowDocText", excerpt: variables.sowDocText?.slice(0, 80) },
      ],
      coverageGaps: docLen < 500 ? ["short_document_low_signal"] : [],
      riskFlags: docLen < 200 ? ["insufficient_input"] : [],
    };
  };
