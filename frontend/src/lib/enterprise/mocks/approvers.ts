/**
 * Approver pool mock for SOW intake Step 3. Per-stage picker fills
 * from these candidates. Commercial is fixed to the Glimmora team.
 *
 * Backend handoff:
 *   GET /api/enterprise/approvers?stage=  → ApproverCandidate[]
 */

export type SowApprovalStageKey = "business" | "commercial" | "legal" | "security" | "final";

export interface ApproverCandidate {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Default option for this stage? */
  default?: boolean;
  /** Read-only / auto-assigned (e.g. Glimmora Commercial team)? */
  auto?: boolean;
}

/** Per-stage SLA in hours — Phase 1 policy default. */
export const STAGE_SLA_HOURS: Record<SowApprovalStageKey, number> = {
  business: 48,
  commercial: 48,
  legal: 48,
  security: 48,
  final: 48,
};

export const STAGE_LABEL: Record<SowApprovalStageKey, string> = {
  business: "Business",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
  final: "Final",
};

const APPROVERS: Record<SowApprovalStageKey, ApproverCandidate[]> = {
  business: [
    { id: "u-sandeep",  name: "Sandeep Kulkarni",   email: "sandeep@acme.com",     role: "VP Engineering", default: true },
    { id: "u-anjali",   name: "Anjali Rao",         email: "anjali@acme.com",      role: "PMO Lead" },
    { id: "u-pooja",    name: "Pooja Venkat",       email: "pooja@acme.com",       role: "Product Director" },
  ],
  commercial: [
    { id: "u-glimmora-com", name: "Glimmora Commercial team", email: "commercial@glimmora.ai", role: "Auto-assigned", default: true, auto: true },
  ],
  legal: [
    { id: "u-meera",      name: "Meera Joshi",       email: "meera@acme.com",       role: "General Counsel", default: true },
    { id: "u-aishwarya",  name: "Aishwarya Rao",     email: "aishwarya@glimmora.ai", role: "Glimmora Legal" },
    { id: "u-pranav",     name: "Pranav Mehta",      email: "pranav@acme.com",      role: "Contracts Lead" },
  ],
  security: [
    { id: "u-rohit",      name: "Rohit Banerjee",    email: "rohit@acme.com",       role: "CISO", default: true },
    { id: "u-karthik",    name: "Karthik Iyer",      email: "karthik@glimmora.ai",  role: "Glimmora Security" },
    { id: "u-divya-sec",  name: "Divya Nair",        email: "divya.sec@acme.com",   role: "Security Architect" },
  ],
  final: [
    { id: "u-sandeep",  name: "Sandeep Kulkarni",   email: "sandeep@acme.com",     role: "VP Engineering", default: true },
    { id: "u-cfo",      name: "Anil Sharma",        email: "anil.cfo@acme.com",    role: "CFO" },
  ],
};

export function listApproversForStageMock(stage: SowApprovalStageKey): ApproverCandidate[] {
  return APPROVERS[stage];
}

export function defaultApproverForStageMock(stage: SowApprovalStageKey): ApproverCandidate {
  return APPROVERS[stage].find((a) => a.default) ?? APPROVERS[stage][0]!;
}
