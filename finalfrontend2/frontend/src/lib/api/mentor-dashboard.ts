/**
 * Real mentor dashboard data client.
 *
 * Fetches from three backend proxy routes and maps backend shapes into the
 * component-level shapes used by the operational dashboard components.
 * ai-review-insights and governance-alerts have no backend endpoint yet —
 * those panels remain in stillMock state.
 */

import type {
  PriorityReviewRow,
  SlaTier,
  RiskSeverity,
  ReviewState,
  AiConfidenceBand,
  OperationalKpi,
  ReviewActivityEntry,
  ReviewActivityKind,
} from "@/mocks/data/mentor-workspace";

// ── Backend response shapes ────────────────────────────────────────────────

/** Shape returned by GET /api/v1/mentor/queue (via proxy /api/mentor/queue) */
interface BackendQueueItem {
  id: string;
  submission_id?: string;
  task_title?: string;
  title?: string;
  project_name?: string;
  project?: string;
  round?: number;
  status?: string;
  state?: string;
  contributor_id?: string;
  contributor_name?: string;
  contributor_code?: string;
  contributor_reliability?: number;
  submission_age_hours?: number;
  sla_remaining_hours?: number;
  sla_tier?: string;
  risk_severity?: string;
  review_state?: string;
  ai_confidence?: number;
  ai_confidence_band?: string;
  flags?: string[];
  submitted_at?: string;
  due_at?: string;
}

interface BackendQueueResponse {
  items?: BackendQueueItem[];
  queue?: BackendQueueItem[];
  data?: BackendQueueItem[];
  total?: number;
}

/** Shape returned by GET /api/mentor/history (decisions log) */
interface BackendHistoryItem {
  id: string;
  decision?: string;
  action?: string;
  kind?: string;
  actor?: string;
  mentor_name?: string;
  subject?: string;
  task_title?: string;
  detail?: string;
  note?: string;
  comment?: string;
  timestamp?: string;
  decided_at?: string;
  created_at?: string;
  review_id?: string;
  submission_id?: string;
}

interface BackendHistoryResponse {
  items?: BackendHistoryItem[];
  decisions?: BackendHistoryItem[];
  history?: BackendHistoryItem[];
  data?: BackendHistoryItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Derive an SLA tier from remaining hours.
 */
function deriveSlaTier(remainingHours: number): SlaTier {
  if (remainingHours < 0) return "breached";
  if (remainingHours <= 3) return "critical";
  if (remainingHours <= 8) return "warning";
  if (remainingHours <= 16) return "watch";
  return "healthy";
}

function toRiskSeverity(raw?: string): RiskSeverity {
  if (raw === "high") return "high";
  if (raw === "low") return "low";
  return "medium";
}

function toReviewState(raw?: string): ReviewState {
  const map: Record<string, ReviewState> = {
    pending: "pending",
    in_progress: "in_progress",
    claimed: "in_progress",
    escalated: "escalated",
    governance_hold: "governance_hold",
    hold: "governance_hold",
    rework: "rework",
    ai_ready: "ai_ready",
  };
  return map[raw ?? ""] ?? "pending";
}

function toAiConfidenceBand(val: number): AiConfidenceBand {
  if (val >= 80) return "high";
  if (val >= 60) return "medium";
  return "low";
}

function toActivityKind(raw?: string): ReviewActivityKind {
  const map: Record<string, ReviewActivityKind> = {
    approved: "approval",
    accept: "approval",
    accepted: "approval",
    rejected: "rejection",
    reject: "rejection",
    escalated: "escalation",
    escalate: "escalation",
    rework: "rework",
    request_rework: "rework",
    hold: "hold",
    release: "release",
    released: "release",
  };
  return map[raw ?? ""] ?? "approval";
}

function fmtTimestamp(iso?: string): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--";
  }
}

// ── Mappers ────────────────────────────────────────────────────────────────

