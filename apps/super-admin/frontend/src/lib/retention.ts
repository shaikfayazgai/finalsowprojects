/**
 * Retention floor + types (spec doc 02 §5.I.3 + doc 06 §13).
 *
 * Defines the minimum retention period for each tenant-configurable
 * data class. Tenants may extend (set higher) or keep indefinite, but
 * never reduce below the floor — enforced server-side by the PUT
 * endpoint at /api/enterprise/compliance/retention.
 *
 * Floors are kept here in one place so the API, the admin UI, and
 * any future enforcement worker can agree.
 */

export const RETENTION_ENTITIES = [
  "audit_event",
  "task_evidence",
  "submission_withdrawn",
  "mentor_notes",
  "kyc_records",
] as const;

export type RetentionEntity = (typeof RETENTION_ENTITIES)[number];

export interface RetentionEntityFloor {
  /** Minimum days the platform requires this data class to be kept. */
  floorDays: number;
  /** Whether `mode: 'indefinite'` is the platform default for new tenants. */
  defaultIndefinite: boolean;
  /** Human-readable label for the admin UI. */
  label: string;
  /** One-line explanation of the policy. */
  rationale: string;
}

export const RETENTION_FLOORS: Record<RetentionEntity, RetentionEntityFloor> = {
  audit_event: {
    floorDays: 7 * 365,
    defaultIndefinite: true,
    label: "Audit events",
    rationale:
      "Signed audit trail anchors compliance + forensic queries. Doc 06 §17 mandates ≥7 years.",
  },
  task_evidence: {
    floorDays: 7 * 365,
    defaultIndefinite: false,
    label: "Task evidence",
    rationale:
      "Submitted artifacts, mentor reviews, acceptance decisions. Needed for dispute resolution and credential verification.",
  },
  submission_withdrawn: {
    floorDays: 90,
    defaultIndefinite: false,
    label: "Withdrawn submissions",
    rationale:
      "Submissions that were withdrawn before acceptance — kept short to honour data-minimization while preserving recall window.",
  },
  mentor_notes: {
    floorDays: 365,
    defaultIndefinite: false,
    label: "Mentor coaching notes",
    rationale:
      "Free-form mentor observations attached to mentorship sessions. Sensitive — kept for the contributor's appraisal cycle then pruned.",
  },
  kyc_records: {
    floorDays: 7 * 365,
    defaultIndefinite: false,
    label: "KYC records",
    rationale:
      "Identity verification artifacts. Doc 06 §17 + payment-rail regulation typically require ≥7 years post-relationship.",
  },
};

export type RetentionMode = "indefinite" | "days";

export interface RetentionRule {
  mode: RetentionMode;
  days?: number;
}

export type RetentionRuleSet = Partial<Record<RetentionEntity, RetentionRule>>;

/** Returns the rule that should apply to an entity, defaulting to the platform floor. */
export function effectiveRule(
  entity: RetentionEntity,
  rules: RetentionRuleSet | null | undefined,
): RetentionRule {
  const override = rules?.[entity];
  if (override) return override;
  const floor = RETENTION_FLOORS[entity];
  return floor.defaultIndefinite
    ? { mode: "indefinite" }
    : { mode: "days", days: floor.floorDays };
}

/** Pretty-print a rule for the overview panel. */
export function formatRule(rule: RetentionRule): string {
  if (rule.mode === "indefinite") return "indefinite";
  if (!rule.days) return "—";
  if (rule.days % 365 === 0) {
    const y = rule.days / 365;
    return y === 1 ? "1 year" : `${y} years`;
  }
  if (rule.days % 30 === 0) {
    const m = rule.days / 30;
    return m === 1 ? "1 month" : `${m} months`;
  }
  return `${rule.days} days`;
}
