/**
 * Resolution Center lanes + the per-(lane, role) field config.
 * The raise form adapts to BOTH the category and the raiser's role — e.g. a
 * contributor's Payment case asks "which task?", a mentor's asks "which review
 * /period?", an enterprise's asks "invoice reference". Mirrors backend `_LANES`.
 */
import { Fragment } from "react";
import {
  LifeBuoy, MessageSquareWarning, Lightbulb, Wallet, Briefcase, Bug, ShieldAlert, Lock,
  type LucideIcon,
} from "lucide-react";

export interface LaneDef {
  key: string;
  label: string;
  desc: string;
  stream: "support" | "resolution" | "operations" | "security";
  icon: LucideIcon;
  tone: "info" | "error" | "warning" | "neutral";
}

export const LANES: LaneDef[] = [
  { key: "support",   label: "Support",          desc: "A question or need help",        stream: "support",    icon: LifeBuoy,             tone: "info" },
  { key: "complaint", label: "Complaint",        desc: "Unfair treatment or conduct",     stream: "resolution", icon: MessageSquareWarning, tone: "error" },
  { key: "feedback",  label: "Feedback",         desc: "An idea or a suggestion",         stream: "support",    icon: Lightbulb,            tone: "warning" },
  { key: "payment",   label: "Payment / Payout", desc: "Not paid, wrong or delayed",      stream: "operations", icon: Wallet,               tone: "warning" },
  { key: "work_task", label: "Work / Task",      desc: "Blocked, unclear or no access",   stream: "operations", icon: Briefcase,            tone: "info" },
  { key: "site_bug",  label: "Site / Bug",       desc: "A page or feature is broken",     stream: "support",    icon: Bug,                  tone: "neutral" },
  { key: "safety",    label: "Safety",           desc: "Harassment or feeling unsafe",    stream: "resolution", icon: ShieldAlert,          tone: "error" },
  { key: "security",  label: "Security",         desc: "Access, permissions or a vuln",   stream: "security",   icon: Lock,                 tone: "error" },
];

export const LANE_BY_KEY: Record<string, LaneDef> = Object.fromEntries(LANES.map((l) => [l.key, l]));

export const TONE_BG: Record<string, string> = {
  info: "bg-info-subtle text-info-text",
  error: "bg-error-subtle text-error-text",
  warning: "bg-warning-subtle text-warning-text",
  neutral: "bg-surface-sunken text-text-secondary",
};

export function laneLabel(key: string | undefined): string {
  return (key && LANE_BY_KEY[key]?.label) || key || "Case";
}

/* ── per-(lane, role) field config ─────────────────────────────────────────── */

export interface LaneField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "checkbox";
  options?: string[];
  placeholder?: string;
  source?: string;   // when set, the field's suggestions are fetched live
}
const sel = (key: string, label: string, options: string[]): LaneField => ({ key, label, type: "select", options });
const txt = (key: string, label: string, placeholder?: string): LaneField => ({ key, label, type: "text", placeholder });
const dt = (key: string, label: string): LaneField => ({ key, label, type: "date" });
const chk = (key: string, label: string): LaneField => ({ key, label, type: "checkbox" });

type FieldSet = { default: LaneField[]; roles?: Record<string, LaneField[]> };

