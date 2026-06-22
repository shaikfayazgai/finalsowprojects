/**
 * Contributor notifications — labels and formatters (enterprise inbox pattern).
 */

export type InboxFilter = "all" | "unread";

export const FILTER_TABS: Array<{ key: InboxFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

const KIND_LABELS: Record<string, string> = {
  "auth.password_changed": "Password changed",
  "auth.mfa_setup_required": "MFA setup required",
  "auth.session_revoked": "Session revoked",
  "task.assigned": "Task assigned",
  "task.accepted": "Task accepted",
  "task.revision_requested": "Revision requested",
  "task.accepted_final": "Task accepted (final)",
  "submission.under_review": "Submission under review",
  "review.assigned": "Review assigned",
  "review.sla_warning": "Review SLA warning",
  "review.sla_breach": "Review SLA breach",
  "mentorship.session_in_30min": "Mentorship session",
  "mentorship.session_no_show": "Mentorship no-show",
  "payout.eligible": "Payout eligible",
  "payout.sent": "Payout sent",
  "payout.failed": "Payout failed",
  "sow.stage_changed": "SOW stage",
  "sow.approved": "SOW approved",
  "sow.rejected": "SOW rejected",
  "governance.case_assigned": "Governance",
  "governance.case_resolved": "Governance",
  "safety.case_received": "Safety",
  "kyc.approved": "KYC approved",
  "kyc.rejected": "KYC rejected",
  "system.tenant_paused": "System",
  "system.agent_unavailable": "System",
  "system.generic": "System",
};

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind.replace(/\./g, " · ");
}

export function formatRelative(iso: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatExact(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function actionUrlAllowed(url: string): boolean {
  return url.startsWith("/contributor") || url.startsWith("/public");
}

export function severityStyle(severity: string) {
  switch (severity) {
    case "critical":
      return {
        iconWrap: "border-error-border text-error-text",
        pill: "border border-error-border text-error-text",
      };
    case "warning":
    case "important":
      return {
        iconWrap: "border-warning-border text-warning-text",
        pill: "border border-warning-border text-warning-text",
      };
    case "success":
      return {
        iconWrap: "border-success-border text-success-text",
        pill: "bg-success-subtle text-success-text",
      };
    default:
      return {
        iconWrap: "border-stroke-subtle text-text-secondary",
        pill: "border border-stroke-subtle text-text-secondary",
      };
  }
}
