import { expect, test, type Page } from "@playwright/test";
import { gotoPortal } from "./auth";

/** Smoke: route loads without auth redirect. */
export async function expectRouteLoads(page: Page, path: string) {
  await gotoPortal(page, path);
  expect(page.url()).not.toContain("/auth/login");
}

export type SmokePortal =
  | "admin"
  | "contributor"
  | "enterprise"
  | "mentor"
  | "enterpriseReviewer"
  | "analytics"
  | "public";

/** Canonical route inventory — single source for smoke tests. */
export const SMOKE_ROUTES: Record<SmokePortal, string[]> = {
  admin: [
    "/admin/dashboard",
    "/admin/sow",
    "/admin/tenants",
    "/admin/kyc",
    "/admin/governance",
    "/admin/mentors",
    "/admin/mentors/pools",
    "/admin/skill-taxonomy",
    "/admin/email-templates",
    "/admin/audit",
    "/admin/partnerships/women-workforce",
    "/admin/mentors/new",
  ],
  contributor: [
    "/contributor/dashboard",
    "/contributor/tasks",
    "/contributor/tasks/submissions",
    "/contributor/tasks/completed",
    "/contributor/earnings",
    "/contributor/profile",
    "/contributor/profile/digital-twin",
    "/contributor/credentials",
    "/contributor/support",
    "/contributor/notifications",
    "/contributor/settings",
    "/contributor/settings/mentorship",
  ],
  enterprise: [
    "/enterprise/dashboard",
    "/enterprise/sow",
    "/enterprise/sow/intake",
    "/enterprise/projects",
    "/enterprise/decomposition",
    "/enterprise/review",
    "/enterprise/billing",
    "/enterprise/analytics/economic",
    "/enterprise/compliance/documents",
    "/enterprise/audit",
    "/enterprise/settings",
    "/enterprise/onboarding",
    "/enterprise/workforce",
  ],
  enterpriseReviewer: [
    "/enterprise/reviewer/queue",
    "/enterprise/reviewer/history",
    "/enterprise/reviewer/metrics",
    "/enterprise/reviewer/notifications",
    "/enterprise/reviewer/profile",
  ],
  mentor: [
    "/mentor/dashboard",
    "/mentor/queue",
    "/mentor/history",
    "/mentor/history/metrics",
    "/mentor/mentorship",
    "/mentor/escalation",
    "/mentor/escalation/esc-001",
    "/mentor/profile",
    "/mentor/profile/edit",
    "/mentor/settings",
    "/mentor/settings/availability",
    "/mentor/settings/account",
    "/mentor/settings/privacy",
    "/mentor/settings/notifications",
    "/mentor/notifications",
    "/mentor/onboarding",
    "/mentor/queue/rev-001",
    "/mentor/queue/rev-001/diff",
    "/mentor/queue/rev-001/audit",
  ],
  analytics: ["/analytics/overview"],
  public: ["/public/credentials/AB12CDE"],
};

export function defineSmokeRouteTests(portal: SmokePortal, tag = "@ui-mock") {
  for (const path of SMOKE_ROUTES[portal]) {
    test(`loads ${path} ${tag}`, async ({ page }) => {
      await expectRouteLoads(page, path);
    });
  }
}
