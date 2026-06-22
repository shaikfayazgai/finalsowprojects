/**
 * The 8 Resolution Center lanes (shared by the user form + the Glimmora desk).
 * Mirrors the backend `_LANES`. Adding/removing one = edit both.
 */
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

export const LANE_BY_KEY: Record<string, LaneDef> = Object.fromEntries(
  LANES.map((l) => [l.key, l]),
);

export const TONE_BG: Record<string, string> = {
  info: "bg-info-subtle text-info-text",
  error: "bg-error-subtle text-error-text",
  warning: "bg-warning-subtle text-warning-text",
  neutral: "bg-surface-sunken text-text-secondary",
};

export function laneLabel(key: string | undefined): string {
  return (key && LANE_BY_KEY[key]?.label) || key || "Case";
}