const FIELD_SETS: Record<string, FieldSet> = {
  support: {
    default: [sel("subtype", "Topic", ["General", "Account", "Other"])],
    roles: {
      contributor: [sel("subtype", "Topic", ["Submissions", "Payments", "Opportunities", "Account", "Other"])],
      mentor: [sel("subtype", "Topic", ["Reviews", "Queue", "Mentorship", "Account", "Other"])],
      reviewer: [sel("subtype", "Topic", ["QA reviews", "Queue", "Account", "Other"])],
      enterprise: [sel("subtype", "Topic", ["SOW", "Billing", "Workforce", "Account", "Other"])],
    },
  },
  complaint: {
    default: [sel("subtype", "Type", ["Conduct", "Policy", "Decision appeal", "Other"]), txt("against", "Who or what is this about?", "a person or a decision"), dt("when", "When did it happen?")],
    roles: {
      contributor: [sel("subtype", "Type", ["Unfair review / decision", "Conduct", "Payment-related", "Other"]), sel("against", "About whom?", ["Mentor", "Reviewer", "Enterprise", "Glimmora", "Other"]), txt("relatedTask", "Related task (optional)"), dt("when", "When did it happen?")],
      mentor: [sel("subtype", "Type", ["Conduct", "Process / workload", "Decision", "Other"]), sel("against", "About whom?", ["Contributor", "Reviewer", "Enterprise", "Glimmora", "Other"]), dt("when", "When did it happen?")],
      reviewer: [sel("subtype", "Type", ["Conduct", "Process / workload", "Decision", "Other"]), sel("against", "About whom?", ["Contributor", "Mentor", "Enterprise", "Glimmora", "Other"]), dt("when", "When did it happen?")],
      enterprise: [sel("subtype", "Type", ["Service quality", "Delivery", "Billing", "Other"]), sel("against", "About whom?", ["Contributor", "Mentor", "Reviewer", "Glimmora"]), dt("when", "When did it happen?")],
    },
  },
  feedback: {
    default: [sel("area", "Area", ["UI / design", "A feature", "Performance", "Other"])],
  },
  payment: {
    default: [sel("subtype", "Issue", ["Delayed", "Missing", "Wrong amount", "Refund"]), txt("reference", "Reference"), txt("amount", "Amount (₹)")],
    roles: {
      contributor: [sel("subtype", "Issue", ["Delayed", "Missing", "Wrong amount", "Refund"]), txt("taskRef", "Which task?", "Task title or ID"), txt("amount", "Amount expected (₹)"), dt("expected", "When was it expected?")],
      mentor: [sel("subtype", "Issue", ["Delayed", "Missing", "Wrong amount"]), txt("period", "Which review / period?"), txt("amount", "Amount (₹)")],
      reviewer: [sel("subtype", "Issue", ["Delayed", "Missing", "Wrong amount"]), txt("period", "Which review / period?"), txt("amount", "Amount (₹)")],
      enterprise: [sel("subtype", "Issue", ["Invoice query", "Overcharge", "Refund"]), txt("invoiceRef", "Invoice / SOW reference"), txt("amount", "Amount (₹)")],
    },
  },
  work_task: {
    default: [sel("subtype", "Issue", ["Blocked", "Unclear scope", "Can't access", "Deadline"]), txt("ref", "Reference")],
    roles: {
      contributor: [sel("subtype", "Issue", ["Blocked", "Unclear scope", "Can't access", "Deadline too tight"]), txt("taskRef", "Which task?", "Task title or ID")],
      mentor: [sel("subtype", "Issue", ["Queue item", "SOW assignment", "Submission problem", "Other"]), txt("ref", "Which submission / SOW?")],
      reviewer: [sel("subtype", "Issue", ["QA item", "Assignment", "Submission problem", "Other"]), txt("ref", "Which QA item?")],
      enterprise: [sel("subtype", "Issue", ["SOW", "Decomposition", "Delivery", "Other"]), txt("ref", "Which SOW / project?")],
    },
  },
  site_bug: {
    default: [txt("pageUrl", "Which page? (URL)", "/mentor/queue"), txt("device", "Browser / device", "Chrome on Windows")],
  },
  safety: {
    default: [txt("involved", "Who is involved?"), dt("when", "When did it happen?"), chk("anonymous", "Report anonymously")],
  },
  security: {
    default: [sel("subtype", "Type", ["Login / access", "Permission issue", "Vulnerability"]), dt("when", "When did it start?")],
  },
};

export function laneFields(laneKey: string, role?: string | null): LaneField[] {
  const set = FIELD_SETS[laneKey];
  if (!set) return [];
  const r = (role || "").toLowerCase();
  return (set.roles && set.roles[r]) || set.default;
}

/** Read-only display of the structured facts a case was raised with. */
export function CaseFacts({
  lane, role, subtype, details,
}: { lane: string; role?: string | null; subtype?: string | null; details?: Record<string, unknown> | null }) {
  const fields = laneFields(lane, role);
  const subtypeField = fields.find((f) => f.key === "subtype");
  const rows: Array<[string, string]> = [];
  if (subtype) rows.push([subtypeField?.label ?? "Type", subtype]);
  for (const f of fields) {
    if (f.key === "subtype") continue;
    const v = details?.[f.key];
    if (v === undefined || v === null || v === "" || v === false) continue;
    rows.push([f.label, f.type === "checkbox" ? "Yes" : String(v)]);
  }
  if (rows.length === 0) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-surface-sunken p-3 text-xs">
      {rows.map(([k, v]) => (
        <Fragment key={k}>
          <dt className="text-text-secondary">{k}</dt>
          <dd className="font-medium text-foreground">{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
