/**
 * AI-Generated SOW mock — V2.0 Pathway A (deep-analysis §8.1).
 *
 * Instead of uploading a document, the user supplies parameters and the
 * SOW Generation Guardrails Engine produces a complete SOW, constrained
 * by template lock + clause library + the 8-layer Hallucination
 * Prevention Framework (§8.9).
 *
 * Backend handoff:
 *   POST /api/sow/generate
 *     body: GenerateParams
 *     → GeneratedSow  (includes guardrail report + audit trace)
 *
 * The real engine runs an LLM constrained to approved templates +
 * clause library, then validates against the 8 layers below. The UI
 * reads the same GeneratedSow shape regardless.
 */

import type {
  ExtractedClause,
  ExtractedDeliverable,
} from "./sow-extraction";

export type Industry =
  | "software"
  | "data_ai"
  | "design"
  | "marketing"
  | "operations"
  | "finance";

export interface GenerateParams {
  industry: Industry;
  /** Plain-language objective from the operator. */
  objective: string;
  /** Budget in INR (major units). */
  budgetInr: number;
  /** Timeline in weeks. */
  timelineWeeks: number;
  /** Target team size. */
  teamSize: number;
  classification: "internal" | "confidential" | "restricted";
}

export interface GuardrailLayer {
  n: number;
  name: string;
  status: "pass" | "warn";
  detail: string;
}

export interface GeneratedSow {
  title: string;
  industryLabel: string;
  /** Which locked template the engine used. */
  templateUsed: string;
  /** Clauses pulled from the pre-approved library (ids + text). */
  clauses: ExtractedClause[];
  deliverables: ExtractedDeliverable[];
  /** Generated markdown body. */
  scopeBody: string;
  /** Overall generation confidence 0..1 (must be ≥0.9 to auto-pass). */
  confidence: number;
  /** Completeness — all required sections present? */
  completeness: { present: string[]; missing: string[] };
  /** Pattern match against historical SOWs. */
  patternMatch: { matchedTemplate: string; similarity: number };
  /** The 8-layer Hallucination Prevention Framework report. */
  guardrails: GuardrailLayer[];
  /** Audit trace line. */
  auditTrace: string;
  period: { startDate: string; endDate: string; estimatedWeeks: number };
}

const INDUSTRY: Record<Industry, { label: string; template: string; titlePrefix: string; skills: string[]; deliverables: string[] }> = {
  software: {
    label: "Software & IT",
    template: "TPL-SW-DELIVERY-v4",
    titlePrefix: "Software delivery",
    skills: ["typescript", "api", "testing"],
    deliverables: [
      "Technical discovery + architecture decision record",
      "Core service implementation (2-week sprints)",
      "API contract + OpenAPI 3.1 spec",
      "Automated test suite (unit + integration)",
      "CI/CD pipeline + staging environment",
      "Production rollout + 30-day hypercare",
    ],
  },
  data_ai: {
    label: "Data & AI",
    template: "TPL-DATA-AI-v3",
    titlePrefix: "Data & AI engagement",
    skills: ["python", "sql", "ml"],
    deliverables: [
      "Data inventory + quality assessment",
      "Pipeline build (ingest → transform → serve)",
      "Model training + evaluation harness",
      "Bias + drift monitoring dashboard",
      "Model card + governance documentation",
      "Production deployment + monitoring",
    ],
  },
  design: {
    label: "Design",
    template: "TPL-DESIGN-v2",
    titlePrefix: "Design engagement",
    skills: ["figma", "research", "design-systems"],
    deliverables: [
      "Discovery + stakeholder interviews",
      "Design system audit + token refresh",
      "Hi-fi mockups + interactive prototype",
      "Accessibility audit (WCAG 2.2 AA)",
      "Design handoff + Storybook documentation",
    ],
  },
  marketing: {
    label: "Marketing",
    template: "TPL-MKT-v2",
    titlePrefix: "Marketing campaign",
    skills: ["content", "seo", "analytics"],
    deliverables: [
      "Campaign strategy + audience research",
      "Content calendar + asset production",
      "Landing pages + conversion tracking",
      "Performance dashboard + weekly reporting",
    ],
  },
  operations: {
    label: "Business Operations",
    template: "TPL-OPS-v2",
    titlePrefix: "Operations improvement",
    skills: ["process", "documentation", "analytics"],
    deliverables: [
      "Current-state process mapping",
      "Gap analysis + improvement recommendations",
      "Standard operating procedures",
      "Change-management + rollout plan",
    ],
  },
  finance: {
    label: "Finance",
    template: "TPL-FIN-v2",
    titlePrefix: "Finance workstream",
    skills: ["finance", "compliance", "analytics"],
    deliverables: [
      "Requirements + compliance mapping",
      "Reconciliation automation build",
      "Reporting + close-cycle dashboards",
      "Controls + audit-trail documentation",
    ],
  },
};

