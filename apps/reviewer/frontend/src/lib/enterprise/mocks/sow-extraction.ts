/**
 * Mock SOW AI extraction — the "sow-nlp-svc" the master SOW V1.1 §6.2
 * describes. Takes an uploaded file and returns the structured fields
 * the SOW Intake Assistant (§3.1.MVP.7) is supposed to surface:
 *
 *   - Title, period, stakeholders, confidentiality classification
 *   - Deliverables list (auto-bulleted)
 *   - Clauses tagged (dependencies / assumptions / constraints)
 *   - Risk flags
 *
 * Backend handoff: replace this whole file with a real call to your
 * NLP pipeline (Tika + GPT-4 or whatever). The wizard reads the same
 * `ExtractedSow` shape regardless.
 */

export type RiskSeverity = "low" | "medium" | "high";
export type ClauseKind = "dependency" | "assumption" | "constraint";

export interface ExtractedClause {
  id: string;
  kind: ClauseKind;
  text: string;
  /** Confidence the parser had — drives the "review carefully" cue. */
  confidence: number;
}

export interface ExtractedDeliverable {
  id: string;
  title: string;
  /** Rough estimate; PMO refines during decomposition. */
  hours?: number;
}

export interface ExtractedRiskFlag {
  id: string;
  severity: RiskSeverity;
  category: string;
  message: string;
  /** Mitigation suggestion the operator can accept or override. */
  suggestion: string;
}

export interface ExtractedStakeholder {
  role: "sponsor" | "pmo" | "legal_contact" | "security_contact" | "finance_contact";
  name: string;
  email: string;
}

export interface ExtractedSow {
  /** Echoed back so the UI can display "Parsed: helios-q3.pdf". */
  source: { name: string; sizeBytes: number; type: string };

  title: string;
  initiative: string | null;
  classification: "internal" | "confidential" | "restricted";

  period: {
    startDate: string;       // ISO yyyy-mm-dd
    endDate: string;         // ISO yyyy-mm-dd
    estimatedWeeks: number;
  };

  stakeholders: ExtractedStakeholder[];

  deliverables: ExtractedDeliverable[];

  clauses: ExtractedClause[];

  riskFlags: ExtractedRiskFlag[];

  /** Overall extraction confidence — drives the green/amber UI badge. */
  confidence: number;

  /** Markdown summary the wizard pre-fills into the Scope body field. */
  scopeBody: string;

  /** OCR was needed? (Only fires when filename hints at scanned PDF.) */
  ocrApplied: boolean;
}

/* ───────────────────── lightweight content "AI" ─────────────────── */

type ExtractionTemplate = {
  keywords: string[];
  title: string;
  initiative: string | null;
  deliverables: string[];
  stakeholders: ExtractedStakeholder[];
  clauses: { kind: string; text: string }[];
  risks: { severity: "low" | "medium" | "high"; category: string; message: string; suggestion: string }[];
};

const TEMPLATES: ExtractionTemplate[] = [];

const GENERIC = {
  title: "Engagement scope",
  initiative: null,
  deliverables: [
    "Discovery + stakeholder interviews",
    "Detailed design + architecture review",
    "Implementation in 2-week sprints",
    "User-acceptance testing with sign-off",
    "Production rollout + 30-day hypercare",
  ],
  stakeholders: [],
  clauses: [
    { kind: "dependency", text: "Stakeholder availability for weekly steering committee." },
    { kind: "assumption", text: "All work performed in IST business hours unless otherwise agreed." },
    { kind: "constraint", text: "Total budget capped at the value in §4 of this SOW." },
  ],
  risks: [
    { severity: "low" as const, category: "scope", message: "Acceptance criteria are described but not enumerated.", suggestion: "Add a bulleted acceptance checklist before approval." },
  ],
};

function pickTemplate(filename: string) {
  const lower = filename.toLowerCase();
  for (const t of TEMPLATES) {
    if (t.keywords.some((k) => lower.includes(k))) return t;
  }
  return GENERIC;
}

