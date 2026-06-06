import { test } from "@playwright/test";
import { expectRouteLoads } from "./helpers/routes";

test.describe("Admin portal @ui-mock", () => {
  const routes = [
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
  ];

  for (const path of routes) {
    test(`loads ${path}`, async ({ page }) => {
      await expectRouteLoads(page, path);
    });
  }
});
