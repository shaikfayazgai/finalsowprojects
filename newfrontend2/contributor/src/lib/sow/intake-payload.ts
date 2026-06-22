/**
 * Normalizes SOW intake payloads for create + detail display.
 * Upload flow stores nested `extraction`; detail reads flat + nested.
 */

import type { ExtractedSow } from "@/lib/enterprise/mocks/sow-extraction";

export interface IntakeSourceFile {
  name: string;
  sizeBytes: number;
  type: string;
}

export interface UploadExtractionPayload {
  period: ExtractedSow["period"];
  stakeholders: ExtractedSow["stakeholders"];
  deliverables: ExtractedSow["deliverables"];
  clauses: ExtractedSow["clauses"];
  riskFlags: ExtractedSow["riskFlags"];
  confidence: number;
  ocrApplied: boolean;
}

export interface RiskBreakdownPayload {
  completeness: number;
  confidence: number;
  compliance: number;
  patternMatch: number;
  overall: "low" | "medium" | "high";
}

export function riskBreakdownFromExtraction(extracted: ExtractedSow): RiskBreakdownPayload {
  const pct = Math.round(extracted.confidence * 100);
  const complianceHit = extracted.riskFlags.some((r) => r.category === "compliance");
  return {
    completeness: Math.min(100, pct + 4),
    confidence: pct,
    compliance: complianceHit ? Math.max(55, pct - 12) : Math.min(100, pct + 6),
    patternMatch: Math.min(100, pct - 3),
    overall: pct >= 90 ? "low" : pct >= 75 ? "medium" : "high",
  };
}

export function buildUploadCreatePayload(args: {
  extracted: ExtractedSow;
  sourceFile: IntakeSourceFile | null;
  submission: Record<string, unknown>;
}): Record<string, unknown> {
  const { extracted, sourceFile, submission } = args;
  const sponsor = extracted.stakeholders.find((s) => s.role === "sponsor");

  return {
    intakeMode: "upload",
    initiative: extracted.initiative ?? undefined,
    startDate: extracted.period.startDate,
    endDate: extracted.period.endDate,
    sponsor: sponsor?.name ?? undefined,
    stakeholders: extracted.stakeholders.map(
      (s) => `${s.name} · ${s.role.replace(/_/g, " ")}`,
    ),
    sourceFile: sourceFile ?? extracted.source,
    extraction: {
      period: extracted.period,
      stakeholders: extracted.stakeholders,
      deliverables: extracted.deliverables,
      clauses: extracted.clauses,
      riskFlags: extracted.riskFlags,
      confidence: extracted.confidence,
      ocrApplied: extracted.ocrApplied,
    } satisfies UploadExtractionPayload,
    riskBreakdown: riskBreakdownFromExtraction(extracted),
    submission,
  };
}

export function parseIntakePayload(payload: Record<string, unknown>) {
  const extraction = (payload.extraction ?? null) as UploadExtractionPayload | null;
  const sourceFile = (payload.sourceFile ?? null) as IntakeSourceFile | null;
  const intakeMode = typeof payload.intakeMode === "string" ? payload.intakeMode : null;
  const initiative = typeof payload.initiative === "string" ? payload.initiative : null;

  const startDate =
    typeof payload.startDate === "string"
      ? payload.startDate
      : extraction?.period.startDate ?? null;
  const endDate =
    typeof payload.endDate === "string"
      ? payload.endDate
      : extraction?.period.endDate ?? null;

  const sponsor =
    typeof payload.sponsor === "string"
      ? payload.sponsor
      : extraction?.stakeholders.find((s) => s.role === "sponsor")?.name ?? null;

  let stakeholders: string[] = [];
  if (Array.isArray(payload.stakeholders)) {
    stakeholders = payload.stakeholders.filter((x): x is string => typeof x === "string");
  } else if (extraction?.stakeholders.length) {
    stakeholders = extraction.stakeholders.map(
      (s) => `${s.name} · ${s.role.replace(/_/g, " ")}`,
    );
  }

  const riskBreakdown = (payload.riskBreakdown ?? null) as RiskBreakdownPayload | null;

  const submission = parseSubmissionPayload(payload.submission);

  return {
    intakeMode,
    initiative,
    startDate,
    endDate,
    sponsor,
    stakeholders,
    sourceFile,
    extraction,
    riskBreakdown,
    submission,
  };
}

export interface SubmissionApproverRef {
  id: string;
  name: string;
  email: string;
}

export interface IntakeSubmissionPayload {
  approvers: Partial<Record<string, SubmissionApproverRef>>;
  notify: boolean;
  coverNote?: string;
}

export function parseSubmissionPayload(raw: unknown): IntakeSubmissionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const notify = typeof obj.notify === "boolean" ? obj.notify : true;
  const coverNote = typeof obj.coverNote === "string" ? obj.coverNote : undefined;

  const approvers: Partial<Record<string, SubmissionApproverRef>> = {};
  if (obj.approvers && typeof obj.approvers === "object") {
    for (const [stage, value] of Object.entries(obj.approvers as Record<string, unknown>)) {
      if (!value || typeof value !== "object") continue;
      const ref = value as Record<string, unknown>;
      if (typeof ref.id !== "string") continue;
      approvers[stage] = {
        id: ref.id,
        name: typeof ref.name === "string" ? ref.name : ref.id,
        email: typeof ref.email === "string" ? ref.email : "",
      };
    }
  }

  if (Object.keys(approvers).length === 0 && !coverNote) return null;

  return { approvers, notify, coverNote };
}

export function approverDisplayName(
  approverId: string | null | undefined,
  submission: IntakeSubmissionPayload | null,
  stage?: string,
): string | null {
  if (stage && submission?.approvers[stage]?.name) {
    return submission.approvers[stage]!.name;
  }
  if (!approverId || !submission?.approvers) return null;
  for (const ref of Object.values(submission.approvers)) {
    if (ref?.id === approverId) return ref.name;
  }
  return null;
}
