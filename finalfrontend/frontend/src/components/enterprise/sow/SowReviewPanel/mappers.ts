import type {
  SowReviewSection,
  SowReviewMetrics,
  SowRiskData,
  SowRiskFactor,
  SowHallucinationLayer,
} from "./types";

/* ── Sections ── */

function isSectionArray(arr: unknown): arr is any[] {
  return (
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.some(
      (item) =>
        item &&
        typeof item === "object" &&
        (item.title || item.section_title || item.heading || item.name) &&
        (item.content || item.body || item.text || item.markdown || item.description),
    )
  );
}

function normalizeSection(s: any, fallbackTitle = ""): SowReviewSection {
  return {
    title: String(s?.title ?? s?.section_title ?? s?.heading ?? s?.name ?? s?.header ?? fallbackTitle ?? ""),
    body: String(
      s?.content ?? s?.body ?? s?.text ?? s?.markdown ?? s?.description ??
      (typeof s === "string" ? s : ""),
    ),
  };
}

function findSectionArray(obj: unknown, depth = 0): any[] | undefined {
  if (depth > 5 || !obj || typeof obj !== "object") return undefined;
  if (Array.isArray(obj)) return isSectionArray(obj) ? obj : undefined;

  const record = obj as Record<string, unknown>;
  const priorityKeys = Object.keys(record).filter(
    (k) => /section/i.test(k) || k === "generated_sow" || k === "content" || k === "generated" || k === "draft",
  );
  const otherKeys = Object.keys(record).filter((k) => !priorityKeys.includes(k));

  for (const k of [...priorityKeys, ...otherKeys]) {
    const val = record[k];
    if (Array.isArray(val) && isSectionArray(val)) return val;
  }
  for (const k of [...priorityKeys, ...otherKeys]) {
    const val = record[k];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const found = findSectionArray(val, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

/* ── Metrics ── */

function pickMetric(metricsBags: Record<string, any>[], ...keys: string[]): number | undefined {
  for (const bag of metricsBags) {
    for (const k of keys) {
      const v = bag?.[k];
      if (v != null && (typeof v === "number" || (typeof v === "string" && !isNaN(Number(v))))) {
        return Number(v);
      }
    }
  }
  return undefined;
}

/* ── Public mappers ── */

export function mapSowSectionsResponse(raw: unknown): SowReviewSection[] {
  if (!raw) return [];
  const payload = ((raw as any)?.data ?? raw) as Record<string, unknown>;
  const list = (
    Array.isArray(payload) ? payload :
    Array.isArray(payload.sections) ? payload.sections :
    Array.isArray(payload.items) ? payload.items :
    Array.isArray(payload.results) ? payload.results :
    []
  ) as Record<string, unknown>[];
  return list
    .map((s) => ({
      title: String(s.title ?? s.section_title ?? s.heading ?? s.name ?? ""),
      body: String(s.content ?? s.body ?? s.text ?? s.markdown ?? ""),
    }))
    .filter((s) => s.title || s.body);
}

export function mapSowResponseToMetricsAndSections(
  payload: unknown,
): { metrics: Partial<SowReviewMetrics>; sections: SowReviewSection[] } | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, any>;
  const data = root.data && typeof root.data === "object" ? root.data : root;

  const metricsBags = [
    data, data.metrics, data.quality_metrics, data.qualityMetrics, data.ai_metrics,
    data.aiMetrics, data.scores, data.score, data.analysis, data.summary, data.generated_sow,
  ].filter((b) => b && typeof b === "object" && !Array.isArray(b)) as Record<string, any>[];

  const confidence    = pickMetric(metricsBags, "overall_confidence", "confidence", "confidence_score", "confidenceScore", "ai_confidence", "extraction_confidence", "confidence_percentage");
  const riskScore     = pickMetric(metricsBags, "risk_score", "riskScore", "overall_risk_score", "overallRiskScore", "risk", "risk_level_score", "total_risk");
  const hallucinationFlags = pickMetric(metricsBags, "hallucination_flags_count", "hallucination_flags", "hallucinationFlags", "hallucination_count", "flags", "flag_count");
  const completeness  = pickMetric(metricsBags, "completeness_pct", "completeness_percentage", "completeness", "completeness_score", "completenessScore", "section_completeness", "coverage");

  const metricsPartial: Partial<SowReviewMetrics> = {
    ...(confidence       != null ? { confidence }       : {}),
    ...(riskScore        != null ? { riskScore }        : {}),
    ...(hallucinationFlags != null ? { hallucinationFlags } : {}),
    ...(completeness     != null ? { completeness }     : {}),
  };

  let sections: SowReviewSection[] | undefined;

  // Explicit checks for the most common AI SOW response paths first,
  // before the generic recursive search (which may miss nested paths or
  // pick up the wrong array when multiple arrays exist in the response).
  const directCandidates: unknown[] = [
    data.sections,
    data.generated_sow?.sections,
    data.generated?.sections,
    data.generated?.content?.sections,
    data.generated_content?.sections,
    data.content?.sections,
    data.document?.sections,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      const mapped = candidate
        .map((s: any) => normalizeSection(s))
        .filter((s) => s.title || s.body);
      if (mapped.length > 0) { sections = mapped; break; }
    }
  }

  if (!sections || sections.length === 0) {
    const foundArray = findSectionArray(data);
    if (foundArray) {
      sections = foundArray.map((s) => normalizeSection(s)).filter((s) => s.title || s.body);
    }
  }

  if (!sections || sections.length === 0) {
    const sectionKeys = Object.keys(data).filter((k) => /^section[_-][a-z0-9]+$/i.test(k)).sort();
    if (sectionKeys.length > 0) {
      sections = sectionKeys.map((k) => {
        const node = data[k];
        const fallback = k.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (node && typeof node === "object" && !Array.isArray(node)) {
          const title = String((node as any).title ?? (node as any).section_title ?? (node as any).heading ?? fallback);
          const body = String((node as any).content ?? (node as any).body ?? (node as any).text ?? (node as any).markdown ?? (node as any).description ?? "");
          if (body) return { title, body };
        }
        return normalizeSection(node, fallback);
      }).filter((s) => s.title || s.body);
    }
  }

  if (!sections || sections.length === 0) {
    const md = data.draft_markdown ?? data.draftMarkdown ?? data.generated_content ?? data.generatedContent ?? data.content ?? data.markdown;
    if (typeof md === "string" && md.trim().length > 0) {
      const parts = md.split(/\n(?=#{1,3}\s)/g);
      sections = parts
        .map((p) => {
          const m = p.match(/^\s*#{1,3}\s*(.+?)\r?\n([\s\S]*)$/);
          return m ? { title: m[1].trim(), body: m[2].trim() } : { title: "", body: p.trim() };
        })
        .filter((s) => s.title || s.body);
    }
  }

  const hasMetrics = Object.keys(metricsPartial).length > 0;
  const hasSections = sections && sections.length > 0;
  if (!hasMetrics && !hasSections) return null;

  return {
    metrics: hasMetrics ? metricsPartial : {},
    sections: hasSections ? sections! : [],
  };
}

export function mapRiskAssessmentResponse(payload: unknown): Partial<SowRiskData> | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, any>;
  const data = root.data && typeof root.data === "object" ? root.data : root;

  const riskLevel = data.risk_level ?? data.riskLevel ?? data.level ?? data.overall_level;
  const riskScore =
    data.risk_score ?? data.riskScore ?? data.overall_score ?? data.overallScore ??
    data.overall ?? data.overall_risk ?? data.overall_risk_score;

  const rawFactors = data.factors ?? data.risk_factors ?? data.riskFactors ?? data.breakdown;
  let factors: SowRiskFactor[] | undefined = Array.isArray(rawFactors)
    ? rawFactors
        .map((f: any) => ({
          factor: String(f.factor ?? f.name ?? f.label ?? ""),
          weight: String(f.weight ?? f.weight_display ?? f.weight_percent ?? ""),
          score: Number(f.score ?? f.value ?? f.percentage ?? 0),
        }))
        .filter((f) => f.factor)
    : undefined;

  if (!factors || factors.length === 0) {
    const scoresObj: Record<string, any> =
      (data.risk_scores && typeof data.risk_scores === "object" ? data.risk_scores : null) ??
      (data.scores && typeof data.scores === "object" ? data.scores : null) ??
      (data.score_breakdown && typeof data.score_breakdown === "object" ? data.score_breakdown : null) ??
      data;

    const toNum = (...keys: string[]): number | null => {
      for (const k of keys) {
        const v = scoresObj?.[k];
        if (v != null && !isNaN(Number(v))) {
          const n = Number(v);
          return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
        }
      }
      return null;
    };

    const completeness = toNum("completeness_pct", "completeness", "completeness_score", "completeness_percentage");
    const confidence   = toNum("confidence", "confidence_score", "confidence_percentage");
    const compliance   = toNum("compliance", "compliance_score", "compliance_percentage");
    const patternMatch = toNum("pattern_match", "patternMatch", "pattern_match_score", "pattern_match_percentage");

    if (completeness !== null || confidence !== null || compliance !== null || patternMatch !== null) {
      factors = [
        { factor: "Completeness",  weight: "30%", score: completeness  ?? 0 },
        { factor: "Confidence",    weight: "25%", score: confidence    ?? 0 },
        { factor: "Compliance",    weight: "25%", score: compliance    ?? 0 },
        { factor: "Pattern Match", weight: "20%", score: patternMatch  ?? 0 },
      ];
    }
  }

  const out: Partial<SowRiskData> = {};
  if (riskLevel != null) out.riskLevel = String(riskLevel);
  if (riskScore  != null) out.riskScore  = Number(riskScore);
  if (factors && factors.length > 0) out.factors = factors;

  return Object.keys(out).length > 0 ? out : null;
}

export function mapManualRiskFromSow(raw: unknown): Partial<SowRiskData> | null {
  if (!raw) return null;
  const d = (((raw as any).data ?? raw)) as Record<string, unknown>;

  const riskObj = (typeof d.risk === "object" && d.risk !== null ? d.risk : {}) as Record<string, unknown>;
  const riskScoreNum =
    Number(riskObj.risk_score ?? riskObj.riskScore) ||
    (typeof d.risk_score === "number" ? d.risk_score : 0) ||
    Number(d.overall_risk_score ?? d.overallRiskScore ?? 0);
  const riskLevel = String(riskObj.risk_level ?? riskObj.riskLevel ?? d.risk_level ?? d.riskLevel ?? "");

  const rs = (typeof d.risk_score === "object" && d.risk_score !== null
    ? d.risk_score
    : d.riskScore && typeof d.riskScore === "object" ? d.riskScore
    : null) as Record<string, unknown> | null;

  const completeness  = Number(rs?.completeness ?? 0);
  const confidence    = Number(rs?.confidence ?? 0);
  const compliance    = Number(rs?.compliance ?? 0);
  const patternMatch  = Number(rs?.pattern_match ?? rs?.patternMatch ?? 0);

  if (!riskScoreNum && !completeness && !confidence && !compliance && !patternMatch) return null;

  return {
    riskScore: riskScoreNum,
    riskLevel,
    factors: [
      { factor: "Completeness",  weight: "30%", score: completeness },
      { factor: "Confidence",    weight: "25%", score: confidence   },
      { factor: "Compliance",    weight: "25%", score: compliance   },
      { factor: "Pattern Match", weight: "20%", score: patternMatch },
    ],
  };
}

export function mapHallucinationAnalysisResponse(payload: unknown): SowHallucinationLayer[] | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, any>;
  const data = root.data && typeof root.data === "object" ? root.data : root;

  const rawLayers: unknown = data.layers ?? data.hallucination_layers ?? data.hallucinationLayers ?? data.results;
  if (!Array.isArray(rawLayers)) return null;

  const layers: SowHallucinationLayer[] = rawLayers
    .map((l: any) => ({
      layer: l.layer ?? l.layer_id ?? l.id ?? l.index,
      name: l.name ?? l.layer_name ?? l.title,
      status: l.status ?? l.result ?? l.outcome,
      details: l.details ?? l.description ?? l.message ?? l.detail,
    }))
    .filter((l) => l.name || l.status);

  return layers.length > 0 ? layers : null;
}