function iso(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function clausesForLibrary(industryKey: Industry): ExtractedClause[] {
  const base: Array<{ kind: ExtractedClause["kind"]; text: string }> = [
    { kind: "dependency", text: "Client provides stakeholder availability for weekly steering reviews." },
    { kind: "dependency", text: "Access to required systems + environments provisioned before sprint 1." },
    { kind: "assumption", text: "Work performed in IST business hours unless otherwise agreed." },
    { kind: "assumption", text: "Scope is fixed at approval; change requests follow the variation process." },
    { kind: "constraint", text: "Total fees capped at the approved budget in §4." },
    { kind: "constraint", text: "All deliverables signed off via the platform acceptance flow." },
  ];
  if (industryKey === "data_ai") {
    base.push({ kind: "constraint", text: "No PII used in model training without a signed DPA + anonymisation." });
  }
  if (industryKey === "software") {
    base.push({ kind: "constraint", text: "No breaking API changes without a 90-day deprecation header." });
  }
  return base.map((c, i) => ({
    id: `lib-${i + 1}`,
    kind: c.kind,
    text: c.text,
    confidence: 0.9 + Math.random() * 0.08, // library clauses are high-confidence
  }));
}

function buildBody(p: GenerateParams, title: string, deliverables: string[], clauses: ExtractedClause[]): string {
  const lines: string[] = [];
  lines.push(`# ${title}\n`);
  lines.push(`**Industry:** ${INDUSTRY[p.industry].label}`);
  lines.push(`**Confidentiality:** ${p.classification}`);
  lines.push(`**Budget:** ₹${p.budgetInr.toLocaleString("en-IN")}`);
  lines.push(`**Timeline:** ${p.timelineWeeks} weeks · team of ${p.teamSize}`);
  lines.push(`\n## Objective\n${p.objective.trim() || "Deliver the engagement scope as defined below."}`);
  lines.push("\n## Deliverables");
  for (const d of deliverables) lines.push(`- ${d}`);
  lines.push("\n## Dependencies");
  for (const c of clauses.filter((x) => x.kind === "dependency")) lines.push(`- ${c.text}`);
  lines.push("\n## Assumptions");
  for (const c of clauses.filter((x) => x.kind === "assumption")) lines.push(`- ${c.text}`);
  lines.push("\n## Constraints");
  for (const c of clauses.filter((x) => x.kind === "constraint")) lines.push(`- ${c.text}`);
  lines.push("\n## Acceptance");
  lines.push("- Each deliverable accepted via the two-stage review (mentor + enterprise).");
  lines.push("- Evidence pack exported on close.");
  return lines.join("\n");
}

export function generateSowSync(p: GenerateParams): GeneratedSow {
  const ind = INDUSTRY[p.industry];
  const objectiveSnippet = p.objective.trim().split(/\s+/).slice(0, 5).join(" ");
  const title = objectiveSnippet
    ? `${ind.titlePrefix}: ${objectiveSnippet}${p.objective.trim().split(/\s+/).length > 5 ? "…" : ""}`
    : `${ind.titlePrefix} — ${p.timelineWeeks}-week engagement`;

  const clauses = clausesForLibrary(p.industry);
  const perDeliverableHours = Math.max(8, Math.round((p.timelineWeeks * p.teamSize * 30) / ind.deliverables.length));
  const deliverables: ExtractedDeliverable[] = ind.deliverables.map((d, i) => ({
    id: `gd-${i + 1}`,
    title: d,
    hours: perDeliverableHours + (i % 3) * 8,
  }));

  const confidence = 0.9 + Math.random() * 0.08; // engine only emits ≥90%
  const requiredSections = ["Objective", "Deliverables", "Dependencies", "Assumptions", "Constraints", "Acceptance"];

  const guardrails: GuardrailLayer[] = [
    { n: 1, name: "Input validation",   status: "pass", detail: "All 5 wizard parameters validated before generation." },
    { n: 2, name: "Template locking",   status: "pass", detail: `Locked to ${ind.template} — no free-form generation.` },
    { n: 3, name: "Clause library",     status: "pass", detail: `${clauses.length} clauses selected from approved library; 0 novel clauses.` },
    { n: 4, name: "Completeness check", status: "pass", detail: `All ${requiredSections.length} required sections present.` },
    { n: 5, name: "Confidence scoring", status: confidence >= 0.9 ? "pass" : "warn", detail: `${(confidence * 100).toFixed(0)}% confidence (threshold 90%).` },
    { n: 6, name: "Pattern matching",   status: "pass", detail: `Matched ${ind.template} historical pattern at ${(82 + Math.random() * 12).toFixed(0)}% similarity.` },
    { n: 7, name: "Human approval",     status: "warn", detail: "Pending — requires sign-off before finalization." },
    { n: 8, name: "Audit logging",      status: "pass", detail: "Generation params, template, clauses + confidence recorded." },
  ];

  return {
    title,
    industryLabel: ind.label,
    templateUsed: ind.template,
    clauses,
    deliverables,
    scopeBody: buildBody(p, title, ind.deliverables, clauses),
    confidence,
    completeness: { present: requiredSections, missing: [] },
    patternMatch: { matchedTemplate: ind.template, similarity: 0.82 + Math.random() * 0.12 },
    guardrails,
    auditTrace: `gen-${Date.now().toString(36)} · ${ind.template} · ${clauses.length} clauses · conf ${(confidence * 100).toFixed(0)}%`,
    period: { startDate: iso(7), endDate: iso(7 + p.timelineWeeks * 7), estimatedWeeks: p.timelineWeeks },
  };
}

/** Async wrapper that simulates generation latency for the progress UI. */
export function generateSow(p: GenerateParams, options: { ms?: number } = {}): Promise<GeneratedSow> {
  const ms = options.ms ?? 2200;
  return new Promise((resolve) => setTimeout(() => resolve(generateSowSync(p)), ms));
}

export const INDUSTRY_OPTIONS: Array<{ value: Industry; label: string }> = (
  Object.keys(INDUSTRY) as Industry[]
).map((k) => ({ value: k, label: INDUSTRY[k].label }));