function isoOffset(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function classify(name: string, picked: "internal" | "confidential" | "restricted" | undefined): ExtractedSow["classification"] {
  if (picked) return picked;
  const l = name.toLowerCase();
  if (l.includes("internal") || l.includes("acme")) return "internal";
  if (l.includes("restricted") || l.includes("secret")) return "restricted";
  return "confidential";
}

function mkScopeBody(t: ReturnType<typeof pickTemplate>, classification: string, weeks: number): string {
  const lines: string[] = [];
  lines.push(`# ${t.title}\n`);
  lines.push(`**Confidentiality:** ${classification}.\n`);
  lines.push(`**Duration:** ~${weeks} weeks.\n`);
  lines.push("\n## Deliverables\n");
  for (const d of t.deliverables) lines.push(`- ${d}`);
  lines.push("\n\n## Dependencies\n");
  for (const c of t.clauses.filter((x) => x.kind === "dependency")) lines.push(`- ${c.text}`);
  lines.push("\n\n## Assumptions\n");
  for (const c of t.clauses.filter((x) => x.kind === "assumption")) lines.push(`- ${c.text}`);
  lines.push("\n\n## Constraints\n");
  for (const c of t.clauses.filter((x) => x.kind === "constraint")) lines.push(`- ${c.text}`);
  lines.push("\n\n## Acceptance\n");
  lines.push("- Each deliverable signed off via the §5.G.3 acceptance flow.");
  lines.push("- Audit pack exported on close.");
  return lines.join("\n");
}

/* ─────────────────────────── public API ─────────────────────────── */

export interface ExtractInput {
  file: { name: string; sizeBytes: number; type: string };
  /** Hint from the upload form. Overrides classifier when present. */
  confidentialityHint?: "internal" | "confidential" | "restricted";
  initiativeHint?: string;
}

const HINT_TO_CLASSIFICATION: Record<NonNullable<ExtractInput["confidentialityHint"]>, ExtractedSow["classification"]> = {
  internal: "internal",
  confidential: "confidential",
  restricted: "restricted",
};

/**
 * Pure (synchronous) extractor. The wizard wraps it in a setTimeout to
 * simulate the "Parsing…" animation; tests can call this directly.
 */
export function extractSowSync(input: ExtractInput): ExtractedSow {
  const t = pickTemplate(input.file.name);
  const weeks = 4 + Math.floor(input.file.sizeBytes / 50_000) % 10;
  const classification = input.confidentialityHint
    ? HINT_TO_CLASSIFICATION[input.confidentialityHint]
    : classify(input.file.name, undefined);
  const stem = input.file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const title = t === GENERIC ? prettify(stem) : t.title;
  const ocrApplied = /scan|scanned|img|jpg|jpeg|png/i.test(input.file.name);

  return {
    source: input.file,
    title,
    initiative: input.initiativeHint?.trim() || t.initiative || null,
    classification,
    period: {
      startDate: isoOffset(7),
      endDate: isoOffset(7 + weeks * 7),
      estimatedWeeks: weeks,
    },
    stakeholders: t.stakeholders.map((s) => ({ ...s, role: s.role as ExtractedStakeholder["role"] })),
    deliverables: t.deliverables.map((d, i) => ({
      id: `d-${i + 1}`,
      title: d,
      hours: 16 + (i * 8) % 32,
    })),
    clauses: t.clauses.map((c, i) => ({
      id: `c-${i + 1}`,
      kind: c.kind as ClauseKind,
      text: c.text,
      confidence: 0.78 + Math.random() * 0.18,
    })),
    riskFlags: t.risks.map((r, i) => ({
      id: `r-${i + 1}`,
      severity: r.severity,
      category: r.category,
      message: r.message,
      suggestion: r.suggestion,
    })),
    confidence: 0.86 + Math.random() * 0.1,
    scopeBody: mkScopeBody(t, classification, weeks),
    ocrApplied,
  };
}

function prettify(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

/**
 * Async wrapper that simulates the parsing latency the master SOW
 * implies. Wizard uses this so the "Parsing…" UI feels real.
 *
 * Deterministic failure: filename contains `fail-extract` (for QA / demos).
 */
export function extractSow(input: ExtractInput, options: { ms?: number } = {}): Promise<ExtractedSow> {
  const ms = options.ms ?? 1600;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (/fail-extract|unreadable/i.test(input.file.name)) {
        reject(
          new ExtractionError(
            "We couldn't extract structured fields from this document. Try a text-based PDF or DOCX, or continue in Author mode.",
          ),
        );
        return;
      }
      resolve(extractSowSync(input));
    }, ms);
  });
}

