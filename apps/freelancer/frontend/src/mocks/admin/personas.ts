/**
 * Platform Admin personas — spec doc 04 §1.2.
 * Eight internal Glimmora-staff roles. Same shell; modules gated by RBAC.
 */

export type AdminRole =
  | "plat.admin"
  | "plat.tsm"
  | "plat.mpm"
  | "plat.tns"
  | "plat.compliance"
  | "plat.payments"
  | "plat.partnerships"
  | "plat.ai";

export interface AdminProfile {
  role: AdminRole;
  displayName: string;
  title: string;
  initials: string;
  email: string;
}

export const MOCK_ADMINS: Record<AdminRole, AdminProfile> = {
  "plat.admin":        { role: "plat.admin",        displayName: "", title: "Platform Admin",            initials: "", email: "" },
  "plat.tsm":          { role: "plat.tsm",          displayName: "", title: "Tenant Success Manager",    initials: "", email: "" },
  "plat.mpm":          { role: "plat.mpm",          displayName: "", title: "Mentor Program Manager",    initials: "", email: "" },
  "plat.tns":          { role: "plat.tns",          displayName: "", title: "Trust & Safety Officer",    initials: "", email: "" },
  "plat.compliance":   { role: "plat.compliance",   displayName: "", title: "Compliance Officer",        initials: "", email: "" },
  "plat.payments":     { role: "plat.payments",     displayName: "", title: "Payments Operator",         initials: "", email: "" },
  "plat.partnerships": { role: "plat.partnerships", displayName: "", title: "Partnership Manager",       initials: "", email: "" },
  "plat.ai":           { role: "plat.ai",           displayName: "", title: "AI Operator",               initials: "", email: "" },
};

export function isAdminRole(v: string | null): v is AdminRole {
  return v != null && v in MOCK_ADMINS;
}

// Map roles → which sidebar sections they can see (spec §3.2 RBAC).
// "view" = read-only; we treat both as "visible" for navigation purposes.
export const ADMIN_SECTION_VISIBILITY: Record<string, AdminRole[]> = {
  dashboard:        ["plat.admin", "plat.tsm", "plat.mpm", "plat.tns", "plat.compliance", "plat.payments", "plat.partnerships", "plat.ai"],
  tenants:          ["plat.admin", "plat.tsm", "plat.mpm", "plat.tns", "plat.compliance", "plat.payments"],
  commercialGate:   ["plat.admin", "plat.payments", "plat.tsm"],
  mentors:          ["plat.admin", "plat.mpm", "plat.tsm", "plat.tns"],
  skillTaxonomy:    ["plat.admin", "plat.mpm", "plat.compliance"],
  rubricTemplates:  ["plat.admin", "plat.mpm", "plat.tns"],
  emailTemplates:   ["plat.admin", "plat.tsm", "plat.tns"],
  governance:       ["plat.admin", "plat.tns", "plat.tsm", "plat.mpm", "plat.compliance", "plat.partnerships"],
  kyc:              ["plat.admin", "plat.tns", "plat.compliance", "plat.partnerships"],
  audit:            ["plat.admin", "plat.compliance", "plat.tsm", "plat.tns", "plat.payments"],
  ai:               ["plat.admin", "plat.ai", "plat.compliance"],
  paymentRails:     ["plat.admin", "plat.payments", "plat.compliance"],
  systemHealth:     ["plat.admin", "plat.tsm", "plat.payments", "plat.ai"],
  universities:     ["plat.admin", "plat.partnerships", "plat.tsm", "plat.mpm"],
  womenWorkforce:   ["plat.admin", "plat.partnerships", "plat.tsm", "plat.mpm", "plat.tns"],
  roles:            ["plat.admin", "plat.compliance"],
};

/** Roles that may edit (not just view) a section — spec §3.2 "view" rows. */
export const ADMIN_SECTION_EDIT: Record<string, AdminRole[]> = {
  rubricTemplates: ["plat.admin", "plat.mpm"],
  emailTemplates:  ["plat.admin"],
  governance:      ["plat.admin", "plat.tns"],
  kyc:             ["plat.admin", "plat.tns"],
  auditExport:     ["plat.admin", "plat.compliance"],
  roles:           ["plat.admin"],
  ai:              ["plat.admin", "plat.ai"],
  paymentRails:    ["plat.admin", "plat.payments"],
  universities:    ["plat.admin", "plat.partnerships"],
  womenWorkforce:  ["plat.admin", "plat.partnerships"],
};