function mapQueueItem(item: BackendQueueItem, idx: number): PriorityReviewRow {
  const title = item.task_title ?? item.title ?? `Review #${idx + 1}`;
  const project = item.project_name ?? item.project ?? "—";
  const contributorCode = item.contributor_code ?? item.contributor_id ?? `c${idx}`;
  const reliability = clamp(item.contributor_reliability ?? 75, 0, 100);
  const submissionAgeHours = item.submission_age_hours ?? 0;

  const slaRemainingHours = (() => {
    if (item.sla_remaining_hours !== undefined) return item.sla_remaining_hours;
    if (item.due_at) {
      return (new Date(item.due_at).getTime() - Date.now()) / 3_600_000;
    }
    return 24;
  })();

  const slaTier = (item.sla_tier as SlaTier | undefined) ?? deriveSlaTier(slaRemainingHours);
  const aiConfidence = clamp(item.ai_confidence ?? 70, 0, 100);

  return {
    id: item.id ?? item.submission_id ?? String(idx),
    contributor: {
      code: contributorCode,
      name: item.contributor_name ?? contributorCode,
      reliability,
    },
    task: {
      title,
      project,
      round: item.round,
      type: item.round && item.round > 1 ? "rework" : "initial",
    },
    submissionAgeHours: Math.round(submissionAgeHours),
    slaRemainingHours: Math.round(slaRemainingHours),
    slaTier,
    riskSeverity: toRiskSeverity(item.risk_severity),
    reviewState: toReviewState(item.review_state ?? item.state ?? item.status),
    aiConfidence,
    aiConfidenceBand: (item.ai_confidence_band as AiConfidenceBand | undefined) ?? toAiConfidenceBand(aiConfidence),
    flags: item.flags ?? [],
  };
}

function mapHistoryItem(item: BackendHistoryItem, idx: number): ReviewActivityEntry {
  const kind = toActivityKind(item.decision ?? item.action ?? item.kind);
  const actor = item.actor ?? item.mentor_name ?? "Mentor";
  const subject = item.subject ?? item.task_title ?? `Review ${idx + 1}`;
  const detail = item.detail ?? item.note ?? item.comment ?? "";
  const timestamp = fmtTimestamp(item.timestamp ?? item.decided_at ?? item.created_at);
  return {
    id: item.id ?? String(idx),
    kind,
    actor,
    subject,
    detail,
    timestamp,
    reviewId: item.review_id ?? item.submission_id,
  };
}

// ── Derived KPIs from queue data ───────────────────────────────────────────

export function deriveKpisFromQueue(rows: PriorityReviewRow[]): OperationalKpi[] {
  const pending = rows.length;
  const slaRisk = rows.filter((r) => r.slaTier === "breached" || r.slaTier === "critical").length;
  const escalated = rows.filter((r) => r.reviewState === "escalated").length;
  const holds = rows.filter((r) => r.reviewState === "governance_hold").length;

  return [
    {
      key: "pending",
      label: "Pending Reviews",
      value: String(pending),
      caption: `${rows.filter((r) => r.reviewState === "pending").length} unassigned`,
    },
    {
      key: "sla_risk",
      label: "SLA Breach Risks",
      value: String(slaRisk),
      caption: `${rows.filter((r) => r.slaTier === "breached").length} breached · ${rows.filter((r) => r.slaTier === "critical").length} critical`,
      emphasis: slaRisk > 0 ? "critical" : "default",
    },
    {
      key: "escalated",
      label: "Escalated Reviews",
      value: String(escalated),
      caption: escalated > 0 ? `${escalated} awaiting mentor ruling` : "None",
      emphasis: escalated > 0 ? "warning" : "default",
    },
    {
      key: "holds",
      label: "Governance Holds",
      value: String(holds),
      caption: holds > 0 ? "Awaiting governance clearance" : "None",
    },
    {
      key: "avg_time",
      label: "Avg Review Time",
      value: "—",
      caption: "Live data pending",
    },
    {
      key: "throughput",
      label: "Review Throughput",
      value: "—",
      caption: "Live data pending",
    },
  ];
}

// ── Fetch functions ────────────────────────────────────────────────────────

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { cache: "no-store", signal });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      msg = body.error ?? body.detail ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function fetchRealQueue(signal?: AbortSignal): Promise<PriorityReviewRow[]> {
  const raw = await getJSON<BackendQueueResponse>("/api/mentor/queue", signal);
  const items: BackendQueueItem[] = raw.items ?? raw.queue ?? raw.data ?? [];
  return items.map(mapQueueItem);
}

export async function fetchRealHistory(signal?: AbortSignal): Promise<ReviewActivityEntry[]> {
  const raw = await getJSON<BackendHistoryResponse>("/api/mentor/history", signal);
  const items: BackendHistoryItem[] = raw.items ?? raw.decisions ?? raw.history ?? raw.data ?? [];
  return items.map(mapHistoryItem);
}
