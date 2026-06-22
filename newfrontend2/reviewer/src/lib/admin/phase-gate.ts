/**
 * Phase-1 scope gate for the platform admin.
 *
 * Per the SOW, Phase 1 ships a lean operator console. These sections are
 * Phase-2/3 features and are HIDDEN from the nav AND BLOCKED at the route guard
 * unless `NEXT_PUBLIC_ADMIN_PHASE2_ENABLED=1`. Fully reversible — flip the flag
 * to restore the complete surface for Phase 2.
 *
 * Keep in sync with `ADMIN_SECTION_VISIBILITY` keys in src/mocks/admin/personas.ts.
 */
export const PHASE2_ADMIN_SECTIONS = new Set<string>([
  "ai", // AI Agents — advanced AI governance / model lifecycle (Phase 2)
  "paymentRails", // multi-provider payout rails (Phase 2)
  "systemHealth", // ops/observability belongs in infra tooling
  "womenWorkforce", // partner-program expansion (Phase 3)
  "skillTaxonomy", // skills work as tags in P1; mgmt UI deferred
  "emailTemplates", // ship default transactional emails in P1
  "governance", // formal case console deferred; ad-hoc in P1
]);

export function isPhase2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_PHASE2_ENABLED === "1";
}

/** True when a section is Phase-2 and should currently be hidden/blocked. */
export function isAdminSectionPhaseHidden(sectionKey: string): boolean {
  return !isPhase2Enabled() && PHASE2_ADMIN_SECTIONS.has(sectionKey);
}

/**
 * Phase-1 collapses the 8 operator personas to 3 (Platform Admin, Tenant
 * Success, Compliance). The 8 definitions stay intact for Phase 2 — we just
 * resolve the requested persona down to one of the 3 at runtime when Phase-2
 * is off. The personas that only existed to operate Phase-2 features
 * (AI Operator, Payments Operator, Partnership Manager) and the narrower
 * MPM/T&S roles fold into the nearest surviving persona.
 */
const PHASE1_PERSONA_MAP: Record<string, string> = {
  "plat.admin": "plat.admin",
  "plat.tsm": "plat.tsm",
  "plat.mpm": "plat.tsm",
  "plat.tns": "plat.tsm",
  "plat.compliance": "plat.compliance",
  "plat.payments": "plat.compliance",
  "plat.partnerships": "plat.compliance",
  "plat.ai": "plat.compliance",
};

/** Resolve a requested persona to its Phase-1 equivalent (no-op when Phase-2 on). */
export function resolvePhaseAdminRole(role: string): string {
  if (isPhase2Enabled()) return role;
  return PHASE1_PERSONA_MAP[role] ?? "plat.admin";
}
