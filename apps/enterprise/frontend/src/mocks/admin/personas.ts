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
  "plat.admin":        { role: "plat.admin",        displayName: "Aishwarya Rao",    title: "Platform Admin",            initials: "AR", email: "aishwarya@glimmora.ai" },
  "plat.tsm":          { role: "plat.tsm",          displayName: "Vikram Shenoy",    title: "Tenant Success Manager",    initials: "VS", email: "vikram@glimmora.ai" },
  "plat.mpm":          { role: "plat.mpm",          displayName: "Anjali Rao",       title: "Mentor Program Manager",    initials: "AR", email: "anjali@glimmora.ai" },
  "plat.tns":          { role: "plat.tns",          displayName: "Sneha Pillai",     title: "Trust & Safety Officer",    initials: "SP", email: "sneha@glimmora.ai" },
  "plat.compliance":   { role: "plat.compliance",   displayName: "Rohit Menon",      title: "Compliance Officer",        initials: "RM", email: "rohit@glimmora.ai" },
  "plat.payments":     { role: "plat.payments",     displayName: "Kavya Iyer",       title: "Payments Operator",         initials: "KI", email: "kavya@glimmora.ai" },
  "plat.partnerships": { role: "plat.partnerships", displayName: "Deepak Sharma",    title: "Partnership Manager",       initials: "DS", email: "deepak@glimmora.ai" },
  "plat.ai":           { role: "plat.ai",           displayName: "Priyanka Bansal",  title: "AI Operator",               initials: "PB", email: "priyanka@glimmora.ai" },
};

export function isAdminRole(v: string | null): v is AdminRole {
  return v != null && v in MOCK_ADMINS;
}

// Map roles → which sidebar sections they can see (spec §3.2 RBAC).
// "view" = read-only; we treat both as "visible" for navigation purposes.
export const ADMIN_SECTION_VISIBILITY: Record<string, AdminRole[]> = {};

/** Roles that may edit (not just view) a section — spec §3.2 "view" rows. */
export const ADMIN_SECTION_EDIT: Record<string, AdminRole[]> = {};
