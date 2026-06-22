/**
 * Shared option lists for tenant complaints / support tickets.
 * Used by the enterprise support form, the suspended-workspace ticket form,
 * and the super-admin Complaints view so labels never drift.
 * Values MUST match the backend `_VALID_CATEGORY` / `_VALID_PRIORITY` sets.
 */

export interface Option {
  value: string;
  label: string;
}

export const COMPLAINT_REASONS: Option[] = [
  { value: "access", label: "Access / suspension" },
  { value: "account", label: "Login & account access" },
  { value: "billing", label: "Billing & payments" },
  { value: "technical", label: "Technical issue / bug" },
  { value: "performance", label: "Performance / slowness" },
  { value: "data", label: "Data & compliance" },
  { value: "feature", label: "Feature request" },
  { value: "general", label: "General question" },
  { value: "abuse", label: "Report abuse / misuse" },
  { value: "other", label: "Other" },
];

export const COMPLAINT_PRIORITIES: Option[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent — blocking work" },
];

/** Today's date as YYYY-MM-DD in the user's local timezone (en-CA yields ISO order). */
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function reasonLabel(value?: string | null): string {
  return COMPLAINT_REASONS.find((r) => r.value === value)?.label ?? value ?? "—";
}

export function priorityLabel(value?: string | null): string {
  return COMPLAINT_PRIORITIES.find((p) => p.value === value)?.label ?? value ?? "—";
}
